import { trpc } from '@/lib/trpc';

interface UseHomePageDataParams {
  userId: string | null | undefined;
}

export function useHomePageData({ userId }: UseHomePageDataParams) {
  const videosQuery = trpc.videos.list.useQuery({
    limit: 5,
    ordering: 'uploaded_at_desc',
  }, {
    enabled: !!userId,
  });
  const coursesQuery = trpc.courses.list.useQuery({ limit: 1 }, {
    enabled: !!userId,
  });

  return {
    videos: videosQuery.data?.data ?? [],
    courseCount: coursesQuery.data?.meta.total ?? 0,
    isLoading: videosQuery.isLoading || coursesQuery.isLoading,
    videosQuery,
    coursesQuery,
  };
}
