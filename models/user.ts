import {
  FirestoreDataConverter,
  QueryDocumentSnapshot,
} from 'firebase-admin/firestore';

export const USER_ROLES = ['owner', 'staff', 'member', 'admin'] as const;
export const GENDERS = ['male', 'female'] as const;

export type User = {
  id: string;
  email: string;
  name: string;
  phone?: string;
  gender?: (typeof GENDERS)[number];
  photoURL?: string;
  createdAt: Date;
  role: (typeof USER_ROLES)[number];
};

export type CreateUserInput = Omit<User, 'id' | 'createdAt' | 'isActive'> & {
  password: string;
};

export type UpdateUserInput = Partial<
  Pick<User, 'name' | 'phone' | 'gender' | 'photoURL'>
>;

export const userConverter: FirestoreDataConverter<User> = {
  toFirestore: (user: User) => {
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
      name: data.name,
      phone: data.phone,
      gender: data.gender,
      photoURL: data.photoURL,
      createdAt: data.createdAt?.toDate() || new Date(),
      role: data.role,
    };
  },
};
