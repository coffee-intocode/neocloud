"""Brokkr API proxy routes."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query

from ..brokkr import (
    ActiveOrganization,
    ApiErrorResponse,
    BrokkrClient,
    DeploymentDetail,
    DeploymentSummary,
    InventoryFilters,
    InventoryItemDetail,
    InventoryItemSummary,
    InventoryMetadata,
    OverviewResponse,
    PaginatedResponse,
    SessionUser,
)
from ..auth.dependencies import CurrentUser
from ..config import Settings, get_settings

router = APIRouter(prefix='/brokkr', tags=['brokkr'])


def get_brokkr_client(settings: Settings = Depends(get_settings)) -> BrokkrClient:
    return BrokkrClient(settings)


@router.get('/me', response_model=SessionUser | None, responses={401: {'model': ApiErrorResponse}})
async def get_current_user(
    _current_user: CurrentUser,
    client: BrokkrClient = Depends(get_brokkr_client),
) -> SessionUser | None:
    user, _source = await client.get_current_user()
    return user


@router.get('/organization', response_model=ActiveOrganization, responses={401: {'model': ApiErrorResponse}})
async def get_active_organization(
    _current_user: CurrentUser,
    client: BrokkrClient = Depends(get_brokkr_client),
) -> ActiveOrganization:
    return await client.get_active_organization()


@router.get('/overview', response_model=OverviewResponse, responses={401: {'model': ApiErrorResponse}})
async def get_overview(
    _current_user: CurrentUser,
    client: BrokkrClient = Depends(get_brokkr_client),
) -> OverviewResponse:
    return await client.get_overview()


@router.get('/inventory/metadata', response_model=InventoryMetadata, responses={401: {'model': ApiErrorResponse}})
async def get_inventory_metadata(
    _current_user: CurrentUser,
    client: BrokkrClient = Depends(get_brokkr_client),
) -> InventoryMetadata:
    return await client.get_inventory_metadata()


@router.get('/inventory', response_model=PaginatedResponse[InventoryItemSummary], responses={401: {'model': ApiErrorResponse}})
async def list_inventory(
    _current_user: CurrentUser,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=24, alias='pageSize', ge=1, le=100),
    search: str = Query(default=''),
    region: str = Query(default=''),
    availability: str = Query(default=''),
    client: BrokkrClient = Depends(get_brokkr_client),
) -> PaginatedResponse[InventoryItemSummary]:
    return await client.list_inventory(
        page=page,
        page_size=page_size,
        filters=InventoryFilters(search=search, region=region, availability=availability),
    )


@router.get('/inventory/{inventory_id}', response_model=InventoryItemDetail, responses={401: {'model': ApiErrorResponse}})
async def get_inventory_item(
    _current_user: CurrentUser,
    inventory_id: str,
    client: BrokkrClient = Depends(get_brokkr_client),
) -> InventoryItemDetail:
    return await client.get_inventory_item(inventory_id)


@router.get('/deployments', response_model=PaginatedResponse[DeploymentSummary], responses={401: {'model': ApiErrorResponse}})
async def list_deployments(
    _current_user: CurrentUser,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, alias='pageSize', ge=1, le=100),
    search: str = Query(default=''),
    client: BrokkrClient = Depends(get_brokkr_client),
) -> PaginatedResponse[DeploymentSummary]:
    return await client.list_deployments(page=page, page_size=page_size, search=search)


@router.get('/deployments/{deployment_id}', response_model=DeploymentDetail, responses={401: {'model': ApiErrorResponse}})
async def get_deployment(
    _current_user: CurrentUser,
    deployment_id: str,
    client: BrokkrClient = Depends(get_brokkr_client),
) -> DeploymentDetail:
    return await client.get_deployment(deployment_id)
