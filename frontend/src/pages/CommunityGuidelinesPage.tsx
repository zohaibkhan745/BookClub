import {
  Heart,
  CheckCircle,
  Shield,
  MessageCircle,
  BookOpen,
  AlertTriangle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { AppLayout } from "../components/AppLayout";

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
    <AppLayout maxWidth="4xl">
      <div className="max-w-3xl mx-auto py-4">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-2xl mb-4 shadow-sm">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Community Guidelines
          </h1>
          <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            A few simple principles to keep BookClub a welcoming place for everyone.
          </p>
        </div>

        {/* Guidelines List */}
        <div className="space-y-4">
          {guidelines.map((guideline) => {
            const Icon = guideline.icon;
            return (
              <div
                key={guideline.title}
                className="bg-white/70 dark:bg-[#2c2c2e] rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`shrink-0 flex items-center justify-center w-12 h-12 ${guideline.color} rounded-xl`}
                  >
                    <Icon className={`w-6 h-6 ${guideline.iconColor}`} />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      {guideline.title}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                      {guideline.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Note */}
        <div className="mt-10 bg-white/50 dark:bg-white/5 rounded-2xl p-6 md:p-8 border border-gray-200 dark:border-gray-700 text-center">
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm md:text-base">
            These guidelines exist to protect our community and ensure everyone
            has a positive experience. If you encounter behavior that violates
            these principles, please reach out to us.
          </p>
          <Link
            to="/contact"
            className="inline-block mt-4 text-red-600 dark:text-red-400 font-semibold hover:underline text-sm md:text-base"
          >
            Contact Us →
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
