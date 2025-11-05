// =====================================================================
// PWA Logic - تسجيل عامل الخدمة (Service Worker) ورسالة التثبيت
// =====================================================================

// المسار الصحيح لـ GitHub Pages: يجب إضافة اسم المستودع (/Deerty/)
const BASE_PATH = '/Deerty/'; 
let deferredPrompt; // المتغير الرئيسي لحفظ حدث التثبيت
const pwaInstallPrompt = document.getElementById('pwa-install-prompt'); // نافذة التثبيت المنبثقة
const installBtn = document.getElementById('install-btn'); // زر التثبيت داخل النافذة
const dismissInstallBtn = document.getElementById('dismiss-install-btn'); // زر إلغاء التثبيت

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // تسجيل عامل الخدمة باستخدام المسار الصحيح: /Deerty/sw.js
    navigator.serviceWorker.register(BASE_PATH + 'sw.js') 
      .then((registration) => {
        console.log('ServiceWorker registered successfully. Scope: ', registration.scope);
      })
      .catch((error) => {
        console.error('ServiceWorker registration failed: ', error);
      });
  });
}

// اعتراض حدث "beforeinstallprompt" لإظهار رسالتنا المخصصة
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  
  // إظهار الرسالة المنبثقة المخصصة (رسالة الشاشة الكبيرة)
  if(pwaInstallPrompt) {
     pwaInstallPrompt.style.display = 'flex'; // يتم إظهارها كـ flex لترتيب المحتوى
  }
});

// التعامل مع ضغطة زر التثبيت في الرسالة الكبيرة
if(installBtn) {
    installBtn.addEventListener('click', () => {
      if(pwaInstallPrompt) {
          pwaInstallPrompt.style.display = 'none'; // إخفاء الرسالة المنبثقة
      }
      if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
          if (choiceResult.outcome === 'accepted') {
            console.log('User accepted the install prompt');
          } else {
            console.log('User dismissed the install prompt');
          }
          deferredPrompt = null;
        });
      }
    });
}

// التعامل مع زر إلغاء/إغلاق الرسالة
if(dismissInstallBtn) {
    dismissInstallBtn.addEventListener('click', () => {
        if(pwaInstallPrompt) {
            pwaInstallPrompt.style.display = 'none';
        }
    });
}

// =====================================================================
// Splash Screen Logic (مضمون العمل الآن)
// =====================================================================
const splashScreen = document.getElementById('splash-screen');
const menuContent = document.querySelector('.content'); 

if (splashScreen) {
    setTimeout(() => {
        splashScreen.style.opacity = '0'; // تبدأ بالاختفاء
        setTimeout(() => {
            splashScreen.style.display = 'none'; // تختفي بالكامل
            
            if (menuContent) {
                menuContent.style.display = 'block'; 
            }
            
        }, 500); // يتطابق مع مدة الانتقال في CSS
    }, 3000); // 3 ثواني عرض
}

// =====================================================================
// Menu Navigation and Toggle Logic
// =====================================================================
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');

if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        menuToggle.classList.toggle('active');
    });
    
    // إغلاق قائمة التنقل عند اختيار رابط
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            menuToggle.classList.remove('active');
        });
    });
}


// =====================================================================
// CART LOGIC - منطق سلة المشتريات
// =====================================================================

let cart = [];
const cartModal = document.getElementById('cart-modal');
const viewCartBtn = document.getElementById('view-cart-btn');
const closeBtn = document.querySelector('.close-btn');
const cartItemsContainer = document.getElementById('cart-items-container');
const subtotalDisplay = document.getElementById('subtotal-display');
const deliveryFeeDisplay = document.getElementById('delivery-fee-display');
const finalTotalDisplay = document.getElementById('final-total-display');
const sendOrderBtn = document.getElementById('send-order-btn');
const orderMethodRadios = document.querySelectorAll('input[name="order-method-modal"]');
const whatsappNumber = '966536803598'; 
const DELIVERY_FEE = 5;

// =======================
// وظائف تخزين السلة
// =======================

function saveCart() {
    localStorage.setItem('menuCart', JSON.stringify(cart));
}

function loadCart() {
    const storedCart = localStorage.getItem('menuCart');
    if (storedCart) {
        // نستخدم Parse/stringify للتأكد من إنشاء نسخ جديدة من الكائن وليس الإشارة إليه
        cart = JSON.parse(storedCart);
    }
    updateCartDisplay();
}

function clearCart() {
    cart = [];
    saveCart();
    updateCartDisplay();
}

// =======================
// وظائف معالجة الصنف
// =======================

/**
 * دالة مُصَحَّحة لجلب تفاصيل الصنف وحساب سعره النهائي بناءً على الخيارات.
 * @param {HTMLElement} card - بطاقة الصنف.
 * @returns {object|null} تفاصيل الصنف.
 */
function getItemDetails(card) {
    const id = card.getAttribute('data-item-id');
    const title = card.querySelector('.item-title').textContent.trim();
    const basePrice = parseFloat(card.getAttribute('data-base-price'));
    let selectedOptions = [];
    let extraPrice = 0;
    
    // 1. خيارات مجموعة (Main Options Group) - البنية الجديدة
    const mainOptionsGroup = card.querySelector('.main-options-group');
    const isSimpleItem = card.classList.contains('simple-item');

    if (mainOptionsGroup) {
        const selectedMainOptionInput = mainOptionsGroup.querySelector('input:checked');
        
        // التحقق من أن الخيار إجباري إذا لم يكن صنفاً بسيطاً
        if (!isSimpleItem && !selectedMainOptionInput) {
            alert(`الرجاء اختيار نوع الأرز لوجبة "${title}" قبل الإضافة.`);
            return null; 
        }

        if (selectedMainOptionInput) {
            const optionCard = selectedMainOptionInput.closest('.option-card');
            // قراءة السعر من data-option-price في البنية الجديدة
            const optionPrice = parseFloat(optionCard.getAttribute('data-option-price')) || 0;
            // قراءة اسم الخيار من الـ span التالي
            const optionName = selectedMainOptionInput.nextElementSibling.textContent.trim();
            
            selectedOptions.push(`نوع الأرز: ${optionName}`);
            extraPrice += optionPrice;
        } else if (!isSimpleItem) {
            // إذا لم يتم اختيار أي شيء، نفترض أنه الرز الشعبي (بالسعر الأساسي) ونضع ملاحظة
             selectedOptions.push(`نوع الأرز: شعبي`);
        }
    }
    
    // 2. خيارات بسيطة (Options Group) - البنية القديمة (تم حذفها من HTML النهائي، لكن نحافظ على المنطق احتياطاً)
    const simpleOptionsGroup = card.querySelector('.options-group');
    if (simpleOptionsGroup) {
        const selectedSimpleOption = simpleOptionsGroup.querySelector('input:checked');
        if (selectedSimpleOption) {
            const optionName = selectedSimpleOption.closest('.option').querySelector('label').textContent.trim();
            const price = parseFloat(selectedSimpleOption.getAttribute('data-add-price')) || 0;
            
            selectedOptions.push(`تغيير الأرز: ${optionName}`);
            extraPrice += price;
        }
    }

    const finalPrice = basePrice + extraPrice;

    return {
        id,
        title,
        basePrice,
        extraPrice,
        finalPrice,
        options: selectedOptions.join(' | '),
        quantity: 1, // الكمية دائماً تبدأ بـ 1 عند الإضافة
        uniqueKey: id + selectedOptions.join('|') // مفتاح فريد لتمييز الأصناف المختلفة الخيارات
    };
}


/**
 * دالة إضافة الصنف إلى السلة، مع تجميع الأصناف المتطابقة.
 * @param {object} newItem - الصنف المراد إضافته.
 */
function addToCart(newItem) {
    if (!newItem) return; 

    // البحث عن صنف مطابق (نفس الكود ونفس الخيارات)
    const existingItem = cart.find(item => item.uniqueKey === newItem.uniqueKey);
    
    if (existingItem) {
        // إذا كان موجوداً، نزيد الكمية
        existingItem.quantity += 1;
    } else {
        // إذا كان جديداً، نضيفه
        cart.push(newItem);
    }
    
    // إزالة تحديد خيارات الراديو من البطاقة بعد الإضافة للسماح بطلب صنف جديد بخيار مختلف
    const card = document.querySelector(`[data-item-id="${newItem.id}"]`);
    if (card && !card.classList.contains('simple-item')) {
        card.querySelectorAll('input[type="radio"]').forEach(radio => radio.checked = false);
    }

    saveCart();
    updateCartDisplay();
    
    if(viewCartBtn) {
        viewCartBtn.textContent = `✅ تم إضافة ${newItem.title}`;
        setTimeout(() => {
            updateCartBtnText();
        }, 1500);
    }
}

function updateCartBtnText() {
    if(viewCartBtn) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        viewCartBtn.textContent = `عرض السلة (${totalItems})`;
    }
}

function changeQuantity(index, delta) {
    if (cart[index]) {
        cart[index].quantity += delta;
        if (cart[index].quantity <= 0) {
            cart.splice(index, 1);
        }
        saveCart();
        updateCartDisplay();
    }
}

// =======================
// وظائف حساب الإجماليات
// =======================

function calculateTotals() {
    // مجموع سعر الصنف * كميته
    const subtotal = cart.reduce((sum, item) => sum + (item.finalPrice * item.quantity), 0);
    
    // الحصول على طريقة الطلب المختارة
    const orderMethod = document.querySelector('input[name="order-method-modal"]:checked')?.value || 'delivery';
    const deliveryFee = orderMethod === 'delivery' ? DELIVERY_FEE : 0;
    const finalTotal = subtotal + deliveryFee;

    return { subtotal, deliveryFee, finalTotal, orderMethod };
}

// =======================
// وظائف تحديث العرض
// =======================

function updateCartDisplay() {
    if (!cartItemsContainer || !subtotalDisplay || !deliveryFeeDisplay || !finalTotalDisplay || !sendOrderBtn) return;
    
    const { subtotal, deliveryFee, finalTotal, orderMethod } = calculateTotals();

    updateCartBtnText();

    cartItemsContainer.innerHTML = '';
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="empty-cart-message">سلتك فارغة حالياً. أضف بعض الوجبات اللذيذة!</p>';
        sendOrderBtn.disabled = true;
    } else {
        sendOrderBtn.disabled = false;
        cart.forEach((item, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.classList.add('cart-item');
            
            let optionsHtml = item.options ? 
                `<small class="item-options">${item.options}</small>` : '';

            itemDiv.innerHTML = `
                <div class="item-info">
                    <span class="item-name">${item.title}</span>
                    ${optionsHtml}
                    <div class="price-per-unit">${item.finalPrice} ريال للوحدة</div>
                </div>
                <div class="item-controls">
                    <button class="quantity-btn decrease-btn" data-index="${index}">-</button>
                    <span class="quantity-value">${item.quantity}</span>
                    <button class="quantity-btn increase-btn" data-index="${index}">+</button>
                    <span class="item-total-price"> = ${item.finalPrice * item.quantity} ريال</span>
                    <button class="remove-item" data-index="${index}"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            `;
            cartItemsContainer.appendChild(itemDiv);
        });

        document.querySelectorAll('.item-controls .quantity-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const index = parseInt(e.target.getAttribute('data-index'));
                const delta = e.target.classList.contains('increase-btn') ? 1 : -1;
                changeQuantity(index, delta);
            });
        });
        
        document.querySelectorAll('.item-controls .remove-item').forEach(button => {
            button.addEventListener('click', (e) => {
                const index = parseInt(e.target.closest('.remove-item').getAttribute('data-index'));
                changeQuantity(index, -cart[index].quantity); // إزالة العنصر بالكامل
            });
        });
    }

    subtotalDisplay.textContent = `${subtotal.toFixed(0)} ريال`;
    deliveryFeeDisplay.textContent = `${deliveryFee.toFixed(0)} ريال`;
    finalTotalDisplay.textContent = `${finalTotal.toFixed(0)} ريال`;
    
    // ضبط حالة الراديو بناءً على قيمة orderMethod المحسوبة
    const deliveryRadio = document.getElementById('delivery-modal');
    const pickupRadio = document.getElementById('pickup-modal');
    if(deliveryRadio && pickupRadio) {
        deliveryRadio.checked = orderMethod === 'delivery';
        pickupRadio.checked = orderMethod === 'pickup';
    }
}

function generateWhatsAppMessage() {
    const { finalTotal, deliveryFee, subtotal, orderMethod } = calculateTotals();
    
    let message = `مرحباً، أود تقديم طلب من قائمة مطاعم ومطابخ سحايب ديرتي:\n\n`;
    
    message += "📝 *تفاصيل الطلب:*\n";
    
    cart.forEach((item, index) => {
        let optionsText = item.options ? ` (${item.options})` : '';
        message += `  - ${item.quantity} x ${item.title}${optionsText} = ${item.finalPrice * item.quantity} ريال\n`;
    });
    
    message += `\n---------------------------------------\n`;
    message += `*الإجمالي (الوجبات)*: ${subtotal.toFixed(0)} ريال\n`;
    message += `*طريقة الاستلام*: ${orderMethod === 'delivery' ? 'توصيل' : 'استلام من المطعم'}\n`;
    
    if (orderMethod === 'delivery') {
        message += `*رسوم التوصيل*: ${deliveryFee.toFixed(0)} ريال\n`;
    }
    
    message += `*الإجمالي النهائي*: ${finalTotal.toFixed(0)} ريال\n`;
    message += `---------------------------------------\n`;
    message += `\nالرجاء تأكيد الطلب والموقع. شكراً لاختياركم سحايب ديرتي!\n`;

    return encodeURIComponent(message);
}

// =====================================================================
// Event Listeners (Cart)
// =====================================================================

// فتح المودال عند الضغط على زر عرض السلة
if(viewCartBtn && cartModal) {
    viewCartBtn.addEventListener('click', () => {
        updateCartDisplay();
        cartModal.style.display = 'block';
    });
}

// إغلاق المودال عند الضغط على X
if(closeBtn && cartModal) {
    closeBtn.addEventListener('click', () => {
        cartModal.style.display = 'none';
    });
}

// إغلاق المودال عند الضغط خارج المودال
if(cartModal) {
    window.addEventListener('click', (event) => {
        if (event.target === cartModal) {
            cartModal.style.display = 'none';
        }
    });
}

// إضافة الوجبة إلى السلة
document.querySelectorAll('.add-to-cart-btn').forEach(button => {
    button.addEventListener('click', (e) => {
        const card = e.target.closest('.menu-card');
        const item = getItemDetails(card);
        // getItemDetails سيعيد null إذا كان الاختيار إجبارياً ولم يتم
        if (item) { 
            addToCart(item);
        }
    });
});

// تحديث الإجمالي عند تغيير طريقة الطلب (توصيل/استلام)
orderMethodRadios.forEach(radio => {
    radio.addEventListener('change', updateCartDisplay);
});


// زر إرسال الطلب عبر واتساب
if(sendOrderBtn) {
    sendOrderBtn.addEventListener('click', () => {
        const message = generateWhatsAppMessage();
        const url = `https://wa.me/${whatsappNumber}?text=${message}`;
        window.open(url, '_blank');
        
        clearCart(); // تفريغ السلة بعد إرسال الطلب
        cartModal.style.display = 'none'; // إغلاق المودال
    });
}


// تحميل السلة عند بدء تشغيل التطبيق
document.addEventListener('DOMContentLoaded', loadCart);
