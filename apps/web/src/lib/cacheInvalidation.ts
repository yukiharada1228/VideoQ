import type { QueryClient } from '@tanstack/react-query'
import { getQueryKey } from '@trpc/react-query'
import { trpc } from './trpc'

const trpcVideoQueries = getQueryKey(trpc.videos)
const trpcCourseQueries = getQueryKey(trpc.courses)

export async function invalidateAfterVideoUpload(queryClient: QueryClient): Promise<void> {
  await queryClient.invalidateQueries({ queryKey: trpcVideoQueries })
}

export async function invalidateAfterVideoDelete(
  queryClient: QueryClient,
  videoId: number,
): Promise<void> {
  queryClient.removeQueries({ queryKey: getQueryKey(trpc.videos.get, { id: videoId }) })
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: trpcVideoQueries }),
    queryClient.invalidateQueries({ queryKey: trpcCourseQueries }),
  ])
}

export async function invalidateAfterVideoUpdate(
  queryClient: QueryClient,
  videoId: number,
): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: getQueryKey(trpc.videos.get, { id: videoId }) }),
    queryClient.invalidateQueries({ queryKey: trpcVideoQueries }),
    queryClient.invalidateQueries({ queryKey: trpcCourseQueries }),
  ])
}
