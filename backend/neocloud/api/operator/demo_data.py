"""Typed demo dataset builders for empty operator orgs."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from decimal import Decimal
from typing import Any

from ..brokkr import _get_nested
from .device_source import inventory_item_to_mock_device
from .models import OperatorInstanceModel
from .schemas import DeploymentDetail, OperatorStatus


@dataclass(slots=True)
class DemoDataset:
    datacenters: list[dict[str, Any]]
    zones: list[dict[str, Any]]
    bridges: list[dict[str, Any]]
    bridge_requests: list[dict[str, Any]]
    devices: list[dict[str, Any]]
    reservations: list[dict[str, Any]]
    instances: list[OperatorInstanceModel]
    contacts_by_datacenter_id: dict[str, list[dict[str, Any]]]
    deployments: list[dict[str, Any]]


def build_demo_dataset(
    inventory_items: list[dict[str, Any]],
    local_instances: list[OperatorInstanceModel],
) -> DemoDataset | None:
    if not inventory_items:
        return None

    selected_items = inventory_items[:16]
    if len(selected_items) < 14:
        return None

    now = datetime.now(UTC)
    datacenters = [
        _datacenter('demo-dc-ca-1', 'Canada West 1', 'Canada', 'Toronto Colocation A', now - timedelta(days=160)),
        _datacenter('demo-dc-wa-1', 'Washington Core 1', 'Washington', 'Seattle Fabric Hall', now - timedelta(days=120)),
        _datacenter('demo-dc-az-1', 'Arizona Expansion 1', 'Arizona', 'Phoenix Buildout C', now - timedelta(days=45)),
    ]
    zones = [
        {'id': 'demo-zone-ca-a', 'name': 'CA-A', 'siteId': 'demo-dc-ca-1', 'siteName': 'Canada West 1'},
        {'id': 'demo-zone-wa-a', 'name': 'WA-A', 'siteId': 'demo-dc-wa-1', 'siteName': 'Washington Core 1'},
        {'id': 'demo-zone-az-a', 'name': 'AZ-A', 'siteId': 'demo-dc-az-1', 'siteName': 'Arizona Expansion 1'},
    ]
    contacts_by_datacenter_id = {
        'demo-dc-ca-1': [_contact('dc-ca-ops', 'Mina Patel', 'mina@neocloud.dev', 'Operations lead')],
        'demo-dc-wa-1': [_contact('dc-wa-net', 'Jon Reyes', 'jon@neocloud.dev', 'Network lead')],
        'demo-dc-az-1': [_contact('dc-az-build', 'Avery Chen', 'avery@neocloud.dev', 'Expansion manager')],
    }
    bridges = [
        _bridge('demo-bridge-ca-1', 'Canada West 1', 'demo-dc-ca-1', 'CA-A', 'demo-zone-ca-a', 'active'),
        _bridge('demo-bridge-wa-1', 'Washington Core 1', 'demo-dc-wa-1', 'WA-A', 'demo-zone-wa-a', 'active'),
    ]
    bridge_requests = [
        _bridge_request(
            'demo-bridge-request-az-1',
            'Arizona Expansion 1',
            'demo-dc-az-1',
            'AZ-A',
            'demo-zone-az-a',
            'pending',
            now - timedelta(days=4),
        )
    ]

    device_profiles = [
        ('demo-dc-ca-1', 'Canada West 1', 'CA-A', 'earning', Decimal('410.00')),
        ('demo-dc-ca-1', 'Canada West 1', 'CA-A', 'earning', Decimal('405.00')),
        ('demo-dc-ca-1', 'Canada West 1', 'CA-A', 'earning', Decimal('395.00')),
        ('demo-dc-ca-1', 'Canada West 1', 'CA-A', 'earning', Decimal('390.00')),
        ('demo-dc-ca-1', 'Canada West 1', 'CA-A', 'earning', Decimal('380.00')),
        ('demo-dc-wa-1', 'Washington Core 1', 'WA-A', 'earning', Decimal('420.00')),
        ('demo-dc-wa-1', 'Washington Core 1', 'WA-A', 'earning', Decimal('410.00')),
        ('demo-dc-wa-1', 'Washington Core 1', 'WA-A', 'earning', Decimal('395.00')),
        ('demo-dc-wa-1', 'Washington Core 1', 'WA-A', 'earning', Decimal('385.00')),
        ('demo-dc-wa-1', 'Washington Core 1', 'WA-A', 'earning', Decimal('375.00')),
        ('demo-dc-ca-1', 'Canada West 1', 'CA-A', 'idle', Decimal('460.00')),
        ('demo-dc-ca-1', 'Canada West 1', 'CA-A', 'idle', Decimal('380.00')),
        ('demo-dc-wa-1', 'Washington Core 1', 'WA-A', 'idle', Decimal('340.00')),
        ('demo-dc-az-1', 'Arizona Expansion 1', 'AZ-A', 'bridge-blocked', Decimal('520.00')),
        ('demo-dc-wa-1', 'Washington Core 1', 'WA-A', 'unlisted', Decimal('290.00')),
        ('demo-dc-ca-1', 'Canada West 1', 'CA-A', 'offline', Decimal('270.00')),
        ('demo-dc-ca-1', 'Canada West 1', 'CA-A', 'unmapped', Decimal('290.00')),
        ('demo-dc-wa-1', 'Washington Core 1', 'WA-A', 'unmapped', Decimal('270.00')),
    ]

    local_instances_by_device_id = {instance.brokkr_device_id: instance for instance in local_instances}
    devices: list[dict[str, Any]] = []
    demo_instances: list[OperatorInstanceModel] = []

    for index, (item, profile) in enumerate(zip(selected_items, device_profiles, strict=False), start=1):
        datacenter_id, datacenter_name, zone_name, mode, hourly_rate = profile
        device = inventory_item_to_mock_device(item)
        device['siteId'] = datacenter_id
        device['siteName'] = datacenter_name
        device['zoneName'] = zone_name
        device['status'] = {'value': 'active', 'label': 'Online'}
        device['powerStatus'] = {'value': 'online', 'label': 'Online'}
        device['listing'] = {
            **(device.get('listing') or {}),
            'isActive': mode not in {'unmapped', 'unlisted'},
            'isInterruptibleOnly': False,
        }
        device['customer'] = {'reservationType': 'reserved' if mode == 'earning' and index > 3 else None}
        device['deployment'] = {'id': f'demo-deployment-{index:02d}'} if mode == 'earning' and index <= 3 else None
        if mode == 'offline':
            device['status'] = {'value': 'offline', 'label': 'Offline'}
            device['powerStatus'] = {'value': 'off', 'label': 'Off'}
        devices.append(device)

        if mode == 'unmapped' or str(device.get('id')) in local_instances_by_device_id:
            continue

        gpu_model = _get_nested(device, 'specs', 'gpu', 'model') or 'GPU node'
        demo_instances.append(
            OperatorInstanceModel(
                id=f'demo-instance-{index:02d}',
                brokkr_device_id=str(device.get('id')),
                brokkr_datacenter_id=datacenter_id,
                display_name=f'{gpu_model} Pod {index:02d}',
                hourly_rate_usd=hourly_rate,
                market_status='draft' if mode == 'unlisted' else 'listed',
                is_visible=True,
                notes='Demo dataset instance for operator presentation.',
                created_by_user_id='demo-operator',
                created_at=now - timedelta(days=8, hours=index),
                updated_at=now - timedelta(hours=index),
            )
        )

    deployments = [
        _deployment_payload(devices[0], demo_instances[0], 'demo-deployment-01', 'customer-training-a'),
        _deployment_payload(devices[1], demo_instances[1], 'demo-deployment-02', 'customer-training-b'),
        _deployment_payload(devices[5], demo_instances[5], 'demo-deployment-03', 'render-cluster'),
    ]
    reservations = [
        _reservation_payload('demo-reservation-01', devices[10], demo_instances[10], 'pending', now - timedelta(hours=7)),
        _reservation_payload('demo-reservation-02', devices[11], demo_instances[11], 'pending', now - timedelta(hours=4)),
        _reservation_payload('demo-reservation-03', devices[3], demo_instances[3], 'accepted', now - timedelta(days=1)),
        _reservation_payload('demo-reservation-04', devices[12], demo_instances[12], 'expired', now - timedelta(days=2)),
    ]

    return DemoDataset(
        datacenters=datacenters,
        zones=zones,
        bridges=bridges,
        bridge_requests=bridge_requests,
        devices=devices,
        reservations=reservations,
        instances=[*local_instances, *demo_instances],
        contacts_by_datacenter_id=contacts_by_datacenter_id,
        deployments=deployments,
    )


def build_demo_deployment_detail(payload: dict[str, Any]) -> DeploymentDetail:
    specs = payload.get('specs') or {}
    cpu = specs.get('cpu') or {}
    gpu = specs.get('gpu') or {}
    memory = specs.get('memory') or {}
    storage = specs.get('storage') or {}
    networking = payload.get('networking') or {}
    return DeploymentDetail(
        id=str(payload.get('id')),
        name=str(_get_nested(payload, 'customer', 'deviceName') or payload.get('id')),
        status=OperatorStatus(value=str(_get_nested(payload, 'status', 'value') or 'active'), label=str(_get_nested(payload, 'status', 'label') or 'Active')),
        power_status=OperatorStatus(value=str(_get_nested(payload, 'powerStatus', 'value') or 'online'), label=str(_get_nested(payload, 'powerStatus', 'label') or 'Online')),
        location=payload.get('location'),
        ipv4=networking.get('ipv4'),
        ipv6=networking.get('ipv6'),
        mac=networking.get('mac'),
        gpu_model=gpu.get('model'),
        gpu_count=gpu.get('count'),
        cpu_model=cpu.get('model'),
        cpu_total_cores=cpu.get('totalCores'),
        cpu_total_threads=cpu.get('totalThreads'),
        memory_total_gb=memory.get('total'),
        storage_total_gb=storage.get('total'),
        contract_type=payload.get('contractType'),
        project_name=_get_nested(payload, 'project', 'name'),
        is_interruptible=bool(payload.get('isInterruptible')),
        scheduled_interruption_time=payload.get('scheduledInterruptionTime'),
        is_locked=bool(payload.get('isLocked')),
        available_operating_systems=[str(entry.get('name')) for entry in payload.get('availableOperatingSystems') or [] if entry.get('name')],
        storage_layouts=[entry for entry in payload.get('storageLayouts') or [] if isinstance(entry, dict)],
        default_disk_layouts=[entry for entry in payload.get('defaultDiskLayouts') or [] if isinstance(entry, dict)],
        ssh_keys=[str(entry) for entry in payload.get('sshKeys') or []],
        lifecycle_actions=[str(entry) for entry in payload.get('lifecycleActions') or []],
        tags=[str(entry) for entry in payload.get('tags') or []],
        operator_instance_id=None,
        operator_instance_name=None,
    )


def build_brokkr_deployment_detail(detail: Any) -> DeploymentDetail:
    return DeploymentDetail(
        id=detail.id,
        name=detail.name,
        status=OperatorStatus(value=detail.status.value, label=detail.status.label),
        power_status=OperatorStatus(value=detail.power_status.value, label=detail.power_status.label),
        location=detail.location,
        ipv4=detail.ipv4,
        ipv6=detail.ipv6,
        mac=detail.mac,
        gpu_model=detail.gpu_model,
        gpu_count=detail.gpu_count,
        cpu_model=detail.cpu_model,
        cpu_total_cores=detail.cpu_total_cores,
        cpu_total_threads=detail.cpu_total_threads,
        memory_total_gb=detail.memory_total_gb,
        storage_total_gb=detail.storage_total_gb,
        contract_type=detail.contract_type,
        project_name=detail.project_name,
        is_interruptible=detail.is_interruptible,
        scheduled_interruption_time=detail.scheduled_interruption_time,
        is_locked=detail.is_locked,
        available_operating_systems=detail.available_operating_systems,
        storage_layouts=detail.storage_layouts,
        default_disk_layouts=detail.default_disk_layouts,
        ssh_keys=detail.ssh_keys,
        lifecycle_actions=detail.lifecycle_actions,
        tags=detail.tags,
        operator_instance_id=None,
        operator_instance_name=None,
    )


def _datacenter(datacenter_id: str, name: str, region: str, facility: str, created_at: datetime) -> dict[str, Any]:
    return {
        'id': datacenter_id,
        'name': name,
        'region': region,
        'status': 'active',
        'facility': facility,
        'physicalAddress': facility,
        'shippingAddress': facility,
        'createdAt': created_at.isoformat(),
    }


def _contact(contact_id: str, name: str, email: str, role: str) -> dict[str, Any]:
    return {'id': contact_id, 'name': name, 'email': email, 'phone': None, 'role': role}


def _bridge(
    bridge_id: str,
    datacenter_name: str,
    datacenter_id: str,
    zone_name: str,
    zone_id: str,
    status: str,
) -> dict[str, Any]:
    return {
        'id': bridge_id,
        'name': f'{datacenter_name} bridge',
        'status': status,
        'type': 'private',
        'datacenter': {'id': datacenter_id, 'name': datacenter_name},
        'zone': {'id': zone_id, 'name': zone_name},
        'interfaces': [{'ip_addresses': [{'address': '10.0.0.1'}]}],
    }


def _bridge_request(
    request_id: str,
    datacenter_name: str,
    datacenter_id: str,
    zone_name: str,
    zone_id: str,
    status: str,
    created_at: datetime,
) -> dict[str, Any]:
    return {
        'id': request_id,
        'datacenter': {'id': datacenter_id, 'name': datacenter_name},
        'zone': {'id': zone_id, 'name': zone_name},
        'status': status,
        'createdAt': created_at.isoformat(),
        'data': {'bridgeType': 'private', 'bridgeCount': 1, 'networkType': 'public', 'prefixes': [{'type': 'private'}]},
    }


def _deployment_payload(
    device: dict[str, Any],
    instance: OperatorInstanceModel,
    deployment_id: str,
    project_name: str,
) -> dict[str, Any]:
    return {
        'id': deployment_id,
        'customer': {'deviceName': instance.display_name},
        'status': {'value': 'active', 'label': 'Active'},
        'powerStatus': {'value': 'online', 'label': 'Online'},
        'location': device.get('siteName'),
        'networking': {'ipv4': f'203.0.113.{len(deployment_id)}', 'ipv6': '2001:db8::1', 'mac': '00:16:3e:00:00:01'},
        'specs': device.get('specs') or {},
        'contractType': 'on_demand',
        'project': {'name': project_name},
        'isInterruptible': False,
        'scheduledInterruptionTime': None,
        'isLocked': False,
        'availableOperatingSystems': [{'name': 'Ubuntu Noble HPC'}, {'name': 'iPXE Custom'}],
        'storageLayouts': [],
        'defaultDiskLayouts': [],
        'sshKeys': ['ssh-ed25519 AAAA... demo@neocloud'],
        'lifecycleActions': ['reboot', 'power off'],
        'tags': ['gpu', 'demo'],
    }


def _reservation_payload(
    reservation_id: str,
    device: dict[str, Any],
    instance: OperatorInstanceModel,
    status: str,
    created_at: datetime,
) -> dict[str, Any]:
    accepted_at = created_at.isoformat() if status == 'accepted' else None
    expires_at = (created_at + timedelta(days=2)).isoformat() if status in {'pending', 'expired'} else None
    if status == 'expired':
        expires_at = (created_at - timedelta(hours=3)).isoformat()
    return {
        'id': reservation_id,
        'inviteeEmail': 'buyer@demo.ai',
        'inviterEmail': 'sales@neocloud.dev',
        'channel': 'DIRECT',
        'contractType': 'reserve',
        'billingFrequency': 'hourly',
        'buyerPrice': float(instance.hourly_rate_usd * Decimal('1.18')),
        'supplierPrice': float(instance.hourly_rate_usd),
        'margin': 18.0,
        'dateCreated': created_at.isoformat(),
        'dateExpires': expires_at,
        'dateAccepted': accepted_at,
        'deviceIds': [str(device.get('id'))],
        'listing': {'name': instance.display_name, 'specs': {'gpu': {'model': _get_nested(device, 'specs', 'gpu', 'model')}}},
    }
