export interface ApiErrorShape {
  code: string
  message: string
  details?: Record<string, unknown> | null
}

export interface OperatorStatus {
  value: string
  label: string
}

export interface RevenueSummary {
  currentHourlyRevenueUsd: number
  idleHourlyOpportunityUsd: number
  onlineCapacityCount: number
  attentionCount: number
}

export interface AttentionItem {
  operatorInstanceId: string | null
  brokkrDeviceId: string | null
  title: string
  reason: string
  blockedHourlyRevenueUsd: number
  datacenterName: string | null
  status: OperatorStatus
}

export interface DatacenterPortfolioRow {
  id: string
  name: string
  region: string | null
  status: string | null
  facility: string | null
  physicalAddress: string | null
  shippingAddress: string | null
  createdAt: string | null
  zoneCount: number
  bridgeCount: number
  bridgeRequestCount: number
  deviceCount: number
  listedInstanceCount: number
  activeInstanceCount: number
  hourlyRevenueUsd: number
  idleHourlyOpportunityUsd: number
  readinessLabel: string
}

export interface ZoneSummary {
  id: string
  name: string
  siteId: number | null
  siteName: string | null
}

export interface DatacenterContact {
  id: string
  name: string
  email: string | null
  phone: string | null
  role: string | null
}

export interface BridgeSummary {
  id: string
  name: string
  status: string
  type: string
  datacenterId: string
  datacenterName: string
  zoneId: string
  zoneName: string
  interfaceCount: number
  ipAddresses: string[]
}

export interface BridgeRequestSummary {
  id: string
  datacenterId: string
  datacenterName: string
  zoneId: string
  zoneName: string
  status: string
  bridgeType: string | null
  bridgeCount: number | null
  networkType: string | null
  createdAt: string | null
  approvedAt: string | null
  rejectedAt: string | null
}

export interface DatacenterDetail {
  datacenter: DatacenterPortfolioRow
  zones: ZoneSummary[]
  contacts: DatacenterContact[]
  bridges: BridgeSummary[]
  bridgeRequests: BridgeRequestSummary[]
}

export interface NetworkSummary {
  bridgeCount: number
  pendingBridgeRequestCount: number
  approvedBridgeRequestCount: number
  rejectedBridgeRequestCount: number
  privatePrefixCount: number
  publicPrefixCount: number
  bridgeRequests: BridgeRequestSummary[]
  bridges: BridgeSummary[]
}

export interface DeviceRow {
  id: string
  name: string
  role: string | null
  datacenterName: string | null
  zoneName: string | null
  location: string | null
  status: OperatorStatus
  powerStatus: OperatorStatus
  gpuModel: string | null
  gpuCount: number | null
  cpuModel: string | null
  memoryTotalGb: number | null
  listingActive: boolean
  interruptibleOnly: boolean
  onDemandPriceUsd: number | null
  reservationType: string | null
  ecoMode: boolean
  isTeeCapable: boolean
  instanceId: string | null
  instanceName: string | null
  attentionReason: string | null
}

export interface OperatorInstance {
  id: string
  brokkrDeviceId: string
  brokkrDatacenterId: string | null
  displayName: string
  hourlyRateUsd: number
  marketStatus: string
  isVisible: boolean
  notes: string | null
  createdByUserId: string
  createdAt: string
  updatedAt: string
  datacenterName: string | null
  deviceName: string | null
  gpuModel: string | null
  currentHourlyRevenueUsd: number
  idleHourlyOpportunityUsd: number
  attentionReason: string | null
  online: boolean
  listed: boolean
}

export interface CreateOperatorInstanceInput {
  brokkrDeviceId: string
  brokkrDatacenterId: string | null
  displayName: string
  hourlyRateUsd: number
  marketStatus: string
  isVisible: boolean
  notes: string | null
}

export interface UpdateOperatorInstanceInput {
  displayName?: string
  hourlyRateUsd?: number
  marketStatus?: string
  isVisible?: boolean
  notes?: string | null
}

export interface ReservationPipelineRow {
  id: string
  inviteeEmail: string | null
  inviterEmail: string | null
  channel: string
  contractType: string | null
  billingFrequency: string
  buyerPrice: number | null
  supplierPrice: number | null
  margin: number | null
  dateCreated: string | null
  dateExpires: string | null
  dateAccepted: string | null
  deviceIds: string[]
  operatorInstanceIds: string[]
  instanceNames: string[]
  listingName: string | null
  gpuModel: string | null
}

export interface DeploymentRow {
  id: string
  name: string
  status: OperatorStatus
  powerStatus: OperatorStatus
  location: string | null
  ipv4: string | null
  gpuModel: string | null
  gpuCount: number | null
  contractType: string | null
  projectName: string | null
  operatorInstanceId: string | null
  operatorInstanceName: string | null
}

export interface DeploymentDetail {
  id: string
  name: string
  status: OperatorStatus
  powerStatus: OperatorStatus
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
  operatorInstanceId: string | null
  operatorInstanceName: string | null
}

export interface DashboardTopInstance {
  operatorInstanceId: string
  name: string
  datacenterName: string | null
  hourlyRateUsd: number
  reason: string
}

export interface ReservationPipelineSnapshot {
  pendingCount: number
  acceptedCount: number
  expiredCount: number
}

export interface DeploymentSnapshot {
  totalCount: number
  interruptibleCount: number
  lockedCount: number
}

export interface OperatorDashboard {
  revenue: RevenueSummary
  attentionItems: AttentionItem[]
  datacenters: DatacenterPortfolioRow[]
  topIdleInstances: DashboardTopInstance[]
  reservationPipeline: ReservationPipelineSnapshot
  deployments: DeploymentSnapshot
}
