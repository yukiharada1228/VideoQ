import { useMutation, useQueryClient } from '@tanstack/react-query';
import { trpc } from '@/lib/trpc';
import {
  invalidateAfterVideoDelete,
  invalidateAfterVideoUpdate,
} from '@/lib/cacheInvalidation';

interface UseVideoDetailPageMutationsParams {
  videoId: number | null;
  onDeleteSuccess: () => void;
  onDeleteError?: (err: unknown) => void;
  onUpdate: () => Promise<void>;
  onUpdateSuccess: () => void;
}

export function useVideoDetailPageMutations({
  videoId,
  onDeleteSuccess,
  onDeleteError,
  onUpdate,
  onUpdateSuccess,
}: UseVideoDetailPageMutationsParams) {
  const queryClient = useQueryClient();

  const deleteMutation = trpc.videos.delete.useMutation({
    onSuccess: async () => {
      if (videoId) {
        await invalidateAfterVideoDelete(queryClient, videoId);
      }
      onDeleteSuccess();
    },
    onError: (err) => {
      onDeleteError?.(err);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      await onUpdate();
    },
    onSuccess: async () => {
      onUpdateSuccess();
      if (videoId) {
        await invalidateAfterVideoUpdate(queryClient, videoId);
      }
    },
  });

  return {
    deleteMutation,
    updateMutation,
  };
}
