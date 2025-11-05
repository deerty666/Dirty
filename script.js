// =====================================================================
// الإعدادات والثوابت
// =====================================================================
const BASE_PATH = '/deerty/'; // مسار GitHub Pages
let cart = [];
const whatsappNumber = '966536803598'; 
const DELIVERY_FEE = 5;

// عناصر DOM
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');
const splashScreen = document.getElementById('splash-screen');
const menuContent = document.querySelector('.content'); 
const cartModal = document.getElementById('cart-modal');
const viewCartBtn = document.getElementById('view-cart-btn');
const closeBtn = document.querySelector('.close-btn');
const cartItemsContainer = document.getElementById('cart-items-container');
const subtotalDisplay = document.getElementById('subtotal-display');
const deliveryFeeDisplay = document.getElementById('delivery-fee-display');
const finalTotalDisplay = document.getElementById('final-total-display');
const sendOrderBtn = document.getElementById('send-order-btn');
const orderMethodRadios = document.querySelectorAll('input[name="order-method-modal"]');

// عناصر PWA
let deferredPrompt; 
const pwaInstallPrompt = document.getElementById('pwa-install-prompt'); 
const installBtn = document.getElementById('install-btn'); 
const dismissInstallBtn = document.getElementById('dismiss-install-btn');

// =====================================================================
// PWA Logic - تسجيل عامل الخدمة ورسالة التثبيت
// =====================================================================

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(BASE_PATH + 'sw.js') 
      .then((registration) => {
        console.log('ServiceWorker registered successfully. Scope: ', registration.scope);
      })
      .catch((error) => {
        console.error('ServiceWorker registration failed: ', error);
      });
  });
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  if(pwaInstallPrompt) {
     pwaInstallPrompt.style.display = 'flex'; 
  }
});

if(installBtn) {
    installBtn.addEventListener('click', () => {
      if(pwaInstallPrompt) {
          pwaInstallPrompt.style.display = 'none'; 
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

if(dismissInstallBtn) {
    dismissInstallBtn.addEventListener('click', () => {
        if(pwaInstallPrompt) {
            pwaInstallPrompt.style.display = 'none';
        }
    });
}

// =====================================================================
// Splash Screen Logic
// =====================================================================
if (splashScreen) {
    setTimeout(() => {
        splashScreen.style.opacity = '0'; 
        setTimeout(() => {
            splashScreen.style.display = 'none'; 
            if (menuContent) {
                menuContent.style.display = 'block'; 
            }
        }, 500); 
    }, 3000); 
}

// =====================================================================
// Menu Navigation and Toggle Logic
// =====================================================================
if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        menuToggle.classList.toggle('active');
    });
    
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

/**
 * دالة جلب تفاصيل الصنف وحساب سعره النهائي بناءً على الخيارات الإجبارية والاختيارية.
 */
function getItemDetails(card) {
    const id = card.getAttribute('data-item-id');
    const title = card.querySelector('.item-title').textContent.trim();
    const basePrice = parseFloat(card.getAttribute('data-base-price'));
    let selectedOptions = []; // خيارات الراديو الإجبارية
    let selectedOptionals = []; // خيارات Checkbox الاختيارية
    let extraPrice = 0;

    const isSimpleItem = card.classList.contains('simple-item');

    // 1. خيارات مجموعة (Main Options Group) - الراديو الإجباري
    const mainOptionsGroup = card.querySelector('.main-options-group');
    if (mainOptionsGroup) {
        const selectedMainOptionInput = mainOptionsGroup.querySelector('input:checked');
        
        // التحقق من أن الخيار إجباري للوجبات غير البسيطة
        if (!isSimpleItem && !selectedMainOptionInput) {
            alert(`الرجاء اختيار نوع الأرز لوجبة "${title}" قبل الإضافة.`);
            return null; 
        }

        if (selectedMainOptionInput) {
            const optionCard = selectedMainOptionInput.closest('.option-card');
            const optionPrice = parseFloat(optionCard.getAttribute('data-option-price')) || 0;
            const optionName = selectedMainOptionInput.nextElementSibling.textContent.trim();
            
            extraPrice += optionPrice;
            selectedOptions.push(`نوع الأرز: ${optionName}`);
        } else if (!isSimpleItem) {
             // افتراض الرز الشعبي إذا لم يكن هناك اختيار وكان سعره 0
             selectedOptions.push(`نوع الأرز: شعبي (مجاني)`);
        }
    }
    
    // 2. ✨ منطق الإضافات الاختيارية (Optional Group) - Checkboxes ✨
    const optionalGroup = card.querySelector('.optional-group');
    if (optionalGroup) {
        const checkedOptionals = optionalGroup.querySelectorAll('input[type="checkbox"]:checked');
        
        checkedOptionals.forEach(input => {
            const optionalItem = input.closest('.optional-item');
            const price = parseFloat(optionalItem.getAttribute('data-add-price')) || 0;
            const name = optionalItem.querySelector('label').textContent.trim();
            
            extraPrice += price; 
            selectedOptionals.push(`${name} (+${price} ر.س)`);
        });
    }

    // تجميع كل الخيارات في سلسلة واحدة
    const allOptions = [...selectedOptions, ...selectedOptionals];
    
    // إزالة تحديد Checkboxes بعد الإضافة
    if (optionalGroup) {
        optionalGroup.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    }


    const finalPrice = basePrice + extraPrice;

    return {
        id,
        title,
        basePrice,
        extraPrice,
        finalPrice,
        options: allOptions.join(' | '), 
        quantity: 1, 
        uniqueKey: id + allOptions.join('|') 
    };
}


function addToCart(newItem) {
    if (!newItem) return; 

    const existingItem = cart.find(item => item.uniqueKey === newItem.uniqueKey);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push(newItem);
    }
    
    // إزالة تحديد خيارات الراديو من البطاقة بعد الإضافة
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

function calculateTotals() {
    const subtotal = cart.reduce((sum, item) => sum + (item.finalPrice * item.quantity), 0);
    const orderMethod = document.querySelector('input[name="order-method-modal"]:checked')?.value || 'delivery';
    const deliveryFee = orderMethod === 'delivery' ? DELIVERY_FEE : 0;
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
                    <span class="item-total-price"> = ${(item.finalPrice * item.quantity).toFixed(0)} ريال</span>
                    <button class="remove-item" data-index="${index}"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            `;
            cartItemsContainer.appendChild(itemDiv);
        });

        // المستمع لأزرار التحكم بالكمية
        document.querySelectorAll('.item-controls .quantity-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const index = parseInt(e.target.getAttribute('data-index'));
                const delta = e.target.classList.contains('increase-btn') ? 1 : -1;
                changeQuantity(index, delta);
            });
        });
        
        // المستمع لزر الإزالة
        document.querySelectorAll('.item-controls .remove-item').forEach(button => {
            button.addEventListener('click', (e) => {
                const index = parseInt(e.target.closest('.remove-item').getAttribute('data-index'));
                changeQuantity(index, -cart[index].quantity); 
            });
        });
    }

    subtotalDisplay.textContent = `${subtotal.toFixed(0)} ريال`;
    deliveryFeeDisplay.textContent = `${deliveryFee.toFixed(0)} ريال`;
    finalTotalDisplay.textContent = `${finalTotal.toFixed(0)} ريال`;
    
    // ضبط حالة الراديو
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
        let optionsText = item.options ? ` | ${item.options}` : '';
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
    message += `\nالرجاء تأكيد الطلب والموقع. شكراً لك!\n`;

    return encodeURIComponent(message);
}

// =====================================================================
// Event Listeners (Cart)
// =====================================================================

if(viewCartBtn && cartModal) {
    viewCartBtn.addEventListener('click', () => {
        updateCartDisplay();
        cartModal.style.display = 'block';
    });
}

if(closeBtn && cartModal) {
    closeBtn.addEventListener('click', () => {
        cartModal.style.display = 'none';
    });
}

if(cartModal) {
    window.addEventListener('click', (event) => {
        if (event.target === cartModal) {
            cartModal.style.display = 'none';
        }
    });
}

document.querySelectorAll('.add-to-cart-btn').forEach(button => {
    button.addEventListener('click', (e) => {
        const card = e.target.closest('.menu-card');
        const item = getItemDetails(card);
        if (item) { 
            addToCart(item);
        }
    });
});

orderMethodRadios.forEach(radio => {
    radio.addEventListener('change', updateCartDisplay);
});


// زر إرسال الطلب عبر واتساب (مع تفريغ السلة)
if(sendOrderBtn) {
    sendOrderBtn.addEventListener('click', () => {
        const message = generateWhatsAppMessage();
        const url = `https://wa.me/${whatsappNumber}?text=${message}`;
        window.open(url, '_blank');
        
        clearCart(); 
        cartModal.style.display = 'none'; 
    });
}


document.addEventListener('DOMContentLoaded', loadCart);
