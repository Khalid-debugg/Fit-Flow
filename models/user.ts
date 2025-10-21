import { QueryDocumentSnapshot } from 'firebase-admin/firestore';

export type UserRole = 'owner' | 'staff' | 'member';

export type AuthProvider = 'email' | 'google' | 'apple';

export interface User {
  id: string;
  email: string;
  password: string;
  authProvider: AuthProvider;
  name: string;
  phone: string;
  createdAt: Date;
  role: UserRole;
}

export interface CreateUserInput {
  email: string;
  password: string;
  authProvider: AuthProvider;
  name: string;
  phone: string;
  role: UserRole;
}

export interface UpdateUserInput {
  name?: string;
  phone?: string;
}

export const userConverter = {
  toFirestore: (user: Partial<User>) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...data } = user;
    return {
      ...data,
      createdAt: user.createdAt || new Date(),
    };
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot): User => {
    const data = snapshot.data();
    return {
      id: snapshot.id,
      email: data.email,
      password: data.password,
      authProvider: data.authProvider,
      name: data.name,
      phone: data.phone,
      createdAt: data.createdAt?.toDate() || new Date(),
      role: data.role,
    };
  },
};
