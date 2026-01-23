import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Plus, Loader2, AlertCircle, Users } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { MobileBottomNav } from "../components/MobileBottomNav";
import { UserAvatar } from "../components/UserAvatar";
import { useAuth } from "../context/AuthContext";
import {
  getForumThreads,
  createThread,
  formatRelativeTime,
  type ForumThread,
} from "../services";

export function CommunityPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // State
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New thread modal state
  const [showNewThreadModal, setShowNewThreadModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Fetch threads on mount
  useEffect(() => {
    fetchThreads();
  }, []);

  const fetchThreads = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getForumThreads();
      setThreads(result.threads);
    } catch (err) {
      console.error("Failed to fetch threads:", err);
      setError("Failed to load discussions. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    setIsCreating(true);
    setCreateError(null);

    try {
      const newThread = await createThread(newTitle.trim(), newContent.trim());
      setThreads([newThread, ...threads]);
      setShowNewThreadModal(false);
      setNewTitle("");
      setNewContent("");
      // Navigate to the new thread
      navigate(`/community/${newThread.id}`);
    } catch (err) {
      console.error("Failed to create thread:", err);
      setCreateError("Failed to create discussion. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F0D7] dark:bg-[#1c1c1e] transition-colors duration-300">
      <Navbar />

      <main className="pt-24 pb-24 md:pb-12 px-4 md:px-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Users className="h-8 w-8 text-amber-500" />
              Community
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Discuss books, share recommendations, and connect with readers
            </p>
          </div>

          {isAuthenticated && (
            <button
              onClick={() => setShowNewThreadModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium rounded-xl transition-colors shadow-lg hover:shadow-xl"
            >
              <Plus className="h-5 w-5" />
              <span className="hidden sm:inline">New Discussion</span>
            </button>
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-amber-500 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              Loading discussions...
            </p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <p className="text-gray-700 dark:text-gray-300 mb-4">{error}</p>
            <button
              onClick={fetchThreads}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg transition"
            >
              Try Again
            </button>
          </div>
        ) : threads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <MessageCircle className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
              No discussions yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
              Be the first to start a conversation! Share your thoughts about a
              book, ask for recommendations, or discuss anything book-related.
            </p>
            {isAuthenticated && (
              <button
                onClick={() => setShowNewThreadModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl transition"
              >
                <Plus className="h-5 w-5" />
                Start a Discussion
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {threads.map((thread) => (
              <div
                key={thread.id}
                onClick={() => navigate(`/community/${thread.id}`)}
                className="bg-white dark:bg-gray-800/50 rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer border border-transparent hover:border-amber-200 dark:hover:border-amber-800"
              >
                <div className="flex gap-4">
                  {/* Avatar */}
                  <UserAvatar name={thread.author.full_name} size="md" />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 truncate">
                      {thread.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                      {thread.content}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-500">
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {thread.author.full_name}
                      </span>
                      <span>•</span>
                      <span>{formatRelativeTime(thread.created_at)}</span>
                    </div>
                  </div>

                  {/* Reply Count Badge */}
                  <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/50 px-3 py-1.5 rounded-full h-fit">
                    <MessageCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {thread.reply_count}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* New Thread Modal */}
      {showNewThreadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Start a New Discussion
              </h2>

              <form onSubmit={handleCreateThread} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Title
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="What would you like to discuss?"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
                    maxLength={255}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Content
                  </label>
                  <textarea
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="Share your thoughts, questions, or ideas..."
                    rows={6}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition resize-none"
                    required
                  />
                </div>

                {createError && (
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    {createError}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewThreadModal(false);
                      setNewTitle("");
                      setNewContent("");
                      setCreateError(null);
                    }}
                    className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      isCreating || !newTitle.trim() || !newContent.trim()
                    }
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Discussion"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <Footer />
      <MobileBottomNav />
    </div>
  );
}

export default CommunityPage;
