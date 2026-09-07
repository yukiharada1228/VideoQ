import { act, renderHook } from '@testing-library/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Tag } from '@videoq/trpc';
import { trpc } from '@/lib/trpc';

describe('tRPC test QueryClient', () => {
  // Repeat with the same keys to also catch defaults or cache leaking between tests.
  it.each(['First tag', 'Second tag'])('applies isolated mutation defaults for %s', async (name) => {
    const tag: Tag = {
      id: 1, name, color: 'gray',
      created_at: '2026-09-07T00:00:00Z', video_count: 0,
    };
    globalThis.__setTrpcHandler('tags.create', () => tag);
    const { result, rerender } = renderHook(() => ({
      client: useQueryClient(),
      mutation: useMutation(trpc.tags.create.mutationOptions()),
    }));
    const client = result.current.client;
    const mutationKey = trpc.tags.create.mutationKey();
    const queryKey = trpc.tags.list.queryKey({ limit: 100, offset: 0 });
    expect(client.getMutationDefaults(mutationKey)).toEqual({});
    expect(client.getQueryData(queryKey)).toBeUndefined();

    client.setQueryData(queryKey, {
      data: [],
      meta: { total: 0, limit: 100, offset: 0 },
    });
    const onSuccess = vi.fn(() => client.invalidateQueries({ queryKey }));
    client.setMutationDefaults(mutationKey, { onSuccess });
    rerender();

    await act(async () => {
      await expect(result.current.mutation.mutateAsync({ name })).resolves.toEqual(tag);
    });

    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onSuccess.mock.calls[0].slice(0, 2)).toEqual([tag, { name }]);
    expect(client.getQueryState(queryKey)?.isInvalidated).toBe(true);
  });
});
