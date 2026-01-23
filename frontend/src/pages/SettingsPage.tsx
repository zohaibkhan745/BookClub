/**
 * Settings Page
 * User account settings and preferences.
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, LogOut, Trash2, Lock } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { MobileBottomNav } from "../components/MobileBottomNav";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import {
  SettingsSection,
  SettingsRow,
  ThemeToggle,
} from "../components/settings";
import { useAuth } from "../context/AuthContext";
import { updateUserProfile } from "../services";

export function SettingsPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading, signOut } = useAuth();

  // Form state
  const [fullName, setFullName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  useEffect(() => {
    // Redirect if not authenticated
    if (!authLoading && !isAuthenticated) {
      navigate("/login", { state: { from: "/settings" } });
      return;
    }

    // Initialize form with user data
    if (user) {
      setFullName(user.user_metadata?.full_name || "");
    }
  }, [user, isAuthenticated, authLoading, navigate]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      await updateUserProfile(fullName);
      setSaveMessage({
        type: "success",
        text: "Profile updated successfully!",
      });
      // Clear success message after 3 seconds
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      setSaveMessage({
        type: "error",
        text: "Failed to update profile. Please try again.",
      });
      console.error("[SettingsPage] Error saving profile:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoutClick = () => {
    setShowLogoutDialog(true);
  };

  const handleLogoutConfirm = async () => {
    setIsLoggingOut(true);
    try {
      // Sign out from Supabase (clears session)
      await signOut();

      // Clear all localStorage data
      localStorage.clear();

      // Redirect to home page
      setShowLogoutDialog(false);
      navigate("/", { replace: true });
    } catch (err) {
      console.error("[SettingsPage] Error logging out:", err);
      setIsLoggingOut(false);
    }
  };

  const handleLogoutCancel = () => {
    setShowLogoutDialog(false);
  };

  // Show loading while auth is being determined
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F6F0D7] dark:bg-[#1c1c1e]">
        <Navbar />
        <div className="pt-24 pb-12 px-4 md:px-12 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600" />
        </div>
      </div>
    );
  }

  const email = user?.email || "";

  return (
    <div className="min-h-screen bg-[#F6F0D7] dark:bg-[#1c1c1e] transition-colors duration-300">
      <Navbar />

      <main className="pt-24 pb-24 md:pb-12 px-4 md:px-12">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Page Header */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/profile")}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white dark:hover:bg-[#2c2c2e] rounded-lg transition-colors"
              aria-label="Back to profile"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Settings
            </h1>
          </div>

          {/* Account Section */}
          <SettingsSection
            title="Account"
            description="Manage your account information"
          >
            <SettingsRow
              label="Full Name"
              description="This is how your name appears to others"
            >
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-48 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1c1c1e] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Enter your name"
                />
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? "Saving..." : "Save"}
                </button>
              </div>
            </SettingsRow>

            {saveMessage && (
              <div
                className={`px-3 py-2 rounded-lg text-sm ${
                  saveMessage.type === "success"
                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                    : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                }`}
              >
                {saveMessage.text}
              </div>
            )}

            <div className="border-t border-gray-200 dark:border-gray-700" />

            <SettingsRow
              label="Email"
              description="Your email address (managed by Supabase)"
            >
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {email}
              </span>
            </SettingsRow>

            <div className="border-t border-gray-200 dark:border-gray-700" />

            <SettingsRow
              label="Password"
              description="Change your account password"
              disabled
            >
              <button
                disabled
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 rounded-lg cursor-not-allowed"
              >
                <Lock className="w-4 h-4" />
                Coming Soon
              </button>
            </SettingsRow>
          </SettingsSection>

          {/* Preferences Section */}
          <SettingsSection
            title="Preferences"
            description="Customize your experience"
          >
            <SettingsRow
              label="Theme"
              description="Choose between light and dark mode"
            >
              <ThemeToggle />
            </SettingsRow>
          </SettingsSection>

          {/* Danger Zone */}
          <SettingsSection
            title="Danger Zone"
            description="Irreversible actions"
            danger
          >
            <SettingsRow
              label="Log Out"
              description="Sign out of your account on this device"
            >
              <button
                onClick={handleLogoutClick}
                disabled={isLoggingOut}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                {isLoggingOut ? "Logging out..." : "Log Out"}
              </button>
            </SettingsRow>

            <div className="border-t border-red-200 dark:border-red-900/30" />

            <SettingsRow
              label="Delete Account"
              description="Permanently delete your account and all data"
              disabled
            >
              <button
                disabled
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 rounded-lg cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
                Coming Soon
              </button>
            </SettingsRow>
          </SettingsSection>
        </div>
      </main>

      <div className="hidden md:block">
        <Footer />
      </div>
      <MobileBottomNav />

      {/* Sign Out Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showLogoutDialog}
        title="Sign Out"
        message="Are you sure you want to sign out?"
        confirmText="Sign Out"
        cancelText="Cancel"
        isLoading={isLoggingOut}
        onConfirm={handleLogoutConfirm}
        onCancel={handleLogoutCancel}
        variant="danger"
      />
    </div>
  );
}
