# تشغيل مشروع YallaPlay (تفصيلي)

هذا الملف يشرح تشغيل جميع اجزاء المشروع داخل هذا المستودع.

## المتطلبات
- Node.js >= 20 (حسب `package.json` في الجذر).
- npm >= 10.8.1.
- Docker + Docker Compose لتشغيل MongoDB و Redis.
- Expo Go او محاكي iOS/Android لتجربة تطبيقات الموبايل.

## 1) تثبيت الحزم
من جذر المشروع:
```bash
npm install
```

> المشروع يستخدم Workspaces، لذلك هذا الامر يثبت كل الحزم داخل `apps/*` و `packages/*`.

## 2) تشغيل البنية التحتية (قاعدة البيانات والريديس)
من جذر المشروع:
```bash
npm run db:up
```
سيتم تشغيل الخدمات التالية عبر Docker:
- MongoDB على المنفذ 27017 (اسم المستخدم `yallaplay` وكلمة المرور `yallaplay_dev_secret`).
- Redis على المنفذ 6379.
- Mongo Express على المنفذ 8081.

لإيقافها:
```bash
npm run db:down
```

## 3) تشغيل الباك اند + لوحة الادارة
من جذر المشروع:
```bash
npm run dev
```
هذا يشغل كل مشروع يملك سكربت `dev` داخل المونوربو:
- API (NestJS) داخل `apps/api` عبر `nest start --watch`.
- Admin Dashboard (Next.js) داخل `apps/admin-dashboard` عبر `next dev -p 3001`.

> ملاحظة: منفذ الـ API يعتمد على اعدادات NestJS (افتراضيا غالبا 3000) وقد يتغير حسب ملف env لديك.

## 4) تشغيل تطبيق المستخدم (Expo)
افتح طرفية جديدة داخل:
```bash
cd apps/user-app
npm run start
```
هذا يشغل Metro/Expo. يمكنك بعدها:
- فتح التطبيق عبر Expo Go.
- او تشغيله على محاكي iOS/Android.

## 5) تشغيل تطبيق المالك (Expo)
افتح طرفية جديدة داخل:
```bash
cd apps/owner-app
npm run start
```

## 6) متغيرات البيئة (Environment Variables)
- نظام Turbo يمرر ملفات `.env*` لجميع عمليات build/dev.
- اذا كانت لديك ملفات بيئة، ضعها في مجلد كل تطبيق حسب الحاجة (مثلا `apps/api/.env`).
- اذا لم تكن ملفات البيئة موجودة، قد تحتاج لاضافتها لاحقا حسب الخدمات التي تعتمد عليها.

### WhatsApp OTP (Baileys)
- في `apps/api/.env` اضف:
  - `SMS_PROVIDER=whatsapp`
  - `WHATSAPP_AUTH_DIR=.wa_session`
- عند تشغيل الباك اند سيظهر QR في الطرفية. امسحه من واتساب الذي سيتم الارسال منه.

## ملاحظات تشغيل سريعة
- لتشغيل كل شيء معا تحتاج 3 طرفيات على الاقل:
  1) جذر المشروع: `npm run dev`
  2) `apps/user-app`: `npm run start`
  3) `apps/owner-app`: `npm run start`
- قاعدة البيانات تعمل في الخلفية عبر Docker (`npm run db:up`).

## اختبار سريع
- لوحة الادارة تعمل على المنفذ 3001.
- Mongo Express على المنفذ 8081.

اذا اردت ان اضيف خطوات اضافية (مثل اعداد .env او ربط خدمات خارجية)، اخبرني وسأحدّث الملف.