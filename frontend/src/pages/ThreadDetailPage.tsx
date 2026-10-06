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
import { AppLayout } from "../components/AppLayout";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { UserAvatar } from "../components/UserAvatar";
import { Button } from "../components/ui/Button";
import { Textarea } from "../components/ui/Textarea";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
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
    <AppLayout maxWidth="4xl">
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
          <LoadingSpinner message="Loading discussion..." />
        ) : error || !thread ? (
          <div className="flex flex-col items-center justify-center py-20">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              {error || "Discussion not found"}
            </p>
            <Button
              onClick={() => navigate("/community")}
              variant="primary"
              size="md"
            >
              Back to Community
            </Button>
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
              <div className="bg-white dark:bg-[#2c2c2e] rounded-2xl p-4 shadow-sm sticky bottom-20 md:bottom-4 border border-gray-200 dark:border-gray-700">
                <form onSubmit={handleSubmitReply} className="flex gap-3">
                  <Textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Write a reply..."
                    rows={2}
                    containerClassName="flex-1"
                    className="resize-none"
                    disabled={isReplying}
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    disabled={isReplying || !replyContent.trim()}
                    isLoading={isReplying}
                    icon={<Send className="h-4 w-4" />}
                    className="self-end"
                  >
                    <span className="hidden sm:inline">Reply</span>
                  </Button>
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
      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Discussion?"
        message="This action cannot be undone. All replies will also be deleted."
        confirmText="Delete"
        cancelText="Cancel"
        loadingText="Deleting..."
        isLoading={isDeleting}
        variant="danger"
        icon={<Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />}
        onConfirm={handleDeleteThread}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </AppLayout>
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
