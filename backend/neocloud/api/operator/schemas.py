"""Operator-facing DTOs and request models."""

from __future__ import annotations

from decimal import Decimal
from typing import Any, Generic, TypeVar

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


T = TypeVar('T')


class CamelModel(BaseModel):
    """Base model that emits camelCase JSON."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class PaginationMeta(CamelModel):
    page: int
    page_size: int
    total_items: int
    total_pages: int


class PaginatedResponse(CamelModel, Generic[T]):
    data: list[T]
    meta: PaginationMeta


class OperatorStatus(CamelModel):
    value: str
    label: str


class RevenueSummary(CamelModel):
    current_hourly_revenue_usd: float
    idle_hourly_opportunity_usd: float
    online_capacity_count: int
    attention_count: int


class AttentionItem(CamelModel):
    operator_instance_id: str | None = None
    brokkr_device_id: str | None = None
    title: str
    reason: str
    blocked_hourly_revenue_usd: float
    datacenter_name: str | None = None
    status: OperatorStatus


class DatacenterPortfolioRow(CamelModel):
    id: str
    name: str
    region: str | None = None
    status: str | None = None
    facility: str | None = None
    physical_address: str | None = None
    shipping_address: str | None = None
    created_at: str | None = None
    zone_count: int
    bridge_count: int
    bridge_request_count: int
    device_count: int
    listed_instance_count: int
    active_instance_count: int
    hourly_revenue_usd: float
    idle_hourly_opportunity_usd: float
    readiness_label: str


class ZoneSummary(CamelModel):
    id: str
    name: str
    site_id: str | None = None
    site_name: str | None = None


class DatacenterContact(CamelModel):
    id: str
    name: str
    email: str | None = None
    phone: str | None = None
    role: str | None = None


class BridgeInterface(CamelModel):
    name: str
    mac_address: str
    ip_addresses: list[str]
    mark_connected: bool
    enabled: bool
    mgmt_only: bool


class BridgeSummary(CamelModel):
    id: str
    name: str
    status: str
    type: str
    datacenter_id: str
    datacenter_name: str
    zone_id: str
    zone_name: str
    interface_count: int
    ip_addresses: list[str]


class BridgeRequestSummary(CamelModel):
    id: str
    datacenter_id: str
    datacenter_name: str
    zone_id: str
    zone_name: str
    status: str
    bridge_type: str | None = None
    bridge_count: int | None = None
    network_type: str | None = None
    created_at: str | None = None
    approved_at: str | None = None
    rejected_at: str | None = None


class DatacenterDetail(CamelModel):
    datacenter: DatacenterPortfolioRow
    zones: list[ZoneSummary]
    contacts: list[DatacenterContact]
    bridges: list[BridgeSummary]
    bridge_requests: list[BridgeRequestSummary]


class NetworkSummary(CamelModel):
    bridge_count: int
    pending_bridge_request_count: int
    approved_bridge_request_count: int
    rejected_bridge_request_count: int
    private_prefix_count: int
    public_prefix_count: int
    bridge_requests: list[BridgeRequestSummary]
    bridges: list[BridgeSummary]


class DeviceRow(CamelModel):
    id: str
    name: str
    role: str | None = None
    datacenter_name: str | None = None
    zone_name: str | None = None
    location: str | None = None
    status: OperatorStatus
    power_status: OperatorStatus
    gpu_model: str | None = None
    gpu_count: int | None = None
    cpu_model: str | None = None
    memory_total_gb: float | None = None
    listing_active: bool
    interruptible_only: bool
    on_demand_price_usd: float | None = None
    reservation_type: str | None = None
    eco_mode: bool
    is_tee_capable: bool
    instance_id: str | None = None
    instance_name: str | None = None
    attention_reason: str | None = None


class OperatorInstance(CamelModel):
    id: str
    brokkr_device_id: str
    brokkr_datacenter_id: str | None = None
    display_name: str
    hourly_rate_usd: float
    market_status: str
    is_visible: bool
    notes: str | None = None
    created_by_user_id: str
    created_at: str
    updated_at: str
    datacenter_name: str | None = None
    device_name: str | None = None
    gpu_model: str | None = None
    current_hourly_revenue_usd: float
    idle_hourly_opportunity_usd: float
    attention_reason: str | None = None
    online: bool
    listed: bool


class CreateOperatorInstanceInput(CamelModel):
    brokkr_device_id: str
    brokkr_datacenter_id: str | None = None
    display_name: str = Field(min_length=1, max_length=255)
    hourly_rate_usd: Decimal = Field(gt=0, max_digits=10, decimal_places=2)
    market_status: str = Field(default='draft', min_length=1, max_length=32)
    is_visible: bool = True
    notes: str | None = Field(default=None, max_length=4000)


class UpdateOperatorInstanceInput(CamelModel):
    display_name: str | None = Field(default=None, min_length=1, max_length=255)
    hourly_rate_usd: Decimal | None = Field(default=None, gt=0, max_digits=10, decimal_places=2)
    market_status: str | None = Field(default=None, min_length=1, max_length=32)
    is_visible: bool | None = None
    notes: str | None = Field(default=None, max_length=4000)


class ReservationPipelineRow(CamelModel):
    id: str
    invitee_email: str | None = None
    inviter_email: str | None = None
    channel: str
    contract_type: str | None = None
    billing_frequency: str
    buyer_price: float | None = None
    supplier_price: float | None = None
    margin: float | None = None
    date_created: str | None = None
    date_expires: str | None = None
    date_accepted: str | None = None
    device_ids: list[str]
    operator_instance_ids: list[str]
    instance_names: list[str]
    listing_name: str | None = None
    gpu_model: str | None = None


class DeploymentRow(CamelModel):
    id: str
    name: str
    status: OperatorStatus
    power_status: OperatorStatus
    location: str | None = None
    ipv4: str | None = None
    gpu_model: str | None = None
    gpu_count: int | None = None
    contract_type: str | None = None
    project_name: str | None = None
    operator_instance_id: str | None = None
    operator_instance_name: str | None = None


class DeploymentDetail(CamelModel):
    id: str
    name: str
    status: OperatorStatus
    power_status: OperatorStatus
    location: str | None = None
    ipv4: str | None = None
    ipv6: str | None = None
    mac: str | None = None
    gpu_model: str | None = None
    gpu_count: int | None = None
    cpu_model: str | None = None
    cpu_total_cores: int | None = None
    cpu_total_threads: int | None = None
    memory_total_gb: float | None = None
    storage_total_gb: float | None = None
    contract_type: str | None = None
    project_name: str | None = None
    is_interruptible: bool = False
    scheduled_interruption_time: str | None = None
    is_locked: bool = False
    available_operating_systems: list[str]
    storage_layouts: list[dict[str, Any]]
    default_disk_layouts: list[dict[str, Any]]
    ssh_keys: list[str]
    lifecycle_actions: list[str]
    tags: list[str]
    operator_instance_id: str | None = None
    operator_instance_name: str | None = None


class DashboardTopInstance(CamelModel):
    operator_instance_id: str
    name: str
    datacenter_name: str | None = None
    hourly_rate_usd: float
    reason: str


class ReservationPipelineSnapshot(CamelModel):
    pending_count: int
    accepted_count: int
    expired_count: int


class DeploymentSnapshot(CamelModel):
    total_count: int
    interruptible_count: int
    locked_count: int


class OperatorDashboard(CamelModel):
    demo_mode: bool = False
    revenue: RevenueSummary
    attention_items: list[AttentionItem]
    datacenters: list[DatacenterPortfolioRow]
    top_idle_instances: list[DashboardTopInstance]
    reservation_pipeline: ReservationPipelineSnapshot
    deployments: DeploymentSnapshot
