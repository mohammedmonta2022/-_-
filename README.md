# مجمع عزم التعليمي - بوابة الدخول والتحقق الموحدة
### Azm Educational Complex - Unified Authentication Portal

بوابة إلكترونية متطورة ومصممة بأحدث معايير الويب لمجمع عزم التعليمي. تدعم إنشاء الحسابات، تسجيل الدخول، التحقق عبر رموز الأمان وربط Gmail، واستعادة كلمات المرور مع حفظ سحابي كامل في Firebase Firestore.

---

## 🚀 المميزات والتقنيات (Features & Stack)

- **الواجهة الأمامية (Frontend):** React 19, TypeScript, Vite 6.
- **التصميم والتنسيق:** Tailwind CSS v4, Motion (Framer Motion).
- **الهوية البصرية:** ألوان مجمع عزم التعليمي الرسمية (الكحلي الملكي `#053B50` والبيج الذهبي `#E8DAC8` و `#F7F3EE`) مع خطوط عربية فاخرة (Cairo & Tajawal).
- **قاعدة البيانات والسحابة:** Firebase Firestore لتخزين الحسابات ورموز التحقق.
- **إرسال البريد الإلكتروني:** تكامل مع Google Workspace Gmail API لإرسال رموز التحقق مباشرة إلى صندوق الوارد.
- **دعم الأجهزة:** تصميم متجاوب بالكامل 100% مع الهواتف الذكية والأجهزة اللوحية والحواسيب.

---

## 🛠️ التشغيل المحلي (Local Development)

### 1. تثبيت الحزم:
```bash
npm install
```

### 2. تشغيل خادم التطوير:
```bash
npm run dev
```
سيفتح التطبيق افتراضياً على: `http://localhost:3000`

### 3. بناء المشروع للإنتاج:
```bash
npm run build
```
تُحفظ ملفات الإنتاج الجاهزة للنشر في مجلد `dist/`.

---

## 📦 النشر على GitHub (Publishing to GitHub)

1. أنشئ مستودعاً جديداً (New Repository) على حسابك في GitHub (مثلاً: `azm-educational-portal`).
2. افتح موجه الأوامر (Terminal) في مجلد المشروع وقم برفع الأكواد:
```bash
git init
git add .
git commit -m "Initial commit: Azm Educational Complex portal"
git branch -M main
git remote add origin https://github.com/<YOUR-USERNAME>/<YOUR-REPO-NAME>.git
git push -u origin main
```

*(أو استخدم زر Export to GitHub مباشرة من قائمة إعدادات Google AI Studio إذا رغبت بالربط التلقائي بنقرة واحدة).*

---

## 🌐 النشر والاستضافة على Netlify (Deploying to Netlify)

تم تجهيز المشروع مسبقاً بملفات التكوين الخاصة بـ Netlify (`netlify.toml` و `public/_redirects`) لضمان عدم حدوث أي خطأ (404 Not Found) عند إعادة تحميل الصفحات (SPA Routing).

### الخطوات:
1. سجّل الدخول إلى منصة [Netlify](https://app.netlify.com/).
2. اضغط على **"Add new site"** ثم اختر **"Import an existing project"**.
3. اختر **GitHub** وحدد مستودع المشروع الذي قمت برفعه.
4. ستتعرف Netlify تلقائياً على الإعدادات الصحيحة:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
5. اضغط على **"Deploy site"**.
6. سيبدأ البناء تلقائياً ويكون موقعك جاهزاً ومتاحاً عبر رابط Netlify خلال دقيقة واحدة!

---

## 📁 هيكلية المشروع (Project Structure)

```text
├── netlify.toml               # إعدادات البناء والتوجيه لـ Netlify
├── public/
│   └── _redirects             # توجيه SPA لـ Netlify
├── src/
│   ├── components/            # مكونات الواجهة (شاشات الدخول، التسجيل، التحقق، النماذج)
│   ├── lib/
│   │   ├── firebase.ts        # إعدادات وتوابع الاتصال بـ Firebase Firestore
│   │   └── gmail.ts           # إرسال رسائل التحقق عبر Gmail API
│   ├── types.ts               # تعريف الأنواع والبيانات في TypeScript
│   ├── App.tsx                # المكون الرئيسي
│   └── main.tsx               # نقطة الدخول
├── index.html                 # ملف HTML الأساسي والخطوط
└── vite.config.ts             # إعدادات Vite
```
