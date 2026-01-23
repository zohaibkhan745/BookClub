import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MessageCircle,
  Send,
  Loader2,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { MobileBottomNav } from "../components/MobileBottomNav";
import { UserAvatar } from "../components/UserAvatar";
import { useAuth } from "../context/AuthContext";
import {
  getThreadDetail,
  createReply,
  deleteThread,
  deleteReply,
  formatRelativeTime,
  type ForumThreadDetail,
  type ForumReply,
} from "../services";

export function ThreadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  // State
  const [thread, setThread] = useState<ForumThreadDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reply state
  const [replyContent, setReplyContent] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);

  // Delete state
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingReplyId, setDeletingReplyId] = useState<number | null>(null);

  // Fetch thread on mount
  useEffect(() => {
    if (id) {
      fetchThread(parseInt(id));
    }
  }, [id]);

  const fetchThread = async (threadId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getThreadDetail(threadId);
      setThread(data);
    } catch (err) {
      console.error("Failed to fetch thread:", err);
      setError("Discussion not found or failed to load.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || !thread) return;

    setIsReplying(true);
    setReplyError(null);

    try {
      const newReply = await createReply(thread.id, replyContent.trim());
      setThread({
        ...thread,
        replies: [...thread.replies, newReply],
      });
      setReplyContent("");
    } catch (err) {
      console.error("Failed to post reply:", err);
      setReplyError("Failed to post reply. Please try again.");
    } finally {
      setIsReplying(false);
    }
  };

  const handleDeleteThread = async () => {
    if (!thread) return;

    setIsDeleting(true);
    try {
      await deleteThread(thread.id);
      navigate("/community", { replace: true });
    } catch (err) {
      console.error("Failed to delete thread:", err);
      setError("Failed to delete discussion.");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleDeleteReply = async (replyId: number) => {
    if (!thread) return;

    setDeletingReplyId(replyId);
    try {
      await deleteReply(replyId);
      setThread({
        ...thread,
        replies: thread.replies.filter((r) => r.id !== replyId),
      });
    } catch (err) {
      console.error("Failed to delete reply:", err);
    } finally {
      setDeletingReplyId(null);
    }
  };

  const isThreadAuthor = user?.id === thread?.author.id;

  return (
    <div className="min-h-screen bg-[#F6F0D7] dark:bg-[#1c1c1e] transition-colors duration-300">
      <Navbar />

      <main className="pt-24 pb-32 md:pb-12 px-4 md:px-8 max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate("/community")}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition group"
        >
          <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Community</span>
        </button>

        {/* Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-amber-500 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              Loading discussion...
            </p>
          </div>
        ) : error || !thread ? (
          <div className="flex flex-col items-center justify-center py-20">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              {error || "Discussion not found"}
            </p>
            <button
              onClick={() => navigate("/community")}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg transition"
            >
              Back to Community
            </button>
          </div>
        ) : (
          <>
            {/* Thread Header */}
            <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-6 shadow-sm mb-6">
              <div className="flex items-start gap-4">
                <UserAvatar name={thread.author.full_name} size="lg" />

                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {thread.title}
                  </h1>

                  <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      {thread.author.full_name}
                    </span>
                    <span>•</span>
                    <span>{formatRelativeTime(thread.created_at)}</span>
                  </div>

                  <div className="prose prose-gray dark:prose-invert max-w-none">
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {thread.content}
                    </p>
                  </div>
                </div>

                {isThreadAuthor && (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="p-2 text-gray-400 hover:text-red-500 transition"
                    title="Delete discussion"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Replies Section */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-amber-500" />
                Replies ({thread.replies.length})
              </h2>

              {thread.replies.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No replies yet. Be the first to respond!
                </div>
              ) : (
                <div className="space-y-4">
                  {thread.replies.map((reply) => (
                    <ReplyCard
                      key={reply.id}
                      reply={reply}
                      isAuthor={user?.id === reply.author.id}
                      isDeleting={deletingReplyId === reply.id}
                      onDelete={() => handleDeleteReply(reply.id)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Reply Input */}
            {isAuthenticated ? (
              <div className="bg-white dark:bg-gray-800/50 rounded-2xl p-4 shadow-sm sticky bottom-20 md:bottom-4">
                <form onSubmit={handleSubmitReply} className="flex gap-3">
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Write a reply..."
                    rows={2}
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition resize-none"
                  />
                  <button
                    type="submit"
                    disabled={isReplying || !replyContent.trim()}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 h-fit self-end"
                  >
                    {isReplying ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <Send className="h-5 w-5" />
                        <span className="hidden sm:inline">Reply</span>
                      </>
                    )}
                  </button>
                </form>
                {replyError && (
                  <p className="text-red-500 text-sm mt-2">{replyError}</p>
                )}
              </div>
            ) : (
              <div className="bg-gray-100 dark:bg-gray-800/30 rounded-xl p-4 text-center">
                <p className="text-gray-600 dark:text-gray-400">
                  <button
                    onClick={() => navigate("/login")}
                    className="text-amber-600 hover:text-amber-700 font-medium"
                  >
                    Sign in
                  </button>{" "}
                  to join the discussion
                </p>
              </div>
            )}
          </>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              Delete Discussion?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              This action cannot be undone. All replies will also be deleted.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteThread}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
      <MobileBottomNav />
    </div>
  );
}

// Reply Card Component
interface ReplyCardProps {
  reply: ForumReply;
  isAuthor: boolean;
  isDeleting: boolean;
  onDelete: () => void;
}

function ReplyCard({ reply, isAuthor, isDeleting, onDelete }: ReplyCardProps) {
  return (
    <div className="flex gap-3 group">
      <UserAvatar name={reply.author.full_name} size="sm" />

      <div className="flex-1 bg-white dark:bg-gray-800/50 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-gray-900 dark:text-white">
              {reply.author.full_name}
            </span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-500 dark:text-gray-400">
              {formatRelativeTime(reply.created_at)}
            </span>
          </div>

          {isAuthor && (
            <button
              onClick={onDelete}
              disabled={isDeleting}
              className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 transition"
              title="Delete reply"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </button>
          )}
        </div>

        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
          {reply.content}
        </p>
      </div>
    </div>
  );
}

export default ThreadDetailPage;
