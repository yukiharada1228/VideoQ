import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type {
  CallToolResult,
  ToolAnnotations,
} from "@modelcontextprotocol/sdk/types.js";
import {
  MCP_TOOL_DESCRIPTIONS,
  MCP_TOOL_TITLES,
  MCP_WRITE_TOOLS,
  McpToolError,
  callMcpTool,
  mcpToolOutputSchemas,
  mcpToolSchemas,
  type McpToolCallContext,
  type McpToolName,
} from "../../lib/mcp-tools";
import { enforceThrottles } from "../../lib/rate-limit";

const SERVER_NAME = "videoq-api";
const SERVER_VERSION = "0.3.0";

function toolResult(structured: Record<string, unknown>): CallToolResult {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(structured, null, 2),
      },
    ],
    structuredContent: structured,
    isError: false,
  };
}

function toolError(e: McpToolError): CallToolResult {
  const result: CallToolResult = {
    content: [{ type: "text", text: e.message }],
    isError: true,
  };
  if (
    e.data !== undefined &&
    e.data !== null &&
    typeof e.data === "object" &&
    !Array.isArray(e.data)
  ) {
    result.structuredContent = e.data as Record<string, unknown>;
  }
  return result;
}

async function runTool(
  name: McpToolName,
  args: Record<string, unknown>,
  ctx: McpToolCallContext,
): Promise<CallToolResult> {
  const startedAt = Date.now();
  let outcome = "success";
  try {
    const isWrite = MCP_WRITE_TOOLS.has(name);
    const throttled = await enforceThrottles(ctx.env, [
      {
        scope: isWrite ? "mcp_write_user" : "mcp_read_user",
        ident: ctx.userId,
      },
    ]);
    if (throttled) {
      throw new McpToolError(
        `MCP tool rate limit exceeded. Retry in ${throttled.retryAfterSec} seconds.`,
        {
          status: 429,
          code: "RATE_LIMITED",
          retry_after_seconds: throttled.retryAfterSec,
        },
      );
    }
    return toolResult(await callMcpTool(name, args, ctx));
  } catch (e) {
    outcome = "error";
    if (e instanceof McpToolError) return toolError(e);
    throw e;
  } finally {
    console.log(
      JSON.stringify({
        event: "mcp_tool_call",
        tool: name,
        outcome,
        durationMs: Date.now() - startedAt,
        authVia: ctx.authVia ?? "unknown",
        requestId: ctx.requestId,
      }),
    );
  }
}

const readOnly: ToolAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
};

const additiveIdempotent: ToolAnnotations = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
};

const MCP_TOOL_ANNOTATIONS: Record<McpToolName, ToolAnnotations> = {
  list_videos: readOnly,
  get_video: readOnly,
  request_video_upload: {
    ...additiveIdempotent,
    openWorldHint: true,
  },
  confirm_video_upload: {
    ...additiveIdempotent,
    // A mismatched upload is removed while its storage reservation is released.
    destructiveHint: true,
    openWorldHint: true,
  },
  create_youtube_video: {
    ...additiveIdempotent,
    openWorldHint: true,
  },
  list_courses: readOnly,
  get_course: readOnly,
  create_course: additiveIdempotent,
  add_video_to_course: additiveIdempotent,
  list_tags: readOnly,
  get_chat_history: readOnly,
  get_chat_analytics: readOnly,
  get_evaluation_summary: readOnly,
  list_evaluation_logs: readOnly,
};

function toolConfig(name: McpToolName) {
  return {
    title: MCP_TOOL_TITLES[name],
    description: MCP_TOOL_DESCRIPTIONS[name],
    inputSchema: mcpToolSchemas[name],
    outputSchema: mcpToolOutputSchemas[name],
    annotations: MCP_TOOL_ANNOTATIONS[name],
  };
}

/** リクエストスコープの VideoQ MCP サーバーを組み立てる。 */
export function createVideoqMcpServer(ctx: McpToolCallContext): McpServer {
  const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });

  server.registerTool(
    "list_videos",
    toolConfig("list_videos"),
    async (args: Record<string, unknown>) => runTool("list_videos", args, ctx),
  );

  server.registerTool(
    "get_video",
    toolConfig("get_video"),
    async (args: Record<string, unknown>) => runTool("get_video", args, ctx),
  );

  server.registerTool(
    "request_video_upload",
    toolConfig("request_video_upload"),
    async (args: Record<string, unknown>) => runTool("request_video_upload", args, ctx),
  );

  server.registerTool(
    "confirm_video_upload",
    toolConfig("confirm_video_upload"),
    async (args: Record<string, unknown>) => runTool("confirm_video_upload", args, ctx),
  );

  server.registerTool(
    "create_youtube_video",
    toolConfig("create_youtube_video"),
    async (args: Record<string, unknown>) => runTool("create_youtube_video", args, ctx),
  );

  server.registerTool(
    "list_courses",
    toolConfig("list_courses"),
    async (args: Record<string, unknown>) => runTool("list_courses", args, ctx),
  );

  server.registerTool(
    "get_course",
    toolConfig("get_course"),
    async (args: Record<string, unknown>) => runTool("get_course", args, ctx),
  );

  server.registerTool(
    "create_course",
    toolConfig("create_course"),
    async (args: Record<string, unknown>) => runTool("create_course", args, ctx),
  );

  server.registerTool(
    "add_video_to_course",
    toolConfig("add_video_to_course"),
    async (args: Record<string, unknown>) => runTool("add_video_to_course", args, ctx),
  );

  server.registerTool(
    "list_tags",
    toolConfig("list_tags"),
    async (args: Record<string, unknown>) => runTool("list_tags", args, ctx),
  );

  server.registerTool(
    "get_chat_history",
    toolConfig("get_chat_history"),
    async (args: Record<string, unknown>) => runTool("get_chat_history", args, ctx),
  );

  server.registerTool(
    "get_chat_analytics",
    toolConfig("get_chat_analytics"),
    async (args: Record<string, unknown>) => runTool("get_chat_analytics", args, ctx),
  );

  server.registerTool(
    "get_evaluation_summary",
    toolConfig("get_evaluation_summary"),
    async (args: Record<string, unknown>) => runTool("get_evaluation_summary", args, ctx),
  );

  server.registerTool(
    "list_evaluation_logs",
    toolConfig("list_evaluation_logs"),
    async (args: Record<string, unknown>) => runTool("list_evaluation_logs", args, ctx),
  );

  return server;
}
