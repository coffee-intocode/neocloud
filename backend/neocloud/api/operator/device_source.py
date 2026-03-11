"""Synthetic operator device helpers for inventory-backed demos."""

from __future__ import annotations

from typing import Any


ACTIVE_STOCK_STATUSES = {'ondemand', 'reserve', 'preorder'}


def inventory_items_to_mock_devices(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [_inventory_item_to_mock_device(item) for item in items]


def _inventory_item_to_mock_device(item: dict[str, Any]) -> dict[str, Any]:
    stock_status = str(item.get('stockStatus') or '').lower()
    listing = item.get('listing') if isinstance(item.get('listing'), dict) else {}

    if not listing:
        listing = {
            'isActive': stock_status in ACTIVE_STOCK_STATUSES,
            'isInterruptibleOnly': bool(item.get('isInterruptibleDeployment')),
        }

    return {
        'id': item.get('id'),
        'name': item.get('name'),
        'role': item.get('role'),
        'siteId': None,
        'siteName': item.get('location'),
        'zoneName': None,
        'location': item.get('location'),
        'status': {
            'value': 'available' if listing.get('isActive') else 'unavailable',
            'label': _availability_label(stock_status),
        },
        'powerStatus': {'value': 'online', 'label': 'Online'},
        'specs': item.get('specs') or {},
        'listing': listing,
        'customer': {'reservationType': None},
        'reservationInvite': item.get('activeReservationInvite'),
        'deployment': None,
        'ecoMode': False,
        'isTeeCapable': bool(item.get('isTeeCapable')),
        'mockSource': 'inventory',
    }


def _availability_label(stock_status: str) -> str:
    return {
        'ondemand': 'On demand',
        'reserve': 'Reserve',
        'preorder': 'Preorder',
    }.get(stock_status, 'Available')
