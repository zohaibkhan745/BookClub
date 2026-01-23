import { Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ScrollToTop } from "./components/ScrollToTop";
import {
  LazyHome,
  LazyBookDetailPage,
  LazyUploadBook,
  LazyGenrePage,
  LazyLibraryPage,
  LazySearchPage,
  LazyLoginPage,
  LazyRegisterPage,
  LazyProfilePage,
  LazySettingsPage,
  LazyAboutPage,
  LazyHowItWorksPage,
  LazyCommunityGuidelinesPage,
  LazyFAQPage,
  LazyContactPage,
  LazyLeaderboardPage,
  LazyCommunityPage,
  LazyThreadDetailPage,
  PageLoader,
} from "./components/LazyPages";

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <ScrollToTop />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<LazyHome />} />
              <Route path="/book/:id" element={<LazyBookDetailPage />} />
              <Route
                path="/upload"
                element={
                  <ProtectedRoute>
                    <LazyUploadBook />
                  </ProtectedRoute>
                }
              />
              <Route path="/genre/:genre" element={<LazyGenrePage />} />
              <Route path="/library" element={<LazyLibraryPage />} />
              <Route path="/search" element={<LazySearchPage />} />
              <Route path="/login" element={<LazyLoginPage />} />
              <Route path="/register" element={<LazyRegisterPage />} />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <LazyProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <LazySettingsPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/about" element={<LazyAboutPage />} />
              <Route path="/how-it-works" element={<LazyHowItWorksPage />} />
              <Route
                path="/community-guidelines"
                element={<LazyCommunityGuidelinesPage />}
              />
              <Route path="/faq" element={<LazyFAQPage />} />
              <Route path="/contact" element={<LazyContactPage />} />
              <Route path="/leaderboard" element={<LazyLeaderboardPage />} />
              <Route path="/community" element={<LazyCommunityPage />} />
              <Route path="/community/:id" element={<LazyThreadDetailPage />} />
            </Routes>
          </Suspense>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}
