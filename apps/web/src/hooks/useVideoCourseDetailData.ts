import { useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
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
  const courseQuery = trpc.courses.get.useQuery({ id: courseId! }, {
    enabled: !!courseId,
  });

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

  return trpc.videos.list.useQuery({
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
  });
}

interface UseVideoCourseDetailMutationsParams {
  courseId: number | null;
  onDeleteSuccess: () => void;
  onUpdateSuccess?: () => void;
}

export function useAddVideosToCourseMutation(courseId: number | null, onSuccess?: () => void | Promise<void>) {
  const utils = trpc.useUtils();
  const addVideos = trpc.memberships.addVideos.useMutation();

  return useMutation({
    mutationFn: async (videoIds: number[]) => {
      if (!courseId) {
        throw new Error('Course ID is required');
      }
      return addVideos.mutateAsync({ courseId, videoIds });
    },
    onSuccess: async () => {
      if (courseId) {
        await utils.courses.get.invalidate({ id: courseId });
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
  const utils = trpc.useUtils();
  const removeVideo = trpc.memberships.removeVideo.useMutation();
  const reorderVideos = trpc.memberships.reorderVideos.useMutation();
  const deleteCourse = trpc.courses.delete.useMutation();
  const updateCourse = trpc.courses.update.useMutation();

  const syncCourseDetail = useCallback(async () => {
    if (!courseId) {
      return;
    }
    await Promise.all([
      utils.courses.get.invalidate({ id: courseId }),
      utils.courses.list.invalidate(),
    ]);
  }, [courseId, utils.courses.get, utils.courses.list]);

  const setCourseDetailCache = useCallback((nextGroup: VideoCourse) => {
    if (!courseId) {
      return;
    }
    utils.courses.get.setData({ id: courseId }, nextGroup);
  }, [courseId, utils.courses.get]);

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
        await utils.courses.get.invalidate({ id: courseId });
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
      await utils.courses.list.invalidate();
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
