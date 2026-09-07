import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Course as VideoCourse } from '@videoq/trpc';
import { trpc } from '@/lib/trpc';
import { createVideoIdSet } from '@/lib/utils/videoConversion';

interface UseVideoCourseDetailQueryResult {
  course: VideoCourse | null;
  isLoading: boolean;
  isFetching: boolean;
  errorMessage: string | null;
}

export function useVideoCourseDetailQuery(courseId: number | null): UseVideoCourseDetailQueryResult {
  const courseQuery = useQuery(trpc.courses.get.queryOptions({ id: courseId! }, {
    enabled: !!courseId,
  }));

  return {
    course: courseQuery.data ?? null,
    isLoading: courseQuery.isLoading,
    isFetching: courseQuery.isFetching,
    errorMessage: courseQuery.error instanceof Error ? courseQuery.error.message : null,
  };
}

interface UseAddableVideosQueryParams {
  isOpen: boolean;
  courseId: number | null;
  course: VideoCourse | null;
  q: string;
  status: string;
  ordering: string;
  tagIds: number[];
}

export function useAddableVideosQuery({
  isOpen,
  courseId,
  course,
  q,
  status,
  ordering,
  tagIds,
}: UseAddableVideosQueryParams) {
  const normalizedOrdering = [
    'uploaded_at_desc',
    'uploaded_at_asc',
    'title_asc',
    'title_desc',
  ].includes(ordering)
    ? ordering as 'uploaded_at_desc' | 'uploaded_at_asc' | 'title_asc' | 'title_desc'
    : undefined;

  return useQuery(trpc.videos.list.queryOptions({
    q: q || undefined,
    status: status || undefined,
    ordering: normalizedOrdering,
    tags: tagIds.length > 0 ? tagIds : undefined,
    limit: 100,
  }, {
    enabled: isOpen && !!course && !!courseId,
    select: (response) => {
      if (!course?.videos) return [];
      const currentVideoIdSet = createVideoIdSet(course.videos.map((v) => v.id));
      return response.data.filter((v) => !currentVideoIdSet.has(v.id));
    },
  }));
}

interface UseVideoCourseDetailMutationsParams {
  courseId: number | null;
  onDeleteSuccess: () => void;
  onUpdateSuccess?: () => void;
}

export function useAddVideosToCourseMutation(courseId: number | null, onSuccess?: () => void | Promise<void>) {
  const queryClient = useQueryClient();
  const addVideos = useMutation(trpc.memberships.addVideos.mutationOptions());

  return useMutation({
    mutationFn: async (videoIds: number[]) => {
      if (!courseId) {
        throw new Error('Course ID is required');
      }
      return addVideos.mutateAsync({ courseId, videoIds });
    },
    onSuccess: async () => {
      if (courseId) {
        await queryClient.invalidateQueries(trpc.courses.get.queryFilter({ id: courseId }));
      }
      await onSuccess?.();
    },
  });
}

export function useVideoCourseDetailMutations({
  courseId,
  onDeleteSuccess,
  onUpdateSuccess,
}: UseVideoCourseDetailMutationsParams) {
  const queryClient = useQueryClient();
  const removeVideo = useMutation(trpc.memberships.removeVideo.mutationOptions());
  const reorderVideos = useMutation(trpc.memberships.reorderVideos.mutationOptions());
  const deleteCourse = useMutation(trpc.courses.delete.mutationOptions());
  const updateCourse = useMutation(trpc.courses.update.mutationOptions());

  const syncCourseDetail = useCallback(async () => {
    if (!courseId) {
      return;
    }
    await Promise.all([
      queryClient.invalidateQueries(trpc.courses.get.queryFilter({ id: courseId })),
      queryClient.invalidateQueries(trpc.courses.list.pathFilter()),
    ]);
  }, [courseId, queryClient]);

  const setCourseDetailCache = useCallback((nextGroup: VideoCourse) => {
    if (!courseId) {
      return;
    }
    queryClient.setQueryData(trpc.courses.get.queryKey({ id: courseId }), nextGroup);
  }, [courseId, queryClient]);

  const addVideosMutation = useAddVideosToCourseMutation(courseId);

  const removeVideoMutation = useMutation({
    mutationFn: async (videoId: number) => {
      if (!courseId) {
        throw new Error('Course ID is required');
      }
      await removeVideo.mutateAsync({ courseId, videoId });
      return videoId;
    },
    onSuccess: async () => {
      if (courseId) {
        await queryClient.invalidateQueries(trpc.courses.get.queryFilter({ id: courseId }));
      }
    },
  });

  const reorderVideosMutation = useMutation({
    mutationFn: async (videoIds: number[]) => {
      if (!courseId) {
        throw new Error('Course ID is required');
      }
      await reorderVideos.mutateAsync({ courseId, videoIds });
    },
  });

  const deleteCourseMutation = useMutation({
    mutationFn: async () => {
      if (!courseId) {
        throw new Error('Course ID is required');
      }
      await deleteCourse.mutateAsync({ id: courseId });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries(trpc.courses.list.pathFilter());
      onDeleteSuccess();
    },
  });

  const updateCourseMutation = useMutation({
    mutationFn: async (payload: { name: string; description: string }) => {
      if (!courseId) {
        throw new Error('Course ID is required');
      }
      await updateCourse.mutateAsync({ id: courseId, ...payload });
    },
    onSuccess: async () => {
      onUpdateSuccess?.();
      await syncCourseDetail();
    },
  });

  return {
    syncCourseDetail,
    setCourseDetailCache,
    addVideosMutation,
    removeVideoMutation,
    reorderVideosMutation,
    deleteCourseMutation,
    updateCourseMutation,
  };
}
