/**
 * Run with: node scripts/ensure-indexes.js
 * Idempotent — safe to run multiple times.
 * Creates all critical indexes including the concurrency lock on bookings.
 */

const { MongoClient } = require('mongodb');

const URI = process.env.MONGODB_URI ||
  'mongodb://yallaplay:yallaplay_dev_secret@localhost:27017/yallaplay?authSource=admin';

async function ensureIndexes() {
  const client = new MongoClient(URI);
  await client.connect();
  const db = client.db('yallaplay');

  console.log('🔧 Ensuring indexes...\n');

  // ── Users ────────────────────────────────────────────────────────────────
  await db.collection('users').createIndexes([
    { key: { phone: 1 }, unique: true, name: 'users_phone_unique' },
    { key: { location: '2dsphere' }, name: 'users_location_geo' },
    { key: { role: 1, isActive: 1 }, name: 'users_role_active' },
  ]);
  console.log('✅ users indexes');

  // ── Facilities ───────────────────────────────────────────────────────────
  await db.collection('facilities').createIndexes([
    { key: { location: '2dsphere' }, name: 'facilities_location_geo' },
    { key: { sports: 1, isActive: 1 }, name: 'facilities_sport_active' },
    { key: { totalBookings: -1 }, name: 'facilities_popular_sort' },
    { key: { name: 'text', description: 'text' }, name: 'facilities_text_search' },
    { key: { ownerId: 1 }, name: 'facilities_owner' },
  ]);
  console.log('✅ facilities indexes');

  // ── Bookings — THE CRITICAL CONCURRENCY LOCK ─────────────────────────────
  await db.collection('bookings').createIndexes([
    {
      key: { facilityId: 1, date: 1, startTime: 1 },
      unique: true,
      partialFilterExpression: { status: { $nin: ['cancelled'] } },
      name: 'slot_unique_lock',
    },
    {
      key: { expiresAt: 1 },
      expireAfterSeconds: 0,
      name: 'booking_ttl_pending',
    },
    { key: { userId: 1, status: 1 }, name: 'bookings_user_status' },
    { key: { facilityId: 1, date: 1, status: 1 }, name: 'bookings_facility_date_status' },
    { key: { status: 1, reminderSent: 1 }, name: 'bookings_reminder_cron' },
  ]);
  console.log('✅ bookings indexes (concurrency lock active)');

  // ── Waitlists ────────────────────────────────────────────────────────────
  await db.collection('waitlists').createIndexes([
    {
      key: { expiresAt: 1 },
      expireAfterSeconds: 0,
      name: 'waitlist_ttl',
    },
    {
      key: { facilityId: 1, date: 1, startTime: 1, userId: 1 },
      unique: true,
      name: 'waitlist_user_slot_unique',
    },
    { key: { facilityId: 1, date: 1, startTime: 1, position: 1 }, name: 'waitlist_position' },
  ]);
  console.log('✅ waitlists indexes');

  // ── Notifications ────────────────────────────────────────────────────────
  await db.collection('notifications').createIndexes([
    {
      key: { createdAt: 1 },
      expireAfterSeconds: 7_776_000, // 90 days
      name: 'notification_ttl_90d',
    },
    { key: { userId: 1, isRead: 1 }, name: 'notifications_user_unread' },
  ]);
  console.log('✅ notifications indexes');

  // ── Offers ───────────────────────────────────────────────────────────────
  await db.collection('offers').createIndexes([
    {
      key: { expiresAt: 1 },
      expireAfterSeconds: 0,
      name: 'offer_ttl',
    },
    { key: { facilityId: 1, date: 1, startTime: 1, isActive: 1 }, name: 'offers_slot_active' },
  ]);
  console.log('✅ offers indexes');

  console.log('\n🚀 All indexes created successfully.');
  await client.close();
}

ensureIndexes().catch((err) => {
  console.error('❌ Index creation failed:', err.message);
  process.exit(1);
});
