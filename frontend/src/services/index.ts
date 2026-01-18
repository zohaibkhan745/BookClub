export {
  getBookById,
  getAllBookSections,
  getBooksByGenre,
  getUserLibrary,
  createBook,
  joinClub,
  // New borrow management (using borrow_records table)
  getBorrowStatus,
  requestBorrow,
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
