import type {
  Book,
  BookPreview,
  BookUploadFormData,
  ApiError,
  BorrowRequestData,
  BorrowRequestResponse,
  BorrowRecord,
  User,
  UserPreview,
  UserStats,
  JoinClubData,
  JoinClubResponse,
} from '../types';
import { apiGet, apiPost, apiPatch, createApiError } from './api';
import { clientCache, CACHE_KEYS, CACHE_TTL } from './cache';

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

/** GET /books - Fetches all homepage book sections with caching */
export async function getAllBookSections(): Promise<{
  trending: BookPreview[];
  newArrivals: BookPreview[];
  popular: BookPreview[];
}> {
  // Check cache first
  const cached = clientCache.get<{
    trending: BookPreview[];
    newArrivals: BookPreview[];
    popular: BookPreview[];
  }>(CACHE_KEYS.BOOK_SECTIONS);
  
  if (cached) {
    return cached;
  }
  
  const response = await apiGet<BookSectionsApiResponse>('/books');
  
  // Extract data from { success: true, data: {...} } wrapper
  const result = {
    trending: response.data.trending,
    newArrivals: response.data.newArrivals,
    popular: response.data.popular,
  };
  
  // Cache the result
  clientCache.set(CACHE_KEYS.BOOK_SECTIONS, result, CACHE_TTL.MEDIUM);
  
  return result;
}

/** GET /books/genre/:genre - Fetches books by genre with caching */
export async function getBooksByGenre(genre: string): Promise<BookPreview[]> {
  const cacheKey = CACHE_KEYS.GENRE_BOOKS(genre);
  const cached = clientCache.get<BookPreview[]>(cacheKey);
  
  if (cached) {
    return cached;
  }
  
  interface GenreBooksResponse {
    success: boolean;
    data: BookPreview[];
  }
  const response = await apiGet<GenreBooksResponse>(`/books/genre/${encodeURIComponent(genre)}`);
  
  // Cache the result
  clientCache.set(cacheKey, response.data, CACHE_TTL.MEDIUM);
  
  return response.data;
}

/** GET /user/library - Fetches the current user's library (uploaded + borrowed books) */
export async function getUserLibrary(): Promise<{
  uploaded: BookPreview[];
  borrowed: BookPreview[];
}> {
  // Don't cache user library - it's personal data that changes
  interface UserLibraryResponse {
    success: boolean;
    data: {
      uploaded: BookPreview[];
      borrowed: BookPreview[];
    };
  }
  const response = await apiGet<UserLibraryResponse>('/user/library');
  return {
    uploaded: response.data?.uploaded || [],
    borrowed: response.data?.borrowed || [],
  };
}

/** GET /books/:id - Fetches a book by ID with caching */
export async function getBookById(id: number): Promise<Book> {
  const cacheKey = CACHE_KEYS.BOOK_DETAIL(id);
  const cached = clientCache.get<Book>(cacheKey);
  
  if (cached) {
    return cached;
  }
  
  const response = await apiGet<BookApiResponse>(`/books/${id}`);
  const book = response.data as Book;
  
  // Cache with longer TTL for individual book details
  clientCache.set(cacheKey, book, CACHE_TTL.LONG);
  
  return book;
}

/** Invalidate all book-related caches. Call after any book mutation. */
export function invalidateBooksCache(): void {
  clientCache.invalidatePrefix('books:');
  clientCache.invalidatePrefix('search:');
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
    
    // Invalidate caches after creating a book
    invalidateBooksCache();
    
    return response.data as Book;
  } catch (error) {
    console.error('Create book error:', error);
    throw error;
  }
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

// ============================================================================
// BORROW MANAGEMENT (NEW - using borrow_records table)
// ============================================================================

/** GET /borrow/status/:bookId - Get current borrow status for a book */
export async function getBorrowStatus(bookId: string): Promise<BorrowRecord | null> {
  try {
    interface BorrowStatusResponse {
      success: boolean;
      data: {
        bookId: string;
        isBorrowed: boolean;
        borrowerName: string | null;
        borrowerId: string | null;
        dueAt: string | null;
      };
    }

    const response = await apiGet<BorrowStatusResponse>(`/borrow/status/${bookId}`);
    
    if (!response.data.isBorrowed) {
      return null;
    }

    return {
      id: '', // Not provided by this endpoint
      bookId: response.data.bookId,
      borrowerId: response.data.borrowerId || '',
      borrowerFullName: response.data.borrowerName || undefined,
      borrowedAt: '', // Not provided by this endpoint
      dueAt: response.data.dueAt || undefined,
      status: 'active' as const, // If borrowed, status is active
    };
  } catch (error) {
    console.error('Get borrow status error:', error);
    throw error;
  }
}

/** POST /borrow/request - Request to borrow a book (creates pending borrow record) */
export async function requestBorrow(bookId: string, message?: string): Promise<BorrowRecord> {
  try {
    interface BorrowerInfo {
      id: string;
      username: string;
      fullName: string;
    }
    
    interface BorrowRecordResponse {
      success: boolean;
      data: {
        id: string;
        bookId: string;
        borrowerId: string;
        borrowedAt: string | null;
        dueAt: string | null;
        returnedAt: string | null;
        status: string;
        borrower?: BorrowerInfo;
      };
    }

    const response = await apiPost<BorrowRecordResponse>('/borrow/request', {
      book_id: bookId,
      message: message?.trim() || null,
    });

    return {
      id: response.data.id,
      bookId: response.data.bookId,
      borrowerId: response.data.borrowerId,
      borrowerUsername: response.data.borrower?.username,
      borrowerFullName: response.data.borrower?.fullName,
      borrowedAt: response.data.borrowedAt || '',
      dueAt: response.data.dueAt || undefined,
      returnedAt: response.data.returnedAt || undefined,
      status: response.data.status as 'active' | 'returned' | 'overdue',
    };
  } catch (error) {
    console.error('Request borrow error:', error);
    throw error;
  }
}

/** POST /borrow/mark-borrowed - Owner marks book as borrowed to a specific user */
export async function ownerMarkBorrowed(
  bookId: string, 
  borrowerUsername: string, 
  dueAt?: string
): Promise<BorrowRecord> {
  try {
    interface BorrowerInfo {
      id: string;
      username: string;
      fullName: string;
    }
    
    interface BorrowRecordResponse {
      success: boolean;
      data: {
        id: string;
        bookId: string;
        borrowerId: string;
        borrowedAt: string | null;
        dueAt: string | null;
        returnedAt: string | null;
        status: string;
        borrower?: BorrowerInfo;
      };
    }

    const response = await apiPost<BorrowRecordResponse>('/borrow/mark-borrowed', {
      book_id: bookId,
      borrower_username: borrowerUsername.trim(),
      due_at: dueAt || null,
    });

    return {
      id: response.data.id,
      bookId: response.data.bookId,
      borrowerId: response.data.borrowerId,
      borrowerUsername: response.data.borrower?.username,
      borrowerFullName: response.data.borrower?.fullName,
      borrowedAt: response.data.borrowedAt || '',
      dueAt: response.data.dueAt || undefined,
      returnedAt: response.data.returnedAt || undefined,
      status: response.data.status as 'active' | 'returned' | 'overdue',
    };
  } catch (error) {
    console.error('Owner mark borrowed error:', error);
    throw error;
  }
}

/** POST /borrow/return - Return a borrowed book */
export async function returnBook(bookId: string): Promise<BorrowRecord> {
  try {
    interface BorrowerInfo {
      id: string;
      username: string;
      fullName: string;
    }
    
    interface BorrowRecordResponse {
      success: boolean;
      data: {
        id: string;
        bookId: string;
        borrowerId: string;
        borrowedAt: string | null;
        dueAt: string | null;
        returnedAt: string | null;
        status: string;
        borrower?: BorrowerInfo;
      };
    }

    const response = await apiPost<BorrowRecordResponse>('/borrow/return', {
      book_id: bookId,
    });

    return {
      id: response.data.id,
      bookId: response.data.bookId,
      borrowerId: response.data.borrowerId,
      borrowerUsername: response.data.borrower?.username,
      borrowerFullName: response.data.borrower?.fullName,
      borrowedAt: response.data.borrowedAt || '',
      dueAt: response.data.dueAt || undefined,
      returnedAt: response.data.returnedAt || undefined,
      status: response.data.status as 'active' | 'returned' | 'overdue',
    };
  } catch (error) {
    console.error('Return book error:', error);
    throw error;
  }
}

/** GET /borrow/history/my - Get current user's borrow history */
export async function getMyBorrowHistory(): Promise<BorrowRecord[]> {
  try {
    interface BorrowerInfo {
      id: string;
      username: string;
      fullName: string;
    }
    
    interface BookInfo {
      id: string;
      title: string;
      author: string;
      image: string;
    }
    
    interface BorrowHistoryItem {
      id: string;
      bookId: string;
      borrowerId: string;
      borrowedAt: string | null;
      dueAt: string | null;
      returnedAt: string | null;
      status: string;
      borrower?: BorrowerInfo;
      book?: BookInfo;
    }
    
    interface BorrowHistoryResponse {
      success: boolean;
      data: BorrowHistoryItem[];
    }

    const response = await apiGet<BorrowHistoryResponse>('/borrow/history/my');

    return response.data.map((record) => ({
      id: record.id,
      bookId: record.bookId,
      borrowerId: record.borrowerId,
      borrowerUsername: record.borrower?.username,
      borrowerFullName: record.borrower?.fullName,
      borrowedAt: record.borrowedAt || '',
      dueAt: record.dueAt || undefined,
      returnedAt: record.returnedAt || undefined,
      status: record.status as 'active' | 'returned' | 'overdue',
      book: record.book,
    }));
  } catch (error) {
    console.error('Get my borrow history error:', error);
    throw error;
  }
}

// ============================================================================
// USER MANAGEMENT
// ============================================================================

/** GET /users/search?q=... - Search for users by username or full name */
export async function searchUsers(query: string): Promise<UserPreview[]> {
  try {
    interface UserSearchResult {
      id: string;
      username: string;
      full_name: string;
    }
    
    interface SearchUsersResponse {
      success: boolean;
      data: UserSearchResult[];
    }

    const response = await apiGet<SearchUsersResponse>(`/users/search?q=${encodeURIComponent(query)}`);

    return response.data.map((user) => ({
      id: user.id,
      username: user.username,
      fullName: user.full_name,
    }));
  } catch (error) {
    console.error('Search users error:', error);
    throw error;
  }
}

/** POST /users/sync - Sync Supabase auth user to local users table */
export async function syncUser(): Promise<User> {
  try {
    interface UserData {
      id: string;
      username: string;
      full_name: string;
      email: string;
      created_at: string;
      updated_at: string;
    }
    
    interface SyncUserResponse {
      success: boolean;
      data: UserData;
    }

    const response = await apiPost<SyncUserResponse>('/users/sync', {});

    return {
      id: response.data.id,
      username: response.data.username,
      fullName: response.data.full_name,
      email: response.data.email,
      createdAt: response.data.created_at,
      updatedAt: response.data.updated_at,
    };
  } catch (error) {
    console.error('Sync user error:', error);
    throw error;
  }
}

/** GET /users/me - Get current authenticated user */
export async function getCurrentUser(): Promise<User> {
  try {
    interface UserData {
      id: string;
      username: string;
      full_name: string;
      email: string;
      created_at: string;
      updated_at: string;
    }
    
    interface GetUserResponse {
      success: boolean;
      data: UserData;
    }

    const response = await apiGet<GetUserResponse>('/users/me');

    return {
      id: response.data.id,
      username: response.data.username,
      fullName: response.data.full_name,
      email: response.data.email,
      createdAt: response.data.created_at,
      updatedAt: response.data.updated_at,
    };
  } catch (error) {
    console.error('Get current user error:', error);
    throw error;
  }
}


/** GET /users/me/stats - Get current user's activity statistics */
export async function getUserStats(): Promise<UserStats> {
  try {
    interface StatsData {
      books_listed: number;
      books_sold: number;
      books_borrowed: number;
    }
    
    interface GetStatsResponse {
      success: boolean;
      data: StatsData;
    }

    const response = await apiGet<GetStatsResponse>('/users/me/stats');

    return {
      booksListed: response.data.books_listed,
      booksSold: response.data.books_sold,
      booksBorrowed: response.data.books_borrowed,
    };
  } catch (error) {
    console.error('Get user stats error:', error);
    throw error;
  }
}


/** PATCH /users/me - Update current user's profile */
export async function updateUserProfile(fullName: string): Promise<User> {
  try {
    interface UserData {
      id: string;
      username: string;
      full_name: string;
      email: string;
      created_at: string;
    }
    
    interface UpdateUserResponse {
      success: boolean;
      data: UserData;
    }

    const response = await apiPatch<UpdateUserResponse>('/users/me', {
      full_name: fullName.trim(),
    });

    return {
      id: response.data.id,
      username: response.data.username,
      fullName: response.data.full_name,
      email: response.data.email,
      createdAt: response.data.created_at,
    };
  } catch (error) {
    console.error('Update user profile error:', error);
    throw error;
  }
}


/** 
 * POST /books/:id/mark-borrowed - Mark a book as borrowed.
 * Only the book uploader can call this endpoint.
 * The borrower must be a registered user.
 * @deprecated Use ownerMarkBorrowed instead - this uses the old schema
 */
export async function markBookAsBorrowed(bookId: number, borrowerFullName: string): Promise<Book> {
  // Client-side validation
  if (!borrowerFullName?.trim()) {
    throw createApiError('VALIDATION_ERROR', 'Borrower name is required');
  }

  interface MarkBorrowedResponse {
    success: boolean;
    data: Book;
  }

  const response = await apiPost<MarkBorrowedResponse>(
    `/books/${bookId}/mark-borrowed`,
    { borrower_full_name: borrowerFullName.trim() }
  );

  return response.data;
}