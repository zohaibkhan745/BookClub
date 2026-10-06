import { BookOpen, Users, Heart, Sparkles } from "lucide-react";
import { AppLayout } from "../components/AppLayout";

export function AboutPage() {
  return (
    <AppLayout maxWidth="4xl">
      <div className="max-w-3xl mx-auto py-4">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-2xl mb-4 shadow-sm">
            <BookOpen className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            About BookClub
          </h1>
          <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            A simple idea born from a love of reading and community.
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-10">
          {/* What is BookClub */}
          <section className="bg-white/70 dark:bg-[#2c2c2e] rounded-2xl p-6 md:p-8 border border-gray-200 dark:border-gray-700 shadow-sm">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-3">
              What is BookClub?
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3 text-sm md:text-base">
              BookClub is a platform where readers connect to share the books
              they love. Whether you have a shelf full of stories waiting for
              new readers or you're looking for your next great read, BookClub
              makes it easy to borrow, lend, and discover books within your
              community.
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm md:text-base">
              No complicated systems, no fees—just people sharing books with
              people.
            </p>
          </section>

          {/* Values */}
          <section>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
              What We Believe In
            </h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="bg-white/70 dark:bg-[#2c2c2e] rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl mb-3">
                  <Users className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1.5 text-sm md:text-base">
                  Community First
                </h3>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  Books are better when shared. We believe in the power of
                  readers helping readers.
                </p>
              </div>

              <div className="bg-white/70 dark:bg-[#2c2c2e] rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl mb-3">
                  <Sparkles className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1.5 text-sm md:text-base">
                  Keep It Simple
                </h3>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  No clutter, no complexity. Just a clean, calm space to find
                  and share books.
                </p>
              </div>

              <div className="bg-white/70 dark:bg-[#2c2c2e] rounded-2xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl mb-3">
                  <Heart className="w-6 h-6 text-red-500 dark:text-red-400" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1.5 text-sm md:text-base">
                  Made with Care
                </h3>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  Every detail is crafted thoughtfully, because readers
                  deserve a beautiful experience.
                </p>
              </div>
            </div>
          </section>

          {/* Origin */}
          <section className="bg-white/50 dark:bg-white/5 rounded-2xl p-6 md:p-8 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Our Story
            </h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3 text-sm md:text-base">
              BookClub started at GIKI, where students often had great books
              sitting on their shelves while others were searching for the
              same titles. We thought: why not connect them?
            </p>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm md:text-base">
              What began as a simple idea has grown into a platform that
              celebrates the joy of reading and the generosity of sharing.
              Every book exchanged is a story that continues its journey.
            </p>
          </section>
        </div>
      </div>
    </AppLayout>
  );
}
