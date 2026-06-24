import { useState, useEffect, useCallback } from 'react';
import { Hole } from '../types';
import { initialHoles } from '../data';
import { db, HOLES_COLLECTION, auth, provider } from '../lib/firebase';
import { collection, doc, writeBatch, onSnapshot, updateDoc } from 'firebase/firestore';
import { signInWithPopup, User } from 'firebase/auth';

export function useHoles() {
  const [holes, setHoles] = useState<Hole[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  // Load from Firebase
  useEffect(() => {
    let unsubscribeSnapshot = () => {};
    let unsubscribeAuth = () => {};

    const loadData = async () => {
      // Wait for auth
      unsubscribeAuth = auth.onAuthStateChanged(currentUser => {
        setUser(currentUser);
        if (currentUser) {
          const colRef = collection(db, HOLES_COLLECTION);
          unsubscribeSnapshot = onSnapshot(colRef, async (snapshot) => {
            if (snapshot.empty) {
              // Initialize Firebase with initialHoles
              const batch = writeBatch(db);
              initialHoles.forEach(h => {
                const docRef = doc(db, HOLES_COLLECTION, h.id);
                batch.set(docRef, h);
              });
              await batch.commit();
            } else {
              const loadedHoles: Hole[] = [];
              snapshot.forEach(doc => {
                loadedHoles.push(doc.data() as Hole);
              });
              // Sort by seq
              loadedHoles.sort((a, b) => parseInt(a.seq) - parseInt(b.seq));
              setHoles(loadedHoles);
              setLoading(false);
            }
          });
        } else {
          setLoading(false);
          setHoles([]);
          unsubscribeSnapshot();
        }
      });
    };

    loadData();

    return () => {
      unsubscribeAuth();
      unsubscribeSnapshot();
    };
  }, []);

  const login = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const logout = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const updateHole = useCallback(async (id: string, data: Partial<Hole>) => {
    // Optimistic update
    setHoles(prev => prev.map(h => h.id === id ? { ...h, ...data } : h));
    try {
      const docRef = doc(db, HOLES_COLLECTION, id);
      await updateDoc(docRef, data);
    } catch (e) {
      console.error("Error updating hole", e);
    }
  }, []);

  const markDrilled = useCallback((id: string, drilledDepth: number) => {
    updateHole(id, { status: 'DRILLED', drilledAt: new Date().toISOString(), drilledDepth });
  }, [updateHole]);

  const markInjected = useCallback((id: string, injectedCement: number) => {
    updateHole(id, { status: 'INJECTED', injectedAt: new Date().toISOString(), injectedCement });
  }, [updateHole]);

  const markCompleted = useCallback((id: string) => {
    updateHole(id, { status: 'COMPLETED', completedAt: new Date().toISOString() });
  }, [updateHole]);

  const resetData = useCallback(async () => {
    setHoles(initialHoles);
    const batch = writeBatch(db);
    initialHoles.forEach(h => {
      const docRef = doc(db, HOLES_COLLECTION, h.id);
      batch.set(docRef, h);
    });
    await batch.commit();
  }, []);

  const debugAdvanceTime = useCallback(() => {
    setHoles(prev => {
      const newHoles = [...prev];
      newHoles.forEach(h => {
        if (h.status === 'INJECTED' && h.injectedAt) {
          const d = new Date(h.injectedAt);
          d.setHours(d.getHours() - 12);
          updateHole(h.id, { injectedAt: d.toISOString() });
        }
      });
      return newHoles;
    });
  }, [updateHole]);

  return { holes, loading, user, login, logout, markDrilled, markInjected, markCompleted, resetData, debugAdvanceTime, updateHole };
}
