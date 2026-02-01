import { useState, useEffect } from "react";
import {
  ArrowLeft,
  MessageCircle,
  UserCheck,
  AlertCircle,
  X,
  RotateCcw,
  CheckCircle,
  Trash2,
  Users,
  Clock,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  returnBook,
  getBorrowStatus,
  deleteBook,
  requestToBorrow,
  getBookBorrowRequests,
  approveBorrowRequest,
  cancelBorrowRequest,
} from "../services";
import type { Book, ApiError, BorrowRecord } from "../types";

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
  const { isAuthenticated, user, refreshCredits } = useAuth();

  // Modal state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Borrow status state (fetched from API)
  const [borrowStatus, setBorrowStatus] = useState<BorrowRecord | null>(null);
  const [isBorrowStatusLoading, setIsBorrowStatusLoading] = useState(true);

  // Borrow requests state (for owner)
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [borrowRequests, setBorrowRequests] = useState<BorrowRecord[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [approvingRequestId, setApprovingRequestId] = useState<string | null>(
    null,
  );
  const [decliningRequestId, setDecliningRequestId] = useState<string | null>(
    null,
  );

  // Requesting to borrow state
  const [isRequestingBorrow, setIsRequestingBorrow] = useState(false);

  // Return book confirmation state
  const [showReturnConfirm, setShowReturnConfirm] = useState(false);

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
  const isBorrowed =
    borrowStatus !== null && borrowStatus.status === "borrowed";
  const borrowerName = borrowStatus?.borrowerFullName;

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

  const handleBorrowClick = async () => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      navigate("/login", { state: { from: location.pathname } });
      return;
    }

    setIsRequestingBorrow(true);
    setError(null);

    try {
      // Create borrow request (status: REQUESTED)
      const result = await requestToBorrow(String(book.id));

      // Redirect to WhatsApp with the owner's number
      const whatsappNumber = result.whatsappNumber || book.whatsappNumber;
      if (whatsappNumber) {
        openWhatsApp(whatsappNumber, book.title);
      }
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.code === "ALREADY_REQUESTED") {
        // User already has a pending request - just open WhatsApp
        if (book.whatsappNumber) {
          openWhatsApp(book.whatsappNumber, book.title);
        }
      } else if (apiError.code === "OWN_BOOK") {
        setError("You cannot borrow your own book");
      } else if (apiError.code === "NOT_AVAILABLE") {
        setError("This book is no longer available");
      } else if (apiError.code === "INSUFFICIENT_CREDITS") {
        setError(
          apiError.message ||
            "Insufficient credits. Upload a book or return borrowed books to earn more credits.",
        );
      } else {
        setError(apiError.message || "Failed to send borrow request");
      }
    } finally {
      setIsRequestingBorrow(false);
    }
  };

  // Fetch pending borrow requests for this book (owner only)
  const handleViewRequests = async () => {
    setShowRequestsModal(true);
    setIsLoadingRequests(true);
    setError(null);

    try {
      const requests = await getBookBorrowRequests(String(book.id));
      setBorrowRequests(requests);
    } catch (err) {
      console.error("Failed to fetch borrow requests:", err);
      const apiError = err as ApiError;
      setError(apiError.message || "Failed to load borrow requests");
    } finally {
      setIsLoadingRequests(false);
    }
  };

  // Approve a borrow request
  const handleApproveRequest = async (requestId: string) => {
    setApprovingRequestId(requestId);
    setError(null);

    try {
      const borrowRecord = await approveBorrowRequest(requestId);

      // Refresh credits (borrower's credit is now frozen)
      await refreshCredits();

      // Close modal and update status
      setShowRequestsModal(false);
      setBorrowStatus(borrowRecord);

      // Notify parent of update
      if (onBookUpdate) {
        onBookUpdate({
          ...book,
          isBorrowed: true,
          borrowedByName: borrowRecord.borrowerFullName,
        });
      }
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "Failed to approve request");
    } finally {
      setApprovingRequestId(null);
    }
  };

  // Decline a borrow request
  const handleDeclineRequest = async (requestId: string) => {
    setDecliningRequestId(requestId);
    setError(null);

    try {
      await cancelBorrowRequest(requestId);

      // Remove the declined request from the list
      setBorrowRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || "Failed to decline request");
    } finally {
      setDecliningRequestId(null);
    }
  };

  const handleReturnClick = () => {
    setShowReturnConfirm(true);
    setError(null);
  };

  const handleReturnCancel = () => {
    setShowReturnConfirm(false);
  };

  const handleReturnConfirm = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      await returnBook(String(book.id));
      // Refresh credits (borrower's frozen credit is now available again)
      await refreshCredits();
      // Update local borrow status
      setBorrowStatus(null);
      setShowReturnConfirm(false);
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

      // Refresh credits (1 credit deducted for deletion)
      await refreshCredits();

      // Show success feedback briefly then redirect
      // Navigate to library page "My Uploads" tab after successful deletion
      navigate("/library", {
        replace: true,
        state: {
          message: `"${book.title}" has been deleted successfully`,
          tab: "uploaded", // Redirect to My Uploads section
        },
      });
    } catch (err) {
      console.error("[BookDetail] Delete failed:", err);
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
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white mb-8 transition group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span>Back</span>
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
              {/* Main action button - changes based on borrow status and ownership */}
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
              ) : isUploader ? (
                // Owner sees "Mark as Borrowed" which opens requests modal
                <button
                  onClick={handleViewRequests}
                  className="w-full px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-orange-600 transition shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  <UserCheck className="w-5 h-5" />
                  Mark as Borrowed
                </button>
              ) : (
                // Book is available - show borrow/buy button (sends request + opens WhatsApp)
                <button
                  onClick={handleBorrowClick}
                  disabled={isRequestingBorrow}
                  className="w-full px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-green-700 transition shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <MessageCircle className="w-5 h-5" />
                  {isRequestingBorrow
                    ? "Sending Request..."
                    : book.listingType === "sell"
                      ? "Buy"
                      : "Borrow"}
                </button>
              )}

              {/* "Return Book" button - ONLY visible to the book uploader when book IS borrowed */}
              {canReturnBook && (
                <button
                  onClick={handleReturnClick}
                  disabled={isSubmitting}
                  className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-indigo-600 transition shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <RotateCcw className="w-5 h-5" />
                  Mark as Returned
                </button>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 dark:text-red-400 text-sm">
                  {error}
                </p>
              </div>
            )}

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

      {/* Borrow Requests Modal - For book owner to see and approve requesters */}
      {showRequestsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#2c2c2e] rounded-2xl shadow-2xl max-w-md w-full p-6 relative max-h-[80vh] overflow-hidden flex flex-col">
            {/* Close Button */}
            <button
              onClick={() => setShowRequestsModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Mark as Borrowed
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Approve a request to mark "{book.title}" as borrowed
              </p>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {isLoadingRequests ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
                </div>
              ) : borrowRequests.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No pending requests yet
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                    When users request to borrow this book, they'll appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {borrowRequests.map((request) => (
                    <div
                      key={request.id}
                      className="p-4 bg-gray-50 dark:bg-[#1c1c1e] rounded-xl border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-amber-600 dark:text-amber-400 font-semibold text-lg">
                              {request.borrowerFullName?.charAt(0) || "?"}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 dark:text-white truncate">
                              {request.borrowerFullName || "Unknown User"}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(
                                request.borrowedAt,
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleDeclineRequest(request.id)}
                            disabled={
                              decliningRequestId === request.id ||
                              approvingRequestId === request.id
                            }
                            className="px-3 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-lg transition disabled:opacity-50 flex items-center gap-1.5"
                          >
                            {decliningRequestId === request.id ? (
                              <>
                                <span className="animate-spin text-sm">⏳</span>
                                <span className="hidden sm:inline">
                                  Declining...
                                </span>
                              </>
                            ) : (
                              <>
                                <X className="w-4 h-4" />
                                <span className="hidden sm:inline">
                                  Decline
                                </span>
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleApproveRequest(request.id)}
                            disabled={
                              approvingRequestId === request.id ||
                              decliningRequestId === request.id
                            }
                            className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition disabled:opacity-50 flex items-center gap-1.5"
                          >
                            {approvingRequestId === request.id ? (
                              <>
                                <span className="animate-spin text-sm">⏳</span>
                                <span className="hidden sm:inline">
                                  Approving...
                                </span>
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4" />
                                <span className="hidden sm:inline">
                                  Approve
                                </span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Close button at bottom */}
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowRequestsModal(false)}
                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return Confirmation Modal */}
      {showReturnConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#2c2c2e] rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
            {/* Close Button */}
            <button
              onClick={handleReturnCancel}
              disabled={isSubmitting}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <RotateCcw className="w-8 h-8 text-green-500" />
              </div>
            </div>

            {/* Modal Header */}
            <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-2">
              Mark as Returned?
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
              This will mark{" "}
              <span className="font-medium text-gray-900 dark:text-white">
                "{book.title}"
              </span>{" "}
              as returned and make it available for borrowing again.
            </p>

            {/* Borrower Info */}
            {borrowerName && (
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Returning from
                  </p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {borrowerName}
                  </p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-red-700 dark:text-red-400 text-sm">
                  {error}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleReturnCancel}
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleReturnConfirm}
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 bg-green-500 text-white font-semibold rounded-xl hover:bg-green-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Returning...
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    Mark Returned
                  </>
                )}
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
