import { authClient } from '@/lib/auth-client';

/**
 * Better Auth cookie session — source of truth for "signed in".
 * App profile fields come from the `account.me` tRPC query.
 */
export function useAuthSession() {
  return authClient.useSession();
}

export async function fetchAuthSession() {
  return authClient.getSession();
}
