import { BookOpen, Brain, Heart, Globe, Zap, Music } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Import category background images
import philosophyBg from "../assets/images/Philosophy.png";
import selfHelpBg from "../assets/images/Self Help.jpeg";
import fictionBg from "../assets/images/Fiction.jpg";
import historyBg from "../assets/images/History.jpg";
import biographyBg from "../assets/images/Biography.jpg";
import poetryBg from "../assets/images/Poetry.jpeg";

interface Category {
  id: number;
  name: string;
  slug: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  backgroundImage?: string;
}

export function CategorySection() {
  const navigate = useNavigate();

  const categories: Category[] = [
    {
      id: 1,
      name: "Self Help",
      slug: "self-help",
      icon: Heart,
      color: "from-pink-500 to-rose-500",
      backgroundImage: selfHelpBg,
    },
    {
      id: 2,
      name: "Philosophy",
      slug: "philosophy",
      icon: Brain,
      color: "from-purple-500 to-indigo-500",
      backgroundImage: philosophyBg,
    },
    {
      id: 3,
      name: "Fiction",
      slug: "fiction",
      icon: BookOpen,
      color: "from-blue-500 to-cyan-500",
      backgroundImage: fictionBg,
    },
    {
      id: 4,
      name: "History",
      slug: "history",
      icon: Globe,
      color: "from-red-500 to-pink-500",
      backgroundImage: historyBg,
    },
    {
      id: 5,
      name: "Biography",
      slug: "biography",
      icon: Zap,
      color: "from-teal-500 to-green-500",
      backgroundImage: biographyBg,
    },
    {
      id: 6,
      name: "Poetry",
      slug: "poetry",
      icon: Music,
      color: "from-indigo-500 to-purple-500",
      backgroundImage: poetryBg,
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
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        {categories.map((category) => {
          const Icon = category.icon;
          const hasBackgroundImage = !!category.backgroundImage;

          return (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category.slug)}
              className={`relative overflow-hidden rounded-2xl p-8 md:p-10 hover:scale-105 transition-transform duration-300 group shadow-xl ${
                hasBackgroundImage ? "" : `bg-gradient-to-br ${category.color}`
              }`}
              style={
                hasBackgroundImage
                  ? {
                      backgroundImage: `url(${category.backgroundImage})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }
                  : undefined
              }
            >
              {/* Overlay - darker for image backgrounds, lighter for gradients */}
              <div
                className={`absolute inset-0 transition-colors border border-white/20 ${
                  hasBackgroundImage
                    ? "bg-gradient-to-t from-black/70 via-black/40 to-black/30 group-hover:from-black/60 group-hover:via-black/30 group-hover:to-black/20"
                    : "bg-white/10 backdrop-blur-sm group-hover:bg-white/5 bg-[rgba(197,216,157,0.1)]"
                }`}
              />
              <div className="relative flex flex-col items-center justify-center space-y-3">
                {!hasBackgroundImage && (
                  <Icon className="w-8 h-8 md:w-10 md:h-10 text-white drop-shadow-lg" />
                )}
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
