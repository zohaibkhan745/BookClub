"""
Migration script to add borrowing-related columns to the books table.
Run: python -m app.db.migrations.add_borrowing_columns
"""
from sqlalchemy import text, inspect
from app.db.database import engine

def run_migration():
    """Add borrowing columns to the books table if they don't exist."""
    
    print("Connecting to database...")
    
    # Check existing columns using SQLAlchemy inspector
    inspector = inspect(engine)
    existing_columns = [col['name'] for col in inspector.get_columns('books')]
    print(f"Existing columns: {existing_columns}")
    
    columns_to_add = []
    
    if 'is_borrowed' not in existing_columns:
        columns_to_add.append(("is_borrowed", "ALTER TABLE books ADD COLUMN is_borrowed BOOLEAN DEFAULT FALSE"))
    
    if 'borrowed_by_user_id' not in existing_columns:
        columns_to_add.append(("borrowed_by_user_id", "ALTER TABLE books ADD COLUMN borrowed_by_user_id VARCHAR(255)"))
    
    if 'borrowed_by_name' not in existing_columns:
        columns_to_add.append(("borrowed_by_name", "ALTER TABLE books ADD COLUMN borrowed_by_name VARCHAR(255)"))
    
    if not columns_to_add:
        print("Migration: All borrowing columns already exist. Nothing to do.")
        return
    
    print(f"Columns to add: {[c[0] for c in columns_to_add]}")
    
    with engine.connect() as conn:
        for col_name, query in columns_to_add:
            print(f"Adding column: {col_name}...")
            conn.execute(text(query))
            print(f"  Added {col_name}")
        conn.commit()
        print("Committed changes.")
    
    print("Migration completed: Added borrowing columns to books table")

if __name__ == "__main__":
    run_migration()
