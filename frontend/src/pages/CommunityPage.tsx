import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Plus, AlertCircle, Users } from "lucide-react";
import { AppLayout } from "../components/AppLayout";
import { UserAvatar } from "../components/UserAvatar";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Textarea } from "../components/ui/Textarea";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
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
    <AppLayout maxWidth="4xl">
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
            <Button
              onClick={() => setShowNewThreadModal(true)}
              variant="primary"
              size="md"
              icon={<Plus className="h-5 w-5" />}
            >
              <span className="hidden sm:inline">New Discussion</span>
              <span className="sm:hidden">New</span>
            </Button>
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          <LoadingSpinner message="Loading discussions..." />
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <p className="text-gray-700 dark:text-gray-300 mb-4">{error}</p>
            <Button onClick={fetchThreads} variant="primary" size="md">
              Try Again
            </Button>
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
              <Button
                onClick={() => setShowNewThreadModal(true)}
                variant="primary"
                size="lg"
                icon={<Plus className="h-5 w-5" />}
              >
                Start a Discussion
              </Button>
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
      {/* New Thread Modal */}
      {showNewThreadModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#2c2c2e] border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Start a New Discussion
              </h2>

              <form onSubmit={handleCreateThread} className="space-y-4">
                <Input
                  label="Title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="What would you like to discuss?"
                  maxLength={255}
                  required
                  disabled={isCreating}
                />

                <Textarea
                  label="Content"
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Share your thoughts, questions, or ideas..."
                  rows={6}
                  required
                  disabled={isCreating}
                />

                {createError && (
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{createError}</span>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    onClick={() => {
                      setShowNewThreadModal(false);
                      setNewTitle("");
                      setNewContent("");
                      setCreateError(null);
                    }}
                    className="flex-1"
                    disabled={isCreating}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    disabled={
                      isCreating || !newTitle.trim() || !newContent.trim()
                    }
                    isLoading={isCreating}
                    className="flex-1"
                  >
                    Create Discussion
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

export default CommunityPage;
