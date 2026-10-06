import { HelpCircle, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { AppLayout } from "../components/AppLayout";

export function FAQPage() {
  return (
    <AppLayout maxWidth="4xl">
      <div className="max-w-2xl mx-auto py-4">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-2xl mb-4 shadow-sm">
            <HelpCircle className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            FAQ
          </h1>
          <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
            Frequently Asked Questions
          </p>
        </div>

        {/* Coming Soon Card */}
        <div className="bg-white/70 dark:bg-[#2c2c2e] rounded-2xl p-8 md:p-12 border border-gray-200 dark:border-gray-700 shadow-sm text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-amber-100 dark:bg-amber-900/30 rounded-full mb-5">
            <Clock className="w-7 h-7 text-amber-600 dark:text-amber-400" />
          </div>

          <h2 className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            Coming Soon
          </h2>

          <p className="text-gray-600 dark:text-gray-400 leading-relaxed max-w-md mx-auto mb-8 text-sm md:text-base">
            We're gathering the most common questions from our community to build
            a helpful FAQ section. Check back soon!
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/contact"
              className="inline-flex items-center justify-center px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl transition shadow-sm w-full sm:w-auto"
            >
              Have a Question?
            </Link>
            <Link
              to="/how-it-works"
              className="inline-flex items-center justify-center px-6 py-2.5 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-gray-800 dark:text-gray-200 font-medium rounded-xl transition w-full sm:w-auto"
            >
              How It Works
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
