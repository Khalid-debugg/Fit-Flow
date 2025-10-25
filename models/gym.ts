import { QueryDocumentSnapshot } from 'firebase-admin/firestore';

export const GYM_STATUS = ['active', 'suspended'] as const;

type GymBranding = {
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
};

export type Gym = {
  id: string;
  name: string;
  subdomain: string;
  ownerId: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  status: (typeof GYM_STATUS)[number];
  branding: GymBranding;
};

export type CreateGymInput = Omit<
  Gym,
  'id' | 'createdAt' | 'updatedAt' | 'status'
>;

export type UpdateGymInput = Partial<
  Pick<Gym, 'name' | 'description' | 'branding'>
>;

export const gymConverter = {
  toFirestore: (gym: Partial<Gym>) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...data } = gym;
    return {
      ...data,
      createdAt: gym.createdAt || new Date(),
      updatedAt: new Date(),
      status: gym.status || 'active',
    };
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot): Gym => {
    const data = snapshot.data();
    return {
      id: snapshot.id,
      name: data.name,
      subdomain: data.subdomain,
      ownerId: data.ownerId,
      description: data.description,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      status: data.status,
      branding: data.branding,
    };
  },
};
