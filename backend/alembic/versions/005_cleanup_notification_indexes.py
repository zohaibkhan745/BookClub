"""Cleanup redundant notification indexes

Revision ID: 005_cleanup_notification_indexes
Revises: 004_create_notifications
Create Date: 2026-10-07

Removes:
- ix_notifications_created_at_desc (redundant with bidirectional ix_notifications_created_at)
- ix_user_notification_reads_user_id (redundant with leading column of uq_user_notification_read)
"""
from typing import Sequence, Union
from alembic import op

# revision identifiers
revision: str = '005_cleanup_notification_indexes'
down_revision: Union[str, None] = '004_create_notifications'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Drop redundant reverse index (PostgreSQL B-Tree indexes can be scanned backwards identically)
    op.execute("DROP INDEX IF EXISTS ix_notifications_created_at_desc")

    # Drop standalone user_id index (already covered by leading column of uq_user_notification_read)
    op.execute("DROP INDEX IF EXISTS ix_user_notification_reads_user_id")


def downgrade() -> None:
    op.execute("CREATE INDEX IF NOT EXISTS ix_notifications_created_at_desc ON notifications (created_at DESC)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_user_notification_reads_user_id ON user_notification_reads (user_id)")
