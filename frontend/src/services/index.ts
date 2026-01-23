export {
  getBookById,
  getAllBookSections,
  getAllBooks,
  getBooksByGenre,
  searchBooks,
  getUserLibrary,
  createBook,
  deleteBook,
  joinClub,
  // Borrow management (using borrow_records table)
  getBorrowStatus,
  requestToBorrow,
  getBookBorrowRequests,
  approveBorrowRequest,
  cancelBorrowRequest,
  ownerMarkBorrowed,
  returnBook,
  getMyBorrowHistory,
  // User management
  searchUsers,
  syncUser,
  getCurrentUser as getCurrentLocalUser,
  getUserStats,
  updateUserProfile,
  // Cache management
  invalidateBooksCache,
  // Legacy (deprecated)
  markBookAsBorrowed,
} from './bookService';

export type { BorrowRequestResult } from './bookService';

export { API_BASE_URL, API_URL } from './api';

export { clientCache, CACHE_KEYS, CACHE_TTL } from './cache';

export {
  signIn,
  signUp,
  signOut,
  getSession,
  getCurrentUser,
  getAccessToken,
} from './authService';
