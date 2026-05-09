// Runs once on first container start
// Creates the app database and seeds default subscription plans

db = db.getSiblingDB('yallaplay');

// Seed default subscription plans
db.subscription_plans.insertMany([
  {
    name: 'free',
    displayName: 'مجاني',
    price: 0,
    billingCycle: 'monthly',
    isVisible: true,
    features: {
      maxFacilities: 1,
      canAddOffers: false,
      canSetCustomSlotPricing: false,
      analyticsDepth: 'basic',
      prioritySupport: false,
      pointsMultiplier: 1,
      waitlistAccess: false,
      customBranding: false,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: 'primer',
    displayName: 'بريمر',
    price: 99,
    billingCycle: 'monthly',
    isVisible: true,
    features: {
      maxFacilities: 3,
      canAddOffers: true,
      canSetCustomSlotPricing: false,
      analyticsDepth: 'basic',
      prioritySupport: false,
      pointsMultiplier: 1.5,
      waitlistAccess: true,
      customBranding: false,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    name: 'pro',
    displayName: 'برو',
    price: 249,
    billingCycle: 'monthly',
    isVisible: true,
    features: {
      maxFacilities: 999,
      canAddOffers: true,
      canSetCustomSlotPricing: true,
      analyticsDepth: 'full',
      prioritySupport: true,
      pointsMultiplier: 2,
      waitlistAccess: true,
      customBranding: true,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]);

print('✅ YallaPlay DB initialized with default subscription plans');
