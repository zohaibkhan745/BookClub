"""Add pg_trgm extension and search indexes for faster text search

Revision ID: 003_add_search_indexes
Revises: 002_thumb_url
Create Date: 2026-02-01

This migration adds:
1. pg_trgm extension for trigram-based text matching
2. GIN indexes on title and author for fast ILIKE searches
3. Combined search performance improvement: O(n) -> O(log n)
"""
from typing import Sequence, Union
from alembic import op

# revision identifiers
revision: str = '003_add_search_indexes'
down_revision: Union[str, None] = '002_thumb_url'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add pg_trgm extension and search indexes."""
    # Enable pg_trgm extension for trigram matching
    # This is safe to run multiple times (CREATE EXTENSION IF NOT EXISTS)
    op.execute('CREATE EXTENSION IF NOT EXISTS pg_trgm')
    
    # Create GIN indexes for fast ILIKE searches
    # These indexes support pattern matching with wildcards
    op.execute('''
        CREATE INDEX IF NOT EXISTS idx_books_title_trgm 
        ON books USING GIN (title gin_trgm_ops)
    ''')
    
    op.execute('''
        CREATE INDEX IF NOT EXISTS idx_books_author_trgm 
        ON books USING GIN (author gin_trgm_ops)
    ''')
    
    # Add a partial index for active borrow records (frequently queried)
    op.execute('''
        CREATE INDEX IF NOT EXISTS idx_borrow_records_pending
        ON borrow_records (book_id)
        WHERE status = 'pending'
    ''')


def downgrade() -> None:
    """Remove search indexes (extension kept for safety)."""
    op.execute('DROP INDEX IF EXISTS idx_borrow_records_pending')
    op.execute('DROP INDEX IF EXISTS idx_books_author_trgm')
    op.execute('DROP INDEX IF EXISTS idx_books_title_trgm')
    # Note: Not dropping pg_trgm extension as other parts of DB may use it
