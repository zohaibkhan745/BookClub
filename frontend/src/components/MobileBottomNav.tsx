import { Home, BookOpen, ShoppingBag, Search } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

export function MobileBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { id: "home", label: "Home", icon: Home, path: "/" },
    { id: "library", label: "Library", icon: BookOpen, path: "/library" },
    { id: "store", label: "Book Store", icon: ShoppingBag, path: "/store" },
    { id: "search", label: "Search", icon: Search, path: "/search" },
  ];

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#1c1c1e]/95 backdrop-blur-xl border-t border-white/10 safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center px-4 py-2 rounded-2xl transition-all duration-200 min-w-[70px] ${
                active
                  ? "bg-[#2c2c2e] text-[#64D2FF]"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              <Icon
                className={`w-6 h-6 mb-1 ${active ? "text-[#64D2FF]" : ""}`}
                strokeWidth={active ? 2.5 : 2}
              />
              <span
                className={`text-[10px] font-medium ${
                  active ? "text-[#64D2FF]" : ""
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
