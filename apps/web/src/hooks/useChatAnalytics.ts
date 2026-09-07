import { useQuery } from '@tanstack/react-query';
import { trpc } from '@/lib/trpc';

export function useChatAnalytics(courseId: number | null, enabled = true) {
  return useQuery(trpc.chat.analytics.queryOptions({ courseId: courseId! }, {
    enabled: enabled && courseId != null,
    staleTime: 5 * 60 * 1000,
  }));
}
