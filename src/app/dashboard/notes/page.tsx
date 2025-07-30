"use client";

import { useAuth } from "../../components/context/AuthContext";
import { db } from "../../lib/firebase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { collection, query, getDocs, orderBy, addDoc, serverTimestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { FiFileText, FiPlus, FiSave, FiTrash2, FiLoader, FiBookOpen } from "react-icons/fi";

// Define the structure of a note
interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: {
    seconds: number;
  };
  updatedAt?: {
    seconds: number;
  };
}

const NotesPage = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [currentTitle, setCurrentTitle] = useState('');
  const [currentContent, setCurrentContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchNotes = async () => {
      try {
        const notesRef = collection(db, 'users', user.uid, 'notes');
        const q = query(notesRef, orderBy('updatedAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const fetchedNotes = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Note));
        setNotes(fetchedNotes);
      } catch (error) {
        console.error("Error fetching notes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, [user, authLoading, router]);
  
  useEffect(() => {
    if (selectedNote) {
        setCurrentTitle(selectedNote.title);
        setCurrentContent(selectedNote.content);
    } else {
        setCurrentTitle('');
        setCurrentContent('');
    }
  }, [selectedNote]);

  const handleSelectNote = (note: Note) => {
    setSelectedNote(note);
  };

  const handleAddNewNote = () => {
    setSelectedNote(null);
    setCurrentTitle('New Note');
    setCurrentContent('');
  };

  const handleSaveNote = async () => {
    if (!user || !currentTitle) return;
    setIsSaving(true);
    
    try {
        if (selectedNote) {
            // Update existing note
            const noteRef = doc(db, 'users', user.uid, 'notes', selectedNote.id);
            await updateDoc(noteRef, {
                title: currentTitle,
                content: currentContent,
                updatedAt: serverTimestamp()
            });
        } else {
            // Create new note
            const notesRef = collection(db, 'users', user.uid, 'notes');
            await addDoc(notesRef, {
                title: currentTitle,
                content: currentContent,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
        }
        // Refresh notes list
        const notesRef = collection(db, 'users', user.uid, 'notes');
        const q = query(notesRef, orderBy('updatedAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const fetchedNotes = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Note));
        setNotes(fetchedNotes);
        if (!selectedNote) {
            setSelectedNote(fetchedNotes[0]);
        }
    } catch (error) {
        console.error("Error saving note: ", error);
    } finally {
        setIsSaving(false);
    }
  };

  const handleDeleteNote = async () => {
    if (!user || !selectedNote) return;
    if (!window.confirm(`Are you sure you want to delete "${selectedNote.title}"?`)) return;

    try {
        const noteRef = doc(db, 'users', user.uid, 'notes', selectedNote.id);
        await deleteDoc(noteRef);
        setNotes(notes.filter(note => note.id !== selectedNote.id));
        setSelectedNote(null);
    } catch (error) {
        console.error("Error deleting note: ", error);
    }
  };

  if (authLoading || loading) {
    return <div className="flex items-center justify-center h-full"><FiLoader className="animate-spin mr-2" /> Loading Notes...</div>;
  }

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Notes List Panel */}
      <aside className="w-1/3 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800">My Notes</h2>
          <button onClick={handleAddNewNote} className="p-2 rounded-full hover:bg-slate-100 text-slate-600">
            <FiPlus size={20} />
          </button>
        </div>
        <ul className="overflow-y-auto">
            {notes.length > 0 ? (
                notes.map(note => (
                    <li key={note.id}>
                        <button onClick={() => handleSelectNote(note)} className={`w-full text-left p-4 border-b transition-colors ${selectedNote?.id === note.id ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}>
                            <h3 className="font-semibold text-slate-800 truncate">{note.title}</h3>
                            <p className="text-sm text-slate-500 truncate">{note.content || 'No content'}</p>
                        </button>
                    </li>
                ))
            ) : (
                <div className="p-8 text-center text-slate-500">
                    <FiBookOpen size={40} className="mx-auto mb-4" />
                    <p>You haven&apos;t created any notes yet. Click the &apos;+&apos; button to get started.</p>
                </div>
            )}
        </ul>
      </aside>

      {/* Note Editor Panel */}
      <main className="w-2/3 flex flex-col">
        {selectedNote === null && !currentTitle ? (
            <div className="h-full flex flex-col justify-center items-center text-slate-500">
                <FiFileText size={48} className="mb-4" />
                <h2 className="text-xl font-semibold">Select a note</h2>
                <p>Select a note from the left panel to view or edit it, or create a new one.</p>
            </div>
        ) : (
            <>
                <div className="p-4 border-b flex justify-between items-center bg-white">
                    <input 
                        type="text"
                        value={currentTitle}
                        onChange={(e) => setCurrentTitle(e.target.value)}
                        placeholder="Note Title"
                        className="text-xl font-bold text-slate-800 w-full focus:outline-none"
                    />
                    <div className="flex items-center gap-2">
                        {selectedNote && (
                            <button onClick={handleDeleteNote} className="p-2 rounded-full hover:bg-red-100 text-red-600">
                                <FiTrash2 />
                            </button>
                        )}
                        <button onClick={handleSaveNote} disabled={isSaving} className="bg-indigo-600 text-white font-semibold px-4 py-2 rounded-md hover:bg-indigo-700 disabled:bg-gray-400 flex items-center gap-2">
                            {isSaving ? <FiLoader className="animate-spin" /> : <FiSave />}
                            <span>Save</span>
                        </button>
                    </div>
                </div>
                <textarea
                    value={currentContent}
                    onChange={(e) => setCurrentContent(e.target.value)}
                    placeholder="Start writing your notes here..."
                    className="flex-grow w-full p-6 focus:outline-none text-slate-700 leading-relaxed resize-none"
                />
            </>
        )}
      </main>
    </div>
  );
};

export default NotesPage;
