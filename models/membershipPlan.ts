import { QueryDocumentSnapshot } from 'firebase-admin/firestore';

export type MembershipPlanType =
  | 'monthly'
  | 'annual'
  | 'drop_in'
  | 'class_pack';

export interface MembershipPlan {
  id: string;
  gymId: string;
  name: string;
  description: string;
  price: number;
  type: MembershipPlanType;
  duration: number;
  benefits: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMembershipPlanInput {
  gymId: string;
  name: string;
  description: string;
  price: number;
  type: MembershipPlanType;
  duration: number;
  benefits: string[];
  isActive: boolean;
}

export interface UpdateMembershipPlanInput {
  name?: string;
  description?: string;
  price?: number;
  type?: MembershipPlanType;
  duration?: number;
  benefits?: string[];
  isActive?: boolean;
}

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
      type: data.type,
      duration: data.duration,
      benefits: data.benefits,
      isActive: data.isActive,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };
  },
};
