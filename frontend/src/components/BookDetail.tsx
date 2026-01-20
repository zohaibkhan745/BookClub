import { useState, useEffect } from "react";
import {
  ArrowLeft,
  MessageCircle,
  UserCheck,
  AlertCircle,
  X,
  RotateCcw,
  Search,
  CheckCircle,
  Trash2,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  ownerMarkBorrowed,
  returnBook,
  searchUsers,
  getBorrowStatus,
  deleteBook,
} from "../services";
import type { Book, ApiError, UserPreview, BorrowRecord } from "../types";

interface BookDetailProps {
  book: Book;
  onBookUpdate?: (updatedBook: Book) => void;
}

/** Opens WhatsApp chat with pre-filled message */
function openWhatsApp(phoneNumber: string, bookTitle: string) {
  // Remove any non-digit characters from phone number
  const cleanNumber = phoneNumber.replace(/\D/g, "");

  // Create message
  const message = encodeURIComponent(
    `Hi! I'm interested in borrowing "${bookTitle}" from the Book Club app. Is it still available?`,
  );

  // Open WhatsApp (works on both mobile and desktop)
  const whatsappUrl = `https://wa.me/${cleanNumber}?text=${message}`;
  window.open(whatsappUrl, "_blank");
}

export function BookDetail({ book, onBookUpdate }: BookDetailProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();

  // Modal state for "Mark as Borrowed"
  const [showBorrowerModal, setShowBorrowerModal] = useState(false);
  const [borrowerUsername, setBorrowerUsername] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // User search state
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userSearchResults, setUserSearchResults] = useState<UserPreview[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserPreview | null>(null);

  // Borrow status state (fetched from API)
  const [borrowStatus, setBorrowStatus] = useState<BorrowRecord | null>(null);
  const [isBorrowStatusLoading, setIsBorrowStatusLoading] = useState(true);

  // Delete book state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Determine if the current user is the uploader of this book
  // This check is used for conditional UI rendering only - backend enforces authorization
  const isUploader = isAuthenticated && user?.id === book.uploadedByUserId;

  // Alias for clarity: the owner can delete their own book
  // IMPORTANT: This is for UI visibility only - backend enforces the actual authorization
  const isOwner = isUploader;

  // Derive borrow state from borrowStatus
  const isBorrowed = borrowStatus !== null && borrowStatus.status === "active";
  const borrowerName = borrowStatus?.borrowerFullName;

  // Show "Mark as Borrowed" button only if:
  // 1. User is authenticated
  // 2. User is the uploader of this book
  // 3. Book is not already borrowed
  const canMarkAsBorrowed = isUploader && !isBorrowed;

  // Show "Return Book" button only if:
  // 1. User is authenticated
  // 2. User is the uploader of this book
  // 3. Book IS currently borrowed
  const canReturnBook = isUploader && isBorrowed;

  // Fetch borrow status on mount
  useEffect(() => {
    async function fetchBorrowStatus() {
      try {
        setIsBorrowStatusLoading(true);
        const status = await getBorrowStatus(String(book.id));
        setBorrowStatus(status);
      } catch (err) {
        console.error("Failed to fetch borrow status:", err);
        // Default to not borrowed if we can't fetch status
        setBorrowStatus(null);
      } finally {
        setIsBorrowStatusLoading(false);
      }
    }

    fetchBorrowStatus();
  }, [book.id]);

  // Search users when query changes
  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (userSearchQuery.trim().length >= 2) {
        setIsSearching(true);
        try {
          const results = await searchUsers(userSearchQuery);
          setUserSearchResults(results);
        } catch (err) {
          console.error("User search failed:", err);
          setUserSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setUserSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [userSearchQuery]);

  const handleBorrowClick = () => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      navigate("/login", { state: { from: location.pathname } });
      return;
    }

    if (book.whatsappNumber) {
      openWhatsApp(book.whatsappNumber, book.title);
    } else {
      alert("Contact information not available for this book.");
    }
  };

  const handleMarkAsBorrowed = () => {
    setShowBorrowerModal(true);
    setError(null);
    setBorrowerUsername("");
    setUserSearchQuery("");
    setUserSearchResults([]);
    setSelectedUser(null);
  };

  const handleSelectUser = (userPreview: UserPreview) => {
    setSelectedUser(userPreview);
    setBorrowerUsername(userPreview.username);
    setUserSearchQuery(userPreview.fullName);
    setUserSearchResults([]);
  };

  const handleSubmitBorrower = async () => {
    // Validate borrower selection
    if (!selectedUser) {
      setError("Please search for and select a registered user");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const borrowRecord = await ownerMarkBorrowed(
        String(book.id),
        selectedUser.username,
      );
      setShowBorrowerModal(false);
      // Update local borrow status
      setBorrowStatus(borrowRecord);
      // Notify parent component of the update (if needed)
      if (onBookUpdate) {
        onBookUpdate({
          ...book,
          isBorrowed: true,
          borrowedByName: borrowRecord.borrowerFullName,
        });
      }
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "Failed to mark book as borrowed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReturnBook = async () => {
    if (!confirm("Are you sure you want to mark this book as returned?")) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await returnBook(String(book.id));
      // Update local borrow status
      setBorrowStatus(null);
      // Notify parent component of the update (if needed)
      if (onBookUpdate) {
        onBookUpdate({
          ...book,
          isBorrowed: false,
          borrowedByName: undefined,
        });
      }
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "Failed to mark book as returned");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================
  // Delete Book Handlers
  // ============================================

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
    setDeleteError(null);
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setDeleteError(null);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    setDeleteError(null);

    try {
      await deleteBook(book.id);

      // Show success feedback briefly then redirect
      // Navigate to library page "My Uploads" tab after successful deletion
      navigate("/library", {
        replace: true,
        state: { 
          message: `"${book.title}" has been deleted successfully`,
          tab: "uploaded"  // Redirect to My Uploads section
        },
      });
    } catch (err) {
      const apiError = err as ApiError;
      setDeleteError(
        apiError.message || "Failed to delete book. Please try again.",
      );
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F0D7] dark:bg-[#1c1c1e] pt-24 pb-24 md:pb-0 transition-colors duration-300">
      <div className="px-4 md:px-12 max-w-7xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white mb-8 transition group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Home</span>
        </button>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left Side - Book Image */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-200 to-orange-200 dark:from-amber-900/50 dark:to-orange-900/50 rounded-2xl blur-2xl opacity-50 group-hover:opacity-70 transition-opacity"></div>
              <img
                src={book.image}
                alt={book.title}
                className="relative w-full max-w-md h-auto rounded-2xl shadow-2xl object-cover"
              />
              {/* Borrowed Badge */}
              {isBorrowed && (
                <div className="absolute top-4 right-4 bg-amber-500 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
                  Borrowed
                </div>
              )}
              {/* Loading Badge */}
              {isBorrowStatusLoading && (
                <div className="absolute top-4 right-4 bg-gray-400 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg animate-pulse">
                  ...
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Book Information */}
          <div className="space-y-6 flex flex-col justify-center">
            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold text-black dark:text-white leading-tight">
              {book.title}
            </h1>

            {/* Author */}
            <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-300">
              by{" "}
              <span className="font-semibold text-black dark:text-white">
                {book.author}
              </span>
            </p>

            {/* Book Details */}
            <div className="py-4">
              <div className="space-y-1">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Genre
                </p>
                <p className="font-semibold text-black dark:text-white">
                  {book.genre}
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h3 className="font-semibold text-black dark:text-white text-lg">
                About this book
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {book.description}
              </p>

              {/* Attribution Section */}
              <div className="mt-3 space-y-1">
                {/* Listed By Attribution - shows uploader's full name, never email */}
                {book.listedBy && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                    Listed by {book.listedBy}
                  </p>
                )}
                {/* Borrowed By Attribution - only shown when book is borrowed */}
                {isBorrowed && borrowerName && (
                  <p className="text-sm text-amber-600 dark:text-amber-400 italic">
                    Borrowed by {borrowerName}
                  </p>
                )}
              </div>
            </div>

            {/* Price (if selling) */}
            {book.listingType === "sell" && book.price && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border border-green-200 dark:border-green-700 rounded-xl p-4">
                <p className="text-sm text-green-700 dark:text-green-400">
                  Price
                </p>
                <p className="text-2xl font-bold text-green-800 dark:text-green-300">
                  PKR {book.price}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              {/* Main action button - changes based on borrow status */}
              {isBorrowStatusLoading ? (
                // Loading state
                <button
                  disabled
                  className="w-full px-6 py-4 bg-gray-300 text-gray-500 font-semibold rounded-xl cursor-not-allowed flex items-center justify-center gap-2 animate-pulse"
                >
                  Loading...
                </button>
              ) : isBorrowed ? (
                // Book is already borrowed - show disabled button
                <button
                  disabled
                  className="w-full px-6 py-4 bg-gray-400 text-white font-semibold rounded-xl cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <UserCheck className="w-5 h-5" />
                  Borrowed
                </button>
              ) : (
                // Book is available - show borrow/buy button
                <button
                  onClick={handleBorrowClick}
                  className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-green-700 transition shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  {book.listingType === "sell" ? "Buy" : "Borrow"}
                </button>
              )}

              {/* "Mark as Borrowed" button - ONLY visible to the book uploader when book is not borrowed */}
              {canMarkAsBorrowed && (
                <button
                  onClick={handleMarkAsBorrowed}
                  className="w-full px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-orange-600 transition shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  <UserCheck className="w-5 h-5" />
                  Mark as Borrowed
                </button>
              )}

              {/* "Return Book" button - ONLY visible to the book uploader when book IS borrowed */}
              {canReturnBook && (
                <button
                  onClick={handleReturnBook}
                  disabled={isSubmitting}
                  className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-indigo-600 transition shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <RotateCcw className="w-5 h-5" />
                  {isSubmitting ? "Returning..." : "Mark as Returned"}
                </button>
              )}
            </div>

            {/* Delete Book Button - ONLY visible to the book owner (uploader) */}
            {/* SECURITY NOTE: This visibility check is for UX only. Backend enforces authorization. */}
            {isOwner && (
              <div className="pt-6 border-t border-gray-200 dark:border-gray-700 mt-6">
                <button
                  onClick={handleDeleteClick}
                  disabled={isDeleting}
                  className="w-full px-6 py-3 bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 font-semibold rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Trash2 className="w-5 h-5" />
                  {isDeleting ? "Deleting..." : "Delete Book"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mark as Borrowed Modal */}
      {showBorrowerModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#2c2c2e] rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
            {/* Close Button */}
            <button
              onClick={() => setShowBorrowerModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Mark Book as Borrowed
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
              Search for the registered user who borrowed this book.
            </p>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 dark:text-red-400 text-sm">
                  {error}
                </p>
              </div>
            )}

            {/* User Search Input */}
            <div className="mb-4">
              <label
                htmlFor="userSearch"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Search User by Name or Username
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="userSearch"
                  type="text"
                  value={userSearchQuery}
                  onChange={(e) => {
                    setUserSearchQuery(e.target.value);
                    setSelectedUser(null);
                  }}
                  placeholder="Type to search users..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-[#1c1c1e] border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-gray-900 dark:text-white placeholder:text-gray-400"
                  disabled={isSubmitting}
                />
              </div>

              {/* Search Results Dropdown */}
              {userSearchResults.length > 0 && !selectedUser && (
                <div className="mt-2 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-[#1c1c1e] max-h-48 overflow-y-auto">
                  {userSearchResults.map((userResult) => (
                    <button
                      key={userResult.id}
                      onClick={() => handleSelectUser(userResult)}
                      className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                    >
                      <p className="font-medium text-gray-900 dark:text-white">
                        {userResult.fullName}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        @{userResult.username}
                      </p>
                    </button>
                  ))}
                </div>
              )}

              {/* Loading indicator */}
              {isSearching && (
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Searching...
                </p>
              )}

              {/* No results message */}
              {userSearchQuery.length >= 2 &&
                !isSearching &&
                userSearchResults.length === 0 &&
                !selectedUser && (
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    No users found. They must have a registered account.
                  </p>
                )}
            </div>

            {/* Selected User Display */}
            {selectedUser && (
              <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-300 dark:border-green-700 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-xs text-green-600 dark:text-green-400 font-medium uppercase tracking-wide">
                        Selected Borrower
                      </p>
                      <p className="font-bold text-green-900 dark:text-green-200 text-lg">
                        {selectedUser.fullName}
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-400">
                        @{selectedUser.username}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedUser(null);
                      setUserSearchQuery("");
                      setBorrowerUsername("");
                    }}
                    className="p-2 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-800 rounded-lg transition"
                    title="Clear selection"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowBorrowerModal(false)}
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitBorrower}
                disabled={isSubmitting || !selectedUser}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Confirming..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#2c2c2e] rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
            {/* Close Button */}
            <button
              onClick={handleDeleteCancel}
              disabled={isDeleting}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Warning Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
            </div>

            {/* Modal Header */}
            <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-2">
              Delete this book?
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
              This action cannot be undone. The book "{book.title}" will be
              permanently removed from your library.
            </p>

            {/* Error Message */}
            {deleteError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 dark:text-red-400 text-sm">
                  {deleteError}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleDeleteCancel}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
