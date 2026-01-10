import { useParams } from 'react-router-dom';
import { BookDetail } from '../components/BookDetail';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

// Mock data - in a real app, this would come from an API
const booksData: Record<number, any> = {
  1: {
    id: 1,
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    genre: "Classic Fiction",
    image: "https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=800",
    description: "The Great Gatsby is a 1925 novel by American writer F. Scott Fitzgerald. Set in the Jazz Age on Long Island, near New York City, the novel depicts first-person narrator Nick Carraway's interactions with mysterious millionaire Jay Gatsby and Gatsby's obsession to reunite with his former lover, Daisy Buchanan. A classic exploration of the American Dream, decadence, and excess.",
    year: "1925",
    pages: 180,
    language: "English",
    rating: 5
  },
  2: {
    id: 2,
    title: "1984",
    author: "George Orwell",
    genre: "Dystopian Fiction",
    image: "https://images.unsplash.com/photo-1419640303358-44f0d27f48e7?w=800",
    description: "1984 is a dystopian social science fiction novel and cautionary tale by English writer George Orwell. It was published on 8 June 1949 as Orwell's ninth and final book completed in his lifetime. The novel examines the role of truth and facts within politics and the ways in which they are manipulated.",
    year: "1949",
    pages: 328,
    language: "English",
    rating: 5
  },
  3: {
    id: 3,
    title: "Pride and Prejudice",
    author: "Jane Austen",
    genre: "Romance",
    image: "https://images.unsplash.com/photo-1556566952-11eff3d06ed4?w=800",
    description: "Pride and Prejudice is an 1813 novel of manners by Jane Austen. The novel follows the character development of Elizabeth Bennet, the dynamic protagonist who learns about the repercussions of hasty judgments and comes to appreciate the difference between superficial goodness and actual goodness.",
    year: "1813",
    pages: 432,
    language: "English",
    rating: 5
  },
  4: {
    id: 4,
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    genre: "Southern Gothic",
    image: "https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=800",
    description: "To Kill a Mockingbird is a novel by the American author Harper Lee. It was published in 1960 and was instantly successful. The plot and characters are loosely based on Lee's observations of her family, her neighbors and an event that occurred near her hometown.",
    year: "1960",
    pages: 281,
    language: "English",
    rating: 5
  },
  5: {
    id: 5,
    title: "The Catcher in the Rye",
    author: "J.D. Salinger",
    genre: "Coming-of-age",
    image: "https://images.unsplash.com/photo-1419640303358-44f0d27f48e7?w=800",
    description: "The Catcher in the Rye is a novel by J. D. Salinger, partially published in serial form in 1945–1946 and as a novel in 1951. Originally intended for adults, it is often read by adolescents for its themes of angst and alienation, and as a critique on superficiality in society.",
    year: "1951",
    pages: 234,
    language: "English",
    rating: 4
  },
  6: {
    id: 6,
    title: "Brave New World",
    author: "Aldous Huxley",
    genre: "Science Fiction",
    image: "https://images.unsplash.com/photo-1556566952-11eff3d06ed4?w=800",
    description: "Brave New World is a dystopian novel by English author Aldous Huxley, written in 1931 and published in 1932. Set in a futuristic World State, whose citizens are environmentally engineered into an intelligence-based social hierarchy, the novel anticipates developments in reproductive technology.",
    year: "1932",
    pages: 311,
    language: "English",
    rating: 5
  },
  7: {
    id: 7,
    title: "Atomic Habits",
    author: "James Clear",
    genre: "Self-Help",
    image: "https://images.unsplash.com/photo-1618365908648-e71bd5716cba?w=800",
    description: "Atomic Habits offers a proven framework for improving every day. James Clear reveals practical strategies that will teach you exactly how to form good habits, break bad ones, and master the tiny behaviors that lead to remarkable results.",
    year: "2018",
    pages: 320,
    language: "English",
    rating: 5
  },
  8: {
    id: 8,
    title: "Sapiens",
    author: "Yuval Noah Harari",
    genre: "Philosophy",
    image: "https://images.unsplash.com/photo-1643050079091-1d4a51e07ba0?w=800",
    description: "Sapiens: A Brief History of Humankind is a book by Yuval Noah Harari. It surveys the history of humankind from the evolution of archaic human species in the Stone Age up to the twenty-first century, focusing on Homo sapiens.",
    year: "2011",
    pages: 443,
    language: "English",
    rating: 5
  },
  9: {
    id: 9,
    title: "Educated",
    author: "Tara Westover",
    genre: "Biography",
    image: "https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=800",
    description: "Educated is a memoir by the American author Tara Westover. It is a coming-of-age story that details her journey from growing up in a survivalist family in rural Idaho to earning a PhD from Cambridge University.",
    year: "2018",
    pages: 334,
    language: "English",
    rating: 5
  },
  10: {
    id: 10,
    title: "The Midnight Library",
    author: "Matt Haig",
    genre: "Fiction",
    image: "https://images.unsplash.com/photo-1419640303358-44f0d27f48e7?w=800",
    description: "The Midnight Library is a novel by Matt Haig. Somewhere out beyond the edge of the universe there is a library that contains an infinite number of books, each one the story of another reality. Between life and death there is a library.",
    year: "2020",
    pages: 304,
    language: "English",
    rating: 4
  },
  11: {
    id: 11,
    title: "Becoming",
    author: "Michelle Obama",
    genre: "Biography",
    image: "https://images.unsplash.com/photo-1556566952-11eff3d06ed4?w=800",
    description: "Becoming is the memoir by former First Lady of the United States Michelle Obama, published in 2018. The memoir explores Obama's roots and how she found her voice, as well as her time in the White House, her public health campaign, and her role as a mother.",
    year: "2018",
    pages: 426,
    language: "English",
    rating: 5
  },
  12: {
    id: 12,
    title: "Thinking, Fast and Slow",
    author: "Daniel Kahneman",
    genre: "Business",
    image: "https://images.unsplash.com/photo-1618365908648-e71bd5716cba?w=800",
    description: "Thinking, Fast and Slow is a 2011 book by psychologist Daniel Kahneman. It summarizes research that Kahneman conducted over decades, often in collaboration with Amos Tversky. It covers all three phases of his career: his early work on cognitive biases.",
    year: "2011",
    pages: 499,
    language: "English",
    rating: 5
  },
  13: {
    id: 13,
    title: "The Alchemist",
    author: "Paulo Coelho",
    genre: "Philosophy",
    image: "https://images.unsplash.com/photo-1643050079091-1d4a51e07ba0?w=800",
    description: "The Alchemist is a novel by Brazilian author Paulo Coelho. An allegorical novel, The Alchemist follows a young Andalusian shepherd in his journey to the pyramids of Egypt, after having a recurring dream of finding a treasure there.",
    year: "1988",
    pages: 197,
    language: "English",
    rating: 4
  },
  14: {
    id: 14,
    title: "Harry Potter and the Philosopher's Stone",
    author: "J.K. Rowling",
    genre: "Fantasy",
    image: "https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=800",
    description: "Harry Potter and the Philosopher's Stone is a fantasy novel written by British author J. K. Rowling. The first novel in the Harry Potter series, it follows Harry Potter, a young wizard who discovers his magical heritage on his eleventh birthday.",
    year: "1997",
    pages: 223,
    language: "English",
    rating: 5
  },
  15: {
    id: 15,
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
    genre: "Fantasy",
    image: "https://images.unsplash.com/photo-1419640303358-44f0d27f48e7?w=800",
    description: "The Hobbit, or There and Back Again is a children's fantasy novel by English author J. R. R. Tolkien. It was published on 21 September 1937 to wide critical acclaim, being nominated for the Carnegie Medal and awarded a prize from the New York Herald Tribune.",
    year: "1937",
    pages: 310,
    language: "English",
    rating: 5
  },
  16: {
    id: 16,
    title: "Animal Farm",
    author: "George Orwell",
    genre: "Political Satire",
    image: "https://images.unsplash.com/photo-1556566952-11eff3d06ed4?w=800",
    description: "Animal Farm is a satirical allegorical novella by George Orwell. It tells the story of a group of farm animals who rebel against their human farmer, hoping to create a society where the animals can be equal, free, and happy.",
    year: "1945",
    pages: 112,
    language: "English",
    rating: 5
  },
  17: {
    id: 17,
    title: "The Da Vinci Code",
    author: "Dan Brown",
    genre: "Mystery Thriller",
    image: "https://images.unsplash.com/photo-1618365908648-e71bd5716cba?w=800",
    description: "The Da Vinci Code is a 2003 mystery thriller novel by Dan Brown. It is Brown's second novel to include the character Robert Langdon: the first was his 2000 novel Angels & Demons. The Da Vinci Code follows symbologist Robert Langdon.",
    year: "2003",
    pages: 454,
    language: "English",
    rating: 4
  },
  18: {
    id: 18,
    title: "The Book Thief",
    author: "Markus Zusak",
    genre: "Historical Fiction",
    image: "https://images.unsplash.com/photo-1643050079091-1d4a51e07ba0?w=800",
    description: "The Book Thief is a historical fiction novel by the Australian author Markus Zusak, set in Nazi Germany during World War II. Published in 2005, The Book Thief became an international bestseller and was translated into 63 languages.",
    year: "2005",
    pages: 552,
    language: "English",
    rating: 5
  }
};

export function BookDetailPage() {
  const { id } = useParams();
  const book = booksData[Number(id)];

  if (!book) {
    return (
      <div className="min-h-screen bg-[#F6F0D7] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-black mb-4">Book not found</h2>
          <a href="/" className="text-red-600 hover:underline">Return to home</a>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <BookDetail book={book} />
      <Footer />
    </>
  );
}
