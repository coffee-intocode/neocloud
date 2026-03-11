"""Operator aggregation service."""

from __future__ import annotations

import asyncio
from dataclasses import dataclass
from datetime import UTC, datetime
from decimal import Decimal
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from ..auth.schemas import AuthenticatedUser
from ..brokkr import BrokkrApiError, BrokkrClient
from .demo_data import build_brokkr_deployment_detail, build_demo_dataset, build_demo_deployment_detail
from .models import InstanceRevenueSnapshotModel, OperatorInstanceModel
from .repository import OperatorInstanceRepository
from .schemas import (
    AttentionItem,
    BridgeRequestSummary,
    BridgeSummary,
    DashboardTopInstance,
    DatacenterContact,
    DatacenterDetail,
    DatacenterPortfolioRow,
    DeploymentDetail,
    DeploymentRow,
    DeviceRow,
    NetworkSummary,
    OperatorDashboard,
    OperatorInstance,
    OperatorStatus,
    ReservationPipelineRow,
    ReservationPipelineSnapshot,
    RevenueSummary,
    ZoneSummary,
    DeploymentSnapshot,
    CreateOperatorInstanceInput,
    UpdateOperatorInstanceInput,
)


ACTIVE_MARKET_STATUSES = {'listed', 'active'}
ONLINE_STATUS_VALUES = {'active', 'online', 'running', 'available'}
OFFLINE_STATUS_VALUES = {'offline', 'decommissioned', 'deprecated', 'failed'}
FORCE_OPERATOR_DEMO_MODE = True


@dataclass(slots=True)
class OperatorServiceError(Exception):
    status_code: int
    code: str
    message: str
    details: dict[str, Any] | None = None


@dataclass(slots=True)
class OperatorState:
    datacenters: list[dict[str, Any]]
    zones: list[dict[str, Any]]
    bridges: list[dict[str, Any]]
    bridge_requests: list[dict[str, Any]]
    devices: list[dict[str, Any]]
    reservations: list[dict[str, Any]]
    deployments: list[dict[str, Any]]
    instances: list[OperatorInstanceModel]
    contacts_by_datacenter_id: dict[str, list[dict[str, Any]]]
    demo_mode: bool = False


@dataclass(slots=True)
class InstanceEvaluation:
    instance: OperatorInstanceModel
    current_hourly_revenue_usd: float
    idle_hourly_opportunity_usd: float
    attention_reason: str | None
    online: bool
    listed: bool
    datacenter_name: str | None
    device_name: str | None
    gpu_model: str | None


def _get_nested(payload: dict[str, Any] | None, *keys: str) -> Any:
    current: Any = payload or {}
    for key in keys:
        if not isinstance(current, dict):
            return None
        current = current.get(key)
    return current


def _to_float(value: Any) -> float | None:
    if value is None:
        return None
    if isinstance(value, bool):
        return None
    if isinstance(value, (int, float, Decimal)):
        return float(value)
    return None


def _to_status(value: str | None, label: str | None) -> OperatorStatus:
    return OperatorStatus(value=value or 'unknown', label=label or 'Unknown')


def _price_from_cents(value: Any) -> float | None:
    numeric = _to_float(value)
    if numeric is None:
        return None
    return round(numeric / 100, 2)


def _format_decimal(value: Decimal | float | int | None) -> float:
    numeric = _to_float(value)
    return round(numeric or 0.0, 2)


def _is_future_timestamp(value: str | None) -> bool:
    if not value:
        return False
    return datetime.fromisoformat(value.replace('Z', '+00:00')) > datetime.now(UTC)


def _device_datacenter_id(device: dict[str, Any]) -> str | None:
    site_id = device.get('siteId')
    return str(site_id) if site_id is not None else None


def _device_datacenter_name(device: dict[str, Any]) -> str | None:
    return device.get('siteName') or None


def _device_listing_active(device: dict[str, Any]) -> bool:
    return bool(_get_nested(device, 'listing', 'isActive'))


def _device_on_demand_price(device: dict[str, Any]) -> float | None:
    return _price_from_cents(_get_nested(device, 'listing', 'onDemandPrice', 'perHour', 'total'))


def _device_is_online(device: dict[str, Any]) -> bool:
    status_value = str(_get_nested(device, 'status', 'value') or '').lower()
    power_value = str(_get_nested(device, 'powerStatus', 'value') or '').lower()
    if status_value in OFFLINE_STATUS_VALUES or power_value in OFFLINE_STATUS_VALUES:
        return False
    return status_value in ONLINE_STATUS_VALUES or power_value in ONLINE_STATUS_VALUES


def _device_is_deprecated(device: dict[str, Any]) -> bool:
    status_label = str(_get_nested(device, 'status', 'label') or '').lower()
    status_value = str(_get_nested(device, 'status', 'value') or '').lower()
    return 'deprecated' in status_label or 'deprecated' in status_value


def _device_is_earning(device: dict[str, Any]) -> bool:
    if device.get('deployment'):
        return True
    reservation_type = str(_get_nested(device, 'customer', 'reservationType') or '').strip()
    if reservation_type:
        return True
    reservation_invite = device.get('reservationInvite')
    return bool(reservation_invite and reservation_invite.get('dateAccepted'))


def _count_prefixes(bridge_requests: list[dict[str, Any]], prefix_type: str) -> int:
    count = 0
    for request in bridge_requests:
        prefixes = _get_nested(request, 'data', 'prefixes') or []
        for prefix in prefixes:
            if isinstance(prefix, dict) and str(prefix.get('type') or '').lower() == prefix_type:
                count += 1
    return count


class OperatorService:
    """Aggregates Brokkr infrastructure with local operator state."""

    def __init__(self, *, session: AsyncSession, brokkr_client: BrokkrClient):
        self._session = session
        self._repo = OperatorInstanceRepository(session)
        self._brokkr = brokkr_client

    async def get_dashboard(self) -> OperatorDashboard:
        state = await self._load_state()
        evaluations = self._evaluate_instances(state)
        revenue = self._build_revenue_summary(evaluations)
        attention_items = self._build_attention_items(evaluations)
        datacenters = self._build_datacenter_rows(state, evaluations)
        top_idle = [
            DashboardTopInstance(
                operator_instance_id=evaluation.instance.id,
                name=evaluation.instance.display_name,
                datacenter_name=evaluation.datacenter_name,
                hourly_rate_usd=_format_decimal(evaluation.instance.hourly_rate_usd),
                reason=evaluation.attention_reason or 'Idle but ready to earn',
            )
            for evaluation in sorted(
                [item for item in evaluations if item.idle_hourly_opportunity_usd > 0],
                key=lambda item: item.idle_hourly_opportunity_usd,
                reverse=True,
            )[:5]
        ]
        reservation_rows = await self._build_reservation_rows(state)
        deployment_rows = await self._build_deployment_rows(state)

        return OperatorDashboard(
            demo_mode=state.demo_mode,
            revenue=revenue,
            attention_items=attention_items[:8],
            datacenters=datacenters[:6],
            top_idle_instances=top_idle,
            reservation_pipeline=ReservationPipelineSnapshot(
                pending_count=len([row for row in reservation_rows if not row.date_accepted and _is_future_timestamp(row.date_expires)]),
                accepted_count=len([row for row in reservation_rows if row.date_accepted]),
                expired_count=len([row for row in reservation_rows if not row.date_accepted and row.date_expires and not _is_future_timestamp(row.date_expires)]),
            ),
            deployments=DeploymentSnapshot(
                total_count=len(deployment_rows),
                interruptible_count=len(
                    [
                        row
                        for row in deployment_rows
                        if (row.contract_type or '').lower() == 'interruptible'
                    ]
                ),
                locked_count=0,
            ),
        )

    async def list_datacenters(self) -> list[DatacenterPortfolioRow]:
        state = await self._load_state()
        return self._build_datacenter_rows(state, self._evaluate_instances(state))

    async def get_datacenter_detail(self, datacenter_id: str) -> DatacenterDetail:
        state = await self._load_state()
        datacenters = self._build_datacenter_rows(state, self._evaluate_instances(state))
        datacenter = next((row for row in datacenters if row.id == datacenter_id), None)
        if datacenter is None:
            raise OperatorServiceError(404, 'datacenter_not_found', 'Datacenter was not found.')

        zones = [
            ZoneSummary(
                id=str(zone.get('id')),
                name=str(zone.get('name') or 'Unnamed zone'),
                site_id=str(zone.get('siteId')) if zone.get('siteId') is not None else None,
                site_name=zone.get('siteName'),
            )
            for zone in state.zones
            if str(zone.get('siteId')) == datacenter_id
        ]
        contacts = [
            DatacenterContact(
                id=str(contact.get('id')),
                name=str(contact.get('name') or contact.get('email') or 'Contact'),
                email=contact.get('email'),
                phone=contact.get('phone'),
                role=contact.get('role'),
            )
            for contact in state.contacts_by_datacenter_id.get(datacenter_id, [])
        ]
        bridges = [
            self._normalize_bridge(bridge)
            for bridge in state.bridges
            if str(_get_nested(bridge, 'datacenter', 'id')) == datacenter_id
        ]
        bridge_requests = [
            self._normalize_bridge_request(request)
            for request in state.bridge_requests
            if str(_get_nested(request, 'datacenter', 'id')) == datacenter_id
        ]
        return DatacenterDetail(
            datacenter=datacenter,
            zones=zones,
            contacts=contacts,
            bridges=bridges,
            bridge_requests=bridge_requests,
        )

    async def get_network_summary(self) -> NetworkSummary:
        state = await self._load_state()
        bridge_requests = [self._normalize_bridge_request(request) for request in state.bridge_requests]
        bridges = [self._normalize_bridge(bridge) for bridge in state.bridges]
        return NetworkSummary(
            bridge_count=len(bridges),
            pending_bridge_request_count=len([item for item in bridge_requests if item.status == 'pending']),
            approved_bridge_request_count=len([item for item in bridge_requests if item.status == 'approved']),
            rejected_bridge_request_count=len([item for item in bridge_requests if item.status == 'rejected']),
            private_prefix_count=_count_prefixes(state.bridge_requests, 'private'),
            public_prefix_count=_count_prefixes(state.bridge_requests, 'public'),
            bridge_requests=bridge_requests,
            bridges=bridges,
        )

    async def list_devices(self) -> list[DeviceRow]:
        state = await self._load_state()
        instances_by_device_id = {instance.brokkr_device_id: instance for instance in state.instances}
        evaluations = {item.instance.id: item for item in self._evaluate_instances(state)}

        return [
            DeviceRow(
                id=str(device.get('id')),
                name=str(device.get('name') or device.get('id')),
                role=device.get('role'),
                datacenter_name=_device_datacenter_name(device),
                zone_name=device.get('zoneName'),
                location=device.get('location'),
                status=_to_status(_get_nested(device, 'status', 'value'), _get_nested(device, 'status', 'label')),
                power_status=_to_status(
                    _get_nested(device, 'powerStatus', 'value'),
                    _get_nested(device, 'powerStatus', 'label'),
                ),
                gpu_model=_get_nested(device, 'specs', 'gpu', 'model'),
                gpu_count=_get_nested(device, 'specs', 'gpu', 'count'),
                cpu_model=_get_nested(device, 'specs', 'cpu', 'model'),
                memory_total_gb=_to_float(_get_nested(device, 'specs', 'memory', 'total')),
                listing_active=_device_listing_active(device),
                interruptible_only=bool(_get_nested(device, 'listing', 'isInterruptibleOnly')),
                on_demand_price_usd=_device_on_demand_price(device),
                reservation_type=_get_nested(device, 'customer', 'reservationType'),
                eco_mode=bool(device.get('ecoMode')),
                is_tee_capable=bool(device.get('isTeeCapable')),
                instance_id=instances_by_device_id.get(str(device.get('id'))).id
                if instances_by_device_id.get(str(device.get('id')))
                else None,
                instance_name=instances_by_device_id.get(str(device.get('id'))).display_name
                if instances_by_device_id.get(str(device.get('id')))
                else None,
                attention_reason=evaluations[instances_by_device_id[str(device.get('id'))].id].attention_reason
                if instances_by_device_id.get(str(device.get('id')))
                and instances_by_device_id[str(device.get('id'))].id in evaluations
                else None,
            )
            for device in state.devices
        ]

    async def list_instances(self) -> list[OperatorInstance]:
        state = await self._load_state()
        evaluations = {item.instance.id: item for item in self._evaluate_instances(state)}
        devices_by_id = {str(device.get('id')): device for device in state.devices}
        rows: list[OperatorInstance] = []
        for instance in state.instances:
            device = devices_by_id.get(instance.brokkr_device_id)
            evaluation = evaluations[instance.id]
            rows.append(
                OperatorInstance(
                    id=instance.id,
                    brokkr_device_id=instance.brokkr_device_id,
                    brokkr_datacenter_id=instance.brokkr_datacenter_id,
                    display_name=instance.display_name,
                    hourly_rate_usd=_format_decimal(instance.hourly_rate_usd),
                    market_status=instance.market_status,
                    is_visible=instance.is_visible,
                    notes=instance.notes,
                    created_by_user_id=instance.created_by_user_id,
                    created_at=instance.created_at.isoformat(),
                    updated_at=instance.updated_at.isoformat(),
                    datacenter_name=evaluation.datacenter_name,
                    device_name=str(device.get('name')) if isinstance(device, dict) and device.get('name') else None,
                    gpu_model=evaluation.gpu_model,
                    current_hourly_revenue_usd=evaluation.current_hourly_revenue_usd,
                    idle_hourly_opportunity_usd=evaluation.idle_hourly_opportunity_usd,
                    attention_reason=evaluation.attention_reason,
                    online=evaluation.online,
                    listed=evaluation.listed,
                )
            )
        return rows

    async def create_instance(
        self,
        *,
        payload: CreateOperatorInstanceInput,
        current_user: AuthenticatedUser,
    ) -> OperatorInstance:
        existing = await self._repo.get_instance_by_device_id(payload.brokkr_device_id)
        if existing is not None:
            raise OperatorServiceError(
                409,
                'instance_already_exists',
                'This Brokkr device is already mapped to a commercial instance.',
            )

        device = await self._find_device(payload.brokkr_device_id)
        instance = OperatorInstanceModel(
            brokkr_device_id=payload.brokkr_device_id,
            brokkr_datacenter_id=payload.brokkr_datacenter_id or _device_datacenter_id(device),
            display_name=payload.display_name,
            hourly_rate_usd=payload.hourly_rate_usd,
            market_status=payload.market_status,
            is_visible=payload.is_visible,
            notes=payload.notes,
            created_by_user_id=current_user.supabase_user_id,
        )
        await self._repo.create_instance(instance)
        await self._session.commit()
        await self._capture_snapshot(instance, device)
        await self._session.commit()
        return await self.get_instance(instance.id)

    async def update_instance(self, instance_id: str, payload: UpdateOperatorInstanceInput) -> OperatorInstance:
        instance = await self._repo.get_instance(instance_id)
        if instance is None:
            raise OperatorServiceError(404, 'instance_not_found', 'Operator instance was not found.')

        updates = payload.model_dump(exclude_unset=True)
        for field_name, value in updates.items():
            setattr(instance, field_name, value)

        await self._repo.save(instance)
        await self._session.commit()
        device = await self._find_device(instance.brokkr_device_id)
        await self._capture_snapshot(instance, device)
        await self._session.commit()
        return await self.get_instance(instance.id)

    async def get_instance(self, instance_id: str) -> OperatorInstance:
        items = await self.list_instances()
        instance = next((item for item in items if item.id == instance_id), None)
        if instance is None:
            raise OperatorServiceError(404, 'instance_not_found', 'Operator instance was not found.')
        return instance

    async def list_reservations(self) -> list[ReservationPipelineRow]:
        state = await self._load_state()
        return await self._build_reservation_rows(state)

    async def list_deployments(self) -> list[DeploymentRow]:
        state = await self._load_state()
        return await self._build_deployment_rows(state)

    async def get_deployment_detail(self, deployment_id: str) -> DeploymentDetail:
        state = await self._load_state()
        if state.demo_mode:
            for deployment in state.deployments:
                if str(deployment.get('id')) == deployment_id:
                    return build_demo_deployment_detail(deployment)
        detail = await self._brokkr.get_deployment(deployment_id)
        return build_brokkr_deployment_detail(detail)

    async def _load_state(self) -> OperatorState:
        instances = list(await self._repo.list_instances())

        if FORCE_OPERATOR_DEMO_MODE:
            demo_state = await self._build_demo_state(instances)
            if demo_state is not None:
                return demo_state

        if await self._should_use_demo_mode():
            demo_state = await self._build_demo_state(instances)
            if demo_state is not None:
                return demo_state

        datacenters_task = self._brokkr.list_all_paginated('/datacenters')
        zones_task = self._brokkr.list_all_paginated('/zones')
        bridge_requests_task = self._brokkr.list_all_paginated('/bridge-requests')
        bridges_task = self._brokkr.list_all_paginated('/bridges')
        devices_task = self._brokkr.list_all_paginated('/devices')
        deployments_task = self._brokkr.list_all_paginated('/deployments')

        datacenters, zones, bridge_requests, bridges, devices, deployments = await asyncio.gather(
            datacenters_task,
            zones_task,
            bridge_requests_task,
            bridges_task,
            devices_task,
            deployments_task,
        )

        contacts_by_datacenter_id = await self._load_contacts(datacenters)
        reservations = await self._load_reservations(devices)

        state = OperatorState(
            datacenters=datacenters,
            zones=zones,
            bridges=bridges,
            bridge_requests=bridge_requests,
            devices=devices,
            reservations=reservations,
            deployments=deployments,
            instances=instances,
            contacts_by_datacenter_id=contacts_by_datacenter_id,
        )
        return state

    async def _build_demo_state(self, instances: list[OperatorInstanceModel]) -> OperatorState | None:
        inventory_items = await self._brokkr.list_inventory_items()
        demo = build_demo_dataset(inventory_items, instances)
        if demo is None:
            return None
        return OperatorState(
            datacenters=demo.datacenters,
            zones=demo.zones,
            bridges=demo.bridges,
            bridge_requests=demo.bridge_requests,
            devices=demo.devices,
            reservations=demo.reservations,
            deployments=demo.deployments,
            instances=demo.instances,
            contacts_by_datacenter_id=demo.contacts_by_datacenter_id,
            demo_mode=True,
        )

    async def _load_contacts(self, datacenters: list[dict[str, Any]]) -> dict[str, list[dict[str, Any]]]:
        if not datacenters:
            return {}

        responses = await asyncio.gather(
            *[
                self._brokkr.list_all_paginated(f'/datacenters/{datacenter["id"]}/contacts')
                for datacenter in datacenters
                if datacenter.get('id') is not None
            ]
        )
        return {
            str(datacenter['id']): response
            for datacenter, response in zip(
                [item for item in datacenters if item.get('id') is not None],
                responses,
                strict=False,
            )
        }

    async def _load_reservations(self, devices: list[dict[str, Any]]) -> list[dict[str, Any]]:
        if not devices:
            return []

        responses = await asyncio.gather(
            *[
                self._brokkr.list_all_paginated(f'/devices/{device["id"]}/reservation-invites')
                for device in devices
                if device.get('id')
            ]
        )
        unique: dict[str, dict[str, Any]] = {}
        for payload in responses:
            for item in payload:
                invite_id = str(item.get('id'))
                if invite_id:
                    unique[invite_id] = item
        return list(unique.values())

    async def _find_device(self, brokkr_device_id: str) -> dict[str, Any]:
        state = await self._load_state()
        for device in state.devices:
            if str(device.get('id')) == brokkr_device_id:
                return device
        raise OperatorServiceError(404, 'device_not_found', 'The selected Brokkr device was not found.')

    async def _capture_snapshot(self, instance: OperatorInstanceModel, device: dict[str, Any]) -> None:
        state = await self._load_state()
        evaluations = {item.instance.id: item for item in self._evaluate_instances(state)}
        evaluation = evaluations.get(instance.id)
        if evaluation is None:
            evaluation = self._evaluate_instance(instance, device, state)
        snapshot = InstanceRevenueSnapshotModel(
            operator_instance_id=instance.id,
            current_hourly_revenue_usd=Decimal(str(evaluation.current_hourly_revenue_usd)),
            idle_hourly_opportunity_usd=Decimal(str(evaluation.idle_hourly_opportunity_usd)),
            attention_state='attention' if evaluation.attention_reason else 'healthy',
        )
        await self._repo.add_snapshot(snapshot)

    def _evaluate_instances(self, state: OperatorState) -> list[InstanceEvaluation]:
        devices_by_id = {str(device.get('id')): device for device in state.devices}
        return [
            self._evaluate_instance(instance, devices_by_id.get(instance.brokkr_device_id), state)
            for instance in state.instances
        ]

    def _evaluate_instance(
        self,
        instance: OperatorInstanceModel,
        device: dict[str, Any] | None,
        state: OperatorState,
    ) -> InstanceEvaluation:
        hourly_rate = _format_decimal(instance.hourly_rate_usd)
        if device is None:
            return InstanceEvaluation(
                instance=instance,
                current_hourly_revenue_usd=0,
                idle_hourly_opportunity_usd=0,
                attention_reason='Mapped Brokkr device is missing.',
                online=False,
                listed=False,
                datacenter_name=None,
                device_name=None,
                gpu_model=None,
            )

        online = _device_is_online(device)
        listed = _device_listing_active(device) and instance.is_visible and instance.market_status in ACTIVE_MARKET_STATUSES
        target_datacenter_id = _device_datacenter_id(device) or instance.brokkr_datacenter_id
        bridge_ready = target_datacenter_id is None or any(
            str(_get_nested(bridge, 'datacenter', 'id')) == target_datacenter_id for bridge in state.bridges
        )

        attention_reason: str | None = None
        if _device_is_deprecated(device):
            attention_reason = 'Device is deprecated and cannot earn.'
        elif not online:
            attention_reason = 'Device is offline.'
        elif not bridge_ready:
            attention_reason = 'Datacenter has no active bridge.'
        elif not listed:
            attention_reason = 'Instance is not listed for sale.'

        is_earning = _device_is_earning(device)
        current_hourly_revenue = hourly_rate if is_earning and online else 0.0
        idle_hourly_opportunity = hourly_rate if listed and online and not is_earning and attention_reason is None else 0.0

        return InstanceEvaluation(
            instance=instance,
            current_hourly_revenue_usd=current_hourly_revenue,
            idle_hourly_opportunity_usd=idle_hourly_opportunity,
            attention_reason=attention_reason,
            online=online,
            listed=listed,
            datacenter_name=_device_datacenter_name(device),
            device_name=str(device.get('name') or '') or None,
            gpu_model=_get_nested(device, 'specs', 'gpu', 'model'),
        )

    def _build_revenue_summary(self, evaluations: list[InstanceEvaluation]) -> RevenueSummary:
        return RevenueSummary(
            current_hourly_revenue_usd=round(sum(item.current_hourly_revenue_usd for item in evaluations), 2),
            idle_hourly_opportunity_usd=round(sum(item.idle_hourly_opportunity_usd for item in evaluations), 2),
            online_capacity_count=len([item for item in evaluations if item.online]),
            attention_count=len([item for item in evaluations if item.attention_reason]),
        )

    def _build_attention_items(self, evaluations: list[InstanceEvaluation]) -> list[AttentionItem]:
        items = [
            AttentionItem(
                operator_instance_id=item.instance.id,
                brokkr_device_id=item.instance.brokkr_device_id,
                title=item.instance.display_name,
                reason=item.attention_reason or 'Ready',
                blocked_hourly_revenue_usd=_format_decimal(item.instance.hourly_rate_usd),
                datacenter_name=item.datacenter_name,
                status=OperatorStatus(
                    value='attention' if item.attention_reason else 'healthy',
                    label='Attention' if item.attention_reason else 'Healthy',
                ),
            )
            for item in evaluations
            if item.attention_reason
        ]
        return sorted(items, key=lambda item: item.blocked_hourly_revenue_usd, reverse=True)

    def _build_datacenter_rows(
        self,
        state: OperatorState,
        evaluations: list[InstanceEvaluation],
    ) -> list[DatacenterPortfolioRow]:
        evaluations_by_datacenter: dict[str, list[InstanceEvaluation]] = {}
        for evaluation in evaluations:
            datacenter_id = evaluation.instance.brokkr_datacenter_id
            if datacenter_id is None:
                continue
            evaluations_by_datacenter.setdefault(datacenter_id, []).append(evaluation)

        rows: list[DatacenterPortfolioRow] = []
        for datacenter in state.datacenters:
            datacenter_id = str(datacenter.get('id'))
            zone_count = len([zone for zone in state.zones if str(zone.get('siteId')) == datacenter_id])
            bridge_count = len(
                [bridge for bridge in state.bridges if str(_get_nested(bridge, 'datacenter', 'id')) == datacenter_id]
            )
            bridge_request_count = len(
                [
                    request
                    for request in state.bridge_requests
                    if str(_get_nested(request, 'datacenter', 'id')) == datacenter_id
                ]
            )
            device_count = len([device for device in state.devices if _device_datacenter_id(device) == datacenter_id])
            datacenter_evaluations = evaluations_by_datacenter.get(datacenter_id, [])
            rows.append(
                DatacenterPortfolioRow(
                    id=datacenter_id,
                    name=str(datacenter.get('name') or 'Unnamed datacenter'),
                    region=datacenter.get('region'),
                    status=datacenter.get('status'),
                    facility=datacenter.get('facility'),
                    physical_address=datacenter.get('physicalAddress'),
                    shipping_address=datacenter.get('shippingAddress'),
                    created_at=datacenter.get('createdAt'),
                    zone_count=zone_count,
                    bridge_count=bridge_count,
                    bridge_request_count=bridge_request_count,
                    device_count=device_count,
                    listed_instance_count=len([item for item in datacenter_evaluations if item.listed]),
                    active_instance_count=len([item for item in datacenter_evaluations if item.current_hourly_revenue_usd > 0]),
                    hourly_revenue_usd=round(sum(item.current_hourly_revenue_usd for item in datacenter_evaluations), 2),
                    idle_hourly_opportunity_usd=round(
                        sum(item.idle_hourly_opportunity_usd for item in datacenter_evaluations), 2
                    ),
                    readiness_label='Bridge ready' if bridge_count > 0 else 'Bridge required',
                )
            )
        return sorted(rows, key=lambda row: row.hourly_revenue_usd + row.idle_hourly_opportunity_usd, reverse=True)

    async def _build_reservation_rows(self, state: OperatorState) -> list[ReservationPipelineRow]:
        instance_by_device_id = {instance.brokkr_device_id: instance for instance in state.instances}
        rows: list[ReservationPipelineRow] = []
        for invite in state.reservations:
            device_ids = [str(device_id) for device_id in invite.get('deviceIds') or []]
            mapped_instances = [instance_by_device_id[device_id] for device_id in device_ids if device_id in instance_by_device_id]
            listing = invite.get('listing') or {}
            rows.append(
                ReservationPipelineRow(
                    id=str(invite.get('id')),
                    invitee_email=invite.get('inviteeEmail'),
                    inviter_email=invite.get('inviterEmail'),
                    channel=str(invite.get('channel') or 'UNKNOWN'),
                    contract_type=invite.get('contractType'),
                    billing_frequency=str(invite.get('billingFrequency') or 'UNKNOWN'),
                    buyer_price=_to_float(invite.get('buyerPrice')),
                    supplier_price=_to_float(invite.get('supplierPrice')),
                    margin=_to_float(invite.get('margin')),
                    date_created=invite.get('dateCreated'),
                    date_expires=invite.get('dateExpires'),
                    date_accepted=invite.get('dateAccepted'),
                    device_ids=device_ids,
                    operator_instance_ids=[instance.id for instance in mapped_instances],
                    instance_names=[instance.display_name for instance in mapped_instances],
                    listing_name=listing.get('name'),
                    gpu_model=_get_nested(listing, 'specs', 'gpu', 'model'),
                )
            )
        return sorted(rows, key=lambda row: row.date_created or '', reverse=True)

    async def _build_deployment_rows(self, state: OperatorState) -> list[DeploymentRow]:
        rows: list[DeploymentRow] = []
        for item in state.deployments:
            rows.append(
                DeploymentRow(
                    id=str(item.get('id')),
                    name=str(_get_nested(item, 'customer', 'deviceName') or item.get('id')),
                    status=_to_status(_get_nested(item, 'status', 'value'), _get_nested(item, 'status', 'label')),
                    power_status=_to_status(
                        _get_nested(item, 'powerStatus', 'value'),
                        _get_nested(item, 'powerStatus', 'label'),
                    ),
                    location=item.get('location'),
                    ipv4=_get_nested(item, 'networking', 'ipv4'),
                    gpu_model=_get_nested(item, 'specs', 'gpu', 'model'),
                    gpu_count=_get_nested(item, 'specs', 'gpu', 'count'),
                    contract_type=item.get('contractType'),
                    project_name=_get_nested(item, 'project', 'name'),
                    operator_instance_id=None,
                    operator_instance_name=None,
                )
        )
        return rows

    async def _should_use_demo_mode(self) -> bool:
        probe_paths = (
            '/datacenters',
            '/zones',
            '/bridges',
            '/bridge-requests',
            '/devices',
            '/deployments',
        )
        for path in probe_paths:
            if await self._brokkr.has_paginated_data(path):
                return False
        return True

    def _normalize_bridge(self, bridge: dict[str, Any]) -> BridgeSummary:
        ip_addresses: list[str] = []
        for interface in bridge.get('interfaces') or []:
            for ip_address in interface.get('ip_addresses') or []:
                if isinstance(ip_address, dict) and ip_address.get('address'):
                    ip_addresses.append(str(ip_address.get('address')))
        return BridgeSummary(
            id=str(bridge.get('id')),
            name=str(bridge.get('name') or 'Unnamed bridge'),
            status=str(bridge.get('status') or 'unknown'),
            type=str(bridge.get('type') or 'unknown'),
            datacenter_id=str(_get_nested(bridge, 'datacenter', 'id') or ''),
            datacenter_name=str(_get_nested(bridge, 'datacenter', 'name') or 'Unknown datacenter'),
            zone_id=str(_get_nested(bridge, 'zone', 'id') or ''),
            zone_name=str(_get_nested(bridge, 'zone', 'name') or 'Unknown zone'),
            interface_count=len(bridge.get('interfaces') or []),
            ip_addresses=ip_addresses,
        )

    def _normalize_bridge_request(self, request: dict[str, Any]) -> BridgeRequestSummary:
        return BridgeRequestSummary(
            id=str(request.get('id')),
            datacenter_id=str(_get_nested(request, 'datacenter', 'id') or ''),
            datacenter_name=str(_get_nested(request, 'datacenter', 'name') or 'Unknown datacenter'),
            zone_id=str(_get_nested(request, 'zone', 'id') or ''),
            zone_name=str(_get_nested(request, 'zone', 'name') or 'Unknown zone'),
            status=str(request.get('status') or 'pending'),
            bridge_type=_get_nested(request, 'data', 'bridgeType'),
            bridge_count=_get_nested(request, 'data', 'bridgeCount'),
            network_type=_get_nested(request, 'data', 'networkType'),
            created_at=request.get('createdAt'),
            approved_at=request.get('approvedAt'),
            rejected_at=request.get('rejectedAt'),
        )
