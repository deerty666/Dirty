// ... داخل ملف sw.js ...
const CACHE_NAME = 'deerty-menu-cache-v1.1.2'; // زيادة رقم الإصدار لضمان التحديث

// قائمة بالملفات الأساسية التي يجب تخزينها مؤقتاً
const urlsToCache = [
  // ملفات HTML و CSS و JS الأساسية
  '/Dirty/', // المسار الأساسي لـ GitHub Pages
  '/Dirty/index.html',
  '/Dirty/style.css',
  '/Dirty/script.js',
  '/Dirty/manifest.json',
  
  // الأيقونات والصور (المفترض أنها في المجلد الرئيسي)
  '/Dirty/logo-192.png', // تم التعديل ليتطابق مع اسم ملفك
  '/Dirty/logo-512.png', // تم التعديل ليتطابق مع اسم ملفك
  '/Dirty/logo.png',
  
  // إذا كان مجلد الصور موجودًا، يجب إضافته
  '/Dirty/images/hero-bg.jpg', 
];
// ... (بقية الكود لا يتغير) ...
