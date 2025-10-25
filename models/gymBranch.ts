import { QueryDocumentSnapshot } from 'firebase-admin/firestore';

type DaySchedule = {
  open: string;
  close: string;
  isClosed: boolean;
};

type OperatingHours = {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
};

export type GymBranch = {
  id: string;
  gymId: string;
  name: string;
  address: string;
  phone: string;
  timezone: string;
  operatingHours: OperatingHours;
  isMain: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateGymBranchInput = Omit<
  GymBranch,
  'id' | 'createdAt' | 'updatedAt' | 'isActive'
>;

export type UpdateGymBranchInput = Partial<
  Pick<
    GymBranch,
    'name' | 'address' | 'phone' | 'timezone' | 'operatingHours' | 'isActive'
  >
>;

export const gymBranchConverter = {
  toFirestore: (branch: Partial<GymBranch>) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...data } = branch;
    return {
      ...data,
      createdAt: branch.createdAt || new Date(),
      updatedAt: new Date(),
      isActive: branch.isActive ?? true,
      isMain: branch.isMain ?? false,
    };
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot): GymBranch => {
    const data = snapshot.data();
    return {
      id: snapshot.id,
      gymId: data.gymId,
      name: data.name,
      address: data.address,
      phone: data.phone,
      timezone: data.timezone,
      operatingHours: data.operatingHours,
      isMain: data.isMain ?? false,
      isActive: data.isActive ?? true,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };
  },
};
