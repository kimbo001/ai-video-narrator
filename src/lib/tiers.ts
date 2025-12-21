export const DAILY_LIMITS = {
  free: 5,
  new_tuber: 10,
  creator: 25,
  pro: 50,
} as const;

export type Tier = keyof typeof DAILY_LIMITS;
