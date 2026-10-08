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
  Loader2,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ConfirmDialog } from "./ui/ConfirmDialog";
import { Button } from "./ui/Button";
import {
  returnBook,
  getBorrowStatus,
  deleteBook,
  requestToBorrow,
  getBookBorrowRequests,
  approveBorrowRequest,
  cancelBorrowRequest,
  markBookAsBorrowed,
} from "../services";
import { OptimizedImage } from "./ui/OptimizedImage";
import { BookJourneyTimeline } from "./BookJourneyTimeline";
import type { Book, ApiError, BorrowRecord } from "../types";

interface BookDetailProps {
  book: Book;
  isInitialPlaceholder?: boolean;
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

export function BookDetail({ book, isInitialPlaceholder = false, onBookUpdate }: BookDetailProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, refreshCredits } = useAuth();

  // Modal state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Borrow status state (initialized from book prop to avoid waterfall request)
  const [borrowStatus, setBorrowStatus] = useState<BorrowRecord | null>(() => {
    if (book.borrowStatus?.isBorrowed || book.isBorrowed) {
      return {
        id: "",
        bookId: String(book.id),
        borrowerId: book.borrowStatus?.borrowerId || book.borrowedByUserId || "",
        borrowerFullName: book.borrowStatus?.borrowerName || book.borrowedByName || undefined,
        borrowedAt: "",
        dueAt: book.borrowStatus?.dueAt,
        status: "borrowed",
      };
    }
    return null;
  });
  const [isBorrowStatusLoading, setIsBorrowStatusLoading] = useState(false);

  // Borrow requests state (for owner)
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [borrowRequests, setBorrowRequests] = useState<BorrowRecord[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
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

  // Manual mark as borrowed state
  const [manualBorrowerUsername, setManualBorrowerUsername] = useState("");
  const [isManualSubmitting, setIsManualSubmitting] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);

  // Determine if the current user is the uploader of this book
  // This check is used for conditional UI rendering only - backend enforces authorization
  const currentUserId = user?.id ? String(user.id).trim().toLowerCase() : "";
  const bookOwnerId = (book.uploadedByUserId || book.ownerId)
    ? String(book.uploadedByUserId || book.ownerId).trim().toLowerCase()
    : "";
  const isUploader = Boolean(
    isAuthenticated &&
    currentUserId &&
    bookOwnerId &&
    currentUserId === bookOwnerId
  );

  // Alias for clarity: the owner can delete their own book
  // IMPORTANT: This is for UI visibility only - backend enforces the actual authorization
  const isOwner = isUploader;

  // Prefetch pending requests for owner so badge and count are immediate
  useEffect(() => {
    if (isUploader && book.id) {
      getBookBorrowRequests(String(book.id))
        .then((reqs) => setBorrowRequests(reqs))
        .catch((err) => console.error("Failed to load borrow requests:", err));
    }
  }, [isUploader, book.id]);

  // Derive borrow state from borrowStatus
  const isBorrowed =
    borrowStatus !== null && borrowStatus.status === "borrowed";
  const borrowerName = borrowStatus?.borrowerFullName;

  // Show "Return Book" button only if:
  // 1. User is authenticated
  // 2. User is the uploader of this book
  // 3. Book IS currently borrowed
  const canReturnBook = isUploader && isBorrowed;

  // Sync borrow status when book prop changes without redundant network requests
  useEffect(() => {
    if (book.borrowStatus !== undefined || book.isBorrowed !== undefined) {
      if (book.borrowStatus?.isBorrowed || book.isBorrowed) {
        setBorrowStatus({
          id: "",
          bookId: String(book.id),
          borrowerId: book.borrowStatus?.borrowerId || book.borrowedByUserId || "",
          borrowerFullName: book.borrowStatus?.borrowerName || book.borrowedByName || undefined,
          borrowedAt: "",
          dueAt: book.borrowStatus?.dueAt,
          status: "borrowed",
        });
      } else {
        setBorrowStatus(null);
      }
      setIsBorrowStatusLoading(false);
      return;
    }

    // Fallback only if book prop lacked borrow status
    async function fetchBorrowStatus() {
      try {
        setIsBorrowStatusLoading(true);
        const status = await getBorrowStatus(String(book.id));
        setBorrowStatus(status);
      } catch (err) {
        console.error("Failed to fetch borrow status:", err);
        setBorrowStatus(null);
      } finally {
        setIsBorrowStatusLoading(false);
      }
    }

    fetchBorrowStatus();
  }, [book.id, book.borrowStatus, book.isBorrowed]);

  const handleBorrowClick = async () => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      navigate("/login", { state: { from: location.pathname } });
      return;
    }

    // Safety guard: if owner clicks borrow, switch to viewing/approving requests
    if (isUploader || (currentUserId && bookOwnerId && currentUserId === bookOwnerId)) {
      handleViewRequests();
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
    setModalError(null);
    setError(null);

    try {
      const requests = await getBookBorrowRequests(String(book.id));
      setBorrowRequests(requests);
    } catch (err) {
      console.error("Failed to fetch borrow requests:", err);
      const apiError = err as ApiError;
      const message = apiError.message || "Failed to load borrow requests";
      setModalError(message);
      setError(message);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  // Approve a borrow request
  const handleApproveRequest = async (requestId: string) => {
    setApprovingRequestId(requestId);
    setModalError(null);
    setError(null);

    try {
      const borrowRecord = await approveBorrowRequest(requestId);

      // Refresh credits (borrower's credit is now frozen)
      await refreshCredits();

      // Close modal and update status
      setShowRequestsModal(false);
      setModalError(null);
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
      const message = apiError.message || "Failed to approve request";
      setModalError(message);
      setError(message);
    } finally {
      setApprovingRequestId(null);
    }
  };

  // Decline a borrow request
  const handleDeclineRequest = async (requestId: string) => {
    setDecliningRequestId(requestId);
    setModalError(null);
    setError(null);

    try {
      await cancelBorrowRequest(requestId);

      // Remove the declined request from the list
      setBorrowRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch (err) {
      const apiError = err as ApiError;
      const message = apiError.message || "Failed to decline request";
      setModalError(message);
      setError(message);
    } finally {
      setDecliningRequestId(null);
    }
  };

  // Manual mark as borrowed directly by username
  const handleManualMarkBorrowed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualBorrowerUsername.trim()) return;
    setIsManualSubmitting(true);
    setManualError(null);
    try {
      const record = await markBookAsBorrowed(book.id, manualBorrowerUsername.trim());
      setShowRequestsModal(false);
      setBorrowStatus(record);
      setManualBorrowerUsername("");
      if (onBookUpdate) {
        onBookUpdate({
          ...book,
          isBorrowed: true,
          borrowedByName: record.borrowerFullName || manualBorrowerUsername.trim(),
        });
      }
    } catch (err) {
      const apiError = err as ApiError;
      setManualError(apiError.message || "Failed to mark book as borrowed");
    } finally {
      setIsManualSubmitting(false);
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
      navigate("/library?tab=uploaded", {
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

  const fromLocation = (location.state as { from?: string; tab?: string })?.from;
  const fromTab = (location.state as { from?: string; tab?: string })?.tab;

  const handleBack = () => {
    if (fromLocation) {
      navigate(fromLocation);
    } else if (fromTab) {
      navigate(`/library?tab=${fromTab}`);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="w-full">
      {/* Back Button */}
      <button
        onClick={handleBack}
        className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white mb-8 transition group cursor-pointer"
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
              <OptimizedImage
                src={book.image}
                alt={book.title}
                className="relative w-full max-w-md rounded-2xl shadow-2xl aspect-[2/3] object-cover"
                placeholderColor="#e2e8f0"
                lazy={false}
                fetchPriority="high"
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
                {book.genre ? (
                  <p className="font-semibold text-black dark:text-white">
                    {book.genre}
                  </p>
                ) : isInitialPlaceholder ? (
                  <div className="h-6 w-28 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse" />
                ) : (
                  <p className="font-semibold text-black dark:text-white">General</p>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h3 className="font-semibold text-black dark:text-white text-lg">
                About this book
              </h3>
              {book.description ? (
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                  {book.description}
                </p>
              ) : isInitialPlaceholder ? (
                <div className="space-y-2 animate-pulse pt-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6" />
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 italic text-sm">
                  No description provided for this book.
                </p>
              )}

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

            {/* Owner Pending Requests Banner */}
            {isUploader && !isBorrowed && borrowRequests.length > 0 && (
              <div className="p-3.5 bg-amber-50 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700/60 rounded-xl flex items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                      {borrowRequests.length} Pending Borrow {borrowRequests.length === 1 ? "Request" : "Requests"}
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-400 truncate">
                      Click Mark as Borrowed to review and approve
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleViewRequests}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg transition shrink-0 cursor-pointer shadow-xs"
                >
                  Review
                </button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              {/* Main action button - changes based on borrow status and ownership */}
              {isBorrowStatusLoading ? (
                // Loading state
                <Button
                  disabled
                  size="lg"
                  className="w-full bg-gray-300 dark:bg-gray-700 text-gray-500 font-semibold cursor-not-allowed animate-pulse"
                >
                  Loading...
                </Button>
              ) : isBorrowed ? (
                // Book is already borrowed - show disabled button
                <Button
                  disabled
                  size="lg"
                  className="w-full bg-gray-400 dark:bg-gray-600 text-white font-semibold cursor-not-allowed"
                >
                  <UserCheck className="w-5 h-5 mr-2" />
                  Borrowed
                </Button>
              ) : isUploader ? (
                // Owner sees "Mark as Borrowed" which opens requests modal
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={handleViewRequests}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  <UserCheck className="w-5 h-5" />
                  <span>Mark as Borrowed</span>
                  {borrowRequests.length > 0 && (
                    <span className="ml-1.5 px-2 py-0.5 bg-red-600 text-white text-xs font-bold rounded-full shadow-xs animate-pulse">
                      {borrowRequests.length} {borrowRequests.length === 1 ? "Request" : "Requests"}
                    </span>
                  )}
                </Button>
              ) : (
                // Book is available - show borrow/buy button (sends request + opens WhatsApp)
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleBorrowClick}
                  disabled={isRequestingBorrow}
                  isLoading={isRequestingBorrow}
                  loadingText="Sending Request..."
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold shadow-lg hover:shadow-xl"
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  {book.listingType === "sell" ? "Buy" : "Borrow"}
                </Button>
              )}

              {/* "Return Book" button - ONLY visible to the book uploader when book IS borrowed */}
              {canReturnBook && (
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={handleReturnClick}
                  disabled={isSubmitting}
                  isLoading={isSubmitting}
                  loadingText="Returning..."
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold shadow-lg hover:shadow-xl"
                >
                  <RotateCcw className="w-5 h-5 mr-2" />
                  Mark as Returned
                </Button>
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
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleDeleteClick}
                  disabled={isDeleting}
                  isLoading={isDeleting}
                  loadingText="Deleting..."
                  className="w-full bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 font-semibold"
                >
                  <Trash2 className="w-5 h-5 mr-2" />
                  Delete Book
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Community Reading Journey Timeline */}
        <BookJourneyTimeline
          journey={book.readingJourney}
          isBorrowed={isBorrowed}
          borrowerName={borrowerName}
          dueAt={borrowStatus?.dueAt || book.borrowStatus?.dueAt}
        />

      {/* Borrow Requests Modal - For book owner to see and approve requesters */}
      {showRequestsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-[#2c2c2e] rounded-2xl shadow-2xl max-w-md w-full p-6 relative max-h-[80vh] overflow-hidden flex flex-col border border-gray-200 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-150">
            {/* Close Button */}
            <button
              onClick={() => setShowRequestsModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1.5">
                Mark as Borrowed
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Approve a request to mark "{book.title}" as borrowed
              </p>
            </div>

            {/* Modal Error Message */}
            {modalError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-red-700 dark:text-red-400 text-xs font-medium">
                  {modalError}
                </p>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {isLoadingRequests ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                </div>
              ) : borrowRequests.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 font-medium">
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
                          <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center shrink-0">
                            <span className="text-amber-600 dark:text-amber-400 font-semibold text-base">
                              {request.borrowerFullName?.charAt(0) || "?"}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 dark:text-white truncate text-sm">
                              {request.borrowerFullName || "Unknown User"}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3" />
                              {new Date(
                                request.borrowedAt,
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button
                            onClick={() => handleDeclineRequest(request.id)}
                            disabled={
                              decliningRequestId === request.id ||
                              approvingRequestId === request.id
                            }
                            className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-lg transition disabled:opacity-50 flex items-center gap-1.5 text-xs cursor-pointer"
                          >
                            {decliningRequestId === request.id ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span className="hidden sm:inline">
                                  Declining...
                                </span>
                              </>
                            ) : (
                              <>
                                <X className="w-3.5 h-3.5" />
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
                            className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition disabled:opacity-50 flex items-center gap-1.5 text-xs cursor-pointer shadow-sm"
                          >
                            {approvingRequestId === request.id ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span className="hidden sm:inline">
                                  Approving...
                                </span>
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-3.5 h-3.5" />
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

            {/* Direct manual borrow section */}
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              <form onSubmit={handleManualMarkBorrowed} className="space-y-2">
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Lent to someone directly?
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualBorrowerUsername}
                    onChange={(e) => setManualBorrowerUsername(e.target.value)}
                    placeholder="Enter borrower username"
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1c1c1e] text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                  <button
                    type="submit"
                    disabled={isManualSubmitting || !manualBorrowerUsername.trim()}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg transition disabled:opacity-50 cursor-pointer shrink-0"
                  >
                    {isManualSubmitting ? "Marking..." : "Mark Borrowed"}
                  </button>
                </div>
                {manualError && (
                  <p className="text-xs text-red-500 mt-1">{manualError}</p>
                )}
              </form>
            </div>

            {/* Close button at bottom */}
            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={() => setShowRequestsModal(false)}
                className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition cursor-pointer text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return Confirmation Modal */}
      <ConfirmDialog
        isOpen={showReturnConfirm}
        title="Mark as Returned?"
        message={`This will mark "${book.title}" as returned and make it available for borrowing again.`}
        confirmText="Mark Returned"
        cancelText="Cancel"
        loadingText="Returning..."
        isLoading={isSubmitting}
        variant="success"
        icon={<RotateCcw className="w-6 h-6 text-green-600 dark:text-green-400" />}
        onConfirm={handleReturnConfirm}
        onCancel={handleReturnCancel}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete this book?"
        message={
          deleteError
            ? deleteError
            : `This action cannot be undone. The book "${book.title}" will be permanently removed from your library.`
        }
        confirmText="Delete"
        cancelText="Cancel"
        loadingText="Deleting..."
        isLoading={isDeleting}
        variant="danger"
        icon={<Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  );
}
