"""create operator instance tables"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa

revision = '20260311_1100'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'operator_instances',
        sa.Column('id', sa.String(length=36), primary_key=True, nullable=False),
        sa.Column('brokkr_device_id', sa.String(length=255), nullable=False),
        sa.Column('brokkr_datacenter_id', sa.String(length=255), nullable=True),
        sa.Column('display_name', sa.String(length=255), nullable=False),
        sa.Column('hourly_rate_usd', sa.Numeric(10, 2), nullable=False),
        sa.Column('market_status', sa.String(length=32), nullable=False),
        sa.Column('is_visible', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_by_user_id', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.UniqueConstraint('brokkr_device_id', name='uq_operator_instances_brokkr_device_id'),
    )
    op.create_table(
        'instance_revenue_snapshots',
        sa.Column('id', sa.String(length=36), primary_key=True, nullable=False),
        sa.Column('operator_instance_id', sa.String(length=36), nullable=False),
        sa.Column('current_hourly_revenue_usd', sa.Numeric(10, 2), nullable=False),
        sa.Column('idle_hourly_opportunity_usd', sa.Numeric(10, 2), nullable=False),
        sa.Column('attention_state', sa.String(length=32), nullable=False),
        sa.Column('captured_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(
            ['operator_instance_id'],
            ['operator_instances.id'],
            ondelete='CASCADE',
        ),
    )


def downgrade() -> None:
    op.drop_table('instance_revenue_snapshots')
    op.drop_table('operator_instances')
