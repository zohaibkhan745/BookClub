import { Mail, MessageSquare, Heart } from "lucide-react";
import { AppLayout } from "../components/AppLayout";

export function ContactPage() {
  return (
    <AppLayout maxWidth="4xl">
      <div className="max-w-2xl mx-auto py-4">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-2xl mb-4 shadow-sm">
            <MessageSquare className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Contact Us
          </h1>
          <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
            We'd love to hear from you.
          </p>
        </div>

        {/* Contact Card */}
        <div className="bg-white/70 dark:bg-[#2c2c2e] rounded-2xl p-8 md:p-12 border border-gray-200 dark:border-gray-700 shadow-sm text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full mb-5">
            <Mail className="w-7 h-7 text-red-500 dark:text-red-400" />
          </div>

          <h2 className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            Get in Touch
          </h2>

          <p className="text-gray-600 dark:text-gray-400 leading-relaxed max-w-md mx-auto mb-8 text-sm md:text-base">
            Have feedback, suggestions, or found a bug? We're always looking
            to improve BookClub and would love to hear your thoughts.
          </p>

          {/* External email link */}
          <a
            href="mailto:u2023787@giki.edu.pk"
            className="inline-flex items-center gap-3 px-7 py-3.5 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-xl hover:from-red-600 hover:to-red-700 transition shadow-md hover:shadow-lg"
          >
            <Mail className="w-5 h-5" />
            <span>u2023787@giki.edu.pk</span>
          </a>
        </div>

        {/* Additional Info */}
        <div className="mt-8 bg-white/50 dark:bg-white/5 rounded-2xl p-6 md:p-8 border border-gray-200 dark:border-gray-700">
          <div className="flex items-start gap-4">
            <div className="shrink-0 flex items-center justify-center w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
              <Heart className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1.5 text-base">
                Your Feedback Matters
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                BookClub is built for our community, and your input helps
                shape what it becomes. Whether it's a feature request, a kind
                word, or constructive criticism—we're listening.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
