"""
Slug generation utility for SEO-friendly, unique book URLs.
"""
import re
import unicodedata
from typing import Optional
from sqlalchemy.orm import Session


def slugify(text: str) -> str:
    """
    Convert a text string into a clean, URL-safe kebab-case slug.
    
    Examples:
        "Deep Work" -> "deep-work"
        "The 7 Habits of Highly Effective People!" -> "the-7-habits-of-highly-effective-people"
        "Saladin: The Life, The Legend" -> "saladin-the-life-the-legend"
    """
    if not text:
        return "book"
    
    # Normalize unicode characters (e.g. accented letters)
    text = unicodedata.normalize("NFKD", text)
    text = text.encode("ascii", "ignore").decode("ascii")
    
    # Lowercase and trim
    text = text.lower().strip()
    
    # Replace non-alphanumeric characters with hyphens
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[-\s]+", "-", text)
    
    # Strip leading and trailing hyphens
    slug = text.strip("-")
    
    # Truncate to reasonable max length (e.g. 100 chars) without cutting in the middle of a word if possible
    if len(slug) > 100:
        slug = slug[:100].rsplit("-", 1)[0]
    
    return slug or "book"


def generate_unique_slug(db: Session, title: str, exclude_book_id: Optional[int] = None) -> str:
    """
    Generate a unique URL slug for a book based on its title.
    If the slug already exists, automatically increments -2, -3, etc.
    
    Args:
        db: Database session
        title: Book title
        exclude_book_id: Book ID to exclude from uniqueness check (for updates)
        
    Returns:
        A unique slug string, e.g. "deep-work" or "deep-work-2"
    """
    from app.models.book import Book
    
    base_slug = slugify(title)
    candidate = base_slug
    counter = 2
    
    while True:
        query = db.query(Book.id).filter(Book.slug == candidate)
        if exclude_book_id is not None:
            query = query.filter(Book.id != exclude_book_id)
        
        exists = query.first()
        if not exists:
            return candidate
        
        candidate = f"{base_slug}-{counter}"
        counter += 1
