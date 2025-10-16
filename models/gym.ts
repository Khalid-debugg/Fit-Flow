export type Timestamp = string | number | Date;

export interface GymTheme {
  primaryColor: string;
  logo?: string;
  borderRadius?: number;
  fontFamily?: string;
}

export interface GymContact {
  timezone?: string;
  currency?: string;
}

export interface GymFeatures {
  classScheduling?: boolean;
  attendance?: boolean;
  payments?: boolean;
  personalTraining?: boolean;
}

export interface GymStats {
  totalMembers: number;
  activeMembers: number;
}

export interface Gym {
  name: string;
  slug: string;
  ownerId: string;
  theme: GymTheme;
  contact?: GymContact;
  features?: GymFeatures;
  stats: GymStats;
  createdAt: Timestamp;
  isActive: boolean;
}
export type GymWithId = Gym & { id: string };

/** Input when creating a gym */
export type CreateGymInput = Partial<Gym> & {
  name: string;
  ownerId: string;
  slug?: string;
  createdAt?: Timestamp;
  isActive?: boolean;
};

/** For updates to settings */
export type UpdateGymSettingsInput = Partial<
  Pick<Gym, 'name' | 'theme' | 'contact' | 'features' | 'isActive' | 'slug'>
>;

/** For updating stats */
export type UpdateGymStatsInput = Partial<GymStats>;

/** For forms / client */
export type GymInput = Pick<Gym, 'name' | 'slug' | 'ownerId'>;
