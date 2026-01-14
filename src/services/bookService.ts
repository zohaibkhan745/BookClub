import type {
  Book,
  BookPreview,
  BookUploadFormData,
  ApiError,
  BorrowRequestData,
  BorrowRequestResponse,
  JoinClubData,
  JoinClubResponse,
} from '../types';
import { booksData, trendingBooks, newArrivals, popularThisWeek } from '../data';

// ============================================
// Fake API Configuration
// ============================================

/** Simulated network delay range (ms) */
const MIN_DELAY_MS = 200;
const MAX_DELAY_MS = 800;

/** Simulated error rate (0 to 1). Set to 0 in production. */
const ERROR_RATE = 0.05;

/** In-memory store for borrow requests (simulates database) */
const borrowRequests: Map<string, BorrowRequestResponse> = new Map();

/** In-memory store for club members (simulates database) */
const clubMembers: Map<string, JoinClubResponse> = new Map();

// ============================================
// API Simulation Helpers
// ============================================

/** Returns random delay between MIN and MAX */
function getRandomDelay(): number {
  return Math.floor(Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS + 1)) + MIN_DELAY_MS;
}

/** Generates a random ID string */
function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
}

/** Creates a standardized API error */
function createApiError(code: string, message: string, details?: ApiError['details']): ApiError {
  return { code, message, details };
}

/** Simulates an async API call with realistic delay and random errors */
async function simulateApiCall<T>(
  operation: () => T,
  errorOverride?: ApiError
): Promise<T> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Simulate random network errors (unless error rate is 0)
      if (ERROR_RATE > 0 && Math.random() < ERROR_RATE) {
        reject(createApiError('NETWORK_ERROR', 'Network request failed. Please try again.'));
        return;
      }

      // Simulate specific error if provided
      if (errorOverride) {
        reject(errorOverride);
        return;
      }

      resolve(operation());
    }, getRandomDelay());
  });
}

// ============================================
// Book Service API Functions
// ============================================

/** GET /books - Fetches all homepage book sections */
export async function getAllBookSections(): Promise<{
  trending: BookPreview[];
  newArrivals: BookPreview[];
  popular: BookPreview[];
}> {
  return simulateApiCall(() => ({
    trending: trendingBooks,
    newArrivals: newArrivals,
    popular: popularThisWeek,
  }));
}

/** GET /books/:id - Fetches a book by ID */
export async function getBookById(id: number): Promise<Book> {
  const book = booksData[id];

  if (!book) {
    throw createApiError('BOOK_NOT_FOUND', `Book with ID ${id} not found.`);
  }

  return simulateApiCall(() => book);
}

/** POST /books - Creates a new book listing */
export async function createBook(formData: BookUploadFormData): Promise<Book> {
  // Validate required fields
  const errors: ApiError['details'] = [];

  if (!formData.title?.trim()) {
    errors.push({ field: 'title', message: 'Title is required' });
  }
  if (!formData.author?.trim()) {
    errors.push({ field: 'author', message: 'Author is required' });
  }
  if (!formData.category) {
    errors.push({ field: 'category', message: 'Category is required' });
  }
  if (!formData.listingType) {
    errors.push({ field: 'listingType', message: 'Listing type is required' });
  }
  if (formData.listingType === 'sell' && !formData.price?.trim()) {
    errors.push({ field: 'price', message: 'Price is required for selling' });
  }
  if (!formData.images || formData.images.length === 0) {
    errors.push({ field: 'images', message: 'At least one image is required' });
  }
  if (!formData.whatsappNumber?.trim()) {
    errors.push({ field: 'whatsappNumber', message: 'WhatsApp number is required' });
  }

  if (errors.length > 0) {
    throw createApiError('VALIDATION_ERROR', 'Validation failed', errors);
  }

  return simulateApiCall(() => {
    const newId = Math.max(...Object.keys(booksData).map(Number)) + 1;

    const newBook: Book = {
      id: newId,
      title: formData.title.trim(),
      author: formData.author.trim(),
      genre: formData.category || 'Uncategorized',
      image: formData.images[0] || '',
      description: formData.description?.trim() || '',
      year: new Date().getFullYear().toString(),
      pages: 0,
      language: 'English',
      rating: 0,
    };

    return newBook;
  });
}

/** POST /borrow - Submits a request to borrow a book */
export async function borrowBook(data: BorrowRequestData): Promise<BorrowRequestResponse> {
  // Validate required fields
  const errors: ApiError['details'] = [];

  if (!data.bookId) {
    errors.push({ field: 'bookId', message: 'Book ID is required' });
  } else if (!booksData[data.bookId]) {
    throw createApiError('BOOK_NOT_FOUND', `Book with ID ${data.bookId} not found.`);
  }

  if (!data.borrowerName?.trim()) {
    errors.push({ field: 'borrowerName', message: 'Name is required' });
  }
  if (!data.borrowerEmail?.trim()) {
    errors.push({ field: 'borrowerEmail', message: 'Email is required' });
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.borrowerEmail)) {
    errors.push({ field: 'borrowerEmail', message: 'Invalid email format' });
  }
  if (!data.borrowerPhone?.trim()) {
    errors.push({ field: 'borrowerPhone', message: 'Phone number is required' });
  }

  if (errors.length > 0) {
    throw createApiError('VALIDATION_ERROR', 'Validation failed', errors);
  }

  return simulateApiCall(() => {
    const response: BorrowRequestResponse = {
      requestId: generateId('br'),
      bookId: data.bookId,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    // Store in fake database
    borrowRequests.set(response.requestId, response);

    return response;
  });
}

/** POST /join - Registers a user to join the book club */
export async function joinClub(data: JoinClubData): Promise<JoinClubResponse> {
  // Validate required fields
  const errors: ApiError['details'] = [];

  if (!data.name?.trim()) {
    errors.push({ field: 'name', message: 'Name is required' });
  }
  if (!data.email?.trim()) {
    errors.push({ field: 'email', message: 'Email is required' });
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push({ field: 'email', message: 'Invalid email format' });
  }

  if (errors.length > 0) {
    throw createApiError('VALIDATION_ERROR', 'Validation failed', errors);
  }

  // Check for duplicate email
  for (const member of clubMembers.values()) {
    if (member.email.toLowerCase() === data.email.toLowerCase()) {
      throw createApiError('EMAIL_EXISTS', 'A member with this email already exists.');
    }
  }

  return simulateApiCall(() => {
    const response: JoinClubResponse = {
      memberId: generateId('mem'),
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      joinedAt: new Date().toISOString(),
    };

    // Store in fake database
    clubMembers.set(response.memberId, response);

    return response;
  });
}
