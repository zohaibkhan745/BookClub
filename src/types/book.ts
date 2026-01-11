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
  price: string;
  description: string;
  whatsappNumber: string;
}
