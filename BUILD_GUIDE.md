# دليل بناء تطبيق YallaPlay وتوزيعه كـ APK

## الطريقتان المتاحتان

| | EAS Build (Expo Cloud) | Local Build (جهازك) |
|---|---|---|
| **السهولة** | ✅ أسهل | ⚠️ يحتاج إعداد |
| **المتطلبات** | حساب Expo فقط | Android Studio + JDK |
| **الوقت** | 10-20 دقيقة (في السحابة) | 5-10 دقائق (محلي) |
| **مجاني؟** | ✅ حتى 30 بناء/شهر | ✅ مجاني تماماً |

---

## الطريقة الأولى: EAS Build (الأسرع والأسهل) ✅

### المتطلبات
- حساب على [expo.dev](https://expo.dev) (مجاني)
- Node.js مثبت
- اتصال إنترنت

### الخطوات

#### 1. تثبيت EAS CLI
```bash
npm install -g eas-cli
```

#### 2. تسجيل الدخول
```bash
eas login
```
أدخل email وكلمة مرور حساب expo.dev

#### 3. انتقل لمجلد التطبيق
```bash
cd apps/user-app
```

#### 4. بناء APK للتوزيع الداخلي (preview)
```bash
eas build --platform android --profile preview
```

> هذا الأمر يبني APK يمكن تثبيته مباشرة دون Google Play.

#### 5. انتظر انتهاء البناء
- سيعطيك رابط لمتابعة التقدم على expo.dev
- عند الانتهاء ستحصل على **رابط تحميل APK** مباشر

#### 6. توزيع الـ APK
- أرسل رابط التحميل مباشرة للمستخدمين عبر واتساب/تيليغرام
- أو حمّل الـ APK وأرسل الملف مباشرة

---

## الطريقة الثانية: Local Build (بدون إنترنت)

### المتطلبات
- [Android Studio](https://developer.android.com/studio) مثبت
- JDK 17 (يأتي مع Android Studio)
- متغيرات البيئة `ANDROID_HOME` و `JAVA_HOME` مضبوطة

### الخطوات

#### 1. توليد مجلد android
```bash
cd apps/user-app
npx expo prebuild --platform android --clean
```

#### 2. بناء الـ APK
```bash
cd android
./gradlew assembleRelease
```

على Windows:
```powershell
cd android
.\gradlew.bat assembleRelease
```

#### 3. مكان الـ APK الناتج
```
apps/user-app/android/app/build/outputs/apk/release/app-release.apk
```

---

## إعداد الـ API URL قبل البناء (مهم جداً)

التطبيق يتصل بـ `localhost:3000` في التطوير — هذا **لن يعمل** على الجوال الحقيقي.

### 1. افتح ملف الإعدادات
```
apps/user-app/src/api/client.ts
```

### 2. غيّر الـ baseURL
```ts
// قبل البناء: ضع IP جهازك أو رابط السيرفر الحقيقي
const BASE_URL = 'http://192.168.1.XXX:3000/api/v1';  // شبكة محلية
// أو
const BASE_URL = 'https://api.yallaplay.com/api/v1';  // سيرفر حقيقي
```

> لمعرفة IP جهازك على Windows: افتح CMD وأكتب `ipconfig` → ابحث عن IPv4 Address

---

## تثبيت الـ APK على الجوال

### 1. فعّل "مصادر غير معروفة"
- اذهب إلى **الإعدادات ← الأمان ← تثبيت التطبيقات من مصادر غير معروفة**
- فعّلها للمتصفح أو مدير الملفات الذي ستفتح منه الـ APK

### 2. على Android 8+
- عند فتح الـ APK سيسألك النظام مباشرة عن الإذن — اقبل

### 3. ملاحظة لـ Samsung
- **الإعدادات ← التطبيقات ← القائمة الخاصة ← تثبيت تطبيقات غير معروفة**

---

## مشاكل شائعة وحلولها

| المشكلة | الحل |
|---|---|
| `eas: command not found` | أعد تشغيل الطرفية بعد `npm install -g eas-cli` |
| التطبيق يفتح لكن لا يتصل بالـ API | غيّر `localhost` إلى IP الجهاز في `client.ts` |
| `ANDROID_HOME not set` | أضفه في متغيرات البيئة من Android Studio |
| APK تم تثبيته لكن يتعطل | تحقق من logs عبر `adb logcat` |
| خطأ في التوقيع (signing) | دع EAS تتولى التوقيع تلقائياً |

---

## نصيحة: Expo Go للاختبار السريع

إذا أردت اختبار التطبيق قبل البناء النهائي دون بناء APK:

```bash
cd apps/user-app
npx expo start
```

ثم امسح الـ QR من تطبيق **Expo Go** على الجوال (متوفر على Play Store).

> لكن Expo Go لا يدعم بعض المكتبات المخصصة — الـ APK الحقيقي هو الأفضل للاختبار الكامل.

---

## ملخص سريع (الطريقة الأسرع)

```bash
# من مجلد المشروع الرئيسي
cd apps/user-app

# غيّر API URL أولاً في src/api/client.ts

# ثم ابنِ الـ APK
eas build --platform android --profile preview

# احصل على رابط التحميل وأرسله للمستخدمين
```
