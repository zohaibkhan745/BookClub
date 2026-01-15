import { useState, useEffect } from "react";
import { Home } from "../pages/Home";
import { MobileHome } from "../pages/MobileHome";
import { MobileLibrary } from "../pages/MobileLibrary";
import { MobileStore } from "../pages/MobileStore";
import { MobileSearch } from "../pages/MobileSearch";

interface ResponsiveLayoutProps {
  page?: "home" | "library" | "store" | "search";
}

export function ResponsiveLayout({ page = "home" }: ResponsiveLayoutProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Desktop view - always show Home for now
  if (!isMobile) {
    return <Home />;
  }

  // Mobile view - show appropriate page
  switch (page) {
    case "library":
      return <MobileLibrary />;
    case "store":
      return <MobileStore />;
    case "search":
      return <MobileSearch />;
    default:
      return <MobileHome />;
  }
}
