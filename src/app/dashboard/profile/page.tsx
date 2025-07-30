"use client";

import { useState, useEffect, ChangeEvent } from 'react';
import { useAuth } from '../../components/context/AuthContext';
import { db } from '../../lib/firebase';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { updateProfile, updateEmail } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import Image from 'next/image';
import { FiUser, FiMail, FiCamera, FiSave, FiLoader } from 'react-icons/fi';

const ProfilePage = () => {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [newPhoto, setNewPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setEmail(user.email || '');
      setPhotoPreview(user.photoURL || null);
    }
  }, [user]);

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setMessage(null);

    try {
      // Step 1: Upload new photo if selected
      let photoURL = user.photoURL;
      if (newPhoto) {
        const storage = getStorage();
        const storageRef = ref(storage, `profile_images/${user.uid}/${newPhoto.name}`);
        const snapshot = await uploadBytes(storageRef, newPhoto);
        photoURL = await getDownloadURL(snapshot.ref);
      }

      // Step 2: Update Firebase Auth profile
      await updateProfile(user, {
        displayName: displayName,
        photoURL: photoURL,
      });

      // Step 3: Update Firestore user document
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        displayName: displayName,
        photoURL: photoURL,
      });

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setNewPhoto(null); // Reset file input

    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
    } finally {
      setLoading(false);
    }
  };
  
  // Note: Updating email is a sensitive operation and may require re-authentication.
  // This is a basic implementation.
  const handleEmailUpdate = async () => {
      if (!user || user.email === email) return;
      setLoading(true);
      setMessage(null);
      try {
          await updateEmail(user, email);
          const userDocRef = doc(db, 'users', user.uid);
          await updateDoc(userDocRef, { email: email });
          setMessage({ type: 'success', text: 'Email updated! Please verify your new email.' });
      } catch (error) {
          console.error("Error updating email:", error);
          setMessage({ type: 'error', text: 'Failed to update email. You may need to log in again.' });
      } finally {
          setLoading(false);
      }
  };

  if (!user) {
    return <div className="flex justify-center items-center h-full">Loading profile...</div>;
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-slate-800">My Profile</h1>
      
      {/* Personal Information Section */}
      <div className="bg-white p-8 rounded-xl shadow-md border border-slate-200">
        <form onSubmit={handleProfileUpdate} className="space-y-6">
          <h2 className="text-xl font-semibold text-slate-700">Personal Information</h2>
          <div className="flex items-center gap-6">
            <div className="relative w-24 h-24">
              <Image
                src={photoPreview || '/default-avatar.png'} // Assumes a default avatar in /public
                alt="Profile"
                width={96}
                height={96}
                className="rounded-full object-cover"
              />
              <label htmlFor="photo-upload" className="absolute -bottom-1 -right-1 bg-indigo-600 text-white p-2 rounded-full cursor-pointer hover:bg-indigo-700">
                <FiCamera />
                <input id="photo-upload" type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              </label>
            </div>
            <div className="flex-grow">
              <label htmlFor="displayName" className="block text-sm font-medium text-slate-600">Full Name</label>
              <div className="relative mt-1">
                <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 text-white font-semibold px-6 py-2 rounded-md hover:bg-indigo-700 disabled:bg-gray-400 flex items-center gap-2"
            >
              {loading ? <FiLoader className="animate-spin" /> : <FiSave />}
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>

      {/* Account Settings Section */}
      <div className="bg-white p-8 rounded-xl shadow-md border border-slate-200">
        <h2 className="text-xl font-semibold text-slate-700 mb-6">Account Settings</h2>
        <div className="space-y-4">
            <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-600">Email Address</label>
                <div className="relative mt-1 flex items-center gap-4">
                    <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                    />
                    <button onClick={handleEmailUpdate} disabled={loading || user.email === email} className="bg-slate-200 font-semibold px-6 py-2 rounded-md hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap">
                        Update Email
                    </button>
                </div>
            </div>
        </div>
      </div>

      {message && (
        <div className={`mt-4 text-center font-semibold p-3 rounded-md ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message.text}
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
