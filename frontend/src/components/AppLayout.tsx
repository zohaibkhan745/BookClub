import { ReactNode, memo } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { MobileBottomNav } from "./MobileBottomNav";

export interface AppLayoutProps {
  children: ReactNode;
  showFooter?: boolean;
  showBottomNav?: boolean;
  maxWidth?: "7xl" | "6xl" | "5xl" | "4xl" | "full";
  className?: string;
  noPadding?: boolean;
  transparent?: boolean;
}

const maxWidthMap = {
  "7xl": "max-w-7xl",
  "6xl": "max-w-6xl",
  "5xl": "max-w-5xl",
  "4xl": "max-w-4xl",
  full: "w-full",
};

export const AppLayout = memo(function AppLayout({
  children,
  showFooter = true,
  showBottomNav = true,
  maxWidth = "7xl",
  className = "",
  noPadding = false,
  transparent = false,
}: AppLayoutProps) {
  return (
    <div
      className={`min-h-screen ${
        transparent ? "bg-transparent" : "bg-[#F6F0D7] dark:bg-[#1c1c1e]"
      } text-foreground flex flex-col transition-colors duration-200`}
    >
      <Navbar />

      <main
        className={`flex-1 w-full mx-auto ${maxWidthMap[maxWidth]} ${
          noPadding
            ? ""
            : "pt-20 px-4 md:px-12 pb-24 md:pb-12 safe-area-bottom"
        } ${className}`}
      >
        {children}
      </main>

      {showFooter && (
        <div className="w-full">
          <Footer />
        </div>
      )}

      {showBottomNav && <MobileBottomNav />}
    </div>
  );
});

AppLayout.displayName = "AppLayout";
