import { Navbar } from '../components/Navbar';
import { BookRow } from '../components/BookRow';
import { CategorySection } from '../components/CategorySection';
import { Footer } from '../components/Footer';

export function Home() {
  const trendingBooks = [
    { id: 1, title: "The Great Gatsby", author: "F. Scott Fitzgerald", image: "https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=400" },
    { id: 2, title: "1984", author: "George Orwell", image: "https://images.unsplash.com/photo-1419640303358-44f0d27f48e7?w=400" },
    { id: 3, title: "Pride and Prejudice", author: "Jane Austen", image: "https://images.unsplash.com/photo-1556566952-11eff3d06ed4?w=400" },
    { id: 4, title: "To Kill a Mockingbird", author: "Harper Lee", image: "https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=400" },
    { id: 5, title: "The Catcher in the Rye", author: "J.D. Salinger", image: "https://images.unsplash.com/photo-1419640303358-44f0d27f48e7?w=400" },
    { id: 6, title: "Brave New World", author: "Aldous Huxley", image: "https://images.unsplash.com/photo-1556566952-11eff3d06ed4?w=400" },
  ];

  const newArrivals = [
    { id: 7, title: "Atomic Habits", author: "James Clear", image: "https://images.unsplash.com/photo-1618365908648-e71bd5716cba?w=400" },
    { id: 8, title: "Sapiens", author: "Yuval Noah Harari", image: "https://images.unsplash.com/photo-1643050079091-1d4a51e07ba0?w=400" },
    { id: 9, title: "Educated", author: "Tara Westover", image: "https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=400" },
    { id: 10, title: "The Midnight Library", author: "Matt Haig", image: "https://images.unsplash.com/photo-1419640303358-44f0d27f48e7?w=400" },
    { id: 11, title: "Becoming", author: "Michelle Obama", image: "https://images.unsplash.com/photo-1556566952-11eff3d06ed4?w=400" },
    { id: 12, title: "Thinking, Fast and Slow", author: "Daniel Kahneman", image: "https://images.unsplash.com/photo-1618365908648-e71bd5716cba?w=400" },
  ];

  const popularThisWeek = [
    { id: 13, title: "The Alchemist", author: "Paulo Coelho", image: "https://images.unsplash.com/photo-1643050079091-1d4a51e07ba0?w=400" },
    { id: 14, title: "Harry Potter", author: "J.K. Rowling", image: "https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=400" },
    { id: 15, title: "The Hobbit", author: "J.R.R. Tolkien", image: "https://images.unsplash.com/photo-1419640303358-44f0d27f48e7?w=400" },
    { id: 16, title: "Animal Farm", author: "George Orwell", image: "https://images.unsplash.com/photo-1556566952-11eff3d06ed4?w=400" },
    { id: 17, title: "The Da Vinci Code", author: "Dan Brown", image: "https://images.unsplash.com/photo-1618365908648-e71bd5716cba?w=400" },
    { id: 18, title: "The Book Thief", author: "Markus Zusak", image: "https://images.unsplash.com/photo-1643050079091-1d4a51e07ba0?w=400" },
  ];

  return (
    <div className="min-h-screen bg-[#F6F0D7]">
      <Navbar />
      
      <div className="pt-20 px-4 md:px-12 pb-8 bg-[rgba(240,255,223,0)]">
        <CategorySection />
      </div>
      
      <div className="px-4 md:px-12 pb-12 space-y-12">
        <BookRow title="Trending Now" books={trendingBooks} />
        <BookRow title="New Arrivals" books={newArrivals} />
        <BookRow title="Popular This Week" books={popularThisWeek} />
      </div>

      <Footer />
    </div>
  );
}
