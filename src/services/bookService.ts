import type { Book, BookPreview, BookUploadFormData } from '../types';
import { booksData, trendingBooks, newArrivals, popularThisWeek } from '../data';

/** Simulated network delay for realistic async behavior */
const SIMULATED_DELAY_MS = 100;

/** Wraps data in a Promise with simulated delay (mimics API call) */
function simulateAsync<T>(data: T): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), SIMULATED_DELAY_MS);
  });
}

/** Fetches all homepage book sections in a single call */
export async function getAllBookSections(): Promise<{
  trending: BookPreview[];
  newArrivals: BookPreview[];
  popular: BookPreview[];
}> {
  return simulateAsync({
    trending: trendingBooks,
    newArrivals: newArrivals,
    popular: popularThisWeek,
  });
}

/** Fetches a book by ID. Returns null if not found. */
export async function getBookById(id: number): Promise<Book | null> {
  const book = booksData[id] ?? null;
  return simulateAsync(book);
}

/** Creates a new book listing. Returns the created book with generated ID. */
export async function createBook(formData: BookUploadFormData): Promise<Book> {
  // Generate a new ID (in real app, this would come from backend)
  const newId = Math.max(...Object.keys(booksData).map(Number)) + 1;

  const newBook: Book = {
    id: newId,
    title: formData.title,
    author: formData.author,
    genre: formData.category || 'Uncategorized',
    image: formData.images[0] || '',
    description: formData.description,
    year: new Date().getFullYear().toString(),
    pages: 0,
    language: 'English',
    rating: 0,
  };

  // In a real app, this would POST to an API
  // For now, we just simulate success
  return simulateAsync(newBook);
}
