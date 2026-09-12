import { PGEngine, PGVectorStore } from "@yukiharada1228/langchain-postgres";
import type { EmbeddingsInterface } from "@langchain/core/embeddings";
import pg from "pg";
import type { Bindings } from "../types/bindings";

const ALLOWED_TABLES = new Set(["scene_embeddings"]);

function resolveVectorTable(env: Bindings): string {
  const name = env.PGVECTOR_COLLECTION_NAME || "scene_embeddings";
  if (!ALLOWED_TABLES.has(name)) {
    throw new Error(`vector table '${name}' is not in the allowed list`);
  }
  return name; // allowlist 済みなので式内展開は安全
}

export type SceneHit = {
  content: string;
  videoId: number;
  videoTitle: string;
  startTime: string;
  endTime: string;
};

export const RETRIEVER_K = 20;

/**
 * searchScenes は呼び出し側で計算済みの埋め込みベクトルを渡す
 * （similaritySearchVectorWithScore）ため、PGVectorStore.initialize が
 * 要求する Embeddings は実際には呼び出されない。
 */
const unsupportedEmbeddings: EmbeddingsInterface = {
  embedDocuments(): Promise<number[][]> {
    throw new Error("embedDocuments is unused: searchScenes only queries by precomputed vector.");
  },
  embedQuery(): Promise<number[]> {
    throw new Error("embedQuery is unused: searchScenes only queries by precomputed vector.");
  },
};

function parseMetadataColumn(rows: Array<Record<string, unknown>>): void {
  for (const row of rows) {
    const raw = row.langchain_metadata;
    if (typeof raw === "string") {
      try {
        row.langchain_metadata = JSON.parse(raw);
      } catch {
        row.langchain_metadata = {};
      }
    }
  }
}

/**
 * pg は json 列を既定で自動パースするが、Hyperdrive 経由の Workers 環境では
 * 文字列のまま返ることがある（chat-repository.ts の mapCitations と同様の既知事象）。
 * ライブラリの rowToDocument は metadata オブジェクトへ直接プロパティ代入するため、
 * 文字列のままだと TypeError で落ちる。ここでクエリ結果を正規化してから渡す。
 */
function withMetadataParsing(pool: pg.Pool): pg.Pool {
  const rawQuery = pool.query.bind(pool) as (...args: unknown[]) => Promise<pg.QueryResult>;
  const rawConnect = pool.connect.bind(pool) as (...args: unknown[]) => Promise<pg.PoolClient>;

  (pool as unknown as { query: unknown }).query = async (...args: unknown[]) => {
    const result = await rawQuery(...args);
    parseMetadataColumn(result.rows);
    return result;
  };

  (pool as unknown as { connect: unknown }).connect = async (...args: unknown[]) => {
    const client = await rawConnect(...args);
    const rawClientQuery = client.query.bind(client) as (...args: unknown[]) => Promise<pg.QueryResult>;
    (client as unknown as { query: unknown }).query = async (...args: unknown[]) => {
      const result = await rawClientQuery(...args);
      parseMetadataColumn(result.rows);
      return result;
    };
    return client;
  };

  return pool;
}

export async function searchScenes(
  env: Bindings,
  params: {
    userId: string;
    videoIds: readonly number[];
    embedding: readonly number[];
    k?: number;
  },
): Promise<SceneHit[]> {
  const table = resolveVectorTable(env);
  const k = params.k ?? RETRIEVER_K;
  if (params.videoIds.length === 0) return [];

  // 重要（要件 §11.4 / PoC #01d）: Pool もリクエストごとに生成し、
  // リクエストをまたいで使い回さない（max: 1 で実質 pg.Client 相当）。
  const pool = withMetadataParsing(
    new pg.Pool({
      connectionString: env.HYPERDRIVE.connectionString,
      max: 1,
    }),
  );
  const engine = PGEngine.fromPool(pool);
  try {
    const store = await PGVectorStore.initialize(engine, unsupportedEmbeddings, table, {
      metadataColumns: ["user_id", "video_id"],
    });
    const hits = await store.similaritySearchVectorWithScore(
      [...params.embedding],
      k,
      {
        user_id: params.userId,
        video_id: { $in: [...params.videoIds] },
      },
    );
    const text = (v: unknown) => (typeof v === "string" ? v : v == null ? "" : String(v));
    return hits.map(([doc]) => ({
      content: doc.pageContent ?? "",
      videoId: Number(doc.metadata?.video_id),
      videoTitle: text(doc.metadata?.video_title),
      startTime: text(doc.metadata?.start_time),
      endTime: text(doc.metadata?.end_time),
    }));
  } finally {
    await engine.close();
  }
}
