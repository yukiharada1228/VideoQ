/** Cache keys for Better Auth extensions that are not part of the tRPC router. */
export const queryKeys = {
  auth: {
    apiKeys: ['auth', 'apiKeys'] as const,
    oauthTokens: ['auth', 'oauthTokens'] as const,
  },
} as const;
