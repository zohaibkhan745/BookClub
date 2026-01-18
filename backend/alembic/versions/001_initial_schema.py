"""Initial schema - users, books, borrow_records

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-01-18

This migration creates the core tables:
- users: User accounts (synced with Supabase auth)
- books: Book listings (refactored from old schema)
- borrow_records: Borrowing history and current loans
"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '001_initial_schema'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    Create initial database schema.
    
    Migration Strategy:
    1. Create new tables (users, borrow_records)
    2. Modify existing books table to new schema
    3. Migrate data from old columns to new structure
    4. Drop deprecated columns
    """
    
    # =============================================
    # CREATE USERS TABLE
    # =============================================
    op.create_table(
        'users',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('username', sa.String(50), unique=True, nullable=False),
        sa.Column('full_name', sa.String(255), nullable=False),
        sa.Column('email', sa.String(255), unique=True, nullable=False),
        sa.Column('password_hash', sa.String(255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )
    
    # Indexes for users table
    op.create_index('ix_users_username', 'users', ['username'])
    op.create_index('ix_users_email', 'users', ['email'])
    op.create_index('ix_users_email_username', 'users', ['email', 'username'])
    
    # =============================================
    # MODIFY BOOKS TABLE
    # =============================================
    # Note: This assumes the books table exists with the old schema
    # We need to handle both fresh installs and migrations
    
    # Check if this is a fresh install or migration
    connection = op.get_bind()
    inspector = sa.inspect(connection)
    tables = inspector.get_table_names()
    
    if 'books' in tables:
        # Migration path: modify existing table
        existing_columns = [col['name'] for col in inspector.get_columns('books')]
        
        # Add new columns if they don't exist
        if 'owner_id' not in existing_columns:
            op.add_column('books', sa.Column('owner_id', sa.String(36), nullable=True))
        
        if 'owner_full_name' not in existing_columns:
            op.add_column('books', sa.Column('owner_full_name', sa.String(255), nullable=True))
        
        if 'is_active' not in existing_columns:
            op.add_column('books', sa.Column('is_active', sa.Boolean(), server_default='true'))
        
        # Migrate data from old columns to new columns
        # Map user_id -> owner_id, listed_by -> owner_full_name, is_available -> is_active
        if 'user_id' in existing_columns and 'owner_id' in existing_columns:
            op.execute("UPDATE books SET owner_id = user_id WHERE owner_id IS NULL")
        
        if 'listed_by' in existing_columns and 'owner_full_name' in existing_columns:
            op.execute("UPDATE books SET owner_full_name = listed_by WHERE owner_full_name IS NULL")
        
        if 'is_available' in existing_columns and 'is_active' in existing_columns:
            op.execute("UPDATE books SET is_active = is_available")
        
        # Handle ID column type change (Integer -> UUID)
        # For existing data, we need to:
        # 1. Create new UUID column
        # 2. Generate UUIDs for existing rows
        # 3. Update foreign keys
        # 4. Drop old column and rename new
        
        # Check if id is integer
        id_column = next((col for col in inspector.get_columns('books') if col['name'] == 'id'), None)
        if id_column and 'INTEGER' in str(id_column['type']).upper():
            # Store old IDs for migration
            op.add_column('books', sa.Column('new_id', sa.String(36), nullable=True))
            op.execute("UPDATE books SET new_id = gen_random_uuid()::text")
            # We'll handle the ID swap after borrow_records creation
        
        # Drop deprecated columns (after data migration)
        deprecated_columns = ['is_borrowed', 'borrowed_by_user_id', 'borrowed_by_name']
        for col in deprecated_columns:
            if col in existing_columns:
                op.drop_column('books', col)
        
        # Create indexes
        try:
            op.create_index('ix_books_owner_id', 'books', ['owner_id'])
        except:
            pass  # Index may already exist
        
        try:
            op.create_index('ix_books_is_active', 'books', ['is_active'])
        except:
            pass
        
        # Add foreign key constraint
        try:
            op.create_foreign_key(
                'fk_books_owner_id',
                'books', 'users',
                ['owner_id'], ['id'],
                ondelete='SET NULL'
            )
        except:
            pass  # May fail if users table has no matching IDs yet
            
    else:
        # Fresh install: create new books table
        op.create_table(
            'books',
            sa.Column('id', sa.String(36), primary_key=True),
            sa.Column('title', sa.String(255), nullable=False),
            sa.Column('author', sa.String(255), nullable=False),
            sa.Column('category', sa.String(100), nullable=False),
            sa.Column('listing_type', sa.String(20), nullable=False, server_default='lend'),
            sa.Column('condition', sa.String(20), nullable=True, server_default='good'),
            sa.Column('description', sa.Text(), nullable=True),
            sa.Column('cover_image', sa.Text(), nullable=True),
            sa.Column('price', sa.String(50), nullable=True),
            sa.Column('whatsapp_number', sa.String(20), nullable=True),
            sa.Column('is_active', sa.Boolean(), server_default='true'),
            sa.Column('owner_id', sa.String(36), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
            sa.Column('owner_full_name', sa.String(255), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
            sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now()),
        )
        
        # Create indexes
        op.create_index('ix_books_id', 'books', ['id'])
        op.create_index('ix_books_title', 'books', ['title'])
        op.create_index('ix_books_author', 'books', ['author'])
        op.create_index('ix_books_category', 'books', ['category'])
        op.create_index('ix_books_owner_id', 'books', ['owner_id'])
        op.create_index('ix_books_is_active', 'books', ['is_active'])
        op.create_index('ix_books_active_category', 'books', ['is_active', 'category'])
        op.create_index('ix_books_owner_active', 'books', ['owner_id', 'is_active'])
    
    # =============================================
    # CREATE BORROW_RECORDS TABLE
    # =============================================
    op.create_table(
        'borrow_records',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('book_id', sa.String(36), sa.ForeignKey('books.id', ondelete='CASCADE'), nullable=False),
        sa.Column('borrower_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('borrowed_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('due_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('returned_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('status', sa.String(20), nullable=False, server_default='borrowed'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.func.now()),
    )
    
    # Indexes for borrow_records
    op.create_index('ix_borrow_records_book_id', 'borrow_records', ['book_id'])
    op.create_index('ix_borrow_records_borrower_id', 'borrow_records', ['borrower_id'])
    op.create_index('ix_borrow_records_status', 'borrow_records', ['status'])
    op.create_index('ix_borrow_records_active', 'borrow_records', ['book_id', 'returned_at'])
    op.create_index('ix_borrow_records_user_history', 'borrow_records', ['borrower_id', 'borrowed_at'])


def downgrade() -> None:
    """
    Revert to previous schema.
    
    Warning: This will lose borrow history data!
    """
    # Drop borrow_records table
    op.drop_table('borrow_records')
    
    # Restore books table columns
    connection = op.get_bind()
    inspector = sa.inspect(connection)
    
    if 'books' in inspector.get_table_names():
        existing_columns = [col['name'] for col in inspector.get_columns('books')]
        
        # Add back deprecated columns
        if 'is_borrowed' not in existing_columns:
            op.add_column('books', sa.Column('is_borrowed', sa.Boolean(), server_default='false'))
        if 'borrowed_by_user_id' not in existing_columns:
            op.add_column('books', sa.Column('borrowed_by_user_id', sa.String(36), nullable=True))
        if 'borrowed_by_name' not in existing_columns:
            op.add_column('books', sa.Column('borrowed_by_name', sa.String(255), nullable=True))
        
        # Restore old column names
        if 'user_id' not in existing_columns and 'owner_id' in existing_columns:
            op.add_column('books', sa.Column('user_id', sa.String(36), nullable=True))
            op.execute("UPDATE books SET user_id = owner_id")
        
        if 'listed_by' not in existing_columns and 'owner_full_name' in existing_columns:
            op.add_column('books', sa.Column('listed_by', sa.String(255), nullable=True))
            op.execute("UPDATE books SET listed_by = owner_full_name")
        
        if 'is_available' not in existing_columns and 'is_active' in existing_columns:
            op.add_column('books', sa.Column('is_available', sa.Boolean(), server_default='true'))
            op.execute("UPDATE books SET is_available = is_active")
        
        # Drop new columns
        new_columns = ['owner_id', 'owner_full_name', 'is_active']
        for col in new_columns:
            if col in existing_columns:
                try:
                    op.drop_column('books', col)
                except:
                    pass
    
    # Drop users table
    op.drop_table('users')
