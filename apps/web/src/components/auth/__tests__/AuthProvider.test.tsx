import { act, render } from '@testing-library/react'
import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api'
import { useI18nNavigate } from '@/lib/i18n'
import { TRPC_UNAUTHORIZED_EVENT } from '@/lib/trpc'
import { AuthProvider } from '../AuthProvider'

const cachedProfileKey = ['test', 'account.me'] as const

vi.mock('@/lib/api', () => ({
  apiClient: {
    setUnauthorizedHandler: vi.fn(),
    logout: vi.fn(() => Promise.resolve()),
  },
}))

function latestUnauthorizedHandler(): (() => void | Promise<void>) {
  const calls = (apiClient.setUnauthorizedHandler as ReturnType<typeof vi.fn>).mock.calls
  for (let i = calls.length - 1; i >= 0; i -= 1) {
    const candidate = calls[i][0]
    if (typeof candidate === 'function') {
      return candidate
    }
  }
  throw new Error('Unauthorized handler was not registered')
}

describe('AuthProvider', () => {
  let queryClient: QueryClient | null = null

  function QueryClientProbe({ onClient }: { onClient: (client: QueryClient) => void }) {
    const client = useQueryClient()
    useEffect(() => {
      onClient(client)
    }, [client, onClient])
    return null
  }

  beforeEach(() => {
    vi.clearAllMocks()
    queryClient = null
    ;(globalThis as any).__setMockPathname?.('/videos')
    window.history.pushState({}, '', '/videos')
  })

  it('clears cached auth state and redirects protected routes when any API reports unauthorized', async () => {
    render(
      <AuthProvider>
        <QueryClientProbe onClient={(client) => { queryClient = client }} />
      </AuthProvider>,
    )

    expect(apiClient.setUnauthorizedHandler).toHaveBeenCalledWith(expect.any(Function))
    expect(queryClient).not.toBeNull()
    queryClient!.setQueryData(cachedProfileKey, { id: 1, username: 'testuser' })

    await act(async () => {
      await latestUnauthorizedHandler()()
    })

    expect(queryClient!.getQueryData(cachedProfileKey)).toBeUndefined()
    expect(useI18nNavigate()).toHaveBeenCalledWith('/login')
  })

  it('clears cached auth state without redirecting from public routes', async () => {
    ;(globalThis as any).__setMockPathname?.('/login')
    window.history.pushState({}, '', '/login')

    render(
      <AuthProvider>
        <QueryClientProbe onClient={(client) => { queryClient = client }} />
      </AuthProvider>,
    )

    queryClient!.setQueryData(cachedProfileKey, { id: 1, username: 'testuser' })

    await act(async () => {
      await latestUnauthorizedHandler()()
    })

    expect(queryClient!.getQueryData(cachedProfileKey)).toBeUndefined()
    expect(useI18nNavigate()).not.toHaveBeenCalled()
  })

  it('signs out and redirects when tRPC reports an unauthorized response', async () => {
    render(
      <AuthProvider>
        <QueryClientProbe onClient={(client) => { queryClient = client }} />
      </AuthProvider>,
    )
    queryClient!.setQueryData(cachedProfileKey, { id: 1, username: 'testuser' })

    await act(async () => {
      window.dispatchEvent(new Event(TRPC_UNAUTHORIZED_EVENT))
      await Promise.resolve()
      await Promise.resolve()
    })

    expect(apiClient.logout).toHaveBeenCalledTimes(1)
    expect(queryClient!.getQueryData(cachedProfileKey)).toBeUndefined()
    expect(useI18nNavigate()).toHaveBeenCalledWith('/login')
  })

  it('unregisters the unauthorized handler on unmount', () => {
    const { unmount } = render(
      <AuthProvider>
        <QueryClientProbe onClient={(client) => { queryClient = client }} />
      </AuthProvider>,
    )

    unmount()

    expect(apiClient.setUnauthorizedHandler).toHaveBeenLastCalledWith(undefined)
  })
})
