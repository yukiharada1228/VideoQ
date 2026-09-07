import type { QueryClient } from '@tanstack/react-query'
import { trpc } from './trpc'

const trpcVideoQueries = trpc.videos.pathKey()
const trpcCourseQueries = trpc.courses.pathKey()

export async function invalidateAfterVideoUpload(queryClient: QueryClient): Promise<void> {
  await queryClient.invalidateQueries({ queryKey: trpcVideoQueries })
}

export async function invalidateAfterVideoDelete(
  queryClient: QueryClient,
  videoId: number,
): Promise<void> {
  queryClient.removeQueries(trpc.videos.get.queryFilter({ id: videoId }))
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
    queryClient.invalidateQueries(trpc.videos.get.queryFilter({ id: videoId })),
    queryClient.invalidateQueries({ queryKey: trpcVideoQueries }),
    queryClient.invalidateQueries({ queryKey: trpcCourseQueries }),
  ])
}
