"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DayOfWeek = exports.BillingCycle = exports.WaitlistStatus = exports.NotificationType = exports.PaymentStatus = exports.PaymentMethod = exports.BookingStatus = exports.PlanTier = exports.UserRole = exports.SkillLevel = exports.SportType = void 0;
exports.SportType = [
    'football',
    'basketball',
    'tennis',
    'volleyball',
    'padel',
    'squash',
    'badminton',
    'swimming',
];
exports.SkillLevel = ['beginner', 'intermediate', 'pro'];
exports.UserRole = ['athlete', 'owner', 'admin'];
exports.PlanTier = ['free', 'primer', 'pro', 'custom'];
exports.BookingStatus = [
    'awaiting_payment',
    'pending_payment',
    'confirmed',
    'cancelled',
    'completed',
    'no_show',
];
exports.PaymentMethod = ['qr_cash', 'stc_pay', 'mada', 'points'];
exports.PaymentStatus = ['unpaid', 'paid'];
exports.NotificationType = [
    'booking_confirmed',
    'booking_reminder',
    'booking_cancelled',
    'waitlist_available',
    'points_earned',
    'offer',
    'plan_upgraded',
    'plan_expired',
];
exports.WaitlistStatus = ['waiting', 'notified', 'converted', 'expired'];
exports.BillingCycle = ['monthly', 'yearly'];
exports.DayOfWeek = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
];
//# sourceMappingURL=enums.js.map