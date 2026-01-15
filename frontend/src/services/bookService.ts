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
import { apiGet, apiPost, createApiError } from './api';

// ============================================
// Types for API Responses
// ============================================

interface BookSectionsApiResponse {
  success: boolean;
  data: {
    trending: BookPreview[];
    newArrivals: BookPreview[];
    popular: BookPreview[];
  };
}

interface BookApiResponse {
  success: boolean;
  data: {
    id: number;
    title: string;
    author: string;
    genre: string;
    image: string;
    description: string;
    year: string;
    pages: number;
    language: string;
    rating: number;
    whatsappNumber: string;
    listingType: string;
    price: string;
  };
}

interface CreateBookApiResponse {
  success: boolean;
  data: {
    id: number;
    title: string;
    author: string;
    genre: string;
    image: string;
    description: string;
    year: string;
    pages: number;
    language: string;
    rating: number;
  };
}

// ============================================
// Helper Functions
// ============================================

/** In-memory store for club members (not implemented in backend yet) */
const clubMembers: Map<string, JoinClubResponse> = new Map();

/** Generates a random ID string */
function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
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
  const response = await apiGet<BookSectionsApiResponse>('/books');
  
  // Extract data from { success: true, data: {...} } wrapper
  return {
    trending: response.data.trending,
    newArrivals: response.data.newArrivals,
    popular: response.data.popular,
  };
}

/** GET /books/genre/:genre - Fetches books by genre */
export async function getBooksByGenre(genre: string): Promise<BookPreview[]> {
  interface GenreBooksResponse {
    success: boolean;
    data: BookPreview[];
  }
  const response = await apiGet<GenreBooksResponse>(`/books/genre/${encodeURIComponent(genre)}`);
  return response.data;
}

/** GET /books/:id - Fetches a book by ID */
export async function getBookById(id: number): Promise<Book> {
  const response = await apiGet<BookApiResponse>(`/books/${id}`);
  // Backend already returns correct Book format in response.data
  return response.data as Book;
}

/** POST /books - Creates a new book listing */
export async function createBook(formData: BookUploadFormData): Promise<Book> {
  // Client-side validation
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
  if (!formData.whatsappNumber?.trim()) {
    errors.push({ field: 'whatsappNumber', message: 'WhatsApp number is required' });
  }

  if (errors.length > 0) {
    throw createApiError('VALIDATION_ERROR', 'Validation failed', errors);
  }

  // Transform to backend format
  const payload = {
    title: formData.title.trim(),
    author: formData.author.trim(),
    category: formData.category,
    listing_type: formData.listingType,
    condition: formData.condition || 'good',  // Changed from null to 'good'
    description: formData.description?.trim() || null,
    cover_image: formData.images?.[0] || null,
    price: formData.price?.trim() || null,  // Keep as string, not parseFloat!
    whatsapp_number: formData.whatsappNumber?.trim() || null,
  };

  try {
    const response = await apiPost<CreateBookApiResponse>('/books', payload);
    return response.data as Book;
  } catch (error) {
    console.error('Create book error:', error);
    throw error;
  }
}

/** POST /borrow - Submits a request to borrow a book */
export async function borrowBook(data: BorrowRequestData): Promise<BorrowRequestResponse> {
  // Client-side validation
  const errors: ApiError['details'] = [];

  if (!data.bookId) {
    errors.push({ field: 'bookId', message: 'Book ID is required' });
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

  // Transform to backend format
  const payload = {
    book_id: data.bookId,
    borrower_name: data.borrowerName.trim(),
    borrower_email: data.borrowerEmail.trim(),
    borrower_phone: data.borrowerPhone.trim(),
    message: data.message?.trim() || null,
  };

  interface BorrowResponse {
    request_id: string;
    book_id: number;
    status: string;
    created_at: string;
  }

  const response = await apiPost<BorrowResponse>('/borrow', payload);
  
  return {
    requestId: response.request_id,
    bookId: response.book_id,
    status: response.status as 'pending' | 'approved' | 'rejected',
    createdAt: response.created_at,
  };
}

/** POST /join - Registers a user to join the book club (client-side only for now) */
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

  // Check for duplicate email (client-side only)
  for (const member of clubMembers.values()) {
    if (member.email.toLowerCase() === data.email.toLowerCase()) {
      throw createApiError('EMAIL_EXISTS', 'A member with this email already exists.');
    }
  }

  // Note: This is still client-side only until we add a /join endpoint to backend
  const response: JoinClubResponse = {
    memberId: generateId('mem'),
    name: data.name.trim(),
    email: data.email.trim().toLowerCase(),
    joinedAt: new Date().toISOString(),
  };

  clubMembers.set(response.memberId, response);
  return response;
}
