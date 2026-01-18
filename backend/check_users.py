"""Check users in the database"""
from app.db.database import engine
from sqlalchemy import text

def check_users():
    with engine.connect() as conn:
        result = conn.execute(text("SELECT id, username, full_name, email FROM users"))
        rows = result.fetchall()
        print(f"Total users: {len(rows)}")
        print("Users in database:")
        for row in rows:
            print(f"  ID: {row[0][:8]}...")
            print(f"  Username: {row[1]}")
            print(f"  Full Name: {row[2]}")
            print(f"  Email: {row[3]}")
            print()

if __name__ == "__main__":
    check_users()
