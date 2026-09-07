import { useQueryClient, useMutation } from '@tanstack/react-query';
import { trpc } from '@/lib/trpc';

interface UseCreateVideoCourseMutationParams {
  onSuccess?: () => void | Promise<void>;
}

export function useCreateVideoCourseMutation({
  onSuccess,
}: UseCreateVideoCourseMutationParams) {
  const queryClient = useQueryClient();

  return useMutation(trpc.courses.create.mutationOptions({
    onSuccess: async () => {
      await queryClient.invalidateQueries(trpc.courses.list.pathFilter());
      await onSuccess?.();
    },
  }));
}

interface UseReorderVideoCoursesMutationParams {
  onSuccess?: () => void | Promise<void>;
}

export function useReorderVideoCoursesMutation({
  onSuccess,
}: UseReorderVideoCoursesMutationParams) {
  const queryClient = useQueryClient();

  return useMutation(trpc.courses.reorder.mutationOptions({
    onSuccess: async () => {
      await queryClient.invalidateQueries(trpc.courses.list.pathFilter());
      await onSuccess?.();
    },
  }));
}
