import pg from "pg";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { updateUserTag } from "../src/features/tags/service";
import { authorizeMediaPath } from "../src/features/media/service";
import type { Bindings } from "../src/types/bindings";

const databaseUrl = process.env.QUOTA_TEST_DATABASE_URL;
const describeWithPostgres = databaseUrl ? describe : describe.skip;

describeWithPostgres("database access and authorization on PostgreSQL", () => {
  const schemaName = `db_access_${crypto.randomUUID().replaceAll("-", "")}`;
  const quotedSchema = `"${schemaName}"`;
  let admin: pg.Client;
  let env: Bindings;

  beforeAll(async () => {
    admin = new pg.Client({ connectionString: databaseUrl });
    await admin.connect();
    await admin.query(`CREATE SCHEMA ${quotedSchema}`);
    await admin.query(`SET search_path TO ${quotedSchema}`);
    await admin.query(`
      CREATE TABLE tags (
        id integer PRIMARY KEY, user_id text NOT NULL, name text NOT NULL,
        color text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE(user_id, name)
      );
      CREATE TABLE videos (
        id integer PRIMARY KEY, user_id text NOT NULL, file text NOT NULL,
        title text NOT NULL DEFAULT 'Video', description text NOT NULL DEFAULT '',
        uploaded_at timestamptz NOT NULL DEFAULT now(), status text NOT NULL DEFAULT 'completed',
        source_type text NOT NULL DEFAULT 'uploaded', source_url text NOT NULL DEFAULT '',
        youtube_video_id text NOT NULL DEFAULT ''
      );
      CREATE TABLE video_tags (id integer PRIMARY KEY, video_id integer, tag_id integer);
      CREATE TABLE video_course_members (id integer PRIMARY KEY, video_id integer, course_id integer);
      CREATE TABLE video_course_memberships (course_id integer, user_id text);
      INSERT INTO tags (id, user_id, name, color) VALUES
        (1, 'owner', 'Original', '#legacy'), (2, 'owner', 'Taken', 'blue');
      INSERT INTO videos (id, user_id, file) VALUES
        (10, 'owner', 'videos/owned.mp4'), (20, 'outsider', 'videos/private.mp4');
      INSERT INTO video_tags VALUES (1, 10, 1);
      INSERT INTO video_course_members VALUES (1, 10, 100);
      INSERT INTO video_course_memberships VALUES (100, 'member');
    `);
    const scopedUrl = new URL(databaseUrl!);
    scopedUrl.searchParams.set("options", `-c search_path=${schemaName}`);
    env = { HYPERDRIVE: { connectionString: scopedUrl.toString() } } as Bindings;
  });

  afterEach(() => vi.restoreAllMocks());
  beforeEach(async () => {
    await admin.query("UPDATE tags SET name = 'Original', color = '#legacy' WHERE id = 1");
  });
  afterAll(async () => {
    try { await admin.query(`DROP SCHEMA IF EXISTS ${quotedSchema} CASCADE`); }
    finally { await admin.end(); }
  });

  it("updates and reloads a tag with one connection, preserving legacy colors", async () => {
    const connect = vi.spyOn(pg.Client.prototype, "connect");
    const result = await updateUserTag(env, 1, "owner", { name: " Updated " });
    expect(connect).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ tag: {
      id: 1, name: "Updated", color: "#legacy", video_count: 1,
      videos: [{ id: 10, file: "/api/media/videos/owned.mp4" }],
    } });
  });

  it("keeps missing/foreign tags as 404 before domain validation", async () => {
    await expect(updateUserTag(env, 1, "outsider", { name: " " })).resolves.toEqual({ notFound: true });
    await expect(updateUserTag(env, 99, "owner", { color: "invalid" })).resolves.toEqual({ notFound: true });
    await expect(updateUserTag(env, 1, "owner", { name: " " })).resolves.toHaveProperty("error");
  });

  it("rolls back a failed update and still supports an empty patch", async () => {
    await expect(updateUserTag(env, 1, "owner", { name: "Taken" })).rejects.toThrow();
    const result = await updateUserTag(env, 1, "owner", {});
    expect(result).toMatchObject({ tag: { name: "Original", color: "#legacy" } });
  });

  it.each([
    { userId: "owner" },
    { userId: "member" },
    { shareCourseId: 100 },
  ])("authorizes the same file with one query for %j", async (access) => {
    const connect = vi.spyOn(pg.Client.prototype, "connect");
    const query = vi.spyOn(pg.Client.prototype, "query");
    await expect(authorizeMediaPath(env, "videos/owned.mp4", access)).resolves.toEqual({
      ok: true, objectKey: "media/videos/owned.mp4",
    });
    expect(connect).toHaveBeenCalledTimes(1);
    expect(query).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["videos/owned.mp4", { userId: "outsider" }],
    ["videos/private.mp4", { userId: "member" }],
    ["videos/private.mp4", { shareCourseId: 100 }],
    ["videos/owned.mp4", { shareCourseId: 200, userId: "owner" }],
    ["videos/missing.mp4", { userId: "owner" }],
  ])("rejects unauthorized file %s for %j", async (path, access) => {
    await expect(authorizeMediaPath(env, path, access)).resolves.toEqual({ notFound: true });
  });

  it("rejects invalid paths and absent credentials before connecting", async () => {
    const connect = vi.spyOn(pg.Client.prototype, "connect");
    await expect(authorizeMediaPath(env, "../private", { userId: "owner" })).resolves.toEqual({ notFound: true });
    await expect(authorizeMediaPath(env, "videos/owned.mp4", {})).resolves.toEqual({ notFound: true });
    expect(connect).not.toHaveBeenCalled();
  });
});
