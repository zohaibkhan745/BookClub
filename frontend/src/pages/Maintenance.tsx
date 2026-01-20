import { Construction, Clock, Mail } from "lucide-react";

export default function Maintenance() {
  return (
    <div className="min-h-screen bg-[#F6F0D7] dark:bg-[#1c1c1e] flex items-center justify-center p-4 transition-colors duration-300">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-24 h-24 bg-[#800020] dark:bg-[#a03040] rounded-full flex items-center justify-center shadow-lg">
            <Construction className="w-12 h-12 text-white" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-3">
          <h1 className="text-4xl font-bold text-[#800020] dark:text-[#f0d0d8]">
            We'll Be Back Soon
          </h1>
          <p className="text-lg text-gray-700 dark:text-gray-300">
            Book Club is currently undergoing scheduled maintenance.
          </p>
        </div>

        {/* Info Card */}
        <div className="bg-white dark:bg-[#2c2c2e] rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400 mb-4">
            <Clock className="w-5 h-5" />
            <span className="font-medium">Estimated Downtime</span>
          </div>
          <p className="text-gray-800 dark:text-gray-200">
            We're working hard to improve your experience. This shouldn't take
            long!
          </p>
        </div>
        {/* Footer */}
        <div className="pt-8 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            © {new Date().getFullYear()} Book Club. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
