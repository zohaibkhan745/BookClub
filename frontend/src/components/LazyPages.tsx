import { Suspense, lazy, ComponentType } from "react";
import { LoadingSpinner } from "./ui/LoadingSpinner";

// Loading fallback component
function PageLoader() {
  return (
    <div className="min-h-screen bg-[#F6F0D7] dark:bg-[#1c1c1e] flex items-center justify-center">
      <LoadingSpinner message="Loading..." />
    </div>
  );
}

// Generic lazy loader with preload support
export function lazyLoad<T extends ComponentType<unknown>>(
  importFn: () => Promise<{ default: T }>,
) {
  const LazyComponent = lazy(importFn);

  // Add preload method to component
  (LazyComponent as unknown as { preload: () => void }).preload = importFn;

  return LazyComponent;
}

// Wrap lazy components with Suspense
export function withSuspense<P extends object>(
  LazyComponent: React.LazyExoticComponent<ComponentType<P>>,
  fallback: React.ReactNode = <PageLoader />,
) {
  return function SuspenseWrapper(props: P) {
    return (
      <Suspense fallback={fallback}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

// Lazy loaded pages
export const LazyHome = lazyLoad(() =>
  import("../pages/Home").then((m) => ({ default: m.Home })),
);
export const LazyBookDetailPage = lazyLoad(() =>
  import("../pages/BookDetailPage").then((m) => ({
    default: m.BookDetailPage,
  })),
);
export const LazyUploadBook = lazyLoad(() =>
  import("../pages/UploadBook").then((m) => ({ default: m.UploadBook })),
);
export const LazyGenrePage = lazyLoad(() =>
  import("../pages/GenrePage").then((m) => ({ default: m.GenrePage })),
);
export const LazyLibraryPage = lazyLoad(() =>
  import("../pages/LibraryPage").then((m) => ({ default: m.LibraryPage })),
);
export const LazySearchPage = lazyLoad(() =>
  import("../pages/SearchPage").then((m) => ({ default: m.SearchPage })),
);
export const LazyLoginPage = lazyLoad(() =>
  import("../pages/LoginPage").then((m) => ({ default: m.LoginPage })),
);
export const LazyRegisterPage = lazyLoad(() =>
  import("../pages/RegisterPage").then((m) => ({ default: m.RegisterPage })),
);
export const LazyProfilePage = lazyLoad(() =>
  import("../pages/ProfilePage").then((m) => ({ default: m.ProfilePage })),
);
export const LazySettingsPage = lazyLoad(() =>
  import("../pages/SettingsPage").then((m) => ({ default: m.SettingsPage })),
);
export const LazyAboutPage = lazyLoad(() =>
  import("../pages/AboutPage").then((m) => ({ default: m.AboutPage })),
);
export const LazyHowItWorksPage = lazyLoad(() =>
  import("../pages/HowItWorksPage").then((m) => ({
    default: m.HowItWorksPage,
  })),
);
export const LazyCommunityGuidelinesPage = lazyLoad(() =>
  import("../pages/CommunityGuidelinesPage").then((m) => ({
    default: m.CommunityGuidelinesPage,
  })),
);
export const LazyFAQPage = lazyLoad(() =>
  import("../pages/FAQPage").then((m) => ({ default: m.FAQPage })),
);
export const LazyContactPage = lazyLoad(() =>
  import("../pages/ContactPage").then((m) => ({ default: m.ContactPage })),
);
export const LazyLeaderboardPage = lazyLoad(() =>
  import("../pages/LeaderboardPage").then((m) => ({ default: m.default })),
);
export const LazyCommunityPage = lazyLoad(() =>
  import("../pages/CommunityPage").then((m) => ({ default: m.CommunityPage })),
);
export const LazyThreadDetailPage = lazyLoad(() =>
  import("../pages/ThreadDetailPage").then((m) => ({
    default: m.ThreadDetailPage,
  })),
);
export const LazyPrivacyPolicyPage = lazyLoad(() =>
  import("../pages/PrivacyPolicyPage").then((m) => ({
    default: m.PrivacyPolicyPage,
  })),
);
export const LazyTermsOfServicePage = lazyLoad(() =>
  import("../pages/TermsOfServicePage").then((m) => ({
    default: m.TermsOfServicePage,
  })),
);

// Export PageLoader for use in App.tsx
export { PageLoader };
