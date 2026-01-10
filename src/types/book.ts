/**
 * Core book type used for list views (Home page, carousels)
 */
export interface BookPreview {
  id: number;
  title: string;
  author: string;
  image: string;
}

/**
 * Full book details including metadata
 */
export interface Book extends BookPreview {
  genre: string;
  description: string;
  year: string;
  pages: number;
  language: string;
  rating: number;
}

/**
 * Category for browsing
 */
export interface Category {
  id: number;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}
