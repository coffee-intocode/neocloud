"""SQLAlchemy models for the operator domain."""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from uuid import uuid4

from sqlalchemy import Boolean, DateTime, ForeignKey, Numeric, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from ..database import Base


class OperatorInstanceModel(Base):
    """Commercial instance backed by a Brokkr device."""

    __tablename__ = 'operator_instances'
    __table_args__ = (UniqueConstraint('brokkr_device_id', name='uq_operator_instances_brokkr_device_id'),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    brokkr_device_id: Mapped[str] = mapped_column(String(255), nullable=False)
    brokkr_datacenter_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    display_name: Mapped[str] = mapped_column(String(255), nullable=False)
    hourly_rate_usd: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    market_status: Mapped[str] = mapped_column(String(32), nullable=False, default='draft')
    is_visible: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by_user_id: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )


class InstanceRevenueSnapshotModel(Base):
    """Persisted revenue snapshot for a commercial instance."""

    __tablename__ = 'instance_revenue_snapshots'

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    operator_instance_id: Mapped[str] = mapped_column(
        ForeignKey('operator_instances.id', ondelete='CASCADE'),
        nullable=False,
    )
    current_hourly_revenue_usd: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    idle_hourly_opportunity_usd: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    attention_state: Mapped[str] = mapped_column(String(32), nullable=False)
    captured_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
