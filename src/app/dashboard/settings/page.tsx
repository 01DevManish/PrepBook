"use client";

import { useAuth } from "../../components/context/AuthContext";
import { auth } from "../../lib/firebase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { sendPasswordResetEmail, deleteUser } from "firebase/auth";
import { FiKey, FiTrash2, FiAlertTriangle, FiLoader } from "react-icons/fi";

// Reusable Confirmation Modal
const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  isLoading: boolean;
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg p-6 shadow-xl max-w-sm w-full">
        <div className="flex items-center mb-4">
          <FiAlertTriangle className="text-red-500 mr-3" size={24} />
          <h3 className="text-lg font-bold text-gray-800">{title}</h3>
        </div>
        <p className="text-slate-700 mb-6">{message}</p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-400 flex items-center"
          >
            {isLoading && <FiLoader className="animate-spin mr-2" />}
            Confirm Delete
          </button>
        </div>
      </div>
    </div>
  );
};

const SettingsPage = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const handlePasswordReset = async () => {
    if (!user || !user.email) {
      setMessage({
        type: "error",
        text: "No email associated with this account. Cannot reset password.",
      });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      await sendPasswordResetEmail(auth, user.email);
      setMessage({
        type: "success",
        text: `A password reset link has been sent to ${user.email}.`,
      });
    } catch (error: unknown) {
      console.error("Error sending password reset email:", error);

      if (isFirebaseError(error) && error.code === "auth/user-not-found") {
        setMessage({
          type: "error",
          text: "User not found. Please double-check your email address.",
        });
      } else {
        setMessage({
          type: "error",
          text: "Failed to send password reset email. Please try again.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setLoading(true);
    setMessage(null);
    try {
      await deleteUser(user);
      alert("Account deleted successfully.");
      router.push("/signup");
    } catch (error: unknown) {
      console.error("Error deleting account:", error);

      if (
        isFirebaseError(error) &&
        error.code === "auth/requires-recent-login"
      ) {
        setMessage({
          type: "error",
          text: "This is a sensitive action. Please log out and log back in before deleting your account.",
        });
      } else {
        setMessage({
          type: "error",
          text: "Failed to delete account. Please try again.",
        });
      }
    } finally {
      setLoading(false);
      setIsDeleteModalOpen(false);
    }
  };

  // Helper function to safely detect Firebase error
  function isFirebaseError(error: unknown): error is { code: string } {
    return (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      typeof (error as { code: unknown }).code === "string"
    );
  }

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center h-full">
        <FiLoader className="animate-spin mr-2" /> Loading Settings...
      </div>
    );
  }

  return (
    <>
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteAccount}
        title="Delete Account"
        message="Are you sure you want to permanently delete your account? All of your data, including test results, will be lost. This action cannot be undone."
        isLoading={loading}
      />
      <div className="space-y-8">
        <h1 className="text-3xl font-bold text-slate-800">Settings</h1>

        {/* Security Section */}
        <div className="bg-white p-8 rounded-xl shadow-md border border-slate-200">
          <h2 className="text-xl font-semibold text-slate-700 mb-6">Security</h2>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-4 border rounded-lg">
            <div>
              <h3 className="font-semibold text-slate-800">Reset Password</h3>
              <p className="text-sm text-slate-500 mt-1">
                We will send a password reset link to your registered email
                address.
              </p>
            </div>
            <button
              onClick={handlePasswordReset}
              disabled={loading}
              className="bg-indigo-600 text-white font-semibold px-4 py-2 rounded-md hover:bg-indigo-700 disabled:bg-gray-400 flex items-center gap-2 whitespace-nowrap"
            >
              <FiKey />
              Send Reset Link
            </button>
          </div>
        </div>

        {/* Danger Zone Section */}
        <div className="bg-white p-8 rounded-xl shadow-md border-2 border-red-200">
          <h2 className="text-xl font-semibold text-red-700 mb-6">
            Danger Zone
          </h2>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-4 bg-red-50 rounded-lg">
            <div>
              <h3 className="font-semibold text-slate-800">Delete Account</h3>
              <p className="text-sm text-slate-500 mt-1">
                Once you delete your account, there is no going back. Please be
                certain.
              </p>
            </div>
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              disabled={loading}
              className="bg-red-600 text-white font-semibold px-4 py-2 rounded-md hover:bg-red-700 disabled:bg-gray-400 flex items-center gap-2 whitespace-nowrap"
            >
              <FiTrash2 />
              Delete My Account
            </button>
          </div>
        </div>

        {message && (
          <div
            className={`mt-4 text-center font-semibold p-3 rounded-md ${
              message.type === "success"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {message.text}
          </div>
        )}
      </div>
    </>
  );
};

export default SettingsPage;
