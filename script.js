// =====================================================================
// PWA Logic - تسجيل عامل الخدمة (Service Worker) ورسالة التثبيت
// =====================================================================

// المسار الصحيح لـ GitHub Pages: يجب إضافة اسم المستودع (/Deerty/)
const BASE_PATH = '/Deerty/'; 
let deferredPrompt;
const pwaInstallPrompt = document.getElementById('pwa-install-prompt');
const installBtn = document.getElementById('install-btn');
const dismissInstallBtn = document.getElementById('dismiss-install-btn');
// 🆕 تعريف زر التثبيت الجديد في الهيدر
const installHeaderBtn = document.getElementById('install-header-btn'); 

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
     pwaInstallPrompt.style.display = 'flex';
  }
  
  // ✅ إظهار زر التثبيت في الهيدر
  if (installHeaderBtn) {
      installHeaderBtn.style.display = 'inline-block';
  }
});

// التعامل مع ضغطة زر التثبيت في الرسالة الكبيرة
if(installBtn) {
    installBtn.addEventListener('click', () => {
      if(pwaInstallPrompt) {
          pwaInstallPrompt.style.display = 'none'; // إخفاء الرسالة
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

// ✅ معالج حدث الزر الجديد في الهيدر (لتشغيل التثبيت)
if(installHeaderBtn) {
    installHeaderBtn.addEventListener('click', () => {
        // إخفاء الزر بمجرد الضغط عليه
        installHeaderBtn.style.display = 'none';
        
        if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult) => {
              if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the install prompt (from header)');
              } else {
                console.log('User dismissed the install prompt (from header)');
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
// ✅ تم تعريف حاوية المنيو الرئيسية هنا
const menuContent = document.querySelector('.content'); 

if (splashScreen) {
    setTimeout(() => {
        splashScreen.style.opacity = '0'; // تبدأ بالاختفاء
        setTimeout(() => {
            splashScreen.style.display = 'none'; // تختفي بالكامل
            
            // ✅ يتم إظهار محتوى المنيو الرئيسي هنا
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

function saveCart() {
    localStorage.setItem('menuCart', JSON.stringify(cart));
}

function loadCart() {
    const storedCart = localStorage.getItem('menuCart');
    if (storedCart) {
        cart = JSON.parse(storedCart);
    }
    updateCartDisplay();
}

function clearCart() {
    cart = [];
    saveCart();
    updateCartDisplay();
}

function getItemDetails(card) {
    const id = card.getAttribute('data-item-id');
    const title = card.querySelector('.item-title').textContent;
    const basePrice = parseFloat(card.getAttribute('data-base-price'));
    let selectedOptions = [];
    let extraPrice = 0;

    // 1. خيارات مجموعة (Main Options Group) - مثال حبة شواية (D01)
    const mainOptionsGroup = card.querySelector('.main-options-group');
    if (mainOptionsGroup) {
        const selectedMainOption = mainOptionsGroup.querySelector('input:checked');
        if (selectedMainOption) {
            const optionCard = selectedMainOption.closest('.option-card');
            const optionPrice = parseFloat(optionCard.getAttribute('data-option-price')) || 0;
            const optionName = selectedMainOption.nextElementSibling.textContent.trim();
            
            selectedOptions.push(`نوع الأرز: ${optionName}`);
            extraPrice += optionPrice;
        } 
    }
    
    // 2. خيارات بسيطة (Options Group) - مثال نص حبة شواية
    const simpleOptionsGroup = card.querySelector('.options-group');
    if (simpleOptionsGroup) {
        const selectedSimpleOption = simpleOptionsGroup.querySelector('input:checked');
        if (selectedSimpleOption) {
            const optionName = selectedSimpleOption.closest('.option').querySelector('label').textContent.trim();
            const price = parseFloat(selectedSimpleOption.getAttribute('data-add-price'));
            
            selectedOptions.push(`تغيير الأرز إلى: ${optionName} (+${price} ريال)`);
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
        options: selectedOptions,
        quantity: 1 
    };
}


function addToCart(item) {
    if (!item) return; 

    cart.push(item);
    
    saveCart();
    updateCartDisplay();
    
    if(viewCartBtn) {
        viewCartBtn.textContent = `تم إضافة ${item.title}`;
        setTimeout(() => {
            updateCartBtnText();
        }, 1500);
    }
}

function updateCartBtnText() {
    if(viewCartBtn) {
        viewCartBtn.textContent = `عرض السلة (${cart.length})`;
    }
}

function removeItemFromCart(index) {
    cart.splice(index, 1);
    saveCart();
    updateCartDisplay();
}

function calculateTotals() {
    const subtotal = cart.reduce((sum, item) => sum + item.finalPrice, 0);
    const orderMethod = document.querySelector('input[name="order-method-modal"]:checked')?.value || 'delivery';
    const deliveryFee = orderMethod === 'delivery' ? 5 : 0;
    const finalTotal = subtotal + deliveryFee;

    return { subtotal, deliveryFee, finalTotal, orderMethod };
}

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
            
            let optionsHtml = item.options.length > 0 ? 
                `<small class="item-options">${item.options.join(', ')}</small>` : '';

            itemDiv.innerHTML = `
                <div class="item-info">
                    <span class="item-name">${item.title}</span>
                    ${optionsHtml}
                </div>
                <span class="item-price">${item.finalPrice} ريال</span>
                <button class="remove-item" data-index="${index}">&times;</button>
            `;
            cartItemsContainer.appendChild(itemDiv);
        });

        document.querySelectorAll('.remove-item').forEach(button => {
            button.addEventListener('click', (e) => {
                const index = parseInt(e.target.getAttribute('data-index'));
                removeItemFromCart(index);
            });
        });
    }

    subtotalDisplay.textContent = `${subtotal.toFixed(0)} ريال`;
    deliveryFeeDisplay.textContent = `${deliveryFee.toFixed(0)} ريال`;
    finalTotalDisplay.textContent = `${finalTotal.toFixed(0)} ريال`;
    
    const deliveryRadio = document.getElementById('delivery-modal');
    const pickupRadio = document.getElementById('pickup-modal');
    if(deliveryRadio && pickupRadio) {
        deliveryRadio.checked = orderMethod === 'delivery';
        pickupRadio.checked = orderMethod === 'pickup';
    }
}

function generateWhatsAppMessage() {
    const { finalTotal, orderMethod } = calculateTotals();
    
    let message = `مرحباً، أود تقديم طلب من قائمة سحايب ديرتي:\n\n`;
    
    cart.forEach((item, index) => {
        let optionsText = item.options.length > 0 ? ` (${item.options.join(', ')})` : '';
        message += `*${index + 1}. ${item.title}*: ${item.finalPrice} ريال${optionsText}\n`;
    });
    
    message += `\n*الإجمالي (الوجبات)*: ${calculateTotals().subtotal} ريال\n`;
    
    if (orderMethod === 'delivery') {
        message += `*رسوم التوصيل*: ٥ ريال\n`;
        message += `\n*الإجمالي النهائي*: ${finalTotal} ريال (شامل التوصيل)\n`;
        message += `\n*طريقة الاستلام*: توصيل\n`;
        message += `\nالرجاء إرسال الموقع والاسم:\n`;
    } else {
        message += `\n*الإجمالي النهائي*: ${finalTotal} ريال\n`;
        message += `\n*طريقة الاستلام*: استلام من المطعم\n`;
    }
    
    message += `\nشكراً لك.`;

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
        addToCart(item);
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
        
        clearCart(); 
    });
}


// تحميل السلة عند بدء تشغيل التطبيق
loadCart();
let deferredPrompt_PWA; 
const installBtn_PWA = document.getElementById('installBtn'); 

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt_PWA = e;
  if(installBtn_PWA) {
    installBtn_PWA.style.display = 'inline-block';
  }
});

if(installBtn_PWA) {
    installBtn_PWA.addEventListener('click', async () => {
      if (deferredPrompt_PWA) {
        deferredPrompt_PWA.prompt();
        const { outcome } = await deferredPrompt_PWA.userChoice;
        if (outcome === 'accepted') {
          installBtn_PWA.textContent = '✅ تم تثبيت التطبيق';
          installBtn_PWA.style.backgroundColor = '#4CAF50';
        }
        deferredPrompt_PWA = null;
      }
    });
}
