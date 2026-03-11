export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

export const API_ENDPOINTS = {
  configure: `${API_BASE_URL}/api/v1/chat/configure`,
  chatStream: `${API_BASE_URL}/api/v1/chat/stream`,
  operator: {
    dashboard: `${API_BASE_URL}/api/v1/operator/dashboard`,
    datacenters: `${API_BASE_URL}/api/v1/operator/datacenters`,
    datacenterItem: (datacenterId: string) => `${API_BASE_URL}/api/v1/operator/datacenters/${datacenterId}`,
    network: `${API_BASE_URL}/api/v1/operator/network`,
    devices: `${API_BASE_URL}/api/v1/operator/devices`,
    instances: `${API_BASE_URL}/api/v1/operator/instances`,
    instanceItem: (instanceId: string) => `${API_BASE_URL}/api/v1/operator/instances/${instanceId}`,
    reservations: `${API_BASE_URL}/api/v1/operator/reservations`,
    deployments: `${API_BASE_URL}/api/v1/operator/deployments`,
    deploymentItem: (deploymentId: string) => `${API_BASE_URL}/api/v1/operator/deployments/${deploymentId}`,
  },
  brokkr: {
    me: `${API_BASE_URL}/api/v1/brokkr/me`,
    organization: `${API_BASE_URL}/api/v1/brokkr/organization`,
    overview: `${API_BASE_URL}/api/v1/brokkr/overview`,
    inventory: `${API_BASE_URL}/api/v1/brokkr/inventory`,
    inventoryMetadata: `${API_BASE_URL}/api/v1/brokkr/inventory/metadata`,
    inventoryItem: (inventoryId: string) => `${API_BASE_URL}/api/v1/brokkr/inventory/${inventoryId}`,
    deployments: `${API_BASE_URL}/api/v1/brokkr/deployments`,
    deploymentItem: (deploymentId: string) => `${API_BASE_URL}/api/v1/brokkr/deployments/${deploymentId}`,
  },
  chat: {
    configure: `${API_BASE_URL}/api/v1/chat/configure`,
    chatStream: `${API_BASE_URL}/api/v1/chat/stream`,
  },
} as const
