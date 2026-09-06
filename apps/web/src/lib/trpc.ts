import { TRPCClientError, httpBatchLink } from '@trpc/client'
import { createTRPCReact } from '@trpc/react-query'
import type { AppRouter } from '@videoq/trpc'
import { TRPC_MAX_BATCH_SIZE } from '@videoq/trpc/schema'
import { ApiError } from '@/lib/api-error'
import { API_URL } from '@/lib/apiConfig'

export const trpc = createTRPCReact<AppRouter>()
export const TRPC_UNAUTHORIZED_EVENT = 'videoq:trpc-unauthorized'

function normalizeTrpcError(error: unknown): unknown {
  if (!(error instanceof TRPCClientError)) return error
  return new ApiError(
    error.message,
    error.data?.applicationCode ?? error.data?.code ?? 'UNKNOWN',
    undefined,
    error.data?.details,
  )
}

function withApplicationErrors<T extends object>(client: T): T {
  const cache = new WeakMap<object, object>()
  const wrap = (target: object): object => {
    const cached = cache.get(target)
    if (cached) return cached
    const proxy = new Proxy(target, {
      get(current, property, receiver) {
        const value = Reflect.get(current, property, receiver) as unknown
        if ((property === 'query' || property === 'mutate') && typeof value === 'function') {
          return (...args: unknown[]) => Promise.resolve(value.apply(current, args)).catch((error) => {
            throw normalizeTrpcError(error)
          })
        }
        if ((typeof value === 'object' && value !== null) || typeof value === 'function') {
          return wrap(value as object)
        }
        return value
      },
    })
    cache.set(target, proxy)
    return proxy
  }
  return wrap(client) as T
}

interface AppTrpcClientOptions {
  baseUrl?: string
  fetchFn?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
  onUnauthorized?: () => void | Promise<void>
}

export function createAppTrpcClient(settings: AppTrpcClientOptions = {}) {
  const baseUrl = (settings.baseUrl ?? API_URL).replace(/\/+$/, '')
  const fetchFn = settings.fetchFn ?? fetch
  const client = trpc.createClient({
    links: [
      httpBatchLink({
        url: `${baseUrl}/trpc`,
        maxItems: TRPC_MAX_BATCH_SIZE,
        async fetch(url, requestInit) {
          const response = await fetchFn(url, { ...requestInit, credentials: 'include' })
          if (response.status === 401) {
            if (settings.onUnauthorized) {
              await settings.onUnauthorized()
            } else if (typeof window !== 'undefined') {
              window.dispatchEvent(new Event(TRPC_UNAUTHORIZED_EVENT))
            }
          }
          return response
        },
      }),
    ],
  })
  return withApplicationErrors(client)
}

export const appTrpcClient = createAppTrpcClient()
