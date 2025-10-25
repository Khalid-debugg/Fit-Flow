import { QueryDocumentSnapshot } from 'firebase-admin/firestore';

export const MEMBERSHIP_DURATION_TYPE = ['days', 'months', 'years'] as const;

export type MembershipPlan = {
  id: string;
  gymId: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  duration: number;
  durationType: (typeof MEMBERSHIP_DURATION_TYPE)[number];
  createdAt: Date;
  updatedAt: Date;
};

export type CreateMembershipPlanInput = Omit<
  MembershipPlan,
  'id' | 'createdAt' | 'updatedAt' | 'isActive'
>;

export type UpdateMembershipPlanInput = Partial<
  Omit<CreateMembershipPlanInput, 'gymId'>
>;

export const membershipPlanConverter = {
  toFirestore: (plan: Partial<MembershipPlan>) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...data } = plan;
    return {
      ...data,
      createdAt: plan.createdAt || new Date(),
      updatedAt: new Date(),
    };
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot): MembershipPlan => {
    const data = snapshot.data();
    return {
      id: snapshot.id,
      gymId: data.gymId,
      name: data.name,
      description: data.description,
      price: data.price,
      duration: data.duration,
      durationType: data.durationType,
      currency: data.currency,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };
  },
};
