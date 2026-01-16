import { BookOpen, Users, Heart, Sparkles } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { MobileBottomNav } from "../components/MobileBottomNav";

export function AboutPage() {
  return (
    <div className="min-h-screen bg-[#F6F0D7] dark:bg-[#1c1c1e] transition-colors duration-300">
      <Navbar />

      <main className="pt-24 pb-24 md:pb-12 px-4 md:px-12">
        <div className="max-w-3xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl mb-6 shadow-lg">
              <BookOpen className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
              About BookClub
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
              A simple idea born from a love of reading and community.
            </p>
          </div>

          {/* Main Content */}
          <div className="space-y-12">
            {/* What is BookClub */}
            <section className="bg-white/60 dark:bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-amber-200/50 dark:border-white/10">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                What is BookClub?
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                BookClub is a platform where readers connect to share the books
                they love. Whether you have a shelf full of stories waiting for
                new readers or you're looking for your next great read, BookClub
                makes it easy to borrow, lend, and discover books within your
                community.
              </p>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                No complicated systems, no fees—just people sharing books with
                people.
              </p>
            </section>

            {/* Values */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6 text-center">
                What We Believe In
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-white/60 dark:bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-amber-200/50 dark:border-white/10 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl mb-4">
                    <Users className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Community First
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Books are better when shared. We believe in the power of
                    readers helping readers.
                  </p>
                </div>

                <div className="bg-white/60 dark:bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-amber-200/50 dark:border-white/10 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl mb-4">
                    <Sparkles className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Keep It Simple
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    No clutter, no complexity. Just a clean, calm space to find
                    and share books.
                  </p>
                </div>

                <div className="bg-white/60 dark:bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-amber-200/50 dark:border-white/10 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl mb-4">
                    <Heart className="w-6 h-6 text-red-500 dark:text-red-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Made with Care
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Every detail is crafted thoughtfully, because readers
                    deserve a beautiful experience.
                  </p>
                </div>
              </div>
            </section>

            {/* Origin */}
            <section className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-white/5 dark:to-white/5 rounded-2xl p-8 border border-amber-200/50 dark:border-white/10">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                Our Story
              </h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                BookClub started at GIKI, where students often had great books
                sitting on their shelves while others were searching for the
                same titles. We thought: why not connect them?
              </p>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                What began as a simple idea has grown into a platform that
                celebrates the joy of reading and the generosity of sharing.
                Every book exchanged is a story that continues its journey.
              </p>
            </section>
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
