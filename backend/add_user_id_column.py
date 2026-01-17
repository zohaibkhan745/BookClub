"""Script to add user_id column to books table."""
from app.db.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    # Add user_id column if it doesn't exist
    conn.execute(text('ALTER TABLE books ADD COLUMN IF NOT EXISTS user_id VARCHAR(255)'))
    conn.commit()
    print('user_id column added successfully!')
