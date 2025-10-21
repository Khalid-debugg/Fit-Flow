import { QueryDocumentSnapshot } from 'firebase-admin/firestore';

export type GymStatus = 'active' | 'suspended' | 'deleted';
export type BillingCycle = 'monthly' | 'annual';
export type SubscriptionStatus = 'active' | 'trial' | 'expired';

export interface GymBranding {
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
}

export interface GymFeatures {
  memberManagement: boolean;
  staffManagement: boolean;
  classBooking: boolean;
  attendance: boolean;
  payments: boolean;
}

export interface GymLimits {
  members: number;
  staff: number;
  classes: number;
}

export interface GymSubscription {
  planId: string;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  expiresAt: Date;
  features: GymFeatures;
  limits: GymLimits;
}

export interface DaySchedule {
  open: string;
  close: string;
}

export interface OperatingHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface Gym {
  id: string;
  name: string;
  subdomain: string;
  ownerId: string;
  address: string;
  phone: string;
  timezone: string;
  createdAt: Date;
  status: GymStatus;
  branding: GymBranding;
  subscription: GymSubscription;
  operatingHours: OperatingHours;
}

export interface CreateGymInput {
  name: string;
  subdomain: string;
  ownerId: string;
  address: string;
  phone: string;
  timezone: string;
  branding: GymBranding;
  subscription: GymSubscription;
  operatingHours: OperatingHours;
}

export interface UpdateGymInput {
  name?: string;
  address?: string;
  phone?: string;
  timezone?: string;
  branding?: Partial<GymBranding>;
  operatingHours?: Partial<OperatingHours>;
}

export const gymConverter = {
  toFirestore: (gym: Partial<Gym>) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...data } = gym;
    return {
      ...data,
      createdAt: gym.createdAt || new Date(),
    };
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot): Gym => {
    const data = snapshot.data();
    return {
      id: snapshot.id,
      name: data.name,
      subdomain: data.subdomain,
      ownerId: data.ownerId,
      address: data.address,
      phone: data.phone,
      timezone: data.timezone,
      createdAt: data.createdAt?.toDate() || new Date(),
      status: data.status,
      branding: data.branding,
      subscription: {
        ...data.subscription,
        expiresAt: data.subscription.expiresAt?.toDate() || new Date(),
      },
      operatingHours: data.operatingHours,
    };
  },
};
