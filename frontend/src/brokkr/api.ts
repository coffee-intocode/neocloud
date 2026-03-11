import { API_ENDPOINTS } from '@/config'
import type {
  ActiveOrganization,
  ApiErrorShape,
  DeploymentDetail,
  DeploymentSummary,
  InventoryItemDetail,
  InventoryItemSummary,
  InventoryMetadata,
  OverviewResponse,
  PaginatedResponse,
  SessionUser,
} from '@/brokkr/types'
import { getSupabaseClient } from '@/lib/supabase/client'

export class ApiError extends Error {
  code: string
  status: number
  details?: Record<string, unknown> | null

  constructor(status: number, payload: ApiErrorShape) {
    super(payload.message)
    this.name = 'ApiError'
    this.code = payload.code
    this.status = status
    this.details = payload.details
  }
}

async function apiFetch<T>(input: string): Promise<T> {
  const {
    data: { session },
  } = await getSupabaseClient().auth.getSession()

  const response = await fetch(input, {
    headers: session?.access_token
      ? {
          Authorization: `Bearer ${session.access_token}`,
        }
      : undefined,
  })

  if (!response.ok) {
    let payload: ApiErrorShape = {
      code: 'request_failed',
      message: 'The request failed.',
    }

    try {
      payload = (await response.json()) as ApiErrorShape
    } catch {
      payload.message = await response.text()
    }

    throw new ApiError(response.status, payload)
  }

  return (await response.json()) as T
}

export function getOverview() {
  return apiFetch<OverviewResponse>(API_ENDPOINTS.brokkr.overview)
}

export function getCurrentUser() {
  return apiFetch<SessionUser | null>(API_ENDPOINTS.brokkr.me)
}

export function getActiveOrganization() {
  return apiFetch<ActiveOrganization>(API_ENDPOINTS.brokkr.organization)
}

export function getInventory(params: {
  page: number
  pageSize: number
  search?: string
  region?: string
  availability?: string
}) {
  const url = new URL(API_ENDPOINTS.brokkr.inventory, window.location.origin)
  url.searchParams.set('page', String(params.page))
  url.searchParams.set('pageSize', String(params.pageSize))

  if (params.search) {
    url.searchParams.set('search', params.search)
  }
  if (params.region) {
    url.searchParams.set('region', params.region)
  }
  if (params.availability) {
    url.searchParams.set('availability', params.availability)
  }

  return apiFetch<PaginatedResponse<InventoryItemSummary>>(url.toString())
}

export function getInventoryMetadata() {
  return apiFetch<InventoryMetadata>(API_ENDPOINTS.brokkr.inventoryMetadata)
}

export function getInventoryItem(inventoryId: string) {
  return apiFetch<InventoryItemDetail>(API_ENDPOINTS.brokkr.inventoryItem(inventoryId))
}

export function getDeployments(params: { page: number; pageSize: number; search?: string }) {
  const url = new URL(API_ENDPOINTS.brokkr.deployments, window.location.origin)
  url.searchParams.set('page', String(params.page))
  url.searchParams.set('pageSize', String(params.pageSize))

  if (params.search) {
    url.searchParams.set('search', params.search)
  }

  return apiFetch<PaginatedResponse<DeploymentSummary>>(url.toString())
}

export function getDeployment(deploymentId: string) {
  return apiFetch<DeploymentDetail>(API_ENDPOINTS.brokkr.deploymentItem(deploymentId))
}
