export const SportType = [
  'football',
  'basketball',
  'tennis',
  'volleyball',
  'padel',
  'squash',
  'badminton',
  'swimming',
] as const;

export type SportType = (typeof SportType)[number];

export const SkillLevel = ['beginner', 'intermediate', 'pro'] as const;
export type SkillLevel = (typeof SkillLevel)[number];

export const UserRole = ['athlete', 'owner', 'admin'] as const;
export type UserRole = (typeof UserRole)[number];

export const PlanTier = ['free', 'primer', 'pro', 'custom'] as const;
export type PlanTier = (typeof PlanTier)[number];

export const BookingStatus = [
  'awaiting_payment',
  'pending_payment',
  'confirmed',
  'cancelled',
  'completed',
  'no_show',
] as const;
export type BookingStatus = (typeof BookingStatus)[number];

export const PaymentMethod = ['qr_cash', 'stc_pay', 'mada', 'points'] as const;
export type PaymentMethod = (typeof PaymentMethod)[number];

export const PaymentStatus = ['unpaid', 'paid'] as const;
export type PaymentStatus = (typeof PaymentStatus)[number];

export const NotificationType = [
  'booking_confirmed',
  'booking_reminder',
  'booking_cancelled',
  'payment_submitted',
  'new_booking',
  'waitlist_available',
  'points_earned',
  'offer',
  'plan_upgraded',
  'plan_expired',
] as const;
export type NotificationType = (typeof NotificationType)[number];

export const WaitlistStatus = ['waiting', 'notified', 'converted', 'expired'] as const;
export type WaitlistStatus = (typeof WaitlistStatus)[number];

export const BillingCycle = ['monthly', 'yearly'] as const;
export type BillingCycle = (typeof BillingCycle)[number];

export const DayOfWeek = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;
export type DayOfWeek = (typeof DayOfWeek)[number];
