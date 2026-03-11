"""Operator API routes."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth.dependencies import CurrentUser
from ..brokkr import BrokkrClient
from ..config import Settings, get_settings
from ..database import get_db_session
from ..operator.schemas import (
    CreateOperatorInstanceInput,
    DatacenterDetail,
    DatacenterPortfolioRow,
    DeviceRow,
    DeploymentDetail,
    DeploymentRow,
    NetworkSummary,
    OperatorDashboard,
    OperatorInstance,
    ReservationPipelineRow,
    UpdateOperatorInstanceInput,
)
from ..operator.service import OperatorService

router = APIRouter(prefix='/operator', tags=['operator'])


def get_brokkr_client(settings: Settings = Depends(get_settings)) -> BrokkrClient:
    return BrokkrClient(settings)


def get_operator_service(
    session: AsyncSession = Depends(get_db_session),
    brokkr_client: BrokkrClient = Depends(get_brokkr_client),
) -> OperatorService:
    return OperatorService(session=session, brokkr_client=brokkr_client)


@router.get('/dashboard', response_model=OperatorDashboard)
async def get_dashboard(
    _current_user: CurrentUser,
    service: OperatorService = Depends(get_operator_service),
) -> OperatorDashboard:
    return await service.get_dashboard()


@router.get('/datacenters', response_model=list[DatacenterPortfolioRow])
async def list_datacenters(
    _current_user: CurrentUser,
    service: OperatorService = Depends(get_operator_service),
) -> list[DatacenterPortfolioRow]:
    return await service.list_datacenters()


@router.get('/datacenters/{datacenter_id}', response_model=DatacenterDetail)
async def get_datacenter_detail(
    _current_user: CurrentUser,
    datacenter_id: str,
    service: OperatorService = Depends(get_operator_service),
) -> DatacenterDetail:
    return await service.get_datacenter_detail(datacenter_id)


@router.get('/network', response_model=NetworkSummary)
async def get_network_summary(
    _current_user: CurrentUser,
    service: OperatorService = Depends(get_operator_service),
) -> NetworkSummary:
    return await service.get_network_summary()


@router.get('/devices', response_model=list[DeviceRow])
async def list_devices(
    _current_user: CurrentUser,
    service: OperatorService = Depends(get_operator_service),
) -> list[DeviceRow]:
    return await service.list_devices()


@router.get('/instances', response_model=list[OperatorInstance])
async def list_instances(
    _current_user: CurrentUser,
    service: OperatorService = Depends(get_operator_service),
) -> list[OperatorInstance]:
    return await service.list_instances()


@router.post('/instances', response_model=OperatorInstance, status_code=201)
async def create_instance(
    current_user: CurrentUser,
    payload: CreateOperatorInstanceInput,
    service: OperatorService = Depends(get_operator_service),
) -> OperatorInstance:
    return await service.create_instance(payload=payload, current_user=current_user)


@router.get('/instances/{instance_id}', response_model=OperatorInstance)
async def get_instance(
    _current_user: CurrentUser,
    instance_id: str,
    service: OperatorService = Depends(get_operator_service),
) -> OperatorInstance:
    return await service.get_instance(instance_id)


@router.patch('/instances/{instance_id}', response_model=OperatorInstance)
async def update_instance(
    _current_user: CurrentUser,
    instance_id: str,
    payload: UpdateOperatorInstanceInput,
    service: OperatorService = Depends(get_operator_service),
) -> OperatorInstance:
    return await service.update_instance(instance_id, payload)


@router.get('/reservations', response_model=list[ReservationPipelineRow])
async def list_reservations(
    _current_user: CurrentUser,
    service: OperatorService = Depends(get_operator_service),
) -> list[ReservationPipelineRow]:
    return await service.list_reservations()


@router.get('/deployments', response_model=list[DeploymentRow])
async def list_deployments(
    _current_user: CurrentUser,
    service: OperatorService = Depends(get_operator_service),
) -> list[DeploymentRow]:
    return await service.list_deployments()


@router.get('/deployments/{deployment_id}', response_model=DeploymentDetail)
async def get_deployment_detail(
    _current_user: CurrentUser,
    deployment_id: str,
    service: OperatorService = Depends(get_operator_service),
) -> DeploymentDetail:
    return await service.get_deployment_detail(deployment_id)
