import { useCallback, useEffect } from 'react';
import type { TagPage } from '@videoq/trpc';
import { trpc } from '@/lib/trpc';
import {
  DEFAULT_TAG_CHIP_COLOR,
  isTagChipColor,
} from '@/lib/tagColors';

const TAG_LIST_INPUT = { limit: 100, offset: 0 } as const;

function emptyTagPage(): TagPage {
  return {
    data: [],
    meta: { total: 0, ...TAG_LIST_INPUT },
  };
}

export function useTags() {
  const utils = trpc.useUtils();

  const tagsQuery = trpc.tags.list.useQuery(TAG_LIST_INPUT);

  const createTagMutation = trpc.tags.create.useMutation();

  const updateTagMutation = trpc.tags.update.useMutation();

  const deleteTagMutation = trpc.tags.delete.useMutation();

  const createTag = useCallback(
    async (name: string, color?: string) => {
      const selectedColor = color ?? DEFAULT_TAG_CHIP_COLOR;
      if (!isTagChipColor(selectedColor)) {
        throw new Error(`Invalid tag color: ${selectedColor}`);
      }

      await utils.tags.list.cancel(TAG_LIST_INPUT);
      const newTag = await createTagMutation.mutateAsync({
        name,
        color: selectedColor,
      });
      utils.tags.list.setData(TAG_LIST_INPUT, (previous) => {
        const page = previous ?? emptyTagPage();
        return {
          data: [...page.data, newTag],
          meta: { ...page.meta, total: page.meta.total + 1 },
        };
      });
      return newTag;
    },
    [createTagMutation, utils.tags.list]
  );

  const updateTag = useCallback(
    async (id: number, name?: string, color?: string) => {
      if (color !== undefined && !isTagChipColor(color)) {
        throw new Error(`Invalid tag color: ${color}`);
      }

      await utils.tags.list.cancel(TAG_LIST_INPUT);
      const updatedTag = await updateTagMutation.mutateAsync({ id, name, color });
      utils.tags.list.setData(TAG_LIST_INPUT, (previous) => {
        const page = previous ?? emptyTagPage();
        return {
          ...page,
          data: page.data.map((tag) =>
            tag.id === updatedTag.id ? updatedTag : tag,
          ),
        };
      });
      return updatedTag;
    },
    [updateTagMutation, utils.tags.list]
  );

  const deleteTag = useCallback(
    async (id: number) => {
      await utils.tags.list.cancel(TAG_LIST_INPUT);
      await deleteTagMutation.mutateAsync({ id });
      utils.tags.list.setData(TAG_LIST_INPUT, (previous) => {
        const page = previous ?? emptyTagPage();
        const data = page.data.filter((tag) => tag.id !== id);
        return {
          data,
          meta: {
            ...page.meta,
            total: Math.max(0, page.meta.total - (data.length < page.data.length ? 1 : 0)),
          },
        };
      });
    },
    [deleteTagMutation, utils.tags.list]
  );

  useEffect(() => {
    if (tagsQuery.error) {
      console.error('Failed to load tags:', tagsQuery.error);
    }
  }, [tagsQuery.error]);

  const loadTags = useCallback(async () => {
    await tagsQuery.refetch();
  }, [tagsQuery]);

  const errorSource =
    tagsQuery.error ??
    createTagMutation.error ??
    updateTagMutation.error ??
    deleteTagMutation.error;
  const error = errorSource instanceof Error ? errorSource.message : null;
  const isLoading =
    tagsQuery.isLoading ||
    createTagMutation.isPending ||
    updateTagMutation.isPending ||
    deleteTagMutation.isPending;

  return {
    tags: tagsQuery.data?.data ?? [],
    isLoading,
    error,
    loadTags,
    refetchTags: loadTags,
    createTag,
    updateTag,
    deleteTag,
  };
}
