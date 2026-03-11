"""Persistence helpers for operator instances."""

from __future__ import annotations

from collections.abc import Sequence

from sqlalchemy import Select, desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from .models import InstanceRevenueSnapshotModel, OperatorInstanceModel


class OperatorInstanceRepository:
    """Data access for operator instances and revenue snapshots."""

    def __init__(self, session: AsyncSession):
        self._session = session

    async def list_instances(self) -> Sequence[OperatorInstanceModel]:
        statement: Select[tuple[OperatorInstanceModel]] = select(OperatorInstanceModel).order_by(
            OperatorInstanceModel.created_at.desc()
        )
        result = await self._session.execute(statement)
        return result.scalars().all()

    async def get_instance(self, instance_id: str) -> OperatorInstanceModel | None:
        result = await self._session.execute(
            select(OperatorInstanceModel).where(OperatorInstanceModel.id == instance_id)
        )
        return result.scalar_one_or_none()

    async def get_instance_by_device_id(self, brokkr_device_id: str) -> OperatorInstanceModel | None:
        result = await self._session.execute(
            select(OperatorInstanceModel).where(OperatorInstanceModel.brokkr_device_id == brokkr_device_id)
        )
        return result.scalar_one_or_none()

    async def create_instance(self, instance: OperatorInstanceModel) -> OperatorInstanceModel:
        self._session.add(instance)
        await self._session.flush()
        await self._session.refresh(instance)
        return instance

    async def save(self, instance: OperatorInstanceModel) -> OperatorInstanceModel:
        self._session.add(instance)
        await self._session.flush()
        await self._session.refresh(instance)
        return instance

    async def add_snapshot(self, snapshot: InstanceRevenueSnapshotModel) -> InstanceRevenueSnapshotModel:
        self._session.add(snapshot)
        await self._session.flush()
        await self._session.refresh(snapshot)
        return snapshot

    async def latest_snapshots(self) -> dict[str, InstanceRevenueSnapshotModel]:
        subquery = (
            select(
                InstanceRevenueSnapshotModel.operator_instance_id,
                InstanceRevenueSnapshotModel.id,
            )
            .order_by(
                InstanceRevenueSnapshotModel.operator_instance_id,
                desc(InstanceRevenueSnapshotModel.captured_at),
            )
            .distinct(InstanceRevenueSnapshotModel.operator_instance_id)
            .subquery()
        )

        result = await self._session.execute(
            select(InstanceRevenueSnapshotModel).join(
                subquery,
                InstanceRevenueSnapshotModel.id == subquery.c.id,
            )
        )
        snapshots = result.scalars().all()
        return {snapshot.operator_instance_id: snapshot for snapshot in snapshots}
