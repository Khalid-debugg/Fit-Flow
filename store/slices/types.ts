import { User } from '@/models/user';
import { User as FirebaseUser } from 'firebase/auth';
export type AuthState = {
  user: FirebaseUser | null;
  idToken: string | null;
  role: string | null;
  isAuthenticated: boolean;
  loading: boolean;
};
export type UserState = {
  currentUser: User | null;
  loading: boolean;
  error: string | null;
  isProfileComplete: boolean;
};
