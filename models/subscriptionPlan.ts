import { QueryDocumentSnapshot } from 'firebase-admin/firestore';

export interface SubscriptionPlanFeatures {
  memberManagement: boolean;
  staffManagement: boolean;
  classBooking: boolean;
  attendance: boolean;
  payments: boolean;
}

export interface SubscriptionPlanLimits {
  members: number;
  staff: number;
  classes: number;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  billingCycle: 'monthly' | 'annual';
  features: SubscriptionPlanFeatures;
  limits: SubscriptionPlanLimits;
}

export interface CreateSubscriptionPlanInput {
  name: string;
  price: number;
  billingCycle: 'monthly' | 'annual';
  features: SubscriptionPlanFeatures;
  limits: SubscriptionPlanLimits;
}

export interface UpdateSubscriptionPlanInput {
  name?: string;
  price?: number;
  billingCycle?: 'monthly' | 'annual';
  features?: Partial<SubscriptionPlanFeatures>;
  limits?: Partial<SubscriptionPlanLimits>;
}

export const subscriptionPlanConverter = {
  toFirestore: (plan: Partial<SubscriptionPlan>) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...data } = plan;
    return data;
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot): SubscriptionPlan => {
    const data = snapshot.data();
    return {
      id: snapshot.id,
      name: data.name,
      price: data.price,
      billingCycle: data.billingCycle,
      features: data.features,
      limits: data.limits,
    };
  },
};
