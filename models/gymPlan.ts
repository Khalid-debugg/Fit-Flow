import { QueryDocumentSnapshot } from 'firebase-admin/firestore';

export const BILLING_CYCLE = ['monthly', 'annual'] as const;
export const PLAN_STATUS = ['active', 'trial', 'expired', 'cancelled'] as const;

export type GymPlanFeatures = {
  memberManagement: boolean;
  staffManagement: boolean;
  classBooking: boolean;
  attendance: boolean;
  payments: boolean;
  reports: boolean;
};

export type GymPlanLimits = {
  members: number;
  staff: number;
  classes: number;
  branches: number;
};

export type GymPlan = {
  id: string;
  gymId: string;
  planName: string;
  description: string;
  price: number;
  billingCycle: (typeof BILLING_CYCLE)[number];
  features: GymPlanFeatures;
  limits: GymPlanLimits;
  status: (typeof PLAN_STATUS)[number];
  startDate: Date;
  expiresAt: Date;
  autoRenew: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateGymPlanInput = Omit<
  GymPlan,
  'id' | 'createdAt' | 'updatedAt'
>;

export type UpdateGymPlanInput = Partial<
  Pick<GymPlan, 'status' | 'expiresAt' | 'autoRenew'>
>;

export const gymPlanConverter = {
  toFirestore: (plan: Partial<GymPlan>) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...data } = plan;
    return {
      ...data,
      createdAt: plan.createdAt || new Date(),
      updatedAt: new Date(),
    };
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot): GymPlan => {
    const data = snapshot.data();
    return {
      id: snapshot.id,
      gymId: data.gymId,
      planName: data.planName,
      description: data.description,
      price: data.price,
      billingCycle: data.billingCycle,
      features: data.features,
      limits: data.limits,
      status: data.status,
      startDate: data.startDate?.toDate() || new Date(),
      expiresAt: data.expiresAt?.toDate() || new Date(),
      autoRenew: data.autoRenew ?? true,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };
  },
};
