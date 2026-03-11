export interface ApiErrorShape {
  code: string
  message: string
  details?: Record<string, unknown> | null
}

export interface PaginationMeta {
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: PaginationMeta
}

export interface StatusSummary {
  value: string
  label: string
}

export interface SessionUser {
  id: string
  email: string | null
  name: string | null
  role: string | null
  avatarUrl: string | null
  membershipRole: string | null
  createdAt: string | null
}

export interface ActiveOrganization {
  id: string
  name: string
  tenantType: string | null
  email: string | null
  country: string | null
  createdAt: string | null
  logoUrl: string | null
}

export interface BrokkrConnectionSummary {
  connected: boolean
  baseUrl: string
  provisioningEnabled: boolean
  userSource: string | null
}

export interface CategoryPrice {
  category: string
  startPrice: number
}

export interface InventoryMetadata {
  regions: string[]
  categoryPrices: CategoryPrice[]
  availabilityOptions: string[]
}

export interface OverviewResponse {
  connection: BrokkrConnectionSummary
  user: SessionUser | null
  organization: ActiveOrganization
  deploymentCount: number
  inventoryRegionCount: number
  categoryPrices: CategoryPrice[]
}

export interface InventoryItemSummary {
  id: string
  name: string
  location: string | null
  stockStatus: string | null
  isInterruptibleDeployment: boolean
  availableAt: string | null
  gpuModel: string | null
  gpuCount: number | null
  cpuModel: string | null
  cpuThreads: number | null
  memoryTotal: number | null
  startingPrice: number | null
  availableOperatingSystems: string[]
}

export interface InventoryNetworking {
  ipv4: string | null
  ipv6: string | null
  networkType: string | null
  vpcCapable: boolean | null
}

export interface InventorySpecs {
  cpuModel: string | null
  cpuCount: number | null
  cpuTotalCores: number | null
  cpuTotalThreads: number | null
  gpuModel: string | null
  gpuCount: number | null
  memoryTotalGb: number | null
  storageTotalGb: number | null
  nvmeCount: number | null
  nvmeSizeGb: number | null
  ssdCount: number | null
  ssdSizeGb: number | null
  hddCount: number | null
  hddSizeGb: number | null
}

export interface InventoryStorageLayout {
  name: string
  diskType: string | null
  capabilities: string[]
  fileSystems: string[]
  sizePerDiskGb: number | null
  diskNames: string[]
}

export interface InventoryDefaultDiskLayout {
  config: string
  format: string
  mountpoint: string
  diskType: string
  disks: string[]
}

export interface InventoryItemDetail {
  id: string
  name: string
  location: string | null
  role: string | null
  stockStatus: string | null
  isTeeCapable: boolean | null
  isInterruptibleDeployment: boolean
  availableAt: string | null
  supplierPolicyUrl: string | null
  startingPrice: number | null
  networking: InventoryNetworking
  specs: InventorySpecs
  availableOperatingSystems: {
    name: string | null
    slug: string | null
    distribution: string | null
    version: string | null
  }[]
  storageLayouts: InventoryStorageLayout[]
  defaultDiskLayouts: InventoryDefaultDiskLayout[]
}

export interface DeploymentSummary {
  id: string
  name: string
  status: StatusSummary
  powerStatus: StatusSummary
  location: string | null
  ipv4: string | null
  gpuModel: string | null
  gpuCount: number | null
  contractType: string | null
  projectName: string | null
  isInterruptible: boolean
}

export interface DeploymentDetail {
  id: string
  name: string
  status: StatusSummary
  powerStatus: StatusSummary
  location: string | null
  ipv4: string | null
  ipv6: string | null
  mac: string | null
  gpuModel: string | null
  gpuCount: number | null
  cpuModel: string | null
  cpuTotalCores: number | null
  cpuTotalThreads: number | null
  memoryTotalGb: number | null
  storageTotalGb: number | null
  contractType: string | null
  projectName: string | null
  isInterruptible: boolean
  scheduledInterruptionTime: string | null
  isLocked: boolean
  availableOperatingSystems: string[]
  storageLayouts: Record<string, unknown>[]
  defaultDiskLayouts: Record<string, unknown>[]
  sshKeys: string[]
  lifecycleActions: string[]
  tags: string[]
}
