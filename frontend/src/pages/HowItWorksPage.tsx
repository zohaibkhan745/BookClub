import {
  Search,
  Upload,
  MessageCircle,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { MobileBottomNav } from "../components/MobileBottomNav";

const steps = [
  {
    number: "01",
    icon: Search,
    title: "Browse & Discover",
    description:
      "Explore our collection of books shared by community members. Filter by genre, search by title, or just browse and see what catches your eye.",
    color: "bg-blue-100 dark:bg-blue-900/30",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  {
    number: "02",
    icon: Upload,
    title: "Share Your Books",
    description:
      "Have books you'd like to share? Upload them to the platform with a photo and description. Help others discover stories you've enjoyed.",
    color: "bg-green-100 dark:bg-green-900/30",
    iconColor: "text-green-600 dark:text-green-400",
  },
  {
    number: "03",
    icon: MessageCircle,
    title: "Connect Directly",
    description:
      "Found a book you want? Reach out to the owner directly through WhatsApp. Arrange a time and place that works for both of you.",
    color: "bg-purple-100 dark:bg-purple-900/30",
    iconColor: "text-purple-600 dark:text-purple-400",
  },
  {
    number: "04",
    icon: BookOpen,
    title: "Read & Return",
    description:
      "Enjoy your borrowed book, then return it when you're done. The cycle continues as books find new readers and stories keep traveling.",
    color: "bg-amber-100 dark:bg-amber-900/30",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
];

export function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-[#F6F0D7] dark:bg-[#1c1c1e] transition-colors duration-300">
      <Navbar />

      <main className="pt-24 pb-24 md:pb-12 px-4 md:px-12">
        <div className="max-w-3xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              How It Works
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Sharing books should be simple. Here's how BookClub makes it easy.
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-6">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.number} className="relative">
                  <div className="bg-white/60 dark:bg-white/5 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-amber-200/50 dark:border-white/10">
                    <div className="flex flex-col md:flex-row md:items-center gap-6">
                      {/* Step Number & Icon */}
                      <div className="flex items-center gap-4 md:flex-col md:items-center md:min-w-[100px]">
                        <span className="text-5xl font-bold text-gray-200 dark:text-gray-700">
                          {step.number}
                        </span>
                        <div
                          className={`flex items-center justify-center w-14 h-14 ${step.color} rounded-xl`}
                        >
                          <Icon className={`w-7 h-7 ${step.iconColor}`} />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                          {step.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Arrow between steps */}
                  {index < steps.length - 1 && (
                    <div className="flex justify-center py-2">
                      <ArrowRight className="w-5 h-5 text-gray-300 dark:text-gray-600 rotate-90" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* CTA */}
          <div className="mt-16 text-center">
            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-8 text-white">
              <h2 className="text-2xl font-semibold mb-3">
                Ready to get started?
              </h2>
              <p className="text-red-100 mb-6">
                Join our community of readers and start sharing books today.
              </p>
              <a
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-red-600 font-semibold rounded-xl hover:bg-red-50 transition"
              >
                <BookOpen className="w-5 h-5" />
                Browse Books
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
