/**
 * Settings Page
 * User account settings and preferences.
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, LogOut, Trash2, Lock } from "lucide-react";
import { AppLayout } from "../components/AppLayout";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
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

    if (user?.user_metadata?.full_name) {
      setFullName(user.user_metadata.full_name);
    }
  }, [user, isAuthenticated, authLoading, navigate]);

  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      setSaveMessage({ type: "error", text: "Name cannot be empty" });
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);

    try {
      await updateUserProfile(fullName.trim());
      setSaveMessage({ type: "success", text: "Profile updated successfully" });
    } catch {
      setSaveMessage({
        type: "error",
        text: "Failed to update profile. Please try again.",
      });
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
      await signOut();
      setShowLogoutDialog(false);
      navigate("/login");
    } catch (error) {
      console.error("[SettingsPage] Sign out error:", error);
      setIsLoggingOut(false);
    }
  };

  const handleLogoutCancel = () => {
    setShowLogoutDialog(false);
  };

  // Show loading while auth is being determined
  if (authLoading) {
    return <LoadingSpinner message="Loading settings..." fullScreen />;
  }

  const email = user?.email || "";

  return (
    <AppLayout maxWidth="4xl">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/profile")}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
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
              <div className="w-52">
                <Input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your name"
                  className="py-2 text-sm"
                  disabled={isSaving}
                />
              </div>
              <Button
                onClick={handleSaveProfile}
                isLoading={isSaving}
                size="md"
                variant="primary"
                icon={<Save className="w-4 h-4" />}
              >
                Save
              </Button>
            </div>
          </SettingsRow>

          {saveMessage && (
            <div
              className={`px-3 py-2 rounded-xl text-sm ${
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
            <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">
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
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 rounded-xl cursor-not-allowed"
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
            <Button
              onClick={handleLogoutClick}
              disabled={isLoggingOut}
              isLoading={isLoggingOut}
              variant="danger"
              size="md"
              icon={<LogOut className="w-4 h-4" />}
            >
              Log Out
            </Button>
          </SettingsRow>

          <div className="border-t border-red-200 dark:border-red-900/30" />

          <SettingsRow
            label="Delete Account"
            description="Permanently delete your account and all data"
            disabled
          >
            <button
              disabled
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 rounded-xl cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4" />
              Coming Soon
            </button>
          </SettingsRow>
        </SettingsSection>
      </div>

      {/* Sign Out Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showLogoutDialog}
        title="Sign Out"
        message="Are you sure you want to sign out?"
        confirmText="Sign Out"
        cancelText="Cancel"
        loadingText="Logging out..."
        isLoading={isLoggingOut}
        onConfirm={handleLogoutConfirm}
        onCancel={handleLogoutCancel}
        variant="danger"
      />
    </AppLayout>
  );
}
