import { BookOpen, Heart, Mail, Loader2, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { apiPost } from "../services/api";

export function Footer() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");
    try {
      const res = await apiPost<{ message: string; email: string }>(
        "/subscribers/subscribe",
        { email: email.trim() }
      );
      setStatus("success");
      setMessage(res.message);
      setEmail("");
      // Reset after 5 seconds
      setTimeout(() => {
        setStatus("idle");
        setMessage("");
      }, 5000);
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
      setTimeout(() => {
        setStatus("idle");
        setMessage("");
      }, 4000);
    }
  };

  return (
    <footer className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-[#1c1c1e] dark:to-[#2c2c2e] border-t border-amber-200/50 dark:border-white/10 transition-colors duration-300">
      {/* Inspirational Quote Section */}
      <div className="px-4 md:px-12 py-12 text-center">
        <div className="max-w-4xl mx-auto space-y-4">
          <BookOpen className="w-12 h-12 text-amber-600 dark:text-amber-400 mx-auto" />
          <blockquote className="text-2xl md:text-3xl font-serif italic text-gray-800 dark:text-white">
            "A book is a dream that you hold in your hands."
          </blockquote>
          <p className="text-gray-600 dark:text-gray-400">— Neil Gaiman</p>
          <p className="text-base md:text-lg text-gray-700 dark:text-gray-300 mt-6 max-w-2xl mx-auto">
            Join our community of readers sharing stories, building connections,
            and making knowledge accessible to everyone, one book at a time.
          </p>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="px-4 md:px-12 py-12 border-t border-amber-200/50 dark:border-white/10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* About Section */}
          <div className="space-y-4">
            <h4 className="text-red-600 dark:text-red-500 font-bold text-xl">
              BookClub
            </h4>
            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
              Connecting book lovers across GIKI. Borrow, lend, and discover
              stories that inspire, educate, and transform lives.
            </p>
            <div className="flex items-center space-x-2 text-amber-700 dark:text-amber-400">
              <Heart className="w-4 h-4 fill-amber-700 dark:fill-amber-400" />
              <span className="text-sm">Made with love for readers</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h5 className="font-semibold text-gray-900 dark:text-white text-lg">
              Quick Links
            </h5>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  to="/about"
                  className="text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  to="/how-it-works"
                  className="text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition"
                >
                  How It Works
                </Link>
              </li>
              <li>
                <Link
                  to="/community-guidelines"
                  className="text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition"
                >
                  Community Guidelines
                </Link>
              </li>
              <li>
                <Link
                  to="/faq"
                  className="text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h5 className="font-semibold text-gray-900 dark:text-white text-lg">
              Stay Connected
            </h5>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Get notified when new books are uploaded and features go live.
            </p>
            <form onSubmit={handleSubscribe} className="space-y-2">
              <div className="flex space-x-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email"
                  required
                  disabled={status === "loading"}
                  className="flex-1 px-3 py-2 rounded-lg bg-white/50 dark:bg-white/10 backdrop-blur-sm border border-amber-300 dark:border-white/20 focus:outline-none focus:border-red-500 text-sm text-gray-800 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={status === "loading" || status === "success"}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status === "loading" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : status === "success" ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Mail className="w-4 h-4" />
                  )}
                </button>
              </div>
              {message && (
                <p className={`text-xs ${status === "success" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                  {message}
                </p>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="px-4 md:px-12 py-6 border-t border-amber-200/50 dark:border-white/10 bg-amber-100/30 dark:bg-black/20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 text-sm text-gray-600 dark:text-gray-400">
          <p>
            © 2026 BookClub. All rights reserved. Built with passion for
            readers.
          </p>
          <div className="flex space-x-6">
            <a
              href="#"
              className="hover:text-red-600 dark:hover:text-red-400 transition"
            >
              Privacy Policy
            </a>
            <a
              href="#"
              className="hover:text-red-600 dark:hover:text-red-400 transition"
            >
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
