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
    
    // متغيرات PWA
    let deferredPrompt;
    const INSTALL_PROMPT_MODAL = document.getElementById('pwa-install-prompt');
    const INSTALL_BTN = document.getElementById('install-btn');
    const DISMISS_INSTALL_BTN = document.getElementById('dismiss-install-btn');
    
    // إخفاء المحتوى قبل بدء شاشة البداية (لمنع ظهور وميض المحتوى قبل شاشة الترحيب)
    if (MAIN_CONTENT && HEADER_NAV && CATEGORY_ICONS) {
        MAIN_CONTENT.style.display = 'none';
        HEADER_NAV.style.display = 'none';
        CATEGORY_ICONS.style.display = 'none';
    }

    // =========== 0. وظيفة التحكم في شاشة الترحيب ===========
    
    if (SPLASH_SCREEN) {
        // إظهار الشاشة الترحيبية لمدة 1.5 ثانية
        setTimeout(() => {
            SPLASH_SCREEN.style.opacity = '0'; // يبدأ تأثير التلاشي (Fade-out) في CSS
            
            setTimeout(() => {
                SPLASH_SCREEN.style.display = 'none';
                // إظهار محتوى التطبيق بعد اختفاء الشاشة
                if (MAIN_CONTENT && HEADER_NAV && CATEGORY_ICONS) {
                    MAIN_CONTENT.style.display = 'block';
                    HEADER_NAV.style.display = 'block';
                    CATEGORY_ICONS.style.display = 'flex';
                }
            }, 500); // 500ms هي مدة التلاشي في CSS
        }, 1500); // مدة عرض الشعار قبل بدء التلاشي
    }

    // =========== 1. وظائف السلة ===========
    
    function saveCart() {
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartDisplay();
    }

    function updateCartDisplay() {
        // تحديث زر "عرض السلة"
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        VIEW_CART_BTN.textContent = `عرض السلة (${totalItems})`;
        VIEW_CART_BTN.disabled = totalItems === 0;

        // تحديث محتوى النافذة المنبثقة
        if (CART_MODAL && CART_MODAL.style.display === 'block') {
            renderCartItems();
            updateTotal();
        }
    }

    function addToCart(itemId, name, finalPrice, options = {}) {
        
        let priceToUse = finalPrice;
        
        const existingItem = cart.find(item => 
            item.id === itemId && 
            JSON.stringify(item.options) === JSON.stringify(options) &&
            item.name === name 
        );

        if (existingItem) {
            existingItem.quantity++;
        } else {
            cart.push({ id: itemId, name, price: priceToUse, quantity: 1, options });
        }
        
        saveCart();
    }

    function renderCartItems() {
        CART_ITEMS_CONTAINER.innerHTML = '';
        if (cart.length === 0) {
            CART_ITEMS_CONTAINER.innerHTML = '<p style="text-align: center; color: #666;">السلة فارغة حاليًا.</p>';
            SEND_ORDER_BTN.disabled = true;
            return;
        }

        cart.forEach((item, index) => {
            const itemElement = document.createElement('div');
            itemElement.classList.add('cart-item');
            
            let optionsText = '';
            for (const key in item.options) {
                const option = item.options[key];
                if (option.price > 0) {
                     optionsText += ` + ${option.name} (${option.price} ريال)`;
                } else {
                     optionsText += ` + ${option.name}`;
                }
            }
            
            itemElement.innerHTML = `
                <button class="remove-item-btn" data-index="${index}"><i class="fa-solid fa-trash-can"></i></button>
                <div class="item-info">
                    <strong>${item.name}</strong>
                    <p class="options-line">${optionsText}</p>
                </div>
                <div class="item-controls">
                    <span style="white-space: nowrap;">${(item.price * item.quantity).toFixed(0)} ريال</span>
                    <div class="quantity-control">
                        <button data-index="${index}" data-action="decrement">-</button>
                        <span>${item.quantity}</span>
                        <button data-index="${index}" data-action="increment">+</button>
                    </div>
                </div>
            `;
            CART_ITEMS_CONTAINER.appendChild(itemElement);
        });

        document.querySelectorAll('.quantity-control button').forEach(button => {
            button.addEventListener('click', handleQuantityChange);
        });
        document.querySelectorAll('.remove-item-btn').forEach(button => {
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
            cart.splice(index, 1);
        }
        saveCart();
    }

    function handleRemoveItem(event) {
        const index = event.target.dataset.index;
        cart.splice(index, 1);
        saveCart();
    }

    function getSubtotal() {
        return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    }
    
    function getDeliveryCost() {
        const selectedOption = document.querySelector('input[name="order-method-modal"]:checked');
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

    // =========== 2. وظيفة إرسال الطلب (واتساب) ===========

    function sendOrderViaWhatsApp() {
        const phoneNumber = '966536803598'; // 💡 تأكد من تعديل هذا الرقم
        let message = 'مرحباً، أرجو تجهيز الطلب التالي:\n\n';
        const subtotal = getSubtotal();
        const deliveryCost = getDeliveryCost();
        const finalTotal = subtotal + deliveryCost;
        
        const deliveryOptionName = document.querySelector('input[name="order-method-modal"]:checked').nextElementSibling.textContent.trim();
        
        const orderNote = ORDER_NOTE_TEXTAREA ? ORDER_NOTE_TEXTAREA.value.trim() : ''; 

        // 1. بناء رسالة الطلبات
        cart.forEach((item) => {
            let itemDetails = `(${item.quantity}x) ${item.name}`;
            let optionsLine = '';

            for (const key in item.options) {
                const option = item.options[key];
                if (option.name) {
                    optionsLine += ` + ${option.name}`;
                }
            }

            if (optionsLine) {
                itemDetails += ` [${optionsLine.trim()}]`;
            }
            itemDetails += ` = ${(item.price * item.quantity).toFixed(0)} ريال`;
            
            message += `- ${itemDetails}\n`;
        });
        
        // 2. إضافة الملاحظات
        if (orderNote.length > 0) {
            message += '\n-----------------------\n';
            message += '✍️ ملاحظات العميل:\n' + orderNote + '\n';
        }

        // 3. إضافة الملخص النهائي
        message += '\n====================\n';
        message += `طريقة الاستلام: ${deliveryOptionName}\n`;
        message += `الإجمالي الفرعي: ${subtotal.toFixed(0)} ريال\n`;
        message += `رسوم التوصيل: ${deliveryCost.toFixed(0)} ريال\n`;
        message += `*الإجمالي النهائي المطلوب: ${finalTotal.toFixed(0)} ريال*\n`;
        message += '====================\n';


        window.open('https://wa.me/' + phoneNumber + '?text=' + encodeURIComponent(message), '_blank');
        
        // تفريغ السلة بعد إرسال الطلب
        cart.length = 0;
        saveCart();
        CART_MODAL.style.display = 'none';
    }

    // =========== 3. ربط الأحداث (Event Listeners) ===========
    
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


    // وظيفة الإضافة إلى السلة 
    document.querySelectorAll('.add-to-cart-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const card = event.target.closest('.menu-card');
            const itemId = card.dataset.itemId;
            let itemName = card.querySelector('.item-title').textContent.trim();
            
            const sizeOptions = card.querySelector('input[name*="_size"]:checked');

            // منطق المشويات الموحدة (SH001, SH002, إلخ.)
            if (sizeOptions) { 
                const selectedValue = sizeOptions.value; 
                const [priceString, sizeName] = selectedValue.split('_'); 
                const finalPrice = parseInt(priceString); 
                
                const finalItemName = itemName + ' (' + sizeName + ')';
                
                addToCart(itemId, finalItemName, finalPrice); 
                return;
            }
            
            // منطق المنتجات ذات الخيارات الإضافية (مثل الدجاج واللحم)
            const basePrice = parseInt(card.dataset.basePrice || 0);
            let selectedOptions = {};
            let isRequiredOptionMissing = false;

            const radioGroups = card.querySelectorAll('.main-options-group');
            
            radioGroups.forEach(group => {
                 // نعتبر أن أي خيار داخل main-options-group هو إجباري
                const checkedRadio = group.querySelector('input[type="radio"]:checked');
                
                if (checkedRadio) {
                    const optionCard = checkedRadio.closest('.option-card'); 
                    const optionName = checkedRadio.value; 
                    const optionPrice = parseInt(optionCard.dataset.optionPrice || 0); 
                    const groupName = checkedRadio.name;
                    
                    selectedOptions[groupName] = { name: optionName, price: optionPrice };
                } else {
                    isRequiredOptionMissing = true;
                }
            });

            if (isRequiredOptionMissing) {
                alert('الرجاء اختيار جميع الخيارات المطلوبة لإكمال الطلب.');
                return; 
            }
            
            // المنتجات البسيطة (simple-item) لن تدخل في هذا الشرط
            addToCart(itemId, itemName, basePrice, selectedOptions);
        });
    });
    
    // =========== 4. منطق PWA (التثبيت) ===========
    
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        setTimeout(() => {
            INSTALL_PROMPT_MODAL.style.display = 'block';
        }, 5000); 
    });

    INSTALL_BTN.addEventListener('click', () => {
        if (deferredPrompt) {
            INSTALL_PROMPT_MODAL.style.display = 'none';
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult) => {
                deferredPrompt = null;
            });
        }
    });
    
    DISMISS_INSTALL_BTN.addEventListener('click', () => {
        INSTALL_PROMPT_MODAL.style.display = 'none';
    });
    
    // =========== 5. وظيفة التحكم في المشويات الموحدة (السعر الديناميكي) ===========

    function setupUnifiedGrillItem(itemName) {
        const options = document.querySelectorAll(`input[name="${itemName}_size"]`);
        const priceDisplay = document.getElementById(`${itemName}-price-display`);

        if (!options.length || !priceDisplay) {
            return;
        }

        options.forEach(option => {
            option.addEventListener('change', (event) => {
                const selectedValue = event.target.value;
                const priceString = selectedValue.split('_')[0]; 
                const priceNumber = parseInt(priceString); 

                priceDisplay.textContent = priceNumber + ' ريال'; 
            });
            
            // ضبط السعر الافتراضي عند التحميل
             if (option.checked) {
                const selectedValue = option.value;
                const priceString = selectedValue.split('_')[0]; 
                const priceNumber = parseInt(priceString); 
                priceDisplay.textContent = priceNumber + ' ريال'; 
            }
        });
    }

    // تفعيل خاصية تحديث السعر التلقائي للمشويات الموحدة
    setupUnifiedGrillItem('kabab_lahm'); 
    setupUnifiedGrillItem('kabab_dajaj');

    // =========== 6. إعدادات البداية ===========
    updateCartDisplay(); 

}); 
