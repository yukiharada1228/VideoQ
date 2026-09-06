import { trpc } from '@/lib/trpc';

export function useChatAnalytics(courseId: number | null, enabled = true) {
  return trpc.chat.analytics.useQuery({ courseId: courseId! }, {
    enabled: enabled && courseId != null,
    staleTime: 5 * 60 * 1000,
  });
}
