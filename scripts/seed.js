/*
  Usage:
    node scripts/seed.js            # upsert demo data
    node scripts/seed.js --reset    # delete known collections first
    node scripts/seed.js --indexes  # also run scripts/ensure-indexes.js

  Environment:
    MONGODB_URI=mongodb://user:pass@localhost:27017/yallaplay?authSource=admin
*/

const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');
const { spawnSync } = require('child_process');

const URI =
  process.env.MONGODB_URI ||
  'mongodb://yallaplay:yallaplay_dev_secret@localhost:27017/yallaplay?authSource=admin';

const reset = process.argv.includes('--reset');
const withIndexes = process.argv.includes('--indexes');

const ids = {
  owner1: new ObjectId('66b4a2e70000000000000001'),
  owner2: new ObjectId('66b4a2e70000000000000002'),
  athlete1: new ObjectId('66b4a2e70000000000000003'),
  admin1: new ObjectId('66b4a2e70000000000000004'),
  facility1: new ObjectId('66b4a2e70000000000000101'),
  facility2: new ObjectId('66b4a2e70000000000000102'),
  facility3: new ObjectId('66b4a2e70000000000000103'),
  booking1: new ObjectId('66b4a2e70000000000000201'),
  booking2: new ObjectId('66b4a2e70000000000000202'),
  offer1: new ObjectId('66b4a2e70000000000000301'),
  waitlist1: new ObjectId('66b4a2e70000000000000401'),
  notification1: new ObjectId('66b4a2e70000000000000501'),
  notification2: new ObjectId('66b4a2e70000000000000502'),
};

function dateStr(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function futureDate(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

function hoursAllWeek(open, close) {
  return {
    monday: { open, close },
    tuesday: { open, close },
    wednesday: { open, close },
    thursday: { open, close },
    friday: { open, close },
    saturday: { open, close },
    sunday: { open, close },
  };
}

async function seed() {
  const client = new MongoClient(URI);
  await client.connect();
  const db = client.db('yallaplay');

  const today = dateStr(0);
  const tomorrow = dateStr(1);

  const users = [
    {
      _id: ids.owner1,
      role: 'owner',
      name: 'Owner One',
      phone: '+966500000001',
      email: 'owner1@yallaplay.dev',
      skillLevel: 'beginner',
      preferredSports: ['football', 'padel'],
      location: { type: 'Point', coordinates: [46.6753, 24.7136] },
      points: 150,
      plan: 'pro',
      isActive: true,
      deviceTokens: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: ids.owner2,
      role: 'owner',
      name: 'Owner Two',
      phone: '+966500000002',
      email: 'owner2@yallaplay.dev',
      skillLevel: 'intermediate',
      preferredSports: ['basketball'],
      location: { type: 'Point', coordinates: [46.7219, 24.6877] },
      points: 80,
      plan: 'primer',
      isActive: true,
      deviceTokens: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: ids.athlete1,
      role: 'athlete',
      name: 'Athlete One',
      phone: '+966500000003',
      email: 'athlete1@yallaplay.dev',
      skillLevel: 'pro',
      preferredSports: ['football', 'basketball', 'tennis'],
      location: { type: 'Point', coordinates: [46.6947, 24.7743] },
      points: 320,
      plan: 'free',
      isActive: true,
      deviceTokens: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: ids.admin1,
      role: 'admin',
      name: 'Admin',
      phone: '+966500000004',
      email: 'admin@yallaplay.dev',
      skillLevel: 'beginner',
      preferredSports: [],
      location: null,
      points: 0,
      plan: 'custom',
      isActive: true,
      deviceTokens: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const facilities = [
    {
      _id: ids.facility1,
      ownerId: ids.owner1,
      name: 'Green Arena',
      description: 'Premium football and padel courts.',
      sports: ['football', 'padel'],
      images: ['https://picsum.photos/seed/yp-1/1200/800'],
      location: { type: 'Point', coordinates: [46.6753, 24.7136] },
      address: 'Riyadh, King Fahd Rd',
      phone: '+966500000101',
      slotDurationMinutes: 60,
      operatingHours: hoursAllWeek('08:00', '23:00'),
      pricePerSlot: 120,
      currency: 'SAR',
      tags: ['indoor', 'family'],
      isActive: true,
      totalBookings: 42,
      rating: 4.6,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: ids.facility2,
      ownerId: ids.owner1,
      name: 'City Hoops',
      description: 'Full-size basketball court with lighting.',
      sports: ['basketball'],
      images: ['https://picsum.photos/seed/yp-2/1200/800'],
      location: { type: 'Point', coordinates: [46.7219, 24.6877] },
      address: 'Riyadh, Olaya St',
      phone: '+966500000102',
      slotDurationMinutes: 90,
      operatingHours: hoursAllWeek('09:00', '22:00'),
      pricePerSlot: 150,
      currency: 'SAR',
      tags: ['outdoor'],
      isActive: true,
      totalBookings: 30,
      rating: 4.2,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: ids.facility3,
      ownerId: ids.owner2,
      name: 'Racquet Hub',
      description: 'Tennis and squash courts with pro coaching.',
      sports: ['tennis', 'squash'],
      images: ['https://picsum.photos/seed/yp-3/1200/800'],
      location: { type: 'Point', coordinates: [46.6947, 24.7743] },
      address: 'Riyadh, Northern Ring',
      phone: '+966500000103',
      slotDurationMinutes: 60,
      operatingHours: hoursAllWeek('07:00', '21:00'),
      pricePerSlot: 110,
      currency: 'SAR',
      tags: ['coaching'],
      isActive: true,
      totalBookings: 18,
      rating: 4.0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const bookings = [
    {
      _id: ids.booking1,
      facilityId: ids.facility1,
      userId: ids.athlete1,
      sport: 'football',
      date: tomorrow,
      startTime: '18:00',
      endTime: '19:00',
      status: 'confirmed',
      paymentMethod: 'qr_cash',
      paymentStatus: 'paid',
      totalPrice: 120,
      discountApplied: 0,
      pointsEarned: 12,
      reminderSent: false,
      sharedViaWhatsapp: false,
      confirmedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: ids.booking2,
      facilityId: ids.facility2,
      userId: ids.athlete1,
      sport: 'basketball',
      date: today,
      startTime: '20:00',
      endTime: '21:30',
      status: 'pending_payment',
      paymentMethod: 'mada',
      paymentStatus: 'unpaid',
      totalPrice: 150,
      discountApplied: 0,
      pointsEarned: 0,
      reminderSent: false,
      sharedViaWhatsapp: false,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const offers = [
    {
      _id: ids.offer1,
      facilityId: ids.facility1,
      ownerId: ids.owner1,
      date: tomorrow,
      startTime: '16:00',
      discountPercent: 20,
      originalPrice: 120,
      discountedPrice: 96,
      isActive: true,
      expiresAt: futureDate(2),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const waitlists = [
    {
      _id: ids.waitlist1,
      facilityId: ids.facility1,
      userId: ids.athlete1,
      date: tomorrow,
      startTime: '18:00',
      position: 1,
      status: 'waiting',
      expiresAt: futureDate(7),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const notifications = [
    {
      _id: ids.notification1,
      userId: ids.athlete1,
      type: 'booking_confirmed',
      title: 'Booking confirmed',
      body: 'Your booking for Green Arena is confirmed.',
      data: { bookingId: ids.booking1.toString() },
      isRead: false,
      sentAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      _id: ids.notification2,
      userId: ids.owner1,
      type: 'offer',
      title: 'Offer created',
      body: 'A new offer is active for tomorrow 16:00.',
      data: { offerId: ids.offer1.toString() },
      isRead: false,
      sentAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const subscriptionPlans = [
    {
      name: 'free',
      displayName: 'Free',
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
    },
    {
      name: 'primer',
      displayName: 'Primer',
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
    },
    {
      name: 'pro',
      displayName: 'Pro',
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
    },
  ];

  const collections = [
    'users',
    'facilities',
    'bookings',
    'offers',
    'waitlists',
    'notifications',
    'subscription_plans',
  ];

  if (reset) {
    for (const name of collections) {
      await db.collection(name).deleteMany({});
    }
  }

  const upsertMany = async (collectionName, docs, key = '_id') => {
    if (!docs.length) return;
    const ops = docs.map((doc) => ({
      updateOne: {
        filter: { [key]: doc[key] },
        update: { $set: doc },
        upsert: true,
      },
    }));
    await db.collection(collectionName).bulkWrite(ops, { ordered: false });
  };

  await upsertMany('users', users);
  await upsertMany('facilities', facilities);
  await upsertMany('bookings', bookings);
  await upsertMany('offers', offers);
  await upsertMany('waitlists', waitlists);
  await upsertMany('notifications', notifications);
  await upsertMany('subscription_plans', subscriptionPlans, 'name');

  console.log('Seed complete.');
  console.log(`Users: ${users.length}`);
  console.log(`Facilities: ${facilities.length}`);
  console.log(`Bookings: ${bookings.length}`);
  console.log(`Offers: ${offers.length}`);
  console.log(`Waitlists: ${waitlists.length}`);
  console.log(`Notifications: ${notifications.length}`);
  console.log(`Subscription plans: ${subscriptionPlans.length}`);

  await client.close();

  if (withIndexes) {
    const scriptPath = path.join(__dirname, 'ensure-indexes.js');
    spawnSync(process.execPath, [scriptPath], { stdio: 'inherit' });
  }
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
