import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { MobileBottomNav } from "../components/MobileBottomNav";
import { Shield, Eye, Lock, UserCheck, Database, Mail } from "lucide-react";

export function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#F6F0D7] dark:bg-[#1c1c1e] transition-colors duration-300">
      <Navbar />

      <main className="pt-24 pb-24 md:pb-12 px-4 md:px-12">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-3">
            <Shield className="w-12 h-12 text-amber-600 dark:text-amber-400 mx-auto" />
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
              Privacy Policy
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Last updated: February 2026
            </p>
          </div>

          {/* Introduction */}
          <div className="bg-white/60 dark:bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-amber-200/50 dark:border-white/10 space-y-4">
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              BookClub is a community platform built for
              GIKI students to share, borrow, and discover books. We are
              committed to protecting your privacy. This policy explains what
              data we collect, how we use it, and your rights.
            </p>
          </div>

          {/* Information We Collect */}
          <div className="bg-white/60 dark:bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-amber-200/50 dark:border-white/10 space-y-4">
            <div className="flex items-center gap-3">
              <Database className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Information We Collect
              </h2>
            </div>
            <ul className="space-y-3 text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-amber-600 dark:text-amber-400 mt-1">
                  •
                </span>
                <span>
                  <strong>Account information:</strong> Your name, email
                  address, and profile picture when you sign up via email or
                  Google OAuth through Supabase.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 dark:text-amber-400 mt-1">
                  •
                </span>
                <span>
                  <strong>Book listings:</strong> Information about books you
                  upload, including title, author, genre, condition, and cover
                  images.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 dark:text-amber-400 mt-1">
                  •
                </span>
                <span>
                  <strong>Borrow records:</strong> Data about book borrowing and
                  lending transactions between users.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 dark:text-amber-400 mt-1">
                  •
                </span>
                <span>
                  <strong>Community posts:</strong> Forum threads and replies
                  you create in the community section.
                </span>
              </li>
            </ul>
          </div>

          {/* How We Use Your Information */}
          <div className="bg-white/60 dark:bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-amber-200/50 dark:border-white/10 space-y-4">
            <div className="flex items-center gap-3">
              <Eye className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                How We Use Your Information
              </h2>
            </div>
            <ul className="space-y-3 text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-amber-600 dark:text-amber-400 mt-1">
                  •
                </span>
                <span>To create and manage your account</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 dark:text-amber-400 mt-1">
                  •
                </span>
                <span>
                  To facilitate book lending, borrowing, and exchanges between
                  users
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 dark:text-amber-400 mt-1">
                  •
                </span>
                <span>
                  To display your profile and book listings to other community
                  members
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 dark:text-amber-400 mt-1">
                  •
                </span>
                <span>To power the leaderboard and community features</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 dark:text-amber-400 mt-1">
                  •
                </span>
                <span>
                  To send notifications about new books and features (if
                  subscribed)
                </span>
              </li>
            </ul>
          </div>

          {/* Data Security */}
          <div className="bg-white/60 dark:bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-amber-200/50 dark:border-white/10 space-y-4">
            <div className="flex items-center gap-3">
              <Lock className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Data Security
              </h2>
            </div>
            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
              Your data is stored securely using Supabase (hosted on AWS). We
              use industry-standard security measures including:
            </p>
            <ul className="space-y-3 text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-amber-600 dark:text-amber-400 mt-1">
                  •
                </span>
                <span>
                  Encrypted connections (HTTPS/TLS) for all data in transit
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 dark:text-amber-400 mt-1">
                  •
                </span>
                <span>
                  Secure authentication via Supabase Auth (passwords are never
                  stored in plain text)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 dark:text-amber-400 mt-1">
                  •
                </span>
                <span>Row-level security policies on the database</span>
              </li>
            </ul>
          </div>

          {/* Your Rights */}
          <div className="bg-white/60 dark:bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-amber-200/50 dark:border-white/10 space-y-4">
            <div className="flex items-center gap-3">
              <UserCheck className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Your Rights
              </h2>
            </div>
            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
              You have the right to:
            </p>
            <ul className="space-y-3 text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-amber-600 dark:text-amber-400 mt-1">
                  •
                </span>
                <span>
                  Access and view all data associated with your account
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 dark:text-amber-400 mt-1">
                  •
                </span>
                <span>
                  Update or correct your profile information at any time
                </span>
              </li>
            </ul>
          </div>

    
          {/* Contact */}
          <div className="bg-white/60 dark:bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-amber-200/50 dark:border-white/10 space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Contact Us
              </h2>
            </div>
            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
              If you have any questions about this Privacy Policy or want to
              exercise your data rights, please reach out through our{" "}
              <a
                href="/contact"
                className="text-red-600 dark:text-red-400 hover:underline"
              >
                Contact page
              </a>
              .
            </p>
          </div>
        </div>
      </main>

      <div className="hidden md:block">
        <Footer />
      </div>
      <MobileBottomNav />
    </div>
  );
}
