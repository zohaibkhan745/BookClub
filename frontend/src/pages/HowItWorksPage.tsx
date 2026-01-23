import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Upload,
  MessageCircle,
  BookOpen,
  ArrowRight,
  Sparkles,
  Trophy,
  Star,
  Award,
  BookMarked,
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { MobileBottomNav } from "../components/MobileBottomNav";

const steps = [
  {
    number: "01",
    icon: Search,
    title: "Browse & Discover",
    actionTitle: "Find Your Next Read",
    description:
      "Explore thousands of books shared by readers in your community. Use smart filters to discover hidden gems by genre, author, or rating.",
    color: "bg-[#F7DB91]",
    iconColor: "text-amber-700",
    borderColor: "border-amber-300",
    linkTo: "/",
    linkText: "Browse Books",
  },
  {
    number: "02",
    icon: Upload,
    title: "List Your Library",
    actionTitle: "Share What You Love",
    description:
      "Snap a photo of your book, add a quick description, and make it available to fellow readers. Your shelf becomes their treasure.",
    color: "bg-[#EDEDCE]",
    iconColor: "text-green-700",
    borderColor: "border-green-300",
    linkTo: "/upload",
    linkText: "Upload a Book",
  },
  {
    number: "03",
    icon: MessageCircle,
    title: "Connect Instantly",
    actionTitle: "Start the Conversation",
    description:
      "One tap to reach out via WhatsApp. Coordinate pickup times, discuss the book, or just chat about your favorite stories.",
    color: "bg-[#FFFBB1]",
    iconColor: "text-purple-700",
    borderColor: "border-purple-300",
  },
  {
    number: "04",
    icon: BookOpen,
    title: "Read & Pass It On",
    actionTitle: "Keep Stories Moving",
    description:
      "Immerse yourself in the story, then return it for the next reader. Every book shared creates a new connection in our reading community.",
    color: "bg-[#F5E7C6]",
    iconColor: "text-red-700",
    borderColor: "border-red-300",
    linkTo: "/library",
    linkText: "View Library",
  },
];

export function HowItWorksPage() {
  const [visibleSteps, setVisibleSteps] = useState<Set<number>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute("data-index"));
            setVisibleSteps((prev) => new Set(prev).add(index));
          }
        });
      },
      {
        threshold: 0.2,
        rootMargin: "0px 0px -50px 0px",
      },
    );

    const elements = document.querySelectorAll("[data-step-card]");
    elements.forEach((el) => observerRef.current?.observe(el));

    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#F6F0D7] dark:bg-[#1c1c1e] transition-colors duration-300 overflow-hidden">
      <Navbar />

      <main className="pt-24 pb-24 md:pb-12 px-4 md:px-12">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-red-600 dark:text-red-400" />
              <span className="text-sm font-medium text-red-700 dark:text-red-300">
                Simple. Social. Sustainable.
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              How It Works
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Four easy steps to start sharing books with your community. Join
              thousands of readers making stories accessible.
            </p>

            {/* Physical Books Notice */}
            <div className="mt-8 inline-flex items-center gap-3 px-6 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl">
              <BookMarked className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
              <p className="text-sm md:text-base text-amber-800 dark:text-amber-300">
                <span className="font-semibold">Physical Books Only</span> —
                This community is for sharing real, paper books and hardcovers.
                No PDFs or eBooks.
              </p>
            </div>
          </div>

          {/* Steps - Zigzag Layout */}
          <div className="relative max-w-6xl mx-auto">
            {/* Curved Connection Line - Desktop Only */}
            <div className="hidden md:block absolute top-0 left-1/2 -translate-x-1/2 w-1 h-full">
              <svg
                className="w-full h-full"
                viewBox="0 0 4 1000"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                preserveAspectRatio="none"
              >
                <path
                  d="M2 0 Q2 125, 2 250 Q2 375, 2 500 Q2 625, 2 750 Q2 875, 2 1000"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray="8 8"
                  className="text-amber-300 dark:text-amber-700"
                />
              </svg>
            </div>

            <div className="space-y-16 md:space-y-24">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isEven = index % 2 === 0;
                const isVisible = visibleSteps.has(index);

                return (
                  <div
                    key={step.number}
                    data-step-card
                    data-index={index}
                    className={`relative transition-all duration-700 ${
                      isVisible
                        ? "opacity-100 translate-y-0"
                        : "opacity-0 translate-y-8"
                    }`}
                    style={{ transitionDelay: `${index * 100}ms` }}
                  >
                    <div
                      className={`flex flex-col ${
                        isEven ? "md:flex-row" : "md:flex-row-reverse"
                      } items-center gap-6 md:gap-12`}
                    >
                      {/* Content Card */}
                      <div className="flex-1 w-full">
                        <div
                          className={`group relative bg-white/80 dark:bg-white/5 backdrop-blur-sm rounded-3xl p-8 border-2 ${step.borderColor} hover:border-red-400 dark:hover:border-red-600 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1`}
                        >
                          {/* Step Number Badge */}
                          <div
                            className={`absolute -top-4 ${
                              isEven ? "left-8" : "right-8"
                            } px-4 py-2 ${step.color} rounded-full border-2 ${step.borderColor} shadow-lg`}
                          >
                            <span className="text-sm font-bold text-gray-800">
                              Step {step.number}
                            </span>
                          </div>

                          {/* Icon */}
                          <div
                            className={`inline-flex items-center justify-center w-16 h-16 ${step.color} rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300`}
                          >
                            <Icon className={`w-8 h-8 ${step.iconColor}`} />
                          </div>

                          {/* Title */}
                          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                            {step.title}
                          </h3>
                          <p className="text-red-600 dark:text-red-400 font-semibold mb-4">
                            {step.actionTitle}
                          </p>

                          {/* Description */}
                          <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg mb-6">
                            {step.description}
                          </p>

                          {/* Action Button */}
                          {step.linkTo && (
                            <Link
                              to={step.linkTo}
                              className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
                            >
                              <span>{step.linkText}</span>
                              <ArrowRight className="w-4 h-4" />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Mobile Connection Dots */}
                    {index < steps.length - 1 && (
                      <div className="flex md:hidden justify-center mt-8">
                        <div className="flex flex-col items-center gap-2">
                          {[...Array(3)].map((_, i) => (
                            <div
                              key={i}
                              className="w-2 h-2 bg-amber-400 dark:bg-amber-600 rounded-full"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Credit & Badge System Section */}
          <div className="mt-24 max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 dark:bg-amber-900/30 rounded-full mb-4">
                <Trophy className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                  Earn Rewards
                </span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Credits & Badges
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Get rewarded for being an active member of our book-sharing
                community.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* How to Earn Credits */}
              <div className="bg-white/80 dark:bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/40 rounded-xl flex items-center justify-center">
                    <Star className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Earn Credits
                  </h3>
                </div>
                <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 font-bold">+1</span>
                    <span>Welcome bonus when you sign up</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 font-bold">+1</span>
                    <span>Upload a book to share with the community</span>
                  </li>
                </ul>
              </div>

              {/* How Borrowing Works */}
              <div className="bg-white/80 dark:bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/40 rounded-xl flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    How Borrowing Works
                  </h3>
                </div>
                <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 font-bold">🔒</span>
                    <span>When you borrow, 1 credit is frozen (held)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 font-bold">🔓</span>
                    <span>
                      When you return the book, your credit is unfrozen
                    </span>
                  </li>
                </ul>
                <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                  Your credits are never spent—just temporarily held while you
                  enjoy the book!
                </p>
              </div>
            </div>

            {/* Badges */}
            <div className="mt-8 bg-white/80 dark:bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/40 rounded-xl flex items-center justify-center">
                  <Award className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Unlock Badges
                </h3>
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Earn badges as you reach credit milestones. Show off your
                contributions to the community!
              </p>
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                  <span>📚</span>
                  <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
                    Bookworm (10+)
                  </span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                  <span>⭐</span>
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
                    Contributor (25+)
                  </span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                  <span>🏆</span>
                  <span className="text-sm font-medium text-purple-800 dark:text-purple-300">
                    Champion (50+)
                  </span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 rounded-full">
                  <span>👑</span>
                  <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
                    Legend (100+)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-24 text-center">
            <div className="relative bg-gradient-to-br from-red-500 via-red-600 to-red-700 rounded-3xl p-12 text-white overflow-hidden shadow-2xl">
              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />

              <div className="relative z-10">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Ready to Start Sharing?
                </h2>
                <p className="text-red-100 text-lg mb-8 max-w-2xl mx-auto">
                  Join our thriving community of book lovers. Share what you
                  have, discover what you need.
                </p>
                <Link
                  to="/"
                  className="inline-flex items-center gap-3 px-8 py-4 bg-white text-red-600 font-bold text-lg rounded-2xl hover:bg-red-50 hover:scale-105 transition-all duration-300 shadow-xl"
                >
                  <BookOpen className="w-6 h-6" />
                  Browse Books Now
                </Link>
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
