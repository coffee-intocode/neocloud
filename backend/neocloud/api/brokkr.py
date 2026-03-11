"""Brokkr API client and response normalization."""

from __future__ import annotations

import asyncio
from dataclasses import dataclass
from typing import Any, Generic, TypeVar

import httpx
from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel

from .config import Settings

T = TypeVar('T')


class CamelModel(BaseModel):
    """Base model that emits camelCase JSON."""

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class ApiErrorResponse(CamelModel):
    code: str
    message: str
    details: dict[str, Any] | None = None


class PaginationMeta(CamelModel):
    page: int
    page_size: int
    total_items: int
    total_pages: int


class PaginatedResponse(CamelModel, Generic[T]):
    data: list[T]
    meta: PaginationMeta


class StatusSummary(CamelModel):
    value: str
    label: str


class SessionUser(CamelModel):
    id: str
    email: str | None = None
    name: str | None = None
    role: str | None = None
    avatar_url: str | None = None
    membership_role: str | None = None
    created_at: str | None = None


class ActiveOrganization(CamelModel):
    id: str
    name: str
    tenant_type: str | None = None
    email: str | None = None
    country: str | None = None
    created_at: str | None = None
    logo_url: str | None = None


class BrokkrConnectionSummary(CamelModel):
    connected: bool
    base_url: str
    provisioning_enabled: bool = False
    user_source: str | None = None


class CategoryPrice(CamelModel):
    category: str
    start_price: float


class InventoryMetadata(CamelModel):
    regions: list[str]
    category_prices: list[CategoryPrice]
    availability_options: list[str]


class OverviewResponse(CamelModel):
    connection: BrokkrConnectionSummary
    user: SessionUser | None
    organization: ActiveOrganization
    deployment_count: int
    inventory_region_count: int
    category_prices: list[CategoryPrice]


class InventoryFilters(CamelModel):
    search: str = ''
    region: str = ''
    availability: str = ''


class InventoryItemSummary(CamelModel):
    id: str
    name: str
    location: str | None = None
    stock_status: str | None = None
    is_interruptible_deployment: bool = False
    available_at: str | None = None
    gpu_model: str | None = None
    gpu_count: int | None = None
    cpu_model: str | None = None
    cpu_threads: int | None = None
    memory_total: float | None = None
    starting_price: float | None = None
    available_operating_systems: list[str]


class InventoryStorageLayout(CamelModel):
    name: str
    disk_type: str | None = None
    capabilities: list[str]
    file_systems: list[str]
    size_per_disk_gb: float | None = None
    disk_names: list[str]


class InventoryDefaultDiskLayout(CamelModel):
    config: str
    format: str
    mountpoint: str
    disk_type: str
    disks: list[str]


class InventoryNetworking(CamelModel):
    ipv4: str | None = None
    ipv6: str | None = None
    network_type: str | None = None
    vpc_capable: bool | None = None


class InventorySpecs(CamelModel):
    cpu_model: str | None = None
    cpu_count: int | None = None
    cpu_total_cores: int | None = None
    cpu_total_threads: int | None = None
    gpu_model: str | None = None
    gpu_count: int | None = None
    memory_total_gb: float | None = None
    storage_total_gb: float | None = None
    nvme_count: int | None = None
    nvme_size_gb: float | None = None
    ssd_count: int | None = None
    ssd_size_gb: float | None = None
    hdd_count: int | None = None
    hdd_size_gb: float | None = None


class InventoryItemDetail(CamelModel):
    id: str
    name: str
    location: str | None = None
    role: str | None = None
    stock_status: str | None = None
    is_tee_capable: bool | None = None
    is_interruptible_deployment: bool = False
    available_at: str | None = None
    supplier_policy_url: str | None = None
    starting_price: float | None = None
    networking: InventoryNetworking
    specs: InventorySpecs
    available_operating_systems: list[dict[str, str | None]]
    storage_layouts: list[InventoryStorageLayout]
    default_disk_layouts: list[InventoryDefaultDiskLayout]


class DeploymentSummary(CamelModel):
    id: str
    name: str
    status: StatusSummary
    power_status: StatusSummary
    location: str | None = None
    ipv4: str | None = None
    gpu_model: str | None = None
    gpu_count: int | None = None
    contract_type: str | None = None
    project_name: str | None = None
    is_interruptible: bool = False


class DeploymentDetail(CamelModel):
    id: str
    name: str
    status: StatusSummary
    power_status: StatusSummary
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


@dataclass(slots=True)
class BrokkrApiError(Exception):
    status_code: int
    code: str
    message: str
    details: dict[str, Any] | None = None


def _normalize_base_url(url: str) -> str:
    normalized = url.rstrip('/')
    if normalized.endswith('/api/v1'):
        return normalized
    return f'{normalized}/api/v1'


def _get_nested(payload: dict[str, Any], *keys: str) -> Any:
    current: Any = payload
    for key in keys:
        if not isinstance(current, dict):
            return None
        current = current.get(key)
    return current


def _to_float(value: Any) -> float | None:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    return None


def _to_int(value: Any) -> int | None:
    if value is None:
        return None
    if isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        return int(value)
    return None


def _gb_from_numeric(value: Any) -> float | None:
    numeric = _to_float(value)
    if numeric is None:
        return None
    return round(numeric, 2)


def _storage_gb_from_bytes(value: Any) -> float | None:
    numeric = _to_float(value)
    if numeric is None:
        return None
    return round(numeric / (1024**3), 2)


def _price_from_listing(listing: dict[str, Any] | None) -> float | None:
    cents = _to_float(_get_nested(listing or {}, 'onDemandPrice', 'perHour', 'total'))
    if cents is None:
        return None
    return round(cents / 100, 2)


def _normalize_category(category: str | None) -> str | None:
    if not category:
        return None
    return ' '.join(category.strip().lower().split())


def _resolve_starting_price(item: dict[str, Any], price_map: dict[str, float]) -> float | None:
    direct_price = _price_from_listing(item.get('listing'))
    if direct_price is not None:
        return direct_price
    category = _normalize_category(_get_nested(item, 'specs', 'gpu', 'model'))
    if category is None:
        return None
    return price_map.get(category)


def _normalize_status(status: dict[str, Any] | None, fallback_value: str = 'unknown', fallback_label: str = 'Unknown') -> StatusSummary:
    return StatusSummary(
        value=str(status.get('value') or fallback_value) if status else fallback_value,
        label=str(status.get('label') or fallback_label) if status else fallback_label,
    )


def _normalize_specs(specs: dict[str, Any] | None) -> InventorySpecs:
    cpu = _get_nested(specs or {}, 'cpu') or {}
    gpu = _get_nested(specs or {}, 'gpu') or {}
    memory = _get_nested(specs or {}, 'memory') or {}
    storage = _get_nested(specs or {}, 'storage') or {}
    return InventorySpecs(
        cpu_model=cpu.get('model'),
        cpu_count=_to_int(cpu.get('count')),
        cpu_total_cores=_to_int(cpu.get('totalCores')),
        cpu_total_threads=_to_int(cpu.get('totalThreads')),
        gpu_model=gpu.get('model'),
        gpu_count=_to_int(gpu.get('count')),
        memory_total_gb=_gb_from_numeric(memory.get('total')),
        storage_total_gb=_gb_from_numeric(storage.get('total')),
        nvme_count=_to_int(storage.get('nvmeCount')),
        nvme_size_gb=_gb_from_numeric(storage.get('nvmeSize')),
        ssd_count=_to_int(storage.get('ssdCount')),
        ssd_size_gb=_gb_from_numeric(storage.get('ssdSize')),
        hdd_count=_to_int(storage.get('hddCount')),
        hdd_size_gb=_gb_from_numeric(storage.get('hddSize')),
    )


def _normalize_networking(networking: dict[str, Any] | None) -> InventoryNetworking:
    return InventoryNetworking(
        ipv4=(networking or {}).get('ipv4') or None,
        ipv6=(networking or {}).get('ipv6') or None,
        network_type=(networking or {}).get('networkType') or None,
        vpc_capable=(networking or {}).get('vpcCapable'),
    )


def _normalize_storage_layouts(storage_layouts: dict[str, Any] | None) -> list[InventoryStorageLayout]:
    configs = storage_layouts.get('configs') if isinstance(storage_layouts, dict) else []
    normalized: list[InventoryStorageLayout] = []
    for config in configs or []:
        disks = config.get('disks') or []
        normalized.append(
            InventoryStorageLayout(
                name=str(config.get('disk_group_name') or config.get('name') or 'Layout'),
                disk_type=config.get('disk_type'),
                capabilities=[str(entry) for entry in config.get('capabilities') or []],
                file_systems=[str(entry) for entry in config.get('file_systems') or []],
                size_per_disk_gb=_storage_gb_from_bytes(config.get('size_per_disk')),
                disk_names=[str(disk.get('name')) for disk in disks if isinstance(disk, dict) and disk.get('name')],
            )
        )
    return normalized


def _normalize_default_disk_layouts(layouts: list[dict[str, Any]] | None) -> list[InventoryDefaultDiskLayout]:
    normalized: list[InventoryDefaultDiskLayout] = []
    for layout in layouts or []:
        normalized.append(
            InventoryDefaultDiskLayout(
                config=str(layout.get('config') or ''),
                format=str(layout.get('format') or ''),
                mountpoint=str(layout.get('mountpoint') or ''),
                disk_type=str(layout.get('diskType') or ''),
                disks=[str(entry) for entry in layout.get('disks') or []],
            )
        )
    return normalized


def _normalize_inventory_summary(item: dict[str, Any], price_map: dict[str, float]) -> InventoryItemSummary:
    specs = _normalize_specs(item.get('specs'))
    return InventoryItemSummary(
        id=str(item.get('id')),
        name=str(item.get('name')),
        location=item.get('location'),
        stock_status=item.get('stockStatus'),
        is_interruptible_deployment=bool(item.get('isInterruptibleDeployment') or _get_nested(item, 'listing', 'isInterruptibleOnly')),
        available_at=item.get('availableAt'),
        gpu_model=specs.gpu_model,
        gpu_count=specs.gpu_count,
        cpu_model=specs.cpu_model,
        cpu_threads=specs.cpu_total_threads,
        memory_total=specs.memory_total_gb,
        starting_price=_resolve_starting_price(item, price_map),
        available_operating_systems=[str(entry.get('name')) for entry in item.get('availableOperatingSystems') or [] if entry.get('name')],
    )


def _normalize_inventory_detail(item: dict[str, Any], price_map: dict[str, float]) -> InventoryItemDetail:
    return InventoryItemDetail(
        id=str(item.get('id')),
        name=str(item.get('name')),
        location=item.get('location'),
        role=item.get('role'),
        stock_status=item.get('stockStatus'),
        is_tee_capable=item.get('isTeeCapable'),
        is_interruptible_deployment=bool(item.get('isInterruptibleDeployment') or _get_nested(item, 'listing', 'isInterruptibleOnly')),
        available_at=item.get('availableAt'),
        supplier_policy_url=item.get('supplierPolicyUrl'),
        starting_price=_resolve_starting_price(item, price_map),
        networking=_normalize_networking(item.get('networking')),
        specs=_normalize_specs(item.get('specs')),
        available_operating_systems=[
            {
                'name': entry.get('name'),
                'slug': entry.get('slug'),
                'distribution': entry.get('osDistribution'),
                'version': entry.get('osVersion'),
            }
            for entry in item.get('availableOperatingSystems') or []
        ],
        storage_layouts=_normalize_storage_layouts(item.get('storageLayouts')),
        default_disk_layouts=_normalize_default_disk_layouts(item.get('defaultDiskLayouts')),
    )


def _normalize_deployment_summary(item: dict[str, Any]) -> DeploymentSummary:
    specs = _normalize_specs(item.get('specs'))
    networking = _normalize_networking(item.get('networking'))
    return DeploymentSummary(
        id=str(item.get('id')),
        name=str(_get_nested(item, 'customer', 'deviceName') or item.get('id')),
        status=_normalize_status(item.get('status')),
        power_status=_normalize_status(item.get('powerStatus')),
        location=item.get('location'),
        ipv4=networking.ipv4,
        gpu_model=specs.gpu_model,
        gpu_count=specs.gpu_count,
        contract_type=item.get('contractType'),
        project_name=_get_nested(item, 'project', 'name'),
        is_interruptible=bool(item.get('isInterruptible')),
    )


def _normalize_deployment_detail(item: dict[str, Any]) -> DeploymentDetail:
    specs = _normalize_specs(item.get('specs'))
    networking = _normalize_networking(item.get('networking'))
    ssh_keys = item.get('sshKeys')
    if not ssh_keys and _get_nested(item, 'customer', 'sshPubKeys'):
        ssh_keys = [entry for entry in str(_get_nested(item, 'customer', 'sshPubKeys')).split('\n') if entry]
    lifecycle_actions = item.get('lifecycleActions') or []
    normalized_actions: list[str] = []
    for action in lifecycle_actions:
        if isinstance(action, dict):
            label = action.get('label') or action.get('value') or action.get('slug')
            if label:
                normalized_actions.append(str(label))
        elif isinstance(action, str):
            normalized_actions.append(action)

    return DeploymentDetail(
        id=str(item.get('id')),
        name=str(_get_nested(item, 'customer', 'deviceName') or item.get('id')),
        status=_normalize_status(item.get('status')),
        power_status=_normalize_status(item.get('powerStatus')),
        location=item.get('location'),
        ipv4=networking.ipv4,
        ipv6=networking.ipv6,
        mac=(item.get('networking') or {}).get('mac'),
        gpu_model=specs.gpu_model,
        gpu_count=specs.gpu_count,
        cpu_model=specs.cpu_model,
        cpu_total_cores=specs.cpu_total_cores,
        cpu_total_threads=specs.cpu_total_threads,
        memory_total_gb=specs.memory_total_gb,
        storage_total_gb=specs.storage_total_gb,
        contract_type=item.get('contractType'),
        project_name=_get_nested(item, 'project', 'name'),
        is_interruptible=bool(item.get('isInterruptible')),
        scheduled_interruption_time=item.get('scheduledInterruptionTime'),
        is_locked=bool(item.get('isLocked')),
        available_operating_systems=[str(entry.get('name')) for entry in item.get('availableOperatingSystems') or [] if entry.get('name')],
        storage_layouts=[entry for entry in item.get('storageLayouts') or [] if isinstance(entry, dict)]
        if isinstance(item.get('storageLayouts'), list)
        else [item.get('storageLayouts')] if item.get('storageLayouts') else [],
        default_disk_layouts=[entry for entry in item.get('defaultDiskLayouts') or [] if isinstance(entry, dict)],
        ssh_keys=[str(entry) for entry in ssh_keys or []] if isinstance(ssh_keys, list) else [],
        lifecycle_actions=normalized_actions,
        tags=[str(tag.get('slug')) for tag in item.get('tags') or [] if isinstance(tag, dict) and tag.get('slug')],
    )


def _apply_inventory_filters(items: list[dict[str, Any]], filters: InventoryFilters) -> list[dict[str, Any]]:
    search = filters.search.strip().lower()
    region = filters.region.strip().lower()
    availability = filters.availability.strip().lower()
    normalized_items: list[dict[str, Any]] = []

    for item in items:
        location = str(item.get('location') or '').lower()
        stock_status = str(item.get('stockStatus') or '').lower()
        haystack = ' '.join(
            [
                str(item.get('name') or ''),
                str(_get_nested(item, 'specs', 'gpu', 'model') or ''),
                str(_get_nested(item, 'specs', 'cpu', 'model') or ''),
                str(item.get('location') or ''),
            ]
        ).lower()

        if region and location != region:
            continue
        if availability and stock_status != availability:
            continue
        if search and search not in haystack:
            continue
        normalized_items.append(item)

    return normalized_items


class BrokkrClient:
    """Thin Brokkr API client with normalization helpers."""

    def __init__(self, settings: Settings):
        self._api_key = settings.brokkr_api_key
        self._base_url = _normalize_base_url(settings.brokkr_base_url)
        self._timeout = settings.brokkr_timeout_seconds

    @property
    def base_url(self) -> str:
        return self._base_url

    async def request_json(
        self,
        method: str,
        path: str,
        *,
        params: dict[str, Any] | None = None,
    ) -> Any:
        return await self._request(method, path, params=params)

    async def list_all_paginated(
        self,
        path: str,
        *,
        page_size: int = 100,
        params: dict[str, Any] | None = None,
    ) -> list[dict[str, Any]]:
        request_params = {'page': 1, 'pageSize': page_size, **(params or {})}
        first_page = await self._request('GET', path, params=request_params)
        items = list(first_page.get('data') or [])
        total_pages = int((first_page.get('meta') or {}).get('totalPages') or 1)

        if total_pages > 1:
            remaining_pages = await asyncio.gather(
                *[
                    self._request('GET', path, params={'page': page, 'pageSize': page_size, **(params or {})})
                    for page in range(2, total_pages + 1)
                ]
            )
            for page_payload in remaining_pages:
                items.extend(page_payload.get('data') or [])

        return [item for item in items if isinstance(item, dict)]

    async def _request(self, method: str, path: str, params: dict[str, Any] | None = None) -> Any:
        if not self._api_key:
            raise BrokkrApiError(
                status_code=500,
                code='brokkr_not_configured',
                message='The Brokkr API key is not configured for this environment.',
            )

        headers = {'x-api-key': self._api_key}
        url = f'{self._base_url}{path}'

        try:
            async with httpx.AsyncClient(timeout=self._timeout) as client:
                response = await client.request(method, url, params=params, headers=headers)
        except httpx.TimeoutException as exc:
            raise BrokkrApiError(
                status_code=504,
                code='brokkr_timeout',
                message='Brokkr did not respond before the timeout expired.',
            ) from exc
        except httpx.HTTPError as exc:
            raise BrokkrApiError(
                status_code=502,
                code='brokkr_unreachable',
                message='Unable to reach the Brokkr API.',
            ) from exc

        if response.is_error:
            details = None
            message = 'Brokkr request failed.'
            try:
                details = response.json()
                message = str(details.get('message') or message)
            except ValueError:
                details = {'raw': response.text[:1000]}

            code = {
                401: 'brokkr_unauthorized',
                403: 'brokkr_forbidden',
                404: 'brokkr_not_found',
                500: 'brokkr_upstream_error',
                502: 'brokkr_upstream_error',
                503: 'brokkr_upstream_error',
            }.get(response.status_code, 'brokkr_request_failed')
            raise BrokkrApiError(
                status_code=response.status_code,
                code=code,
                message=message,
                details=details if isinstance(details, dict) else None,
            )

        try:
            return response.json()
        except ValueError as exc:
            raise BrokkrApiError(
                status_code=502,
                code='brokkr_invalid_json',
                message='Brokkr returned a non-JSON response.',
            ) from exc

    async def get_current_user(self) -> tuple[SessionUser | None, str | None]:
        try:
            payload = await self._request('GET', '/me')
            return (
                SessionUser(
                    id=str(payload.get('id')),
                    email=payload.get('email'),
                    name=payload.get('name'),
                    role=payload.get('role'),
                    avatar_url=payload.get('image'),
                    created_at=payload.get('createdAt'),
                ),
                'me',
            )
        except BrokkrApiError as exc:
            if exc.status_code != 404:
                raise

        memberships = await self._request('GET', '/organizations/memberships', params={'page': 1, 'pageSize': 1})
        first_membership = (memberships.get('data') or [None])[0]
        if not isinstance(first_membership, dict):
            return None, None

        user = first_membership.get('user') or {}
        return (
            SessionUser(
                id=str(user.get('id')),
                email=user.get('email'),
                name=user.get('name'),
                role=user.get('role'),
                avatar_url=user.get('image'),
                membership_role=first_membership.get('role'),
                created_at=user.get('createdAt'),
            ),
            'memberships',
        )

    async def get_active_organization(self) -> ActiveOrganization:
        payload = await self._request('GET', '/organizations/active')
        return ActiveOrganization(
            id=str(payload.get('id')),
            name=str(payload.get('name')),
            tenant_type=payload.get('tenantType'),
            email=payload.get('email'),
            country=payload.get('country'),
            created_at=payload.get('createdAt'),
            logo_url=payload.get('logo'),
        )

    async def get_inventory_metadata(self) -> InventoryMetadata:
        regions_payload, prices_payload = await asyncio.gather(
            self._request('GET', '/inventory/regions', params={'page': 1, 'pageSize': 100}),
            self._request('GET', '/inventory/category-prices', params={'page': 1, 'pageSize': 100}),
        )
        regions = list(regions_payload.get('data') or [])
        regions_meta = regions_payload.get('meta') or {}
        total_region_pages = int(regions_meta.get('totalPages') or 1)

        if total_region_pages > 1:
            remaining_region_pages = await asyncio.gather(
                *[
                    self._request('GET', '/inventory/regions', params={'page': page, 'pageSize': 100})
                    for page in range(2, total_region_pages + 1)
                ]
            )
            for page_payload in remaining_region_pages:
                regions.extend(page_payload.get('data') or [])

        category_prices = [
            CategoryPrice(category=str(entry.get('category')), start_price=float(entry.get('startPrice')))
            for entry in prices_payload.get('data') or []
            if entry.get('category') is not None and entry.get('startPrice') is not None
        ]
        category_prices.sort(key=lambda entry: entry.start_price)
        return InventoryMetadata(
            regions=sorted({str(entry.get('name')) for entry in regions if entry.get('name')}),
            category_prices=category_prices,
            availability_options=['on demand', 'reserve', 'preorder'],
        )

    async def list_all_inventory(self) -> tuple[list[dict[str, Any]], dict[str, float]]:
        first_page = await self._request('GET', '/inventory', params={'page': 1, 'pageSize': 100})
        items = list(first_page.get('data') or [])
        meta = first_page.get('meta') or {}
        total_pages = int(meta.get('totalPages') or 1)

        if total_pages > 1:
            remaining = await asyncio.gather(
                *[
                    self._request('GET', '/inventory', params={'page': page, 'pageSize': 100})
                    for page in range(2, total_pages + 1)
                ]
            )
            for page_payload in remaining:
                items.extend(page_payload.get('data') or [])

        metadata = await self.get_inventory_metadata()
        price_map = {_normalize_category(item.category): item.start_price for item in metadata.category_prices}
        return items, {key: value for key, value in price_map.items() if key is not None}

    async def list_inventory(
        self,
        *,
        page: int,
        page_size: int,
        filters: InventoryFilters,
    ) -> PaginatedResponse[InventoryItemSummary]:
        all_items, price_map = await self.list_all_inventory()
        filtered = _apply_inventory_filters(all_items, filters)

        start = max(page - 1, 0) * page_size
        end = start + page_size
        data = [_normalize_inventory_summary(item, price_map) for item in filtered[start:end]]
        total_items = len(filtered)
        total_pages = 0 if total_items == 0 else ((total_items - 1) // page_size) + 1

        return PaginatedResponse[InventoryItemSummary](
            data=data,
            meta=PaginationMeta(
                page=page,
                page_size=page_size,
                total_items=total_items,
                total_pages=total_pages,
            ),
        )

    async def get_inventory_item(self, inventory_id: str) -> InventoryItemDetail:
        all_items, price_map = await self.list_all_inventory()
        for item in all_items:
            if str(item.get('id')) == inventory_id:
                return _normalize_inventory_detail(item, price_map)
        raise BrokkrApiError(
            status_code=404,
            code='inventory_not_found',
            message='Inventory listing was not found.',
        )

    async def list_deployments(self, *, page: int, page_size: int, search: str = '') -> PaginatedResponse[DeploymentSummary]:
        params: dict[str, Any] = {'page': page, 'pageSize': page_size}
        if search.strip():
            params['search'] = search.strip()
        payload = await self._request('GET', '/deployments', params=params)
        meta = payload.get('meta') or {}
        return PaginatedResponse[DeploymentSummary](
            data=[_normalize_deployment_summary(item) for item in payload.get('data') or []],
            meta=PaginationMeta(
                page=int(meta.get('page') or page),
                page_size=int(meta.get('pageSize') or page_size),
                total_items=int(meta.get('totalItems') or 0),
                total_pages=int(meta.get('totalPages') or 0),
            ),
        )

    async def get_deployment(self, deployment_id: str) -> DeploymentDetail:
        payload = await self._request('GET', f'/deployments/{deployment_id}')
        return _normalize_deployment_detail(payload)

    async def get_overview(self) -> OverviewResponse:
        user_task = self.get_current_user()
        org_task = self.get_active_organization()
        metadata_task = self.get_inventory_metadata()
        deployments_task = self.list_deployments(page=1, page_size=1)

        (user, user_source), organization, metadata, deployments = await asyncio.gather(
            user_task,
            org_task,
            metadata_task,
            deployments_task,
        )

        return OverviewResponse(
            connection=BrokkrConnectionSummary(
                connected=True,
                base_url=self.base_url,
                provisioning_enabled=False,
                user_source=user_source,
            ),
            user=user,
            organization=organization,
            deployment_count=deployments.meta.total_items,
            inventory_region_count=len(metadata.regions),
            category_prices=metadata.category_prices[:8],
        )
