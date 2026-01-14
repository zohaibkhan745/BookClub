"""
Seed script to populate the database with sample books.
Run: python -m app.db.seed
"""
from app.db.database import SessionLocal, engine, Base
from app.models.book import Book

# Sample book data
SEED_BOOKS = [
    {
        "title": "The Great Gatsby",
        "author": "F. Scott Fitzgerald",
        "category": "Classic Fiction",
        "listing_type": "lend",
        "condition": "good",
        "description": "A 1925 novel set in the Jazz Age on Long Island. A classic exploration of the American Dream.",
        "cover_image": "https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=800",
    },
    {
        "title": "1984",
        "author": "George Orwell",
        "category": "Dystopian Fiction",
        "listing_type": "lend",
        "condition": "like-new",
        "description": "A dystopian novel examining the role of truth and facts within politics.",
        "cover_image": "https://images.unsplash.com/photo-1419640303358-44f0d27f48e7?w=800",
    },
    {
        "title": "Pride and Prejudice",
        "author": "Jane Austen",
        "category": "Romance",
        "listing_type": "lend",
        "condition": "good",
        "description": "A novel of manners following Elizabeth Bennet's character development.",
        "cover_image": "https://images.unsplash.com/photo-1556566952-11eff3d06ed4?w=800",
    },
    {
        "title": "To Kill a Mockingbird",
        "author": "Harper Lee",
        "category": "Fiction",
        "listing_type": "lend",
        "condition": "good",
        "description": "A novel about racial injustice in the American South.",
        "cover_image": "https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=800",
    },
    {
        "title": "Atomic Habits",
        "author": "James Clear",
        "category": "Self-Help",
        "listing_type": "sell",
        "condition": "new",
        "price": "1500",
        "description": "A proven framework for improving every day through tiny changes.",
        "cover_image": "https://images.unsplash.com/photo-1618365908648-e71bd5716cba?w=800",
    },
    {
        "title": "Sapiens",
        "author": "Yuval Noah Harari",
        "category": "Philosophy",
        "listing_type": "lend",
        "condition": "good",
        "description": "A brief history of humankind from the Stone Age to the present.",
        "cover_image": "https://images.unsplash.com/photo-1643050079091-1d4a51e07ba0?w=800",
    },
    {
        "title": "Clean Code",
        "author": "Robert C. Martin",
        "category": "Technology",
        "listing_type": "lend",
        "condition": "like-new",
        "description": "A handbook of agile software craftsmanship.",
        "cover_image": "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=800",
    },
    {
        "title": "The Alchemist",
        "author": "Paulo Coelho",
        "category": "Fiction",
        "listing_type": "borrow",
        "condition": "good",
        "description": "A philosophical novel about following your dreams.",
        "cover_image": "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800",
    },
    {
        "title": "Thinking, Fast and Slow",
        "author": "Daniel Kahneman",
        "category": "Psychology",
        "listing_type": "lend",
        "condition": "good",
        "description": "Explores the two systems that drive the way we think.",
        "cover_image": "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=800",
    },
    {
        "title": "The Lean Startup",
        "author": "Eric Ries",
        "category": "Business",
        "listing_type": "sell",
        "condition": "like-new",
        "price": "1200",
        "description": "How today's entrepreneurs use continuous innovation.",
        "cover_image": "https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=800",
    },
    {
        "title": "Dune",
        "author": "Frank Herbert",
        "category": "Science Fiction",
        "listing_type": "lend",
        "condition": "good",
        "description": "An epic science fiction novel set in the distant future.",
        "cover_image": "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800",
    },
    {
        "title": "The Psychology of Money",
        "author": "Morgan Housel",
        "category": "Finance",
        "listing_type": "lend",
        "condition": "new",
        "description": "Timeless lessons on wealth, greed, and happiness.",
        "cover_image": "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800",
    },
]


def seed_database():
    """Seed the database with sample books."""
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Check if data already exists
        existing = db.query(Book).count()
        if existing > 0:
            print(f"Database already has {existing} books. Skipping seed.")
            return
        
        # Insert seed data
        for book_data in SEED_BOOKS:
            book = Book(**book_data, is_available=True)
            db.add(book)
        
        db.commit()
        print(f"Successfully seeded {len(SEED_BOOKS)} books!")
        
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
