import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Home } from "./pages/Home";
import { BookDetailPage } from './pages/BookDetailPage';
import { UploadBook } from './pages/UploadBook';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/book/:id" element={<BookDetailPage />} />
        <Route path="/upload" element={<UploadBook />} />
      </Routes>
    </Router>
  );
}
