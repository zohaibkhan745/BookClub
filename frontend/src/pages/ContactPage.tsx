import { Mail, MessageSquare, Heart } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { MobileBottomNav } from "../components/MobileBottomNav";

export function ContactPage() {
  return (
    <div className="min-h-screen bg-[#F6F0D7] dark:bg-[#1c1c1e] transition-colors duration-300">
      <Navbar />

      <main className="pt-24 pb-24 md:pb-12 px-4 md:px-12">
        <div className="max-w-2xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl mb-6 shadow-lg">
              <MessageSquare className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Contact Us
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-xl mx-auto leading-relaxed">
              We'd love to hear from you.
            </p>
          </div>

          {/* Contact Card */}
          <div className="bg-white/60 dark:bg-white/5 backdrop-blur-sm rounded-2xl p-8 md:p-12 border border-amber-200/50 dark:border-white/10 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full mb-6">
              <Mail className="w-8 h-8 text-red-500 dark:text-red-400" />
            </div>

            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
              Get in Touch
            </h2>

            <p className="text-gray-600 dark:text-gray-400 leading-relaxed max-w-md mx-auto mb-8">
              Have feedback, suggestions, or found a bug? We're always looking
              to improve BookClub and would love to hear your thoughts.
            </p>

            {/* Email */}
            <a
              href="mailto:u2023787@giki.edu.pk"
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-xl hover:from-red-600 hover:to-red-700 transition shadow-lg hover:shadow-xl"
            >
              <Mail className="w-5 h-5" />
              u2023787@giki.edu.pk
            </a>

          </div>

          {/* Additional Info */}
          <div className="mt-8 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-white/5 dark:to-white/5 rounded-2xl p-8 border border-amber-200/50 dark:border-white/10">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
                <Heart className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Your Feedback Matters
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                  BookClub is built for our community, and your input helps
                  shape what it becomes. Whether it's a feature request, a kind
                  word, or constructive criticism—we're listening.
                </p>
              </div>
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
