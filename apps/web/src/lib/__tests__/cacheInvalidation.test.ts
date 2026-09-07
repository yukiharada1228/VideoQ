import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { QueryClient, type QueryKey } from '@tanstack/react-query';
import {
  invalidateAfterVideoDelete,
  invalidateAfterVideoUpdate,
  invalidateAfterVideoUpload,
} from '../cacheInvalidation';
import { trpc } from '../trpc';

describe('tRPC cache invalidation', () => {
  let queryClient: QueryClient;
  const videoList = trpc.videos.list.queryKey({ limit: 24 });
  const videoPages = trpc.videos.list.infiniteQueryKey({ limit: 24 });
  const videoDetail = trpc.videos.get.queryKey({ id: 42 });
  const otherVideo = trpc.videos.get.queryKey({ id: 7 });
  const coursePages = trpc.courses.list.infiniteQueryKey({ limit: 24 });
  const courseDetail = trpc.courses.get.queryKey({ id: 1 });
  const tags = trpc.tags.list.queryKey();
  const allKeys: QueryKey[] = [
    videoList, videoPages, videoDetail, otherVideo, coursePages, courseDetail, tags,
  ];

  beforeEach(() => {
    queryClient = new QueryClient();
    // These tests exercise cache selection without fetching application data.
    for (const key of allKeys) queryClient.setQueryData(key, { cached: true });
  });

  afterEach(() => queryClient.clear());

  function expectInvalidated(keys: QueryKey[]) {
    for (const key of allKeys) {
      expect(queryClient.getQueryState(key)?.isInvalidated, JSON.stringify(key))
        .toBe(keys.includes(key));
    }
  }

  it('invalidates both regular and infinite video queries after upload', async () => {
    await invalidateAfterVideoUpload(queryClient);
    expectInvalidated([videoList, videoPages, videoDetail, otherVideo]);
  });

  it('removes only the deleted detail and invalidates video and course queries', async () => {
    await invalidateAfterVideoDelete(queryClient, 42);
    expect(queryClient.getQueryState(videoDetail)).toBeUndefined();
    for (const key of [videoList, videoPages, otherVideo, coursePages, courseDetail]) {
      expect(queryClient.getQueryState(key)?.isInvalidated).toBe(true);
    }
    expect(queryClient.getQueryState(tags)?.isInvalidated).toBe(false);
  });

  it('retains detail data and invalidates video and course queries after update', async () => {
    await invalidateAfterVideoUpdate(queryClient, 42);
    expect(queryClient.getQueryData(videoDetail)).toEqual({ cached: true });
    expectInvalidated([videoList, videoPages, videoDetail, otherVideo, coursePages, courseDetail]);
  });
});
