import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, AlertCircle, BookOpen } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { AppLayout } from "../components/AppLayout";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";

// Google Icon Component
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signInWithGoogle, isLoading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Get the redirect path from location state, default to home
  const from = (location.state as { from?: string })?.from || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic validation
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    if (!password) {
      setError("Password is required");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await signIn(email, password);
      if (result.error) {
        setError(result.error);
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsGoogleLoading(true);

    try {
      const result = await signInWithGoogle();
      if (result.error) {
        setError(result.error);
        setIsGoogleLoading(false);
      }
      // If successful, user will be redirected by OAuth flow
    } catch (err) {
      setError("Failed to sign in with Google. Please try again.");
      setIsGoogleLoading(false);
    }
  };

  return (
    <AppLayout showFooter={false} maxWidth="4xl">
      <div className="flex items-center justify-center py-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-500 rounded-2xl flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Welcome Back
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Sign in to continue to BookClub
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-[#FAF7EE] dark:bg-[#2c2c2e] rounded-2xl shadow-xl border border-black/10 dark:border-gray-700 p-6 md:p-8">
            {/* Error Alert */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 dark:text-red-400 text-sm">
                  {error}
                </p>
              </div>
            )}

            {/* Google Sign In Button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading || isSubmitting || authLoading}
              className="w-full py-3 px-4 flex items-center justify-center gap-3 bg-white dark:bg-[#1c1c1e] border border-black/10 dark:border-gray-700 rounded-xl hover:bg-black/5 dark:hover:bg-[#2c2c2e] hover:border-black/20 dark:hover:border-gray-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md cursor-pointer"
            >
              <GoogleIcon className="w-5 h-5" />
              <span className="font-semibold text-gray-700 dark:text-gray-200">
                {isGoogleLoading ? "Connecting..." : "Continue with Google"}
              </span>
            </button>

            {/* Divider */}
            <div className="my-6 flex items-center">
              <div className="flex-1 border-t border-black/10 dark:border-gray-700" />
              <span className="px-4 text-sm text-gray-600 dark:text-gray-400">
                or sign in with email
              </span>
              <div className="flex-1 border-t border-black/10 dark:border-gray-700" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <Input
                id="email"
                type="email"
                label="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                leftIcon={<Mail className="w-5 h-5" />}
                disabled={isSubmitting}
                required
              />

              {/* Password Field */}
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                label="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                leftIcon={<Lock className="w-5 h-5" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition cursor-pointer"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                }
                disabled={isSubmitting}
                required
              />

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isSubmitting}
                disabled={isSubmitting || authLoading}
                className="w-full shadow-lg hover:shadow-xl font-semibold"
              >
                Sign In
              </Button>
            </form>

            {/* Divider */}
            <div className="my-6 flex items-center">
              <div className="flex-1 border-t border-black/10 dark:border-gray-700" />
              <span className="px-4 text-sm text-gray-600 dark:text-gray-400">
                New to BookClub?
              </span>
              <div className="flex-1 border-t border-black/10 dark:border-gray-700" />
            </div>

            {/* Register Link */}
            <Link
              to="/register"
              className="block w-full py-3 text-center font-semibold text-red-600 dark:text-red-400 bg-red-500/10 dark:bg-red-900/20 border border-red-500/20 dark:border-red-800/30 rounded-xl hover:bg-red-500/15 dark:hover:bg-red-900/30 transition shadow-sm"
            >
              Create an Account
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
