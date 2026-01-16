import { HelpCircle, Clock } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { MobileBottomNav } from "../components/MobileBottomNav";

export function FAQPage() {
  return (
    <div className="min-h-screen bg-[#F6F0D7] dark:bg-[#1c1c1e] transition-colors duration-300">
      <Navbar />

      <main className="pt-24 pb-24 md:pb-12 px-4 md:px-12">
        <div className="max-w-2xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl mb-6 shadow-lg">
              <HelpCircle className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              FAQ
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-xl mx-auto leading-relaxed">
              Frequently Asked Questions
            </p>
          </div>

          {/* Coming Soon Card */}
          <div className="bg-white/60 dark:bg-white/5 backdrop-blur-sm rounded-2xl p-12 border border-amber-200/50 dark:border-white/10 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full mb-6">
              <Clock className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            </div>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
              Coming Soon
            </h2>

            <p className="text-gray-600 dark:text-gray-400 leading-relaxed max-w-md mx-auto mb-8">
              We're gathering the most common questions from our community to
              build a helpful FAQ section. Check back soon!
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition"
              >
                Have a Question?
              </a>
              <a
                href="/how-it-works"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-white/20 transition"
              >
                How It Works
              </a>
            </div>
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
