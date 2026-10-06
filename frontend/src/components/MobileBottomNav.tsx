import { Home, BookOpen, Search, MessageCircle } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

export function MobileBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();

  const navItems = [
    { id: "home", label: "Home", icon: Home, path: "/" },
    { id: "library", label: "Library", icon: BookOpen, path: "/library" },
    {
      id: "community",
      label: "Community",
      icon: MessageCircle,
      path: "/community",
    },
    { id: "search", label: "Search", icon: Search, path: "/search" },
  ];

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const isLight = theme === "light";

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 backdrop-blur-xl safe-area-bottom border-t"
      style={{
        backgroundColor: isLight
          ? "rgba(246, 240, 215, 0.85)"
          : "rgba(28, 28, 30, 0.85)",
        borderColor: isLight
          ? "rgba(0, 0, 0, 0.1)"
          : "rgba(255, 255, 255, 0.1)",
      }}
    >
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center justify-center px-2 py-1.5 rounded-xl transition-all duration-200 flex-1 max-w-[84px] cursor-pointer"
              style={{
                backgroundColor: active
                  ? isLight
                    ? "rgba(239, 68, 68, 0.15)"
                    : "#2c2c2e"
                  : "transparent",
                color: active
                  ? isLight
                    ? "#ef4444"
                    : "#64D2FF"
                  : isLight
                    ? "#4b5563"
                    : "#9ca3af",
              }}
            >
              <Icon
                className="w-5 h-5 mb-0.5"
                style={{
                  color: active ? (isLight ? "#ef4444" : "#64D2FF") : undefined,
                }}
                strokeWidth={active ? 2.5 : 2}
              />
              <span className="text-xs font-medium tracking-tight leading-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
