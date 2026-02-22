import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { MobileBottomNav } from "../components/MobileBottomNav";
import {
  ScrollText,
  BookOpen,
  Users,
  AlertTriangle,
  Scale,
  RefreshCw,
} from "lucide-react";

export function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-[#F6F0D7] dark:bg-[#1c1c1e] transition-colors duration-300">
      <Navbar />

      <main className="pt-24 pb-24 md:pb-12 px-4 md:px-12">
        <div className="max-w-3xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-3">
            <ScrollText className="w-12 h-12 text-amber-600 dark:text-amber-400 mx-auto" />
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
              Terms of Service
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Last updated: February 2026
            </p>
          </div>

          {/* Introduction */}
          <div className="bg-white/60 dark:bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-amber-200/50 dark:border-white/10 space-y-4">
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Welcome to BookClub! By using our platform, you agree to the
              following terms and conditions. Please read them carefully. If you
              do not agree with any of these terms, you should not use BookClub.
            </p>
          </div>

          {/* Use of the Platform */}
          <div className="bg-white/60 dark:bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-amber-200/50 dark:border-white/10 space-y-4">
            <div className="flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Use of the Platform
              </h2>
            </div>
            <ul className="space-y-3 text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-amber-600 dark:text-amber-400 mt-1">
                  •
                </span>
                <span>
                  BookClub is a community platform for GIKI students to share,
                  lend, borrow, and exchange books.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 dark:text-amber-400 mt-1">
                  •
                </span>
                <span>
                  You must create an account to list books, borrow books, or
                  participate in the community forum.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 dark:text-amber-400 mt-1">
                  •
                </span>
                <span>
                  You must provide accurate information when creating your
                  account and listing books.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 dark:text-amber-400 mt-1">
                  •
                </span>
                <span>
                  You are responsible for maintaining the security of your
                  account credentials.
                </span>
              </li>
            </ul>
          </div>

          {/* Book Listings & Borrowing */}
          <div className="bg-white/60 dark:bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-amber-200/50 dark:border-white/10 space-y-4">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Book Listings & Borrowing
              </h2>
            </div>
            <ul className="space-y-3 text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-amber-600 dark:text-amber-400 mt-1">
                  •
                </span>
                <span>
                  Borrowers are responsible for returning books in the same
                  condition they were received.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 dark:text-amber-400 mt-1">
                  •
                </span>
                <span>
                  If a borrowed book is damaged or lost, the borrower is
                  responsible for replacement or compensation as agreed with the
                  owner.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 dark:text-amber-400 mt-1">
                  •
                </span>
                <span>
                  BookClub is not responsible for transactions between users.
                  All lending and borrowing arrangements are between the parties
                  involved.
                </span>
              </li>
            </ul>
          </div>

          {/* Community Guidelines */}
          <div className="bg-white/60 dark:bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-amber-200/50 dark:border-white/10 space-y-4">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Community Conduct
              </h2>
            </div>
            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
              By participating in the BookClub community, you agree to:
            </p>
            <ul className="space-y-3 text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-amber-600 dark:text-amber-400 mt-1">
                  •
                </span>
                <span>Treat all members with respect and courtesy</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 dark:text-amber-400 mt-1">
                  •
                </span>
                <span>Not post offensive, harmful, or misleading content</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 dark:text-amber-400 mt-1">
                  •
                </span>
                <span>
                  Not spam or use the platform for commercial advertising
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 dark:text-amber-400 mt-1">
                  •
                </span>
                <span>
                  Follow the full{" "}
                  <a
                    href="/community-guidelines"
                    className="text-red-600 dark:text-red-400 hover:underline"
                  >
                    Community Guidelines
                  </a>
                </span>
              </li>
            </ul>
          </div>

          {/* Prohibited Activities */}
          <div className="bg-white/60 dark:bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-amber-200/50 dark:border-white/10 space-y-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Prohibited Activities
              </h2>
            </div>
            <ul className="space-y-3 text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-1">✕</span>
                <span>Listing pirated, counterfeit, or stolen books</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-1">✕</span>
                <span>Creating fake accounts or impersonating other users</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-1">✕</span>
                <span>
                  Attempting to exploit or abuse the platform's features
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-1">✕</span>
                <span>
                  Harassing other members or engaging in harmful behavior
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500 mt-1">✕</span>
                <span>
                  Using bots or automated tools to interact with the platform
                </span>
              </li>
            </ul>
          </div>

          {/* Limitation of Liability */}
          <div className="bg-white/60 dark:bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-amber-200/50 dark:border-white/10 space-y-4">
            <div className="flex items-center gap-3">
              <Scale className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Limitation of Liability
              </h2>
            </div>
            <ul className="space-y-3 text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-amber-600 dark:text-amber-400 mt-1">
                  •
                </span>
                <span>
                  BookClub is provided "as is" without warranties of any kind.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 dark:text-amber-400 mt-1">
                  •
                </span>
                <span>
                  We are not liable for any damages arising from the use of the
                  platform, including lost or damaged books.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 dark:text-amber-400 mt-1">
                  •
                </span>
                <span>
                  We reserve the right to suspend or terminate accounts that
                  violate these terms.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 dark:text-amber-400 mt-1">
                  •
                </span>
                <span>
                  We may update these terms at any time. Continued use of the
                  platform constitutes acceptance of any changes.
                </span>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="bg-white/60 dark:bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-amber-200/50 dark:border-white/10 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Questions?
            </h2>
            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
              If you have any questions about these Terms of Service, please
              visit our{" "}
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
