import { QueryDocumentSnapshot } from 'firebase-admin/firestore';

export type MemberStatus = 'active' | 'paused' | 'cancelled';

export interface MemberPayment {
  lastPayment: Date;
  nextBilling: Date;
  amount: number;
}

export interface GymMember {
  id: string;
  userId: string;
  gymId: string;
  membershipPlanId: string;
  status: MemberStatus;
  startDate: Date;
  expiresAt: Date;
  payment: MemberPayment;
}

export interface CreateGymMemberInput {
  userId: string;
  gymId: string;
  membershipPlanId: string;
  status: MemberStatus;
  startDate: Date;
  expiresAt: Date;
  payment: MemberPayment;
}

export interface UpdateGymMemberInput {
  membershipPlanId?: string;
  status?: MemberStatus;
  expiresAt?: Date;
  payment?: Partial<MemberPayment>;
}

export const gymMemberConverter = {
  toFirestore: (member: Partial<GymMember>) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...data } = member;
    return {
      ...data,
      startDate: member.startDate || new Date(),
    };
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot): GymMember => {
    const data = snapshot.data();
    return {
      id: snapshot.id,
      userId: data.userId,
      gymId: data.gymId,
      membershipPlanId: data.membershipPlanId,
      status: data.status,
      startDate: data.startDate?.toDate() || new Date(),
      expiresAt: data.expiresAt?.toDate() || new Date(),
      payment: {
        lastPayment: data.payment.lastPayment?.toDate() || new Date(),
        nextBilling: data.payment.nextBilling?.toDate() || new Date(),
        amount: data.payment.amount,
      },
    };
  },
};
