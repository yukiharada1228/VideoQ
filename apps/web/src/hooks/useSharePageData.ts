import { useQuery } from '@tanstack/react-query';
import { trpc } from '@/lib/trpc';

export function useSharedCourseQuery(shareToken: string) {
  return useQuery(trpc.courses.shared.queryOptions({ slug: shareToken }, {
    enabled: !!shareToken,
  }));
}
