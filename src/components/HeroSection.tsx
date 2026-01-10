import { Play, Info } from 'lucide-react';

export function HeroSection() {
  return (
    <div className="relative h-[70vh] md:h-[85vh] w-full">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=1920"
          alt="Featured Book"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative h-full px-4 md:px-12 flex flex-col justify-center max-w-2xl space-y-4 md:space-y-6">
        <h2 className="text-4xl md:text-6xl font-bold text-white">
          The Art of Thinking Clearly
        </h2>
        <p className="text-base md:text-lg text-gray-300 leading-relaxed">
          Discover the secrets to making better decisions. Available for borrowing from your local community members. A timeless classic that has helped millions understand the hidden pitfalls in everyday thinking.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button className="flex items-center justify-center space-x-2 bg-white text-black px-6 md:px-8 py-2 md:py-3 rounded hover:bg-white/90 transition font-semibold">
            <Play className="w-5 h-5 fill-black" />
            <span>Borrow Now</span>
          </button>
          <button className="flex items-center justify-center space-x-2 bg-gray-500/70 text-white px-6 md:px-8 py-2 md:py-3 rounded hover:bg-gray-500/50 transition font-semibold">
            <Info className="w-5 h-5" />
            <span>More Info</span>
          </button>
        </div>
      </div>
    </div>
  );
}
