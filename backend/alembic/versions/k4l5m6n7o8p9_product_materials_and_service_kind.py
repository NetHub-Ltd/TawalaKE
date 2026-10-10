"""product_materials table for service→product recipe bindings.

Revision ID: k4l5m6n7o8p9
Revises: j3k4l5m6n7o8
Create Date: 2026-10-09

Additive only. item_type already exists on products (default PRODUCT).
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "k4l5m6n7o8p9"
down_revision: Union[str, Sequence[str], None] = "j3k4l5m6n7o8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "product_materials",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("business_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("service_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("material_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("quantity", sa.Float(), nullable=False, server_default="1.0"),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["business_id"], ["businesses.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["service_id"], ["products.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["material_id"], ["products.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("service_id", "material_id", name="uq_product_materials_service_material"),
    )
    op.create_index("ix_product_materials_organization_id", "product_materials", ["organization_id"])
    op.create_index("ix_product_materials_business_id", "product_materials", ["business_id"])
    op.create_index("ix_product_materials_service_id", "product_materials", ["service_id"])
    op.create_index("ix_product_materials_material_id", "product_materials", ["material_id"])

    # Ensure services never track self-stock (idempotent)
    op.execute(
        """
        UPDATE products
        SET track_stock = false
        WHERE item_type = 'SERVICE' AND track_stock = true
        """
    )


def downgrade() -> None:
    op.drop_index("ix_product_materials_material_id", table_name="product_materials")
    op.drop_index("ix_product_materials_service_id", table_name="product_materials")
    op.drop_index("ix_product_materials_business_id", table_name="product_materials")
    op.drop_index("ix_product_materials_organization_id", table_name="product_materials")
    op.drop_table("product_materials")
