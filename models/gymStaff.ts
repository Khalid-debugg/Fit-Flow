import { QueryDocumentSnapshot } from 'firebase-admin/firestore';

export const STAFF_ROLES = ['manager', 'trainer', 'front_desk'] as const;

export type GymStaff = {
  id: string;
  userId: string;
  gymId: string;
  branchId?: string;
  role: (typeof STAFF_ROLES)[number];
  permissions: string[];
  invitedBy: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateGymStaffInput = Omit<
  GymStaff,
  'id' | 'createdAt' | 'updatedAt' | 'isActive'
>;

export type UpdateGymStaffInput = Partial<
  Pick<GymStaff, 'role' | 'permissions' | 'branchId' | 'isActive'>
>;

export const gymStaffConverter = {
  toFirestore: (staff: Partial<GymStaff>) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...data } = staff;
    return {
      ...data,
      createdAt: staff.createdAt || new Date(),
      updatedAt: new Date(),
      isActive: staff.isActive ?? true,
    };
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot): GymStaff => {
    const data = snapshot.data();
    return {
      id: snapshot.id,
      userId: data.userId,
      gymId: data.gymId,
      branchId: data.branchId,
      role: data.role,
      permissions: data.permissions || [],
      invitedBy: data.invitedBy,
      isActive: data.isActive ?? true,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };
  },
};
