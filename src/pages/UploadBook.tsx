import { useState } from "react";
import { Upload, X, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { createBook } from "../services";
import type { ListingType, BookCategory } from "../types";
import { BOOK_CATEGORIES } from "../types";

export function UploadBook() {
  const navigate = useNavigate();
  const [images, setImages] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState<BookCategory | "">("");
  const [listingType, setListingType] = useState<ListingType | "">("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleFiles = (files: FileList) => {
    const fileArray = Array.from(files);
    const remainingSlots = 3 - images.length;
    const filesToAdd = fileArray.slice(0, remainingSlots);

    filesToAdd.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
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

    // Validation
    if (images.length === 0) {
      alert("Please upload at least one book image");
      return;
    }
    if (!title || !author || !category || !listingType) {
      alert("Please fill in all required fields");
      return;
    }
    if (listingType === "sell" && !price) {
      alert("Please enter a price for selling");
      return;
    }
    if (!whatsappNumber) {
      alert("Please enter your WhatsApp number");
      return;
    }

    setIsSubmitting(true);
    try {
      await createBook({
        images,
        title,
        author,
        category,
        listingType,
        price,
        description,
        whatsappNumber,
      });
      alert("Book uploaded successfully!");
      navigate("/");
    } catch (error) {
      alert("Failed to upload book. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#F6F0D7] pt-24 pb-0">
        <div className="px-4 md:px-12 max-w-4xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => navigate("/")}
            className="flex items-center space-x-2 text-gray-700 hover:text-black mb-6 transition group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Home</span>
          </button>

          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-black mb-2">
              Upload Your Book
            </h1>
            <p className="text-gray-700">Share your books with the community</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6 pb-8">
            {/* Book Images */}
            <div className="space-y-3">
              <label className="block text-black font-semibold">
                Book Images <span className="text-red-600">*</span>
              </label>
              <p className="text-sm text-gray-600">
                Upload 1-3 images. Front cover required.
              </p>

              {/* Image Previews */}
              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mb-3">
                  {images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image}
                        alt={`Book ${index + 1}`}
                        className="w-full h-40 object-cover rounded-lg border-2 border-amber-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      {index === 0 && (
                        <span className="absolute bottom-2 left-2 px-2 py-1 bg-blue-500 text-white text-xs rounded">
                          Front Cover
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Area */}
              {images.length < 3 && (
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`relative border-2 border-dashed rounded-xl p-8 text-center transition ${
                    dragActive
                      ? "border-blue-500 bg-blue-50"
                      : "border-amber-300 bg-white/50 backdrop-blur-sm"
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
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-700 mb-2">
                    Drag and drop your images here, or{" "}
                    <label
                      htmlFor="file-upload"
                      className="text-blue-600 cursor-pointer hover:underline"
                    >
                      browse
                    </label>
                  </p>
                  <p className="text-sm text-gray-500">
                    {images.length}/3 images uploaded
                  </p>
                </div>
              )}
            </div>

            {/* Title */}
            <div className="space-y-3">
              <label className="block text-black font-semibold">
                Book Title <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={handleTitleChange}
                placeholder="Enter book title"
                className="w-full px-4 py-3 rounded-lg bg-white/50 backdrop-blur-sm border border-amber-300 focus:outline-none focus:border-blue-500 text-gray-800"
                required
              />
              <p className="text-xs text-gray-600">
                {title.length}/100 characters
              </p>
            </div>

            {/* Author */}
            <div className="space-y-3">
              <label className="block text-black font-semibold">
                Author <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Enter author name"
                className="w-full px-4 py-3 rounded-lg bg-white/50 backdrop-blur-sm border border-amber-300 focus:outline-none focus:border-blue-500 text-gray-800"
                required
              />
            </div>

            {/* WhatsApp Number */}
            <div className="space-y-3">
              <label className="block text-black font-semibold">
                WhatsApp Number <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 font-medium">
                  +92
                </span>
                <input
                  type="tel"
                  value={whatsappNumber}
                  onChange={(e) => {
                    // Only allow numbers
                    const value = e.target.value.replace(/\D/g, "");
                    setWhatsappNumber(value);
                  }}
                  placeholder="3001234567"
                  className="w-full pl-16 pr-4 py-3 rounded-lg bg-white/50 backdrop-blur-sm border border-amber-300 focus:outline-none focus:border-green-500 text-gray-800"
                  required
                  maxLength={10}
                />
              </div>
              <p className="text-xs text-gray-600">
                Enter your 10-digit mobile number (without +92)
              </p>
            </div>

            {/* Category */}
            <div className="space-y-3">
              <label className="block text-black font-semibold">
                Category / Genre <span className="text-red-600">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {BOOK_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      category === cat
                        ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white"
                        : "bg-white/50 backdrop-blur-sm border border-amber-300 text-gray-700 hover:border-purple-500"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Type of Listing */}
            <div className="space-y-3">
              <label className="block text-black font-semibold">
                Type of Listing <span className="text-red-600">*</span>
              </label>
              <p className="text-sm text-gray-600">Select exactly one option</p>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setListingType("lend")}
                  className={`px-6 py-6 rounded-xl font-semibold transition shadow-md ${
                    listingType === "lend"
                      ? "bg-gradient-to-r from-green-500 to-green-600 text-white scale-105 shadow-lg"
                      : "bg-white/70 backdrop-blur-sm border-2 border-amber-300 text-gray-700 hover:border-green-500"
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">📚</div>
                    <div>Lend</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setListingType("borrow")}
                  className={`px-6 py-6 rounded-xl font-semibold transition shadow-md ${
                    listingType === "borrow"
                      ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white scale-105 shadow-lg"
                      : "bg-white/70 backdrop-blur-sm border-2 border-amber-300 text-gray-700 hover:border-blue-500"
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">🔍</div>
                    <div>Borrow</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setListingType("sell")}
                  className={`px-6 py-6 rounded-xl font-semibold transition shadow-md ${
                    listingType === "sell"
                      ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white scale-105 shadow-lg"
                      : "bg-white/70 backdrop-blur-sm border-2 border-amber-300 text-gray-700 hover:border-orange-500"
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">💰</div>
                    <div>Sell</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Price (Conditional) */}
            {listingType === "sell" && (
              <div className="space-y-3">
                <label className="block text-black font-semibold">
                  Price <span className="text-red-600">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 font-medium">
                    PKR
                  </span>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0"
                    className="w-full pl-16 pr-4 py-3 rounded-lg bg-white/50 backdrop-blur-sm border border-amber-300 focus:outline-none focus:border-orange-500 text-gray-800"
                    required={listingType === "sell"}
                  />
                </div>
              </div>
            )}

            {/* Description */}
            <div className="space-y-3">
              <label className="block text-black font-semibold">
                Short Description{" "}
                <span className="text-gray-500 text-sm font-normal">
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
                className="w-full px-4 py-3 rounded-lg bg-white/50 backdrop-blur-sm border border-amber-300 focus:outline-none focus:border-blue-500 text-gray-800 resize-none"
              />
              <p className="text-xs text-gray-600">
                {description.length}/300 characters
              </p>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-6 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-xl hover:from-red-600 hover:to-red-700 transition shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Uploading..." : "Upload Book"}
              </button>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </>
  );
}
