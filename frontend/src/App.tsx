import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { Home } from "./pages/Home";
import { BookDetailPage } from "./pages/BookDetailPage";
import { UploadBook } from "./pages/UploadBook";
import { GenrePage } from "./pages/GenrePage";
import { LibraryPage } from "./pages/LibraryPage";
import { BookStorePage } from "./pages/BookStorePage";
import { SearchPage } from "./pages/SearchPage";

export default function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/book/:id" element={<BookDetailPage />} />
          <Route path="/upload" element={<UploadBook />} />
          <Route path="/genre/:genre" element={<GenrePage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/store" element={<BookStorePage />} />
          <Route path="/search" element={<SearchPage />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}
