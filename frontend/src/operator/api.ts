import { getSupabaseClient } from '@/lib/supabase/client'
import { API_ENDPOINTS } from '@/config'
import type {
  ApiErrorShape,
  CreateOperatorInstanceInput,
  DatacenterDetail,
  DatacenterPortfolioRow,
  DeploymentDetail,
  DeploymentRow,
  DeviceRow,
  NetworkSummary,
  OperatorDashboard,
  OperatorInstance,
  ReservationPipelineRow,
  UpdateOperatorInstanceInput,
} from '@/operator/types'

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

async function apiFetch<T>(input: string, init?: RequestInit): Promise<T> {
  const {
    data: { session },
  } = await getSupabaseClient().auth.getSession()
  const headers = new Headers(init?.headers)

  headers.set('Content-Type', 'application/json')
  if (session?.access_token) {
    headers.set('Authorization', `Bearer ${session.access_token}`)
  }

  const response = await fetch(input, {
    ...init,
    headers,
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

export function getOperatorDashboard() {
  return apiFetch<OperatorDashboard>(API_ENDPOINTS.operator.dashboard)
}

export function getDatacenters() {
  return apiFetch<DatacenterPortfolioRow[]>(API_ENDPOINTS.operator.datacenters)
}

export function getDatacenterDetail(datacenterId: string) {
  return apiFetch<DatacenterDetail>(API_ENDPOINTS.operator.datacenterItem(datacenterId))
}

export function getNetworkSummary() {
  return apiFetch<NetworkSummary>(API_ENDPOINTS.operator.network)
}

export function getDevices() {
  return apiFetch<DeviceRow[]>(API_ENDPOINTS.operator.devices)
}

export function getInstances() {
  return apiFetch<OperatorInstance[]>(API_ENDPOINTS.operator.instances)
}

export function createInstance(payload: CreateOperatorInstanceInput) {
  return apiFetch<OperatorInstance>(API_ENDPOINTS.operator.instances, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function getInstance(instanceId: string) {
  return apiFetch<OperatorInstance>(API_ENDPOINTS.operator.instanceItem(instanceId))
}

export function updateInstance(instanceId: string, payload: UpdateOperatorInstanceInput) {
  return apiFetch<OperatorInstance>(API_ENDPOINTS.operator.instanceItem(instanceId), {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function getReservations() {
  return apiFetch<ReservationPipelineRow[]>(API_ENDPOINTS.operator.reservations)
}

export function getDeployments() {
  return apiFetch<DeploymentRow[]>(API_ENDPOINTS.operator.deployments)
}

export function getDeployment(deploymentId: string) {
  return apiFetch<DeploymentDetail>(API_ENDPOINTS.operator.deploymentItem(deploymentId))
}
