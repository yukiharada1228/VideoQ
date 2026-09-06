import { renderHook } from '@testing-library/react'
import type { VideoStatusCounts } from '@videoq/trpc'

const trpcMock = vi.hoisted(() => ({
  useStatusCountsQuery: vi.fn(),
}))

vi.mock('@/lib/trpc', () => ({
  trpc: {
    videos: {
      statusCounts: {
        useQuery: trpcMock.useStatusCountsQuery,
      },
    },
  },
}))

import { useVideoStats, useVideoStatusCounts } from '../useVideoStats'

describe('useVideoStats', () => {
  it('should calculate stats for empty array', () => {
    const { result } = renderHook(() => useVideoStats([]))
    
    expect(result.current).toEqual({
      total: 0,
      completed: 0,
      pending: 0,
      processing: 0,
      indexing: 0,
      error: 0,
    })
  })

  it('should calculate stats for videos with different statuses', () => {
    const videos = [
      { status: 'completed' as const },
      { status: 'completed' as const },
      { status: 'pending' as const },
      { status: 'processing' as const },
      { status: 'indexing' as const },
      { status: 'error' as const },
    ]
    
    const { result } = renderHook(() => useVideoStats(videos))
    
    expect(result.current).toEqual({
      total: 6,
      completed: 2,
      pending: 1,
      processing: 1,
      indexing: 1,
      error: 1,
    })
  })

  it('should recalculate when videos change', () => {
    const { result, rerender } = renderHook<
      ReturnType<typeof useVideoStats>,
      { videos: Array<{ status: 'completed' | 'pending' | 'processing' | 'indexing' | 'error' }> }
    >(
      ({ videos }) => useVideoStats(videos),
      {
        initialProps: {
          videos: [{ status: 'completed' as const }],
        },
      }
    )
    
    expect(result.current.total).toBe(1)
    expect(result.current.completed).toBe(1)
    
    rerender({
      videos: [
        { status: 'completed' as const },
        { status: 'pending' as const },
      ],
    })
    
    expect(result.current.total).toBe(2)
    expect(result.current.completed).toBe(1)
    expect(result.current.pending).toBe(1)
  })
})

describe('useVideoStatusCounts', () => {
  it('reads server-side status totals through tRPC', () => {
    const stats: VideoStatusCounts = {
      total: 8,
      completed: 3,
      pending: 1,
      processing: 1,
      indexing: 1,
      error: 1,
      uploading: 1,
    }
    trpcMock.useStatusCountsQuery.mockReturnValue({
      data: stats,
      isLoading: false,
      error: null,
    })

    const { result } = renderHook(() => useVideoStatusCounts(true))

    expect(trpcMock.useStatusCountsQuery).toHaveBeenCalledWith(undefined, {
      enabled: true,
      staleTime: 30_000,
    })
    expect(result.current).toEqual({
      stats,
      isLoading: false,
      error: null,
    })
  })
})
