"""Create notifications and user_notification_reads tables

Revision ID: 004_create_notifications
Revises: 003_add_search_indexes
Create Date: 2026-10-07

"""
from typing import Sequence, Union
from alembic import op

# revision identifiers
revision: str = '004_create_notifications'
down_revision: Union[str, None] = '003_add_search_indexes'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create notifications table
    op.execute("""
        CREATE TABLE IF NOT EXISTS notifications (
            id SERIAL PRIMARY KEY,
            user_id VARCHAR(36) NULL,
            actor_id VARCHAR(36) NULL,
            actor_name VARCHAR(255) NULL,
            type VARCHAR(50) NOT NULL DEFAULT 'BOOK_UPLOADED',
            title VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
            book_slug VARCHAR(255) NULL,
            book_cover TEXT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )
    """)

    op.execute("CREATE INDEX IF NOT EXISTS ix_notifications_user_id ON notifications (user_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_notifications_actor_id ON notifications (actor_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_notifications_created_at ON notifications (created_at)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_notifications_created_at_desc ON notifications (created_at DESC)")

    # 2. Create user_notification_reads table
    op.execute("""
        CREATE TABLE IF NOT EXISTS user_notification_reads (
            id SERIAL PRIMARY KEY,
            user_id VARCHAR(36) NOT NULL,
            notification_id INTEGER NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
            read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            CONSTRAINT uq_user_notification_read UNIQUE (user_id, notification_id)
        )
    """)

    op.execute("CREATE INDEX IF NOT EXISTS ix_user_notification_reads_user_id ON user_notification_reads (user_id)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_user_notification_reads_notif_id ON user_notification_reads (notification_id)")

    # 3. Seed recent books into notifications table so users see recent activity immediately
    op.execute("""
        INSERT INTO notifications (actor_id, actor_name, type, title, message, book_id, book_slug, book_cover, created_at)
        SELECT 
            b.user_id,
            COALESCE(b.listed_by, 'A member'),
            'BOOK_UPLOADED',
            'New Book Uploaded',
            CONCAT(COALESCE(b.listed_by, 'A member'), ' uploaded ''', b.title, ''' by ', b.author, '.'),
            b.id,
            b.slug,
            COALESCE(b.cover_image_thumb_url, b.cover_image),
            b.created_at
        FROM books b
        WHERE NOT EXISTS (
            SELECT 1 FROM notifications n WHERE n.book_id = b.id
        )
        ORDER BY b.created_at DESC
        LIMIT 10
    """)


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS user_notification_reads CASCADE")
    op.execute("DROP TABLE IF EXISTS notifications CASCADE")
