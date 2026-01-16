import {
  Heart,
  CheckCircle,
  Shield,
  MessageCircle,
  BookOpen,
  AlertTriangle,
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { MobileBottomNav } from "../components/MobileBottomNav";

const guidelines = [
  {
    icon: Heart,
    title: "Be Respectful",
    description:
      "Treat every member with kindness and respect. We're all here because we love books.",
    color: "bg-red-100 dark:bg-red-900/30",
    iconColor: "text-red-500 dark:text-red-400",
  },
  {
    icon: CheckCircle,
    title: "Be Honest in Listings",
    description:
      "Describe your books accurately. Mention any wear, highlights, or missing pages so borrowers know what to expect.",
    color: "bg-green-100 dark:bg-green-900/30",
    iconColor: "text-green-600 dark:text-green-400",
  },
  {
    icon: BookOpen,
    title: "Take Care of Borrowed Books",
    description:
      "Handle borrowed books with care. Return them in the same condition you received them.",
    color: "bg-blue-100 dark:bg-blue-900/30",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  {
    icon: MessageCircle,
    title: "Communicate Clearly",
    description:
      "Respond to messages in a timely manner. If plans change, let the other person know.",
    color: "bg-purple-100 dark:bg-purple-900/30",
    iconColor: "text-purple-600 dark:text-purple-400",
  },
  {
    icon: Shield,
    title: "Keep It Safe",
    description:
      "Meet in safe, public places when exchanging books. Trust your instincts.",
    color: "bg-amber-100 dark:bg-amber-900/30",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  {
    icon: AlertTriangle,
    title: "No Spam or Misuse",
    description:
      "Don't post fake listings, spam, or content unrelated to books. Keep the platform focused and useful.",
    color: "bg-gray-100 dark:bg-gray-800/50",
    iconColor: "text-gray-600 dark:text-gray-400",
  },
];

export function CommunityGuidelinesPage() {
  return (
    <div className="min-h-screen bg-[#F6F0D7] dark:bg-[#1c1c1e] transition-colors duration-300">
      <Navbar />

      <main className="pt-24 pb-24 md:pb-12 px-4 md:px-12">
        <div className="max-w-3xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl mb-6 shadow-lg">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              Community Guidelines
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
              A few simple principles to keep BookClub a welcoming place for
              everyone.
            </p>
          </div>

          {/* Guidelines */}
          <div className="space-y-4">
            {guidelines.map((guideline) => {
              const Icon = guideline.icon;
              return (
                <div
                  key={guideline.title}
                  className="bg-white/60 dark:bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-amber-200/50 dark:border-white/10"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex-shrink-0 flex items-center justify-center w-12 h-12 ${guideline.color} rounded-xl`}
                    >
                      <Icon className={`w-6 h-6 ${guideline.iconColor}`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        {guideline.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        {guideline.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Note */}
          <div className="mt-12 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-white/5 dark:to-white/5 rounded-2xl p-8 border border-amber-200/50 dark:border-white/10 text-center">
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              These guidelines exist to protect our community and ensure
              everyone has a positive experience. If you encounter behavior that
              violates these principles, please reach out to us.
            </p>
            <a
              href="/contact"
              className="inline-block mt-4 text-red-600 dark:text-red-400 font-medium hover:underline"
            >
              Contact Us →
            </a>
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
