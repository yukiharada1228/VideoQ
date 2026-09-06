import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { QueryClient } from '@tanstack/react-query';
import { getQueryKey } from '@trpc/react-query';
import {
  invalidateAfterVideoDelete,
  invalidateAfterVideoUpdate,
  invalidateAfterVideoUpload,
} from '../cacheInvalidation';
import { trpc } from '../trpc';

function createMockQueryClient(): QueryClient {
  return {
    invalidateQueries: vi.fn().mockResolvedValue(undefined),
    removeQueries: vi.fn(),
  } as unknown as QueryClient;
}

describe('tRPC cache invalidation', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createMockQueryClient();
  });

  it('invalidates the videos router after upload', async () => {
    await invalidateAfterVideoUpload(queryClient);

    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: getQueryKey(trpc.videos),
    });
  });

  it('removes the detail and invalidates video and course data after deletion', async () => {
    await invalidateAfterVideoDelete(queryClient, 42);

    expect(queryClient.removeQueries).toHaveBeenCalledWith({
      queryKey: getQueryKey(trpc.videos.get, { id: 42 }),
    });
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: getQueryKey(trpc.videos),
    });
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: getQueryKey(trpc.courses),
    });
  });

  it('invalidates the detail, video router, and course router after update', async () => {
    await invalidateAfterVideoUpdate(queryClient, 7);

    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: getQueryKey(trpc.videos.get, { id: 7 }),
    });
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: getQueryKey(trpc.videos),
    });
    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: getQueryKey(trpc.courses),
    });
  });
});
