import { QueryDocumentSnapshot } from 'firebase-admin/firestore';

export type StaffRole = 'manager' | 'trainer' | 'front_desk';

export interface GymStaff {
  id: string;
  userId: string;
  gymId: string;
  role: StaffRole;
  permissions: string[];
  createdAt: Date;
  invitedBy: string;
}

export interface CreateGymStaffInput {
  userId: string;
  gymId: string;
  role: StaffRole;
  permissions: string[];
  invitedBy: string;
}

export interface UpdateGymStaffInput {
  role?: StaffRole;
  permissions?: string[];
}

export const gymStaffConverter = {
  toFirestore: (staff: Partial<GymStaff>) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...data } = staff;
    return {
      ...data,
      createdAt: staff.createdAt || new Date(),
    };
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot): GymStaff => {
    const data = snapshot.data();
    return {
      id: snapshot.id,
      userId: data.userId,
      gymId: data.gymId,
      role: data.role,
      permissions: data.permissions,
      createdAt: data.createdAt?.toDate() || new Date(),
      invitedBy: data.invitedBy,
    };
  },
};
