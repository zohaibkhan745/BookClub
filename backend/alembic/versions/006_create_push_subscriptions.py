"""Create push_subscriptions table for iOS PWA and Android Web Push

Revision ID: 006_create_push_subscriptions
Revises: 005_cleanup_notification_indexes
Create Date: 2026-10-07

"""
from typing import Sequence, Union
from alembic import op

# revision identifiers
revision: str = '006_create_push_subscriptions'
down_revision: Union[str, None] = '005_cleanup_notification_indexes'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS push_subscriptions (
            id SERIAL PRIMARY KEY,
            user_id VARCHAR(36) NULL,
            endpoint TEXT NOT NULL UNIQUE,
            p256dh TEXT NOT NULL,
            auth TEXT NOT NULL,
            user_agent VARCHAR(500) NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
    """)

    op.execute("CREATE INDEX IF NOT EXISTS ix_push_subscriptions_endpoint ON push_subscriptions (endpoint)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_push_subscriptions_user_id ON push_subscriptions (user_id)")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS push_subscriptions CASCADE")
