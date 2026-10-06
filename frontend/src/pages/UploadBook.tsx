import { useState, useRef } from "react";
import {
  Upload,
  X,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  ImagePlus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "../components/AppLayout";
import { Input } from "../components/ui/Input";
import { Textarea } from "../components/ui/Textarea";
import { Button } from "../components/ui/Button";
import { createBook } from "../services";
import { useAuth } from "../context/AuthContext";
import {
  uploadBookImage,
  deleteBookImage,
  compressImage,
  revokeImagePreview,
} from "../services/imageUploadService";
import type { BookCategory, ApiError } from "../types";
import { BOOK_CATEGORIES } from "../types";

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

  // Ref for file input
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Image state - now stores file objects with preview URLs
  const [imageStates, setImageStates] = useState<ImageState[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState<BookCategory | "">("");

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
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
    // Reset value so re-uploading the same file works if previously removed
    e.target.value = "";
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
    <AppLayout maxWidth="4xl">
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
              <div className="flex items-center justify-between">
                <label className="block text-black dark:text-white font-semibold">
                  Book Images{" "}
                  <span className="text-red-600 dark:text-red-400">*</span>
                </label>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  {imageStates.length}/3 photos
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Upload 1 to 3 images. Front cover required.
              </p>
              {fieldErrors.images && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {fieldErrors.images}
                </p>
              )}

              {/* Single unified hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                multiple
                accept="image/*"
                onChange={handleFileInput}
                className="hidden"
                disabled={isSubmitting}
              />

              {/* State 1: Zero images uploaded -> Clean, unified Hero Dropzone */}
              {imageStates.length === 0 && (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`group relative flex flex-col items-center justify-center p-8 md:p-10 rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${
                    dragActive
                      ? "border-red-500 bg-red-500/10 dark:bg-red-900/20 scale-[0.99]"
                      : "border-black/15 dark:border-white/15 bg-[#FAF7EE] dark:bg-[#2c2c2e] hover:border-red-500/70 dark:hover:border-red-400/70 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                  }`}
                >
                  <div className="w-16 h-16 mb-4 rounded-2xl bg-red-500/10 dark:bg-red-500/20 flex items-center justify-center text-red-600 dark:text-red-400 group-hover:scale-110 transition-transform duration-200 shadow-sm">
                    <ImagePlus className="w-8 h-8" />
                  </div>
                  <p className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-1 text-center">
                    Click to upload or drag & drop
                  </p>
                  <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 text-center max-w-sm">
                    Take a photo or choose from your library. Front cover required.
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 bg-black/5 dark:bg-white/5 px-3 py-1.5 rounded-full">
                    <span>JPEG, PNG, WebP</span>
                    <span>•</span>
                    <span>Max 20MB</span>
                  </div>
                </div>
              )}

              {/* State 2: 1-3 images uploaded -> Grid of previews + Inline '+ Add photo' slot */}
              {imageStates.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
                  {imageStates.map((imageState, index) => (
                    <div
                      key={index}
                      className="relative group rounded-xl overflow-hidden border border-black/10 dark:border-white/10 bg-[#FAF7EE] dark:bg-[#2c2c2e] shadow-sm"
                    >
                      <img
                        src={imageState.previewUrl}
                        alt={`Book photo ${index + 1}`}
                        className="w-full h-40 md:h-44 object-cover"
                      />

                      {/* Processing / Loading overlay */}
                      {imageState.isUploading && (
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex flex-col items-center justify-center gap-2 text-white">
                          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span className="text-[11px] font-medium">Processing...</span>
                        </div>
                      )}

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        disabled={isSubmitting}
                        aria-label={`Remove image ${index + 1}`}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-90 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 transition disabled:opacity-50 cursor-pointer shadow-md"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>

                      {/* Badges */}
                      {index === 0 && (
                        <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-red-500/90 backdrop-blur-xs text-white text-[11px] font-medium rounded-md shadow-sm">
                          Front Cover
                        </span>
                      )}
                      {imageState.uploadedUrl && (
                        <span className="absolute top-2 left-2 px-2 py-0.5 bg-emerald-600/90 backdrop-blur-xs text-white text-[11px] font-medium rounded-md shadow-sm">
                          ✓ Uploaded
                        </span>
                      )}
                    </div>
                  ))}

                  {/* Add Photo Slot in the grid if fewer than 3 */}
                  {imageStates.length < 3 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      disabled={isSubmitting}
                      className={`h-40 md:h-44 rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all duration-200 cursor-pointer group focus:outline-none focus:ring-2 focus:ring-red-500 ${
                        dragActive
                          ? "border-red-500 bg-red-500/10 dark:bg-red-900/20 scale-[0.98]"
                          : "border-black/15 dark:border-white/15 bg-[#FAF7EE] dark:bg-[#2c2c2e] hover:border-red-500/70 dark:hover:border-red-400/70 hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                      }`}
                    >
                      <div className="w-10 h-10 mb-2 rounded-xl bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center group-hover:scale-110 transition duration-200">
                        <ImagePlus className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 group-hover:text-red-600 dark:group-hover:text-red-400 transition">
                        Add Photo
                      </span>
                      <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                        ({imageStates.length}/3)
                      </span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Title */}
            <Input
              label={
                <>
                  Book Title <span className="text-red-600 dark:text-red-400">*</span>
                </>
              }
              type="text"
              value={title}
              onChange={(e) => {
                handleTitleChange(e);
                clearFieldError("title");
              }}
              placeholder="Enter book title"
              error={fieldErrors.title}
              helperText={!fieldErrors.title ? `${title.length}/100 characters` : undefined}
            />

            {/* Author */}
            <Input
              label={
                <>
                  Author <span className="text-red-600 dark:text-red-400">*</span>
                </>
              }
              type="text"
              value={author}
              onChange={(e) => {
                setAuthor(e.target.value);
                clearFieldError("author");
              }}
              placeholder="Enter author name"
              error={fieldErrors.author}
            />

            {/* WhatsApp Number */}
            <Input
              label={
                <>
                  WhatsApp Number <span className="text-red-600 dark:text-red-400">*</span>
                </>
              }
              type="tel"
              value={whatsappNumber}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "");
                setWhatsappNumber(value);
                clearFieldError("whatsappNumber");
              }}
              placeholder="3001234567"
              leftIcon={<span className="text-gray-600 dark:text-gray-400 font-medium">+92</span>}
              error={fieldErrors.whatsappNumber}
              helperText={
                !fieldErrors.whatsappNumber
                  ? "Enter your 10-digit mobile number (without +92)"
                  : undefined
              }
              maxLength={10}
            />

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
                    className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all cursor-pointer ${
                      category === cat
                        ? "bg-red-500 text-white shadow-sm"
                        : "bg-white dark:bg-[#2c2c2e] border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-red-400 dark:border-gray-600"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <Textarea
              label={
                <>
                  Short Description{" "}
                  <span className="text-gray-500 dark:text-gray-400 text-sm font-normal">
                    (Optional but recommended)
                  </span>
                </>
              }
              value={description}
              onChange={(e) => {
                if (e.target.value.length <= 300) {
                  setDescription(e.target.value);
                }
              }}
              placeholder="Anything someone should know before requesting this book?"
              rows={4}
              helperText={`${description.length}/300 characters`}
            />

            {/* Submit Button */}
            <div className="pt-4">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={isSubmitting}
                isLoading={isSubmitting}
                loadingText={
                  isUploadingImages
                    ? "Uploading images..."
                    : "Creating book..."
                }
                className="w-full py-4 shadow-md hover:shadow-lg font-semibold"
              >
                <Upload className="w-5 h-5 mr-2" />
                Upload Book
              </Button>
            </div>
          </form>
    </AppLayout>
  );
}
