import {
  BookOpen,
  Brain,
  Heart,
  Briefcase,
  Sparkles,
  Globe,
  Zap,
  Music,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export function CategorySection() {
  const navigate = useNavigate();

  const categories = [
    {
      id: 1,
      name: "Self Help",
      slug: "self-help",
      icon: Heart,
      color: "from-pink-500 to-rose-500",
    },
    {
      id: 2,
      name: "Philosophy",
      slug: "philosophy",
      icon: Brain,
      color: "from-purple-500 to-indigo-500",
    },
    {
      id: 3,
      name: "Fiction",
      slug: "fiction",
      icon: BookOpen,
      color: "from-blue-500 to-cyan-500",
    },
    {
      id: 4,
      name: "Business",
      slug: "business",
      icon: Briefcase,
      color: "from-green-500 to-emerald-500",
    },
    {
      id: 5,
      name: "Science Fiction",
      slug: "science-fiction",
      icon: Sparkles,
      color: "from-yellow-500 to-orange-500",
    },
    {
      id: 6,
      name: "History",
      slug: "history",
      icon: Globe,
      color: "from-red-500 to-pink-500",
    },
    {
      id: 7,
      name: "Biography",
      slug: "biography",
      icon: Zap,
      color: "from-teal-500 to-green-500",
    },
    {
      id: 8,
      name: "Poetry",
      slug: "poetry",
      icon: Music,
      color: "from-indigo-500 to-purple-500",
    },
  ];

  const handleCategoryClick = (slug: string) => {
    navigate(`/genre/${slug}`);
  };

  return (
    <div className="space-y-4 py-8">
      <h3 className="text-black dark:text-white text-xl md:text-2xl font-semibold">
        Browse by Category
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {categories.map((category) => {
          const Icon = category.icon;
          return (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category.slug)}
              className={`relative overflow-hidden rounded-2xl p-6 md:p-8 bg-gradient-to-br ${category.color} hover:scale-105 transition-transform duration-300 group shadow-xl`}
            >
              <div className="absolute inset-0 bg-white/10 backdrop-blur-sm group-hover:bg-white/5 transition-colors border border-white/20 bg-[rgba(197,216,157,0.1)]" />
              <div className="relative flex flex-col items-center justify-center space-y-3">
                <Icon className="w-8 h-8 md:w-10 md:h-10 text-white drop-shadow-lg" />
                <span className="text-white font-semibold text-sm md:text-base text-center drop-shadow-md">
                  {category.name}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
