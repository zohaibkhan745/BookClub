import { useState } from "react";
import {
  Upload,
  X,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { MobileBottomNav } from "../components/MobileBottomNav";
import { createBook } from "../services";
import { useAuth } from "../context/AuthContext";
import {
  uploadBookImage,
  deleteBookImage,
  compressImage,
  revokeImagePreview,
} from "../services/imageUploadService";
import type {
  ListingType,
  BookCategory,
  BookCondition,
  ApiError,
} from "../types";
import { BOOK_CATEGORIES } from "../types";

/** Available book conditions */
const BOOK_CONDITIONS: {
  value: BookCondition;
  label: string;
  emoji: string;
}[] = [
  { value: "new", label: "New", emoji: "✨" },
  { value: "like-new", label: "Like New", emoji: "🌟" },
  { value: "good", label: "Good", emoji: "👍" },
  { value: "fair", label: "Fair", emoji: "📖" },
  { value: "poor", label: "Poor", emoji: "📚" },
];

/** Image state with file, preview URL, and uploaded URL */
interface ImageState {
  file: File;
  previewUrl: string;
  uploadedUrl?: string;
  uploadedPath?: string;
  thumbnailUrl?: string;
  thumbnailPath?: string;
  isUploading?: boolean;
  error?: string;
}

/** Field-level error state */
type FieldErrors = Record<string, string>;

export function UploadBook() {
  const navigate = useNavigate();
  const { user, isAuthenticated, refreshCredits } = useAuth();

  // Image state - now stores file objects with preview URLs
  const [imageStates, setImageStates] = useState<ImageState[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState<BookCategory | "">("");
  const [listingType, setListingType] = useState<ListingType | "">("");
  const [condition, setCondition] = useState<BookCondition | "">("good");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Error and success states
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  /** Clears error for a specific field when user starts typing */
  const clearFieldError = (field: string) => {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = async (files: FileList) => {
    if (!isAuthenticated || !user) {
      setSubmitError("Please sign in to upload images.");
      return;
    }

    const fileArray = Array.from(files);
    const remainingSlots = 3 - imageStates.length;
    const filesToAdd = fileArray.slice(0, remainingSlots);

    // Clear previous image errors
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.images;
      return next;
    });

    // Process files sequentially
    for (const file of filesToAdd) {
      // Validate file type (now accepts more formats since we convert to WebP)
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
        "image/bmp",
      ];
      if (!allowedTypes.includes(file.type)) {
        setFieldErrors((prev) => ({
          ...prev,
          images: "Only JPEG, PNG, WebP, GIF, and BMP images are allowed.",
        }));
        continue;
      }

      // Validate file size (20MB max for input)
      if (file.size > 20 * 1024 * 1024) {
        setFieldErrors((prev) => ({
          ...prev,
          images: "Image must be less than 20MB.",
        }));
        continue;
      }

      // Show temporary loading state
      const tempPreviewUrl = URL.createObjectURL(file);
      const tempIndex = imageStates.length;

      setImageStates((prev) => [
        ...prev,
        { file, previewUrl: tempPreviewUrl, isUploading: true },
      ]);

      try {
        // Compress the image (converts to WebP, max 1200px, under 1MB)
        const { blob, previewUrl } = await compressImage(file);

        // Create a new File object from the compressed blob
        const compressedFile = new File(
          [blob],
          file.name.replace(/\.[^.]+$/, ".webp"),
          { type: "image/webp" },
        );

        // Revoke the temporary preview URL
        revokeImagePreview(tempPreviewUrl);

        // Update state with compressed image
        setImageStates((prev) =>
          prev.map((img, idx) =>
            idx === tempIndex
              ? { file: compressedFile, previewUrl, isUploading: false }
              : img,
          ),
        );
      } catch (error) {
        // Remove the failed image from state
        setImageStates((prev) => prev.filter((_, idx) => idx !== tempIndex));
        revokeImagePreview(tempPreviewUrl);

        const errorMessage =
          error instanceof Error ? error.message : "Failed to process image.";
        setFieldErrors((prev) => ({
          ...prev,
          images: errorMessage,
        }));
      }
    }
  };

  const removeImage = (index: number) => {
    setImageStates((prev) => {
      const imageToRemove = prev[index];
      // Revoke preview URL to free memory
      revokeImagePreview(imageToRemove.previewUrl);
      // If already uploaded, delete from storage
      if (imageToRemove.uploadedPath) {
        deleteBookImage(imageToRemove.uploadedPath).catch(console.error);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length <= 100) {
      // Auto-capitalize words
      const capitalized = value
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      setTitle(capitalized);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setSubmitError(null);
    setSubmitSuccess(false);

    if (!isAuthenticated || !user) {
      setSubmitError("Please sign in to upload a book.");
      return;
    }

    // Validate at least one image
    if (imageStates.length === 0) {
      setFieldErrors((prev) => ({
        ...prev,
        images: "At least one image is required.",
      }));
      return;
    }

    setIsSubmitting(true);
    setIsUploadingImages(true);

    try {
      // Step 1: Upload all images to Supabase Storage
      const uploadedUrls: string[] = [];
      const uploadedPaths: string[] = [];
      const thumbnailUrls: string[] = [];

      for (let i = 0; i < imageStates.length; i++) {
        const imageState = imageStates[i];

        // Skip if already uploaded
        if (imageState.uploadedUrl) {
          uploadedUrls.push(imageState.uploadedUrl);
          if (imageState.uploadedPath)
            uploadedPaths.push(imageState.uploadedPath);
          if (imageState.thumbnailUrl)
            thumbnailUrls.push(imageState.thumbnailUrl);
          continue;
        }

        try {
          const result = await uploadBookImage(imageState.file, user.id);
          uploadedUrls.push(result.url);
          uploadedPaths.push(result.path);
          if (result.thumbnailUrl) thumbnailUrls.push(result.thumbnailUrl);

          // Update state with uploaded URL
          setImageStates((prev) =>
            prev.map((img, idx) =>
              idx === i
                ? {
                    ...img,
                    uploadedUrl: result.url,
                    uploadedPath: result.path,
                    thumbnailUrl: result.thumbnailUrl,
                    thumbnailPath: result.thumbnailPath,
                  }
                : img,
            ),
          );
        } catch (uploadErr) {
          console.error("Image upload failed:", uploadErr);
          setFieldErrors((prev) => ({
            ...prev,
            images: `Failed to upload image ${i + 1}. Please try again.`,
          }));
          setIsUploadingImages(false);
          setIsSubmitting(false);
          return;
        }
      }

      setIsUploadingImages(false);

      // Step 2: Create book with the uploaded image URLs
      await createBook({
        images: uploadedUrls,
        thumbnails: thumbnailUrls,
        title,
        author,
        category,
        listingType,
        condition,
        price,
        description,
        whatsappNumber: whatsappNumber ? `+92${whatsappNumber}` : "",
      });

      setSubmitSuccess(true);
      // Refresh credits (user earned +1 for uploading)
      await refreshCredits();
      // Clean up preview URLs
      imageStates.forEach((img) => revokeImagePreview(img.previewUrl));
      // Navigate to home after brief success message
      setTimeout(() => navigate("/"), 1500);
    } catch (err) {
      const apiError = err as ApiError;

      if (apiError.code === "VALIDATION_ERROR" && apiError.details) {
        // Map field-level errors
        const errors: FieldErrors = {};
        apiError.details.forEach((detail) => {
          errors[detail.field] = detail.message;
        });
        setFieldErrors(errors);
      } else {
        // General error - ensure message is a string
        const errorMessage =
          typeof apiError.message === "string"
            ? apiError.message
            : typeof apiError.message === "object" && apiError.message !== null
              ? JSON.stringify(apiError.message)
              : "Failed to upload book. Please try again.";
        setSubmitError(errorMessage);
      }
    } finally {
      setIsUploadingImages(false);
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#F6F0D7] dark:bg-[#1c1c1e] pt-24 pb-24 md:pb-0 transition-colors duration-300">
        <div className="px-4 md:px-12 max-w-4xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white mb-6 transition group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>Back</span>
          </button>

          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-black dark:text-white mb-2">
              Upload Your Book
            </h1>
            <p className="text-gray-700 dark:text-gray-300">
              Share your books with the community
            </p>
          </div>

          {/* Success Message */}
          {submitSuccess && (
            <div className="mb-6 p-4 bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-600 rounded-lg flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              <p className="text-green-800 dark:text-green-300 font-medium">
                Book uploaded successfully! Redirecting...
              </p>
            </div>
          )}

          {/* General Error Message */}
          {submitError && (
            <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="text-red-800 dark:text-red-300">{submitError}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6 pb-8">
            {/* Book Images */}
            <div className="space-y-3">
              <label className="block text-black dark:text-white font-semibold">
                Book Images{" "}
                <span className="text-red-600 dark:text-red-400">*</span>
              </label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Upload 1-3 images. Front cover required.
              </p>
              {fieldErrors.images && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {fieldErrors.images}
                </p>
              )}

              {/* Image Previews */}
              {imageStates.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mb-3">
                  {imageStates.map((imageState, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={imageState.previewUrl}
                        alt={`Book ${index + 1}`}
                        className="w-full h-40 object-cover rounded-lg border-2 border-amber-200 dark:border-amber-700"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        disabled={isSubmitting}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition disabled:opacity-50"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      {index === 0 && (
                        <span className="absolute bottom-2 left-2 px-2 py-1 bg-blue-500 text-white text-xs rounded">
                          Front Cover
                        </span>
                      )}
                      {imageState.uploadedUrl && (
                        <span className="absolute top-2 left-2 px-2 py-1 bg-green-500 text-white text-xs rounded">
                          ✓ Uploaded
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Area */}
              {imageStates.length < 3 && (
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`relative border-2 border-dashed rounded-xl p-8 text-center transition ${
                    dragActive
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                      : "border-amber-300 dark:border-amber-600 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"
                  }`}
                >
                  <input
                    type="file"
                    id="file-upload"
                    multiple
                    accept="image/*"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                  <Upload className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-700 dark:text-gray-300 mb-2">
                    Drag and drop your images here, or{" "}
                    <label
                      htmlFor="file-upload"
                      className="text-blue-600 dark:text-blue-400 cursor-pointer hover:underline"
                    >
                      browse
                    </label>
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {imageStates.length}/3 images uploaded
                  </p>
                </div>
              )}
            </div>

            {/* Title */}
            <div className="space-y-3">
              <label className="block text-black dark:text-white font-semibold">
                Book Title{" "}
                <span className="text-red-600 dark:text-red-400">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  handleTitleChange(e);
                  clearFieldError("title");
                }}
                placeholder="Enter book title"
                className={`w-full px-4 py-3 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border focus:outline-none text-gray-800 dark:text-white placeholder:text-gray-400 ${
                  fieldErrors.title
                    ? "border-red-400 focus:border-red-500"
                    : "border-amber-300 dark:border-gray-600 focus:border-blue-500"
                }`}
              />
              {fieldErrors.title ? (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {fieldErrors.title}
                </p>
              ) : (
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {title.length}/100 characters
                </p>
              )}
            </div>

            {/* Author */}
            <div className="space-y-3">
              <label className="block text-black dark:text-white font-semibold">
                Author <span className="text-red-600 dark:text-red-400">*</span>
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => {
                  setAuthor(e.target.value);
                  clearFieldError("author");
                }}
                placeholder="Enter author name"
                className={`w-full px-4 py-3 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border focus:outline-none text-gray-800 dark:text-white placeholder:text-gray-400 ${
                  fieldErrors.author
                    ? "border-red-400 focus:border-red-500"
                    : "border-amber-300 dark:border-gray-600 focus:border-blue-500"
                }`}
              />
              {fieldErrors.author && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {fieldErrors.author}
                </p>
              )}
            </div>

            {/* WhatsApp Number */}
            <div className="space-y-3">
              <label className="block text-black dark:text-white font-semibold">
                WhatsApp Number{" "}
                <span className="text-red-600 dark:text-red-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-400 font-medium">
                  +92
                </span>
                <input
                  type="tel"
                  value={whatsappNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    setWhatsappNumber(value);
                    clearFieldError("whatsappNumber");
                  }}
                  placeholder="3001234567"
                  className={`w-full pl-16 pr-4 py-3 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border focus:outline-none text-gray-800 dark:text-white placeholder:text-gray-400 ${
                    fieldErrors.whatsappNumber
                      ? "border-red-400 focus:border-red-500"
                      : "border-amber-300 dark:border-gray-600 focus:border-green-500"
                  }`}
                  maxLength={10}
                />
              </div>
              {fieldErrors.whatsappNumber ? (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {fieldErrors.whatsappNumber}
                </p>
              ) : (
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Enter your 10-digit mobile number (without +92)
                </p>
              )}
            </div>

            {/* Category */}
            <div className="space-y-3">
              <label className="block text-black dark:text-white font-semibold">
                Category / Genre{" "}
                <span className="text-red-600 dark:text-red-400">*</span>
              </label>
              {fieldErrors.category && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {fieldErrors.category}
                </p>
              )}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {BOOK_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setCategory(cat);
                      clearFieldError("category");
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      category === cat
                        ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white"
                        : "bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-amber-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-purple-500"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Type of Listing */}
            <div className="space-y-3">
              <label className="block text-black dark:text-white font-semibold">
                Type of Listing{" "}
                <span className="text-red-600 dark:text-red-400">*</span>
              </label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Select exactly one option
              </p>
              {fieldErrors.listingType && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {fieldErrors.listingType}
                </p>
              )}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setListingType("lend");
                    clearFieldError("listingType");
                  }}
                  className={`px-6 py-6 rounded-xl font-semibold transition shadow-md ${
                    listingType === "lend"
                      ? "bg-gradient-to-r from-green-500 to-green-600 text-white scale-105 shadow-lg"
                      : "bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-2 border-amber-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-green-500"
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">📚</div>
                    <div>Lend</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setListingType("sell");
                    clearFieldError("listingType");
                  }}
                  className={`px-6 py-6 rounded-xl font-semibold transition shadow-md ${
                    listingType === "sell"
                      ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white scale-105 shadow-lg"
                      : "bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-2 border-amber-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-orange-500"
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">💰</div>
                    <div>Sell</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Book Condition */}
            <div className="space-y-3">
              <label className="block text-black dark:text-white font-semibold">
                Book Condition{" "}
                <span className="text-red-600 dark:text-red-400">*</span>
              </label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                What's the physical condition of the book?
              </p>
              {fieldErrors.condition && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {fieldErrors.condition}
                </p>
              )}
              <div className="grid grid-cols-5 gap-2">
                {BOOK_CONDITIONS.map((cond) => (
                  <button
                    key={cond.value}
                    type="button"
                    onClick={() => {
                      setCondition(cond.value);
                      clearFieldError("condition");
                    }}
                    className={`px-3 py-3 rounded-lg font-medium transition text-center ${
                      condition === cond.value
                        ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white scale-105 shadow-md"
                        : "bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-amber-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-amber-500"
                    }`}
                  >
                    <div className="text-lg mb-1">{cond.emoji}</div>
                    <div className="text-xs">{cond.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Price (Conditional) */}
            {listingType === "sell" && (
              <div className="space-y-3">
                <label className="block text-black dark:text-white font-semibold">
                  Price{" "}
                  <span className="text-red-600 dark:text-red-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-400 font-medium">
                    PKR
                  </span>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => {
                      setPrice(e.target.value);
                      clearFieldError("price");
                    }}
                    placeholder="0"
                    className={`w-full pl-16 pr-4 py-3 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border focus:outline-none text-gray-800 dark:text-white placeholder:text-gray-400 ${
                      fieldErrors.price
                        ? "border-red-400 focus:border-red-500"
                        : "border-amber-300 dark:border-gray-600 focus:border-orange-500"
                    }`}
                  />
                </div>
                {fieldErrors.price && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {fieldErrors.price}
                  </p>
                )}
              </div>
            )}

            {/* Description */}
            <div className="space-y-3">
              <label className="block text-black dark:text-white font-semibold">
                Short Description{" "}
                <span className="text-gray-500 dark:text-gray-400 text-sm font-normal">
                  (Optional but recommended)
                </span>
              </label>
              <textarea
                value={description}
                onChange={(e) => {
                  if (e.target.value.length <= 300) {
                    setDescription(e.target.value);
                  }
                }}
                placeholder="Anything someone should know before requesting this book?"
                rows={4}
                className="w-full px-4 py-3 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-amber-300 dark:border-gray-600 focus:outline-none focus:border-blue-500 text-gray-800 dark:text-white placeholder:text-gray-400 resize-none"
              />
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {description.length}/300 characters
              </p>
            </div>

            {/* Submit Button */}
            <div className="pt-4 pb-4 md:pb-0">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-6 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-xl hover:from-red-600 hover:to-red-700 transition shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {isUploadingImages
                      ? "Uploading images..."
                      : "Creating book..."}
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Upload Book
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
      <div className="hidden md:block">
        <Footer />
      </div>
      <div className="md:hidden">
        <MobileBottomNav />
      </div>
    </>
  );
}
