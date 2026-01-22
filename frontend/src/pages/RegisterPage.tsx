import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  BookOpen,
  CheckCircle,
  User,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Navbar } from "../components/Navbar";
import { MobileBottomNav } from "../components/MobileBottomNav";

export function RegisterPage() {
  const navigate = useNavigate();
  const { signUp, isLoading: authLoading } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(5);

  // Password requirements
  const passwordRequirements = [
    { met: password.length >= 6, text: "At least 6 characters" },
  ];

  // Countdown and redirect after success
  useEffect(() => {
    if (!success) return;

    if (countdown <= 0) {
      navigate("/login");
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [success, countdown, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic validation
    if (!fullName.trim()) {
      setError("Full name is required");
      return;
    }
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    if (!password) {
      setError("Password is required");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await signUp(email, password, fullName);
      if (result.error) {
        setError(result.error);
      } else {
        // Success - show verification card (countdown starts via useEffect)
        setSuccess(true);
        setError(null);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F0D7] dark:bg-[#1c1c1e] transition-colors duration-300">
      <Navbar />

      <div className="pt-24 pb-24 md:pb-12 px-4 flex items-center justify-center min-h-[calc(100vh-80px)]">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-500 rounded-2xl flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Create Account
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Join BookClub and start exploring
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white dark:bg-[#2c2c2e] rounded-2xl shadow-xl p-6 md:p-8">
            {/* Verification Email Sent Card - Shows after successful signup */}
            {success ? (
              <div className="animate-in fade-in zoom-in-95 duration-500">
                {/* Success Icon with Animation */}
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    {/* Animated rings */}
                    <div className="absolute inset-0 w-24 h-24 bg-red-400/20 rounded-full animate-ping" />
                    <div className="absolute inset-2 w-20 h-20 bg-red-400/30 rounded-full animate-pulse" />
                    {/* Main icon container */}
                    <div className="relative w-24 h-24 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg shadow-red-500/30">
                      <Mail className="w-10 h-10 text-white" />
                      <Sparkles className="absolute -top-1 -right-1 w-6 h-6 text-amber-400 animate-bounce" />
                    </div>
                  </div>
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">
                  Verification Email Sent!
                </h2>

                {/* Description */}
                <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
                  We've sent a verification link to{" "}
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {email}
                  </span>
                  . Please check your inbox and click the link to verify your
                  account.
                </p>

                {/* Email illustration card */}
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-red-100 dark:bg-red-800/50 rounded-full flex items-center justify-center shrink-0">
                      <CheckCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-red-800 dark:text-red-300">
                        What's next?
                      </p>
                      <ul className="mt-2 text-sm text-red-700 dark:text-red-400 space-y-1">
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                          Open your email inbox
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                          Click the verification link
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                          Sign in and start exploring!
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Countdown progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-2">
                    <span>Redirecting to login...</span>
                    <span className="font-mono font-semibold text-red-600 dark:text-red-400">
                      {countdown}s
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full transition-all duration-1000 ease-linear"
                      style={{ width: `${(countdown / 5) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Manual redirect button */}
                <button
                  onClick={() => navigate("/login")}
                  className="w-full py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-xl hover:from-red-600 hover:to-red-700 transition shadow-lg hover:shadow-xl"
                >
                  Go to Login Now
                </button>

                {/* Spam notice */}
                <p className="text-xs text-gray-500 dark:text-gray-500 text-center mt-4">
                  Didn't receive the email? Check your spam folder or contact
                  support.
                </p>
              </div>
            ) : (
              <>
                {/* Error Alert */}
                {error && (
                  <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-red-700 dark:text-red-400 text-sm">
                      {error}
                    </p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Full Name Field */}
                  <div className="space-y-2">
                    <label
                      htmlFor="fullName"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        id="fullName"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Enter your full name"
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-[#1c1c1e] border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 transition"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  {/* Email Field */}
                  <div className="space-y-2">
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-[#1c1c1e] border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 transition"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Create a password"
                        className="w-full pl-10 pr-12 py-3 rounded-xl bg-gray-50 dark:bg-[#1c1c1e] border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 transition"
                        disabled={isSubmitting}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>

                    {/* Password Requirements */}
                    {password && (
                      <div className="mt-2 space-y-1">
                        {passwordRequirements.map((req, index) => (
                          <div
                            key={index}
                            className={`flex items-center space-x-2 text-xs ${
                              req.met
                                ? "text-green-600 dark:text-green-400"
                                : "text-gray-500 dark:text-gray-400"
                            }`}
                          >
                            <CheckCircle
                              className={`w-3.5 h-3.5 ${
                                req.met ? "opacity-100" : "opacity-40"
                              }`}
                            />
                            <span>{req.text}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Confirm Password Field */}
                  <div className="space-y-2">
                    <label
                      htmlFor="confirmPassword"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm your password"
                        className="w-full pl-10 pr-12 py-3 rounded-xl bg-gray-50 dark:bg-[#1c1c1e] border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 transition"
                        disabled={isSubmitting}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting || authLoading}
                    className="w-full py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-xl hover:from-red-600 hover:to-red-700 transition shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Creating Account..." : "Create Account"}
                  </button>
                </form>

                {/* Divider */}
                <div className="my-6 flex items-center">
                  <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
                  <span className="px-4 text-sm text-gray-500 dark:text-gray-400">
                    Already have an account?
                  </span>
                  <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
                </div>

                {/* Login Link */}
                <Link
                  to="/login"
                  className="block w-full py-3 text-center font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition"
                >
                  Sign In Instead
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden">
        <MobileBottomNav />
      </div>
    </div>
  );
}
