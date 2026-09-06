import { trpc } from '@/lib/trpc';

export function useSharedCourseQuery(shareToken: string) {
  return trpc.courses.shared.useQuery({ slug: shareToken }, {
    enabled: !!shareToken,
  });
}
