"""Add cover_image_thumb_url column for optimized thumbnail images

Revision ID: 002_thumb_url
Revises: 001_initial_schema
Create Date: 2026-02-01

This migration adds a new column to store thumbnail URLs for book covers.
Thumbnails are ~250px wide WebP images stored in Supabase Storage for fast
loading on listing pages (Home, Browse, Search).
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '002_thumb_url'
down_revision: Union[str, None] = '001_initial_schema'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add cover_image_thumb_url column to books table."""
    op.add_column(
        'books',
        sa.Column('cover_image_thumb_url', sa.Text(), nullable=True)
    )


def downgrade() -> None:
    """Remove cover_image_thumb_url column from books table."""
    op.drop_column('books', 'cover_image_thumb_url')
