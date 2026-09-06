import { trpc } from '@/lib/trpc';

interface UseCreateVideoCourseMutationParams {
  onSuccess?: () => void | Promise<void>;
}

export function useCreateVideoCourseMutation({
  onSuccess,
}: UseCreateVideoCourseMutationParams) {
  const utils = trpc.useUtils();

  return trpc.courses.create.useMutation({
    onSuccess: async () => {
      await utils.courses.list.invalidate();
      await onSuccess?.();
    },
  });
}

interface UseReorderVideoCoursesMutationParams {
  onSuccess?: () => void | Promise<void>;
}

export function useReorderVideoCoursesMutation({
  onSuccess,
}: UseReorderVideoCoursesMutationParams) {
  const utils = trpc.useUtils();

  return trpc.courses.reorder.useMutation({
    onSuccess: async () => {
      await utils.courses.list.invalidate();
      await onSuccess?.();
    },
  });
}
