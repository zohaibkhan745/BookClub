import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ScrollToTop } from "./components/ScrollToTop";
import { Home } from "./pages/Home";
import { BookDetailPage } from "./pages/BookDetailPage";
import { UploadBook } from "./pages/UploadBook";
import { GenrePage } from "./pages/GenrePage";
import { LibraryPage } from "./pages/LibraryPage";
import { BookStorePage } from "./pages/BookStorePage";
import { SearchPage } from "./pages/SearchPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ProfilePage } from "./pages/ProfilePage";
import { SettingsPage } from "./pages/SettingsPage";
import { AboutPage } from "./pages/AboutPage";
import { HowItWorksPage } from "./pages/HowItWorksPage";
import { CommunityGuidelinesPage } from "./pages/CommunityGuidelinesPage";
import { FAQPage } from "./pages/FAQPage";
import { ContactPage } from "./pages/ContactPage";

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/book/:id" element={<BookDetailPage />} />
            <Route
              path="/upload"
              element={
                <ProtectedRoute>
                  <UploadBook />
                </ProtectedRoute>
              }
            />
            <Route path="/genre/:genre" element={<GenrePage />} />
            <Route path="/library" element={<LibraryPage />} />
            <Route path="/store" element={<BookStorePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route
              path="/community-guidelines"
              element={<CommunityGuidelinesPage />}
            />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/contact" element={<ContactPage />} />
          </Routes>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}
