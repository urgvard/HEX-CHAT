import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { UserProfile, UserRole, FirebaseCustomConfig } from '../types';
import {
  initFirebase,
  getStoredFirebaseConfig,
  saveStoredFirebaseConfig
} from '../firebase/config';
import { saveUserProfile, localStore } from '../firebase/service';

interface AuthContextType {
  currentUser: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  role: UserRole;
  isAdmin: boolean;
  isLoading: boolean;
  isLiveFirebase: boolean;
  firebaseConfig: FirebaseCustomConfig;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, displayName: string, role?: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  switchDemoRole: (role: UserRole) => void;
  updateFirebaseConfig: (config: FirebaseCustomConfig) => void;
  db: any;
  storage: any;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<FirebaseCustomConfig>(getStoredFirebaseConfig());
  const [firebaseInstances, setFirebaseInstances] = useState(() => initFirebase(config));
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    // Default to admin demo user for instant explore experience
    return localStore.users[0];
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize and observe Firebase Auth if live credentials are active
  useEffect(() => {
    const instances = initFirebase(config);
    setFirebaseInstances(instances);

    if (!instances.auth || !instances.isLive) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(instances.auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        try {
          if (instances.db) {
            const userDoc = await getDoc(doc(instances.db, 'users', user.uid));
            if (userDoc.exists()) {
              const data = userDoc.data() as UserProfile;
              setCurrentUser({
                uid: user.uid,
                email: user.email || data.email,
                displayName: data.displayName || user.displayName || 'Member',
                role: data.role || (user.email === 'urgvard@gmail.com' ? 'admin' : 'member'),
                createdAt: data.createdAt || new Date().toISOString()
              });
            } else {
              // Create initial user doc
              const newProfile: UserProfile = {
                uid: user.uid,
                email: user.email || '',
                displayName: user.displayName || user.email?.split('@')[0] || 'Community Member',
                role: user.email === 'urgvard@gmail.com' ? 'admin' : 'member',
                createdAt: new Date().toISOString()
              };
              await saveUserProfile(instances.db, newProfile);
              setCurrentUser(newProfile);
            }
          }
        } catch (e) {
          console.warn('Error fetching Firestore user profile:', e);
        }
      } else {
        // Not logged in to live Firebase
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [config]);

  const loginWithEmail = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      if (firebaseInstances.auth && firebaseInstances.isLive) {
        await signInWithEmailAndPassword(firebaseInstances.auth, email, pass);
      } else {
        // Fallback local store login
        const found = localStore.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
        if (found) {
          setCurrentUser(found);
        } else {
          // Create temp demo user
          const newUser: UserProfile = {
            uid: 'user_' + Date.now(),
            email,
            displayName: email.split('@')[0],
            role: email === 'urgvard@gmail.com' ? 'admin' : 'member',
            createdAt: new Date().toISOString()
          };
          localStore.users.push(newUser);
          localStore.notifyUsers();
          setCurrentUser(newUser);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const registerWithEmail = async (
    email: string,
    pass: string,
    displayName: string,
    requestedRole: UserRole = 'member'
  ) => {
    setIsLoading(true);
    try {
      const assignedRole = email === 'urgvard@gmail.com' ? 'admin' : requestedRole;
      if (firebaseInstances.auth && firebaseInstances.isLive) {
        const cred = await createUserWithEmailAndPassword(firebaseInstances.auth, email, pass);
        const profile: UserProfile = {
          uid: cred.user.uid,
          email,
          displayName,
          role: assignedRole,
          createdAt: new Date().toISOString()
        };
        if (firebaseInstances.db) {
          await saveUserProfile(firebaseInstances.db, profile);
        }
        setCurrentUser(profile);
      } else {
        const newProfile: UserProfile = {
          uid: 'user_' + Date.now(),
          email,
          displayName,
          role: assignedRole,
          createdAt: new Date().toISOString(),
          avatarColor: assignedRole === 'admin' ? 'bg-emerald-600' : 'bg-blue-600'
        };
        localStore.users.push(newProfile);
        localStore.notifyUsers();
        setCurrentUser(newProfile);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    if (firebaseInstances.auth && firebaseInstances.isLive) {
      await signOut(firebaseInstances.auth);
    }
    setCurrentUser(null);
    setFirebaseUser(null);
  };

  const switchDemoRole = (role: UserRole) => {
    if (role === 'admin') {
      setCurrentUser(localStore.users[0]); // Admin Eleanor
    } else {
      setCurrentUser(localStore.users[1]); // Member Marcus
    }
  };

  const updateFirebaseConfig = (newConfig: FirebaseCustomConfig) => {
    saveStoredFirebaseConfig(newConfig);
    setConfig(newConfig);
  };

  const role: UserRole = currentUser?.role || 'member';
  const isAdmin = role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        firebaseUser,
        role,
        isAdmin,
        isLoading,
        isLiveFirebase: !!firebaseInstances.isLive,
        firebaseConfig: config,
        loginWithEmail,
        registerWithEmail,
        logout,
        switchDemoRole,
        updateFirebaseConfig,
        db: firebaseInstances.db,
        storage: firebaseInstances.storage
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
