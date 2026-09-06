export const MCP_READ_SCOPE = "videoq.read";
export const MCP_WRITE_SCOPE = "videoq.write";
export const MCP_OAUTH_SCOPES = [
  "openid",
  "profile",
  "email",
  "offline_access",
  MCP_READ_SCOPE,
  MCP_WRITE_SCOPE,
] as const;
