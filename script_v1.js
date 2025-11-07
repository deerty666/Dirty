document.addEventListener('DOMContentLoaded', () => {
    // إعداد متغيرات حالة التطبيق
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const VIEW_CART_BTN = document.getElementById('view-cart-btn');
    const CART_MODAL = document.getElementById('cart-modal'); 
    const CLOSE_BTN = document.querySelector('.modal .close-btn');
    const CART_ITEMS_CONTAINER = document.getElementById('cart-items-container');
    const SEND_ORDER_BTN = document.getElementById('send-order-btn');
    const ORDER_NOTE_TEXTAREA = document.getElementById('order-note'); 
    
    // عناصر شاشة الترحيب (Splash Screen)
    const SPLASH_SCREEN = document.getElementById('splash-screen');
    const MAIN_CONTENT = document.querySelector('main.content'); 
    const HEADER_NAV = document.querySelector('header');
    const CATEGORY_ICONS = document.querySelector('.category-icons-container');
    
    // عناصر ملخص السلة
    const DELIVERY_FEE_DISPLAY = document.getElementById('delivery-fee-display');
    const SUB_TOTAL_DISPLAY = document.getElementById('subtotal-display');
    const FINAL_TOTAL_DISPLAY = document.getElementById('final-total-display');
    const ORDER_METHOD_OPTIONS = document.querySelectorAll('input[name="order-method-modal"]');
    
    // متغيرات PWA (تم تبسيطها)
    let deferredPrompt;
    const INSTALL_PROMPT_MODAL = document.getElementById('pwa-install-prompt');
    const INSTALL_BTN = document.getElementById('install-btn');
    const DISMISS_INSTALL_BTN = document.getElementById('dismiss-install-btn');
    
    // ===============================================
    // 0. وظيفة التحكم في شاشة الترحيب (Splash Screen)
    // ===============================================
    
    if (SPLASH_SCREEN) {
        // إظهار المحتوى (لتجنب بقاء الصفحة بيضاء في حال فشل الكود)
        if (MAIN_CONTENT) MAIN_CONTENT.style.display = 'block';
        if (HEADER_NAV) HEADER_NAV.style.display = 'flex'; // Header يستخدم flex
        if (CATEGORY_ICONS) CATEGORY_ICONS.style.display = 'block'; 

        // تشغيل الإخفاء بعد مهلة
        setTimeout(() => {
            SPLASH_SCREEN.style.opacity = '0'; 
            
            setTimeout(() => {
                SPLASH_SCREEN.style.display = 'none';
                
            }, 500); // 500ms هي مدة التلاشي في CSS
        }, 1500); // مدة عرض الشعار قبل بدء التلاشي
    }

    // ===============================================
    // 1. وظائف السلة الأساسية
    // ===============================================
    
    function saveCart() {
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartDisplay();
    }

    function updateCartDisplay() {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        VIEW_CART_BTN.textContent = `عرض السلة (${totalItems})`;
        VIEW_CART_BTN.disabled = totalItems === 0;

        if (CART_MODAL && CART_MODAL.style.display === 'block') {
            renderCartItems();
            updateTotal();
        }
    }

    // 🌟 تم تصحيح وظيفة الإضافة لضمان حفظ السعر النهائي للوجبة في item.price
    function addToCart(itemId, name, finalPrice, options = {}) {
        // إنشاء بصمة (Fingerprint) للخيارات لتحديد إذا ما كان العنصر موجوداً بالفعل
        const optionsFingerprint = JSON.stringify(options);
        
        const existingItem = cart.find(item => 
            item.id === itemId && 
            JSON.stringify(item.options) === optionsFingerprint
        );

        if (existingItem) {
            existingItem.quantity++;
        } else {
            // ملاحظة: item.price هنا يمثل السعر النهائي للوحدة (السعر الأساسي + سعر الخيارات)
            cart.push({ id: itemId, name, price: finalPrice, quantity: 1, options });
        }
        
        saveCart();
    }

    function renderCartItems() {
        CART_ITEMS_CONTAINER.innerHTML = '';
        if (cart.length === 0) {
            CART_ITEMS_CONTAINER.innerHTML = '<p style="text-align: center; color: #666; padding: 20px 0;">السلة فارغة حاليًا.</p>';
            SEND_ORDER_BTN.disabled = true;
            return;
        }

        cart.forEach((item, index) => {
            const itemElement = document.createElement('div');
            itemElement.classList.add('cart-item');
            
            // 🌟 إصلاح: بناء سطر الخيارات ليكون واضحاً
            let optionsText = '';
            for (const key in item.options) {
                const option = item.options[key];
                // عرض الخيار واسم مجموعة الخيار
                let pricePart = option.price > 0 ? ` (+${option.price} ريال)` : '';
                optionsText += `<span style="display: block; color: #888; margin-right: 15px;">- ${option.name} ${pricePart}</span>`;
            }
            
            itemElement.innerHTML = `
                <div class="item-info">
                    <strong class="item-name">${item.name}</strong>
                    <div class="item-options">${optionsText}</div>
                </div>
                <div class="item-price-total">${(item.price * item.quantity).toFixed(0)} ريال</div>
                <div class="item-quantity-control">
                    <button class="qty-btn" data-index="${index}" data-action="increment">+</button>
                    <span class="item-quantity">${item.quantity}</span>
                    <button class="qty-btn" data-index="${index}" data-action="decrement">-</button>
                    <button class="qty-btn remove-item-btn" data-index="${index}" style="margin-right: 10px; background-color: var(--red-alert); color: var(--white); border-color: var(--red-alert);"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            `;
            // ملاحظة: تم تعديل هيكل زر الحذف والكمية ليتناسب مع CSS الأحدث.
            CART_ITEMS_CONTAINER.appendChild(itemElement);
        });

        document.querySelectorAll('.item-quantity-control .qty-btn').forEach(button => {
            button.addEventListener('click', handleQuantityChange);
        });
        document.querySelectorAll('.remove-item-btn').forEach(button => {
            // يتم التعامل مع الحذف ضمن handleQuantityChange في حالة النقصان إلى صفر، 
            // لكن سنترك هذا الزر كخيار حذف سريع أيضاً.
            button.addEventListener('click', handleRemoveItem);
        });
        
        SEND_ORDER_BTN.disabled = false;
    }

    function handleQuantityChange(event) {
        const index = event.target.dataset.index;
        const action = event.target.dataset.action;

        if (action === 'increment') {
            cart[index].quantity++;
        } else if (action === 'decrement' && cart[index].quantity > 1) {
            cart[index].quantity--;
        } else if (action === 'decrement' && cart[index].quantity === 1) {
            // إزالة العنصر عندما تقل الكمية عن 1
            cart.splice(index, 1);
        }
        // في حال كان الزر هو زر الحذف، سيتم التعامل معه في handleRemoveItem
        
        saveCart();
    }

    function handleRemoveItem(event) {
        const index = event.target.closest('.qty-btn').dataset.index;
        cart.splice(index, 1);
        saveCart();
    }

    function getSubtotal() {
        return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    }
    
    function getDeliveryCost() {
        const selectedOption = document.querySelector('input[name="order-method-modal"]:checked');
        // رسوم التوصيل 5 ريال للتوصيل، وصفر للاستلام
        if (selectedOption && selectedOption.value === 'delivery') {
            return 5; 
        }
        return 0; 
    }

    function updateTotal() {
        const subtotal = getSubtotal();
        const deliveryCost = getDeliveryCost();
        const finalTotal = subtotal + deliveryCost;

        SUB_TOTAL_DISPLAY.textContent = `${subtotal.toFixed(0)} ريال`;
        DELIVERY_FEE_DISPLAY.textContent = deliveryCost > 0 ? `${deliveryCost.toFixed(0)} ريال` : 'مجانًا';
        FINAL_TOTAL_DISPLAY.textContent = `${finalTotal.toFixed(0)} ريال`;
        
        SEND_ORDER_BTN.disabled = cart.length === 0;
    }

    // ===============================================
    // 2. وظيفة إرسال الطلب (واتساب)
    // ===============================================

    function sendOrderViaWhatsApp() {
        const phoneNumber = '966536803598'; // 💡 تأكد من تعديل هذا الرقم
        let message = '*مرحباً، أرجو تجهيز الطلب التالي:*\n\n';
        const subtotal = getSubtotal();
        const deliveryCost = getDeliveryCost();
        const finalTotal = subtotal + deliveryCost;
        
        const deliveryOptionName = document.querySelector('input[name="order-method-modal"]:checked').closest('label').textContent.split('رسوم')[0].trim();
        
        const orderNote = ORDER_NOTE_TEXTAREA ? ORDER_NOTE_TEXTAREA.value.trim() : ''; 

        // 1. بناء رسالة الطلبات
        cart.forEach((item) => {
            let itemDetails = `(${item.quantity}x) ${item.name}`;
            let optionsLine = '';

            for (const key in item.options) {
                const option = item.options[key];
                if (option.name) {
                    // عرض اسم الخيار وسعره (إذا كان موجوداً)
                    const pricePart = option.price > 0 ? ` (+${option.price} ر.س)` : '';
                    optionsLine += `${option.name}${pricePart}, `;
                }
            }
            
            // إزالة الفاصلة والمسافة الزائدة في نهاية سطر الخيارات
            if (optionsLine) {
                optionsLine = optionsLine.slice(0, -2); 
                itemDetails += `\n  - الخيارات: [${optionsLine}]`;
            }

            itemDetails += `\n  *الإجمالي: ${(item.price * item.quantity).toFixed(0)} ريال*\n`;
            
            message += `${itemDetails}\n`;
        });
        
        // 2. إضافة الملاحظات
        if (orderNote.length > 0) {
            message += '\n-----------------------\n';
            message += '✍️ *ملاحظات العميل:* \n' + orderNote + '\n';
        }

        // 3. إضافة الملخص النهائي
        message += '\n====================\n';
        message += `طريقة الاستلام: *${deliveryOptionName}*\n`;
        message += `الإجمالي الفرعي: ${subtotal.toFixed(0)} ريال\n`;
        message += `رسوم التوصيل: ${deliveryCost.toFixed(0)} ريال\n`;
        message += `*الإجمالي النهائي المطلوب: ${finalTotal.toFixed(0)} ريال*\n`;
        message += '====================\n';

        // فتح رابط الواتساب
        window.open('https://wa.me/' + phoneNumber + '?text=' + encodeURIComponent(message), '_blank');
        
        // تفريغ السلة بعد إرسال الطلب
        cart.length = 0;
        saveCart();
        CART_MODAL.style.display = 'none';
    }

    // ===============================================
    // 3. ربط الأحداث (Event Listeners) - التعامل مع الإضافة
    // ===============================================
    
    // زر "عرض السلة"
    VIEW_CART_BTN.addEventListener('click', () => {
        CART_MODAL.style.display = 'block';
        renderCartItems();
        updateTotal();
    });

    // إغلاق النافذة المنبثقة
    CLOSE_BTN.addEventListener('click', () => {
        CART_MODAL.style.display = 'none';
    });
    window.addEventListener('click', (event) => {
        if (event.target === CART_MODAL) {
            CART_MODAL.style.display = 'none';
        }
    });

    // تحديث الإجمالي عند تغيير خيار التوصيل/الاستلام
    ORDER_METHOD_OPTIONS.forEach(option => {
        option.addEventListener('change', updateTotal);
    });

    // زر إرسال الطلب عبر واتساب
    SEND_ORDER_BTN.addEventListener('click', sendOrderViaWhatsApp);


    // وظيفة الإضافة إلى السلة الرئيسية
    document.querySelectorAll('.add-to-cart-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const card = event.target.closest('.menu-card');
            const itemId = card.dataset.itemId;
            let itemName = card.querySelector('.item-title').textContent.trim();
            // قيمة basePrice لا تستخدم مباشرة في الكارت الآن، لكن يتم تضمينها في finalPrice
            const basePrice = parseInt(card.dataset.basePrice || 0); 
            
            // 1. التعامل مع الأصناف البسيطة (simple-item)
            if (card.classList.contains('simple-item')) {
                // في الأصناف البسيطة، السعر النهائي = السعر الأساسي
                addToCart(itemId, itemName, basePrice, {});
                return;
            }
            
            // 2. التعامل مع الأصناف ذات الخيارات (مثل الدجاج واللحم)
            let selectedOptions = {};
            let isRequiredOptionMissing = false;
            let finalPrice = basePrice;
            
            const radioGroups = card.querySelectorAll('.main-options-group');
            
            radioGroups.forEach(group => {
                const checkedRadio = group.querySelector('input[type="radio"]:checked');
                
                if (checkedRadio) {
                    const optionCard = checkedRadio.closest('.option-card'); 
                    const optionName = checkedRadio.value; 
                    const optionPrice = parseInt(optionCard.dataset.optionPrice || 0); 
                    
                    const groupName = group.querySelector('h4').textContent.trim().replace(' (إجباري):', '');
                    
                    // إضافة سعر الخيار للسعر النهائي
                    finalPrice += optionPrice;
                    
                    // حفظ اسم الخيار وسعره في قائمة الخيارات المحددة
                    selectedOptions[groupName] = { name: optionName, price: optionPrice };
                } else {
                    // إذا لم يتم اختيار أي خيار في مجموعة إجبارية
                    isRequiredOptionMissing = true;
                }
            });

            if (isRequiredOptionMissing) {
                alert('الرجاء اختيار جميع الخيارات المطلوبة لإكمال الطلب.');
                return; 
            }
            
            // السعر النهائي هو basePrice + مجموع optionPrice
            addToCart(itemId, itemName, finalPrice, selectedOptions);
        });
    });
    
    // ===============================================
    // 4. وظيفة القائمة الجانبية (Sidebar Toggle)
    // ===============================================

    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            menuToggle.classList.toggle('active'); 
        });

        // إغلاق القائمة عند النقر على رابط
        navLinks.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                menuToggle.classList.remove('active');
            });
        });
    }


    // ===============================================
    // 5. إعدادات البداية
    // ===============================================
    updateCartDisplay(); // تحديث عرض السلة عند تحميل الصفحة لأول مرة

    // PWA - التعامل مع حدث التثبيت
    window.addEventListener('beforeinstallprompt', (e) => {
        // منع ظهور النافذة التلقائية
        e.preventDefault();
        deferredPrompt = e;
        INSTALL_PROMPT_MODAL.style.display = 'block';
    });

    if (INSTALL_BTN) {
        INSTALL_BTN.addEventListener('click', () => {
            INSTALL_PROMPT_MODAL.style.display = 'none';
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

    if (DISMISS_INSTALL_BTN) {
         DISMISS_INSTALL_BTN.addEventListener('click', () => {
             INSTALL_PROMPT_MODAL.style.display = 'none';
         });
    }
    // نهاية PWA
});
