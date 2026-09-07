import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Video } from '@videoq/trpc';
import { trpc } from '@/lib/trpc';

interface UseVideoEditingOptions {
  video: Video | null;
  videoId: number | null;
}

interface UseVideoEditingReturn {
  isEditing: boolean;
  editedTitle: string;
  editedDescription: string;
  editedTagIds: number[];
  setEditedTitle: (title: string) => void;
  setEditedDescription: (description: string) => void;
  setEditedTagIds: React.Dispatch<React.SetStateAction<number[]>>;
  startEditing: () => void;
  cancelEditing: () => void;
  handleUpdateVideo: () => Promise<void>;
}

export function useVideoEditing({ video, videoId }: UseVideoEditingOptions): UseVideoEditingReturn {
  const queryClient = useQueryClient();
  const updateVideoMutation = useMutation(trpc.videos.update.mutationOptions());
  const addTagsMutation = useMutation(trpc.memberships.addTags.mutationOptions());
  const removeTagMutation = useMutation(trpc.memberships.removeTag.mutationOptions());
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [editedTagIds, setEditedTagIds] = useState<number[]>([]);

  const saveVideoMutation = useMutation({
    mutationFn: async () => {
      if (!videoId || !video) return;

      await updateVideoMutation.mutateAsync({
        id: videoId,
        title: editedTitle,
        description: editedDescription,
      });

      const currentTagIds = video.tags?.map(tag => tag.id) || [];
      const tagsToAdd = editedTagIds.filter((id: number) => !currentTagIds.includes(id));
      const tagsToRemove = currentTagIds.filter((id: number) => !editedTagIds.includes(id));

      if (tagsToAdd.length > 0) {
        await addTagsMutation.mutateAsync({ videoId, tagIds: tagsToAdd });
      }

      if (tagsToRemove.length > 0) {
        await Promise.all(tagsToRemove.map((tagId: number) =>
          removeTagMutation.mutateAsync({ videoId, tagId })
        ));
      }
    },
    onSuccess: async () => {
      if (!videoId) return;
      await Promise.all([
        queryClient.invalidateQueries(trpc.videos.get.queryFilter({ id: videoId })),
        queryClient.invalidateQueries(trpc.videos.list.pathFilter()),
      ]);
    },
  });

  const startEditing = useCallback(() => {
    if (video) {
      setEditedTitle(video.title);
      setEditedDescription(video.description || '');
      setEditedTagIds(video.tags?.map(tag => tag.id) || []);
      setIsEditing(true);
    }
  }, [video]);

  const cancelEditing = useCallback(() => {
    setIsEditing(false);
    if (video) {
      setEditedTitle(video.title);
      setEditedDescription(video.description || '');
    }
  }, [video]);

  const handleUpdateVideo = useCallback(async () => {
    if (!videoId || !video) return;
    await saveVideoMutation.mutateAsync();
  }, [videoId, video, saveVideoMutation]);

  return {
    isEditing,
    editedTitle,
    editedDescription,
    editedTagIds,
    setEditedTitle,
    setEditedDescription,
    setEditedTagIds,
    startEditing,
    cancelEditing,
    handleUpdateVideo,
  };
}
