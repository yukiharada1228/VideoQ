import { renderHook, act, waitFor } from '@testing-library/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Tag, TagPage } from '@videoq/trpc'

const trpcApi = vi.hoisted(() => ({
  listTags: vi.fn(),
  createTag: vi.fn(),
  updateTag: vi.fn(),
  deleteTag: vi.fn(),
}))

vi.mock('@/lib/trpc', () => {
  const listKey = ['trpc', 'tags', 'list'] as const

  return {
    trpc: {
      useUtils: () => {
        const queryClient = useQueryClient()
        return {
          tags: {
            list: {
              cancel: () => queryClient.cancelQueries({ queryKey: listKey }),
              setData: (
                _input: unknown,
                updater: (previous: TagPage | undefined) => TagPage,
              ) => queryClient.setQueryData<TagPage>(listKey, updater),
            },
          },
        }
      },
      tags: {
        list: {
          useQuery: () => useQuery<TagPage>({
            queryKey: listKey,
            queryFn: async () => {
              const data = await trpcApi.listTags() as Tag[]
              return {
                data,
                meta: { total: data.length, limit: 100, offset: 0 },
              }
            },
          }),
        },
        create: {
          useMutation: () => useMutation({
            mutationFn: (input) => trpcApi.createTag(input),
          }),
        },
        update: {
          useMutation: () => useMutation({
            mutationFn: (input) => trpcApi.updateTag(input),
          }),
        },
        delete: {
          useMutation: () => useMutation({
            mutationFn: (input) => trpcApi.deleteTag(input),
          }),
        },
      },
    },
  }
})

import { useTags } from '../useTags'

const tag = (fields: Partial<Tag> & Pick<Tag, 'id' | 'name' | 'color'>): Tag => ({
  created_at: '2023-01-01',
  video_count: 0,
  ...fields,
})

describe('useTags', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with empty tags array', async () => {
    trpcApi.listTags.mockResolvedValue([])
    const { result } = renderHook(() => useTags())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.tags).toEqual([])
    expect(result.current.error).toBeNull()
  })

  it('should load tags on mount', async () => {
    const mockTags = [
      tag({ id: 1, name: 'Tag 1', color: 'red' }),
      tag({ id: 2, name: 'Tag 2', color: 'green', created_at: '2023-01-02' }),
    ]
    trpcApi.listTags.mockResolvedValue(mockTags)

    const { result } = renderHook(() => useTags())

    await waitFor(() => {
      expect(result.current.tags).toEqual(mockTags)
      expect(result.current.isLoading).toBe(false)
    })
  })

  it('should create a tag', async () => {
    const mockTag = tag({
      id: 3,
      name: 'New Tag',
      color: 'blue',
      created_at: '2023-01-03',
    })
    trpcApi.createTag.mockResolvedValue(mockTag)
    trpcApi.listTags.mockResolvedValue([])

    const { result } = renderHook(() => useTags())

    await act(async () => {
      await result.current.createTag('New Tag', 'blue')
    })

    expect(trpcApi.createTag).toHaveBeenCalledWith({ name: 'New Tag', color: 'blue' })
    await waitFor(() => {
      expect(result.current.tags).toContainEqual(mockTag)
    })
  })

  it('should update a tag', async () => {
    const initialTags = [tag({ id: 1, name: 'Old Tag', color: 'red' })]
    const updatedTag = tag({ id: 1, name: 'Updated Tag', color: 'yellow' })
    trpcApi.listTags.mockResolvedValue(initialTags)
    trpcApi.updateTag.mockResolvedValue(updatedTag)

    const { result } = renderHook(() => useTags())

    await waitFor(() => {
      expect(result.current.tags).toEqual(initialTags)
    })

    await act(async () => {
      await result.current.updateTag(1, 'Updated Tag', 'yellow')
    })

    expect(trpcApi.updateTag).toHaveBeenCalledWith({
      id: 1,
      name: 'Updated Tag',
      color: 'yellow',
    })
    await waitFor(() => {
      expect(result.current.tags).toEqual([updatedTag])
    })
  })

  it('should delete a tag', async () => {
    const initialTags = [
      tag({ id: 1, name: 'Tag 1', color: 'red' }),
      tag({ id: 2, name: 'Tag 2', color: 'green', created_at: '2023-01-02' }),
    ]
    trpcApi.listTags.mockResolvedValue(initialTags)
    trpcApi.deleteTag.mockResolvedValue({ id: 1 })

    const { result } = renderHook(() => useTags())

    await waitFor(() => {
      expect(result.current.tags).toEqual(initialTags)
    })

    await act(async () => {
      await result.current.deleteTag(1)
    })

    expect(trpcApi.deleteTag).toHaveBeenCalledWith({ id: 1 })
    await waitFor(() => {
      expect(result.current.tags).toEqual([initialTags[1]])
    })
  })

  it('should handle loading errors', async () => {
    trpcApi.listTags.mockRejectedValue(new Error('Failed to load'))

    const { result } = renderHook(() => useTags())

    await waitFor(() => {
      expect(result.current.error).toBe('Failed to load')
    })
  })
})
