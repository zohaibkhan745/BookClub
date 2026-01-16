import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Home } from "./pages/Home";
import { BookDetailPage } from "./pages/BookDetailPage";
import { UploadBook } from "./pages/UploadBook";
import { GenrePage } from "./pages/GenrePage";
import { LibraryPage } from "./pages/LibraryPage";
import { BookStorePage } from "./pages/BookStorePage";
import { SearchPage } from "./pages/SearchPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
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
          </Routes>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}
