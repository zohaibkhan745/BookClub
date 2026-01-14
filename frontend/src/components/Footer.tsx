import { BookOpen, Heart, Users, Mail, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-gradient-to-br from-amber-50 to-orange-50 border-t border-amber-200/50">
      {/* Inspirational Quote Section */}
      <div className="px-4 md:px-12 py-12 text-center">
        <div className="max-w-4xl mx-auto space-y-4">
          <BookOpen className="w-12 h-12 text-amber-600 mx-auto" />
          <blockquote className="text-2xl md:text-3xl font-serif italic text-gray-800">
            "A book is a dream that you hold in your hands."
          </blockquote>
          <p className="text-gray-600">— Neil Gaiman</p>
          <p className="text-base md:text-lg text-gray-700 mt-6 max-w-2xl mx-auto">
            Join our community of readers sharing stories, building connections, and making knowledge accessible to everyone, one book at a time.
          </p>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="px-4 md:px-12 py-12 border-t border-amber-200/50">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {/* About Section */}
          <div className="space-y-4">
            <h4 className="text-red-600 font-bold text-xl">BookClub</h4>
            <p className="text-gray-700 text-sm leading-relaxed">
              Connecting book lovers worldwide. Borrow, lend, and discover stories that inspire, educate, and transform lives.
            </p>
            <div className="flex items-center space-x-2 text-amber-700">
              <Heart className="w-4 h-4 fill-amber-700" />
              <span className="text-sm">Made with love for readers</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h5 className="font-semibold text-gray-900 text-lg">Quick Links</h5>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-gray-700 hover:text-red-600 transition">Browse Books</a>
              </li>
              <li>
                <a href="#" className="text-gray-700 hover:text-red-600 transition">How It Works</a>
              </li>
              <li>
                <a href="#" className="text-gray-700 hover:text-red-600 transition">Community Guidelines</a>
              </li>
              <li>
                <a href="#" className="text-gray-700 hover:text-red-600 transition">Success Stories</a>
              </li>
              <li>
                <a href="#" className="text-gray-700 hover:text-red-600 transition">FAQ</a>
              </li>
            </ul>
          </div>

          {/* Community */}
          <div className="space-y-4">
            <h5 className="font-semibold text-gray-900 text-lg">Community</h5>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-gray-700 hover:text-red-600 transition flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>Join Book Clubs</span>
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-700 hover:text-red-600 transition">Discussion Forums</a>
              </li>
              <li>
                <a href="#" className="text-gray-700 hover:text-red-600 transition">Reading Challenges</a>
              </li>
              <li>
                <a href="#" className="text-gray-700 hover:text-red-600 transition">Author Events</a>
              </li>
              <li>
                <a href="#" className="text-gray-700 hover:text-red-600 transition">Volunteer</a>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h5 className="font-semibold text-gray-900 text-lg">Stay Connected</h5>
            <p className="text-sm text-gray-700">Get weekly book recommendations and community updates.</p>
            <div className="flex space-x-2">
              <input
                type="email"
                placeholder="Your email"
                className="flex-1 px-3 py-2 rounded-lg bg-white/50 backdrop-blur-sm border border-amber-300 focus:outline-none focus:border-red-500 text-sm text-gray-800 placeholder:text-gray-500"
              />
              <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
                <Mail className="w-4 h-4" />
              </button>
            </div>
            
            {/* Social Media */}
            <div className="pt-4">
              <p className="text-sm text-gray-700 mb-3">Follow us</p>
              <div className="flex space-x-3">
                <a href="#" className="p-2 bg-white/50 backdrop-blur-sm rounded-full hover:bg-red-100 transition">
                  <Facebook className="w-4 h-4 text-gray-700" />
                </a>
                <a href="#" className="p-2 bg-white/50 backdrop-blur-sm rounded-full hover:bg-red-100 transition">
                  <Twitter className="w-4 h-4 text-gray-700" />
                </a>
                <a href="#" className="p-2 bg-white/50 backdrop-blur-sm rounded-full hover:bg-red-100 transition">
                  <Instagram className="w-4 h-4 text-gray-700" />
                </a>
                <a href="#" className="p-2 bg-white/50 backdrop-blur-sm rounded-full hover:bg-red-100 transition">
                  <Linkedin className="w-4 h-4 text-gray-700" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="px-4 md:px-12 py-6 border-t border-amber-200/50 bg-amber-100/30">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 text-sm text-gray-600">
          <p>© 2026 BookClub. All rights reserved. Built with passion for readers.</p>
          <div className="flex space-x-6">
            <a href="#" className="hover:text-red-600 transition">Privacy Policy</a>
            <a href="#" className="hover:text-red-600 transition">Terms of Service</a>
            <a href="#" className="hover:text-red-600 transition">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
}