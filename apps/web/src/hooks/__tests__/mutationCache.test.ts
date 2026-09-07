import { act, renderHook } from '@testing-library/react';
import { useQueryClient, type QueryClient, type QueryKey } from '@tanstack/react-query';
import type { Video } from '@videoq/trpc';
import { trpc } from '@/lib/trpc';
import { useVideoEditing } from '../useVideoEditing';
import { useVideoCourseDetailMutations } from '../useVideoCourseDetailData';

function seedCache(client: QueryClient, keys: QueryKey[]) {
  for (const key of keys) client.setQueryData(key, { cached: true });
}

describe('mutation cache updates', () => {
  it('marks video detail and both list formats stale after saving an edit', async () => {
    const video: Video = {
      id: 7, title: 'Before', description: '', file: null,
      source_type: 'uploaded', uploaded_at: '2026-09-07T00:00:00Z',
      status: 'completed', tags: [],
    };
    const update = vi.fn(() => ({ ...video, title: 'After' }));
    globalThis.__setTrpcHandler('videos.update', update);
    const { result } = renderHook(() => ({
      client: useQueryClient(),
      editor: useVideoEditing({ video, videoId: video.id }),
    }));
    const keys = [
      trpc.videos.get.queryKey({ id: video.id }),
      trpc.videos.list.queryKey({ limit: 24 }),
      trpc.videos.list.infiniteQueryKey({ limit: 24 }),
    ];
    const otherVideo = trpc.videos.get.queryKey({ id: 8 });
    seedCache(result.current.client, [...keys, otherVideo]);

    act(() => {
      result.current.editor.startEditing();
      result.current.editor.setEditedTitle('After');
    });
    await act(() => result.current.editor.handleUpdateVideo());

    expect(update).toHaveBeenCalledWith({ id: video.id, title: 'After', description: '' });
    for (const key of keys) {
      expect(result.current.client.getQueryState(key)?.isInvalidated).toBe(true);
    }
    expect(result.current.client.getQueryState(otherVideo)?.isInvalidated).toBe(false);
  });

  it('marks course detail and both list formats stale after saving course metadata', async () => {
    const update = vi.fn(() => ({ id: 7, name: 'After', description: '' }));
    globalThis.__setTrpcHandler('courses.update', update);
    const { result } = renderHook(() => ({
      client: useQueryClient(),
      mutations: useVideoCourseDetailMutations({ courseId: 7, onDeleteSuccess: vi.fn() }),
    }));
    const keys = [
      trpc.courses.get.queryKey({ id: 7 }),
      trpc.courses.list.queryKey({ limit: 24 }),
      trpc.courses.list.infiniteQueryKey({ limit: 24 }),
    ];
    seedCache(result.current.client, keys);

    await act(async () => {
      await result.current.mutations.updateCourseMutation.mutateAsync({ name: 'After', description: '' });
    });

    expect(update).toHaveBeenCalledWith({ id: 7, name: 'After', description: '' });
    for (const key of keys) {
      expect(result.current.client.getQueryState(key)?.isInvalidated).toBe(true);
    }
  });
});
