/** Listing type for book uploads */
export type ListingType = 'lend' | 'borrow' | 'sell' | 'exchange';

/** Book condition for uploads */
export type BookCondition = 'new' | 'like-new' | 'good' | 'fair' | 'poor';

/** Borrow status values */
export type BorrowStatusValue = 'requested' | 'borrowed' | 'returned' | 'overdue' | 'cancelled';

/** Book category names */
export type BookCategory =
  | 'Self-Help'
  | 'Fiction'
  | 'Non-Fiction'
  | 'Technology'
  | 'Philosophy'
  | 'Romance'
  | 'Mystery'
  | 'Biography'
  | 'Science'
  | 'History';

/** All available book categories (used in dropdowns) */
export const BOOK_CATEGORIES: BookCategory[] = [
  'Self-Help',
  'Fiction',
  'Non-Fiction',
  'Technology',
  'Philosophy',
  'Romance',
  'Mystery',
  'Biography',
  'Science',
  'History',
];

/** Minimal book data for list views and carousels */
export interface BookPreview {
  id: string;  // Changed to string (UUID)
  title: string;
  author: string;
  image: string;
}

/**
 * Borrow status information for a book.
 * Derived from borrow_records table, NOT stored in books.
 */
export interface BorrowStatus {
  isBorrowed: boolean;
  borrowerName?: string | null;
  borrowerId?: string | null;
  dueAt?: string | null;
}

/** Full book details including metadata */
export interface Book extends BookPreview {
  genre: string;
  description: string;
  year: string;
  pages: number;
  language: string;
  rating: number;
  whatsappNumber?: string;
  listingType?: string;
  condition?: string;
  price?: string;
  
  // Owner info (new naming convention)
  ownerId?: string;
  ownerFullName?: string;
  
  // Legacy fields for backwards compatibility
  listedBy?: string;
  uploadedByUserId?: string;
  
  // Borrow status - computed from borrow_records table
  borrowStatus?: BorrowStatus;
  
  // Legacy borrow fields for backwards compatibility
  isBorrowed?: boolean;
  borrowedByName?: string | null;
  borrowedByUserId?: string | null;
}

/** Form data for uploading a new book */
export interface BookUploadFormData {
  images: string[];
  title: string;
  author: string;
  category: BookCategory | '';
  listingType: ListingType | '';
  condition: BookCondition | '';
  price: string;
  description: string;
  whatsappNumber: string;
}

// ============================================
// User Types
// ============================================

/** User profile information */
export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  createdAt?: string;
}

/** User preview for search results */
export interface UserPreview {
  id: string;
  username: string;
  fullName: string;
}

/** User activity statistics */
export interface UserStats {
  booksListed: number;
  booksSold: number;
  booksBorrowed: number;
}

/** User profile with stats combined */
export interface UserProfile extends User {
  stats?: UserStats;
}

// ============================================
// Borrow Record Types
// ============================================

/** Borrow record response from API */
export interface BorrowRecord {
  id: string;
  bookId: string;
  borrowerId: string;
  borrowerUsername?: string;
  borrowerFullName?: string;
  borrower?: UserPreview;
  borrowedAt: string;
  dueAt?: string | null;
  returnedAt?: string | null;
  status: BorrowStatusValue;
  book?: BookPreview;
}

/** Request to borrow a book (self) */
export interface BorrowBookRequest {
  bookId: string;
  dueAt?: string;
}

/** Request for owner to mark book as borrowed */
export interface OwnerBorrowRequest {
  bookId: string;
  borrowerUsername: string;
  dueAt?: string;
}

/** Request to return a book */
export interface ReturnBookRequest {
  bookId: string;
}

// ============================================
// API Response Types
// ============================================

/** Standard API error structure */
export interface ApiError {
  code: string;
  message: string;
  details?: Array<{ field: string; message: string }>;
}

/** Legacy borrow request form data (for backwards compat) */
export interface BorrowRequestData {
  bookId: number;
  borrowerName: string;
  borrowerEmail: string;
  borrowerPhone: string;
  message?: string;
}

/** Legacy borrow request response */
export interface BorrowRequestResponse {
  requestId: string;
  bookId: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

/** Join club form data */
export interface JoinClubData {
  name: string;
  email: string;
  phone?: string;
  interests?: BookCategory[];
}

/** Join club response */
export interface JoinClubResponse {
  memberId: string;
  name: string;
  email: string;
  joinedAt: string;
}
