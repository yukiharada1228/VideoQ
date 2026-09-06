import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import AdminPage from '../AdminPage'

const listUsers = vi.fn()
const patchFlags = vi.fn()
const patchQuota = vi.fn()
const patchUsage = vi.fn()
const reindexAll = vi.fn()
const deleteUser = vi.fn()

const navigateMock = vi.fn()

vi.mock('@/lib/i18n', async () => {
  const actual = await vi.importActual<typeof import('@/lib/i18n')>('@/lib/i18n')
  return {
    ...actual,
    useI18nNavigate: () => navigateMock,
  }
})

vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))

vi.mock('@/lib/api', () => {
  class ApiError extends Error {
    code: string
    constructor(message: string, code: string) {
      super(message)
      this.code = code
    }
  }
  return {
    ApiError,
  }
})

import { useAuth } from '@/hooks/useAuth'

const sampleUser = {
  id: 9,
  username: 'bob',
  email: 'bob@example.com',
  is_active: true,
  is_staff: false,
  is_superuser: false,
  max_video_upload_size_mb: 500,
  storage_limit_gb: 10,
  processing_limit_minutes: 60,
  ai_answers_limit: 100,
  used_storage_bytes: 1024,
  used_processing_seconds: 30,
  used_ai_answers: 2,
  usage_period_start: null,
  is_over_quota: false,
}

describe('AdminPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    globalThis.__setTrpcHandler('admin.listUsers', listUsers)
    globalThis.__setTrpcHandler('admin.patchFlags', patchFlags)
    globalThis.__setTrpcHandler('admin.patchQuota', patchQuota)
    globalThis.__setTrpcHandler('admin.patchUsage', patchUsage)
    globalThis.__setTrpcHandler('admin.reindexAll', reindexAll)
    globalThis.__setTrpcHandler('admin.deleteUser', deleteUser)
    ;(useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: {
        id: 1,
        username: 'admin',
        email: 'admin@example.com',
        is_superuser: true,
        video_count: 0,
        max_video_upload_size_mb: 500,
      },
      isLoading: false,
      refetch: vi.fn(),
    })
    listUsers.mockResolvedValue({
      data: [sampleUser],
      meta: { total: 1, limit: 20, offset: 0 },
    })
  })

  it('lists admin users for superusers', async () => {
    render(<AdminPage />)

    expect(await screen.findByText('admin.title')).toBeInTheDocument()
    expect(await screen.findByText('bob')).toBeInTheDocument()
    expect(listUsers).toHaveBeenCalled()
  })

  it('keeps the users table in a horizontal scroll container on narrow viewports', async () => {
    const { container } = render(<AdminPage />)
    expect(await screen.findByText('bob')).toBeInTheDocument()
    const table = container.querySelector('table')
    expect(table).not.toBeNull()
    expect(table?.parentElement).toHaveClass('overflow-x-auto')
    expect(table).toHaveClass('min-w-[560px]')
  })

  it('redirects non-superusers home', async () => {
    ;(useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: {
        id: 2,
        username: 'alice',
        email: 'alice@example.com',
        is_superuser: false,
        video_count: 0,
        max_video_upload_size_mb: 500,
      },
      isLoading: false,
      refetch: vi.fn(),
    })

    render(<AdminPage />)

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/')
    })
    expect(listUsers).not.toHaveBeenCalled()
  })

  it('saves flags, quota and usage from the edit dialog', async () => {
    patchFlags.mockResolvedValue({
      ...sampleUser,
      is_staff: true,
    })
    patchQuota.mockResolvedValue(sampleUser)
    patchUsage.mockResolvedValue(sampleUser)

    render(<AdminPage />)
    fireEvent.click(await screen.findByRole('button', { name: 'admin.users.edit' }))

    const staffCheckbox = await screen.findByLabelText('admin.users.fields.isStaff')
    await waitFor(() => {
      expect(staffCheckbox).not.toBeChecked()
    })
    fireEvent.click(staffCheckbox)

    const uploadInput = await screen.findByLabelText('admin.users.fields.maxUploadMb')
    await waitFor(() => {
      expect(uploadInput).toHaveValue('500')
    })
    fireEvent.change(uploadInput, { target: { value: '750' } })
    fireEvent.click(screen.getByRole('button', { name: 'admin.users.save' }))

    await waitFor(() => {
      expect(patchFlags).toHaveBeenCalledWith({
        id: 9,
        is_active: true,
        is_staff: true,
        is_superuser: false,
      })
      expect(patchQuota).toHaveBeenCalledWith(expect.objectContaining({
        id: 9,
        max_video_upload_size_mb: 750,
      }))
      expect(patchUsage).toHaveBeenCalledWith(expect.objectContaining({
        id: 9,
        used_storage_bytes: 1024,
      }))
    })
    expect(
      await screen.findByText((content) => content.includes('admin.users.saveSuccess')),
    ).toBeInTheDocument()
  })

  it('enqueues a full embedding reindex', async () => {
    reindexAll.mockResolvedValue({
      job_id: 'job-123',
    })

    render(<AdminPage />)
    fireEvent.click(await screen.findByRole('button', { name: 'admin.reindex.button' }))
    fireEvent.click(await screen.findByRole('button', { name: 'admin.reindex.confirm' }))

    await waitFor(() => {
      expect(reindexAll).toHaveBeenCalled()
    })
    expect(
      await screen.findByText((content) => content.includes('admin.reindex.success')),
    ).toBeInTheDocument()
  })

  it('deletes a user after confirmation', async () => {
    deleteUser.mockResolvedValue({
      job_id: 'job-del',
    })

    render(<AdminPage />)
    expect(await screen.findByText('bob')).toBeInTheDocument()
    fireEvent.click(await screen.findByRole('button', { name: 'admin.users.delete' }))
    expect(screen.getByText('admin.users.deleteBody')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'admin.users.deleteConfirm' }))

    await waitFor(() => {
      expect(deleteUser).toHaveBeenCalledWith({ id: 9 })
    })
    expect(
      await screen.findByText((content) => content.includes('admin.users.deleteSuccess')),
    ).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.queryByText('bob')).not.toBeInTheDocument()
    })
  })
})
