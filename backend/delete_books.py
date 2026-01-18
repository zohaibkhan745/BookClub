"""Script to delete all books from the database"""
from app.db.database import engine
from sqlalchemy import text

def delete_all_books():
    with engine.connect() as conn:
        # First check the current count
        result = conn.execute(text("SELECT COUNT(*) FROM books"))
        count_before = result.fetchone()[0]
        print(f"Books before deletion: {count_before}")
        
        # Delete all books
        conn.execute(text("DELETE FROM books"))
        conn.commit()
        
        # Check again
        result = conn.execute(text("SELECT COUNT(*) FROM books"))
        count_after = result.fetchone()[0]
        print(f"Books after deletion: {count_after}")
        print("All books deleted successfully!")

if __name__ == "__main__":
    delete_all_books()
