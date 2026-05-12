# نشر الباك اند وتطبيق المستخدمين (User App)

هذا دليل عملي لنشر الباك اند وتطبيق المستخدمين فقط.

## 1) نشر الباك اند (NestJS)
### خيار A: VPS (Ubuntu) + PM2
1) جهز سيرفر Ubuntu وفعّل SSH.
2) ثبّت Node.js (نسخة LTS) و npm، وGit.
3) انسخ المشروع أو فقط مجلد apps/api.
4) أنشئ ملف بيئة: .env.local أو .env داخل apps/api مع القيم التالية (مثال):
   - NODE_ENV=production
   - PORT=3000
   - MONGO_URI=... (MongoDB Atlas أو محلي)
   - JWT_ACCESS_SECRET=...
   - JWT_REFRESH_SECRET=...
   - JWT_QR_SECRET=...
   - REDIS_HOST=... (إن رغبت بالكاش/الـ queues)
   - REDIS_PORT=6379
5) من داخل apps/api:
   - npm install
   - npm run build
   - npm run start:prod
6) لإبقاء الخدمة شغالة:
   - npm i -g pm2
   - pm2 start dist/main.js --name yallaplay-api
   - pm2 save
7) إعداد Reverse Proxy (Nginx) لربط الدومين بالمنفذ 3000.
8) تأكد أن الـ API يعمل على:
   - https://your-domain.com/api/v1

### خيار B: Render / Railway / Fly.io
1) اربط المستودع أو ارفع مجلد apps/api.
2) عرّف متغيرات البيئة السابقة في لوحة الخدمة.
3) أمر البناء: npm install && npm run build
4) أمر التشغيل: node dist/main.js

## 2) ربط تطبيق المستخدمين بالباك اند
تأكد من قيمة:
- EXPO_PUBLIC_API_URL
في بيئة التطبيق لتكون عنوان الـ API الحقيقي (مثال):
- https://your-domain.com/api/v1

في بيئة التطوير أو البناء، يمكنك وضعها في:
- apps/user-app/.env

## 3) بناء تطبيق المستخدمين وإرساله للناس
### خيار A: نشر عبر EAS (موصى به)
1) ثبّت EAS:
   - npm i -g eas-cli
2) من داخل apps/user-app:
   - eas login
   - eas build:android
   - eas build:ios
3) ستظهر لك روابط التحميل أو الرفع إلى المتاجر.

### خيار B: APK مباشر (Android فقط)
1) من داخل apps/user-app:
   - eas build --platform android --profile preview
2) ستحصل على رابط APK.
3) أرسله للأشخاص ليحمّلوه (يحتاج تفعيل “تثبيت من مصادر غير معروفة”).

### خيار C: TestFlight (iOS)
1) ابني iOS عبر EAS.
2) ارفع إلى App Store Connect.
3) أرسل دعوات TestFlight للمستخدمين.

## 4) نقاط مهمة قبل الإرسال
- تأكد أن الـ API يعمل عبر HTTPS.
- تأكد أن EXPO_PUBLIC_API_URL تشير للدومين الصحيح.
- اختبر تسجيل الدخول والحجز على نسخة الإنتاج.
- احتفظ بنسخة من مفاتيح JWT وبيانات البيئة.

إذا أردت، أعطني نوع السيرفر الذي تستخدمه وسأكتب لك خطوات دقيقة له (VPS/Render/Railway).