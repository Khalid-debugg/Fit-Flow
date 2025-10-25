import { QueryDocumentSnapshot } from 'firebase-admin/firestore';

export const MEMBER_STATUS = [
  'active',
  'paused',
  'cancelled',
  'expired',
] as const;

export type GymMember = {
  id: string;
  userId: string;
  gymId: string;
  branchId?: string;
  membershipPlanId: string;
  status: (typeof MEMBER_STATUS)[number];
  startDate: Date;
  expiresAt: Date;
  lastPaymentDate?: Date;
  nextPaymentDate?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateGymMemberInput = Omit<
  GymMember,
  'id' | 'createdAt' | 'updatedAt'
>;

export type UpdateGymMemberInput = Partial<
  Pick<
    GymMember,
    | 'membershipPlanId'
    | 'status'
    | 'expiresAt'
    | 'lastPaymentDate'
    | 'nextPaymentDate'
  >
>;

export const gymMemberConverter = {
  toFirestore: (member: Partial<GymMember>) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...data } = member;
    return {
      ...data,
      createdAt: member.createdAt || new Date(),
      updatedAt: new Date(),
    };
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot): GymMember => {
    const data = snapshot.data();
    return {
      id: snapshot.id,
      userId: data.userId,
      gymId: data.gymId,
      branchId: data.branchId,
      membershipPlanId: data.membershipPlanId,
      status: data.status,
      startDate: data.startDate?.toDate() || new Date(),
      expiresAt: data.expiresAt?.toDate() || new Date(),
      lastPaymentDate: data.lastPaymentDate?.toDate(),
      nextPaymentDate: data.nextPaymentDate?.toDate(),
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };
  },
};
