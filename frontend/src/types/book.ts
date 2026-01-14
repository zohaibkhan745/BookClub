/** Listing type for book uploads */
export type ListingType = 'lend' | 'borrow' | 'sell';

/** Book condition for uploads */
export type BookCondition = 'new' | 'like-new' | 'good' | 'fair' | 'poor';

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
  id: number;
  title: string;
  author: string;
  image: string;
}

/** Full book details including metadata */
export interface Book extends BookPreview {
  genre: string;
  description: string;
  year: string;
  pages: number;
  language: string;
  rating: number;
}

/** Form data for uploading a new book */
export interface BookUploadFormData {
  images: string[];
  title: string;
  author: string;
  category: BookCategory | '';
  listingType: ListingType | '';
  condition: BookCondition | '';  // Book condition (new, like-new, good, fair, poor)
  price: string;
  description: string;
  whatsappNumber: string;
}

// ============================================
// API Response Types (matches docs/api.md)
// ============================================

/** Standard API error structure */
export interface ApiError {
  code: string;
  message: string;
  details?: Array<{ field: string; message: string }>;
}

/** Borrow request form data */
export interface BorrowRequestData {
  bookId: number;
  borrowerName: string;
  borrowerEmail: string;
  borrowerPhone: string;
  message?: string;
}

/** Borrow request response */
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
