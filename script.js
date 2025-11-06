document.addEventListener('DOMContentLoaded', () => {
    // إعداد متغيرات حالة التطبيق
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const VIEW_CART_BTN = document.getElementById('view-cart-btn');
    const CART_MODAL = document.getElementById('cartModal');
    const CLOSE_BTN = document.querySelector('.close-btn');
    const CART_ITEMS_CONTAINER = document.getElementById('cart-items-container');
    const TOTAL_DISPLAY = document.getElementById('final-total-display');
    const SEND_ORDER_BTN = document.getElementById('send-order-btn');
    const DELIVERY_OPTIONS = document.querySelectorAll('input[name="delivery-option"]');

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
        if (CART_MODAL.style.display === 'block') {
            renderCartItems();
            updateTotal();
        }
    }

    function addToCart(itemId, name, price, options = {}) {
        const existingItem = cart.find(item => 
            item.id === itemId && 
            JSON.stringify(item.options) === JSON.stringify(options)
        );

        if (existingItem) {
            existingItem.quantity++;
        } else {
            cart.push({ id: itemId, name, price, quantity: 1, options });
        }
        
        saveCart();
    }

    function renderCartItems() {
        CART_ITEMS_CONTAINER.innerHTML = '';
        if (cart.length === 0) {
            CART_ITEMS_CONTAINER.innerHTML = '<p style="text-align: center; color: #666;">السلة فارغة حاليًا.</p>';
            return;
        }

        cart.forEach((item, index) => {
            const itemElement = document.createElement('div');
            itemElement.classList.add('cart-item');
            
            let optionsText = '';
            for (const key in item.options) {
                if (item.options[key].name) {
                    optionsText += `${item.options[key].name} (+${item.options[key].price} ريال). `;
                }
            }
            
            itemElement.innerHTML = `
                <button class="remove-item-btn" data-index="${index}">حذف</button>
                <div class="item-info">
                    <strong>${item.name}</strong>
                    <p> ${optionsText}</p>
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

        // ربط الأحداث بأزرار التحكم
        document.querySelectorAll('.quantity-control button').forEach(button => {
            button.addEventListener('click', handleQuantityChange);
        });
        document.querySelectorAll('.remove-item-btn').forEach(button => {
            button.addEventListener('click', handleRemoveItem);
        });
    }

    function handleQuantityChange(event) {
        const index = event.target.dataset.index;
        const action = event.target.dataset.action;

        if (action === 'increment') {
            cart[index].quantity++;
        } else if (action === 'decrement' && cart[index].quantity > 1) {
            cart[index].quantity--;
        }
        saveCart();
    }

    function handleRemoveItem(event) {
        const index = event.target.dataset.index;
        cart.splice(index, 1);
        saveCart();
    }

    function getSubtotal() {
        return cart.reduce((total, item) => {
            let basePrice = item.price;
            // حساب سعر الخيارات المضافة (مثل الأرز أو نوع اللحم)
            for (const key in item.options) {
                basePrice += item.options[key].price;
            }
            return total + (basePrice * item.quantity);
        }, 0);
    }
    
    function getDeliveryCost() {
        const selectedOption = document.querySelector('input[name="delivery-option"]:checked');
        if (selectedOption) {
            return parseFloat(selectedOption.value);
        }
        return 0;
    }

    function updateTotal() {
        const subtotal = getSubtotal();
        const deliveryCost = getDeliveryCost();
        const finalTotal = subtotal + deliveryCost;

        // تحديث إجمالي الفاتورة
        const summaryHtml = `
            <p><span>الإجمالي الفرعي:</span> <span>${subtotal.toFixed(0)} ريال</span></p>
            <p><span>رسوم التوصيل:</span> <span>${deliveryCost.toFixed(0)} ريال</span></p>
            <p class="final-total"><span>الإجمالي النهائي:</span> <span id="final-total-display">${finalTotal.toFixed(0)} ريال</span></p>
        `;
        document.querySelector('.totals-display').innerHTML = summaryHtml;

        // تمكين زر الإرسال فقط إذا كانت السلة مملوءة وتم اختيار طريقة استلام
        const isReadyToSend = cart.length > 0 && deliveryCost >= 0; 
        SEND_ORDER_BTN.disabled = !isReadyToSend;
    }

    // =========== 2. وظيفة إرسال الطلب (التعديل هنا) ===========

    function sendOrderViaWhatsApp() {
        const phoneNumber = '9665xxxxxxxx'; // ضع رقم الواتساب الخاص بك هنا
        let message = 'مرحباً، أرجو تجهيز الطلب التالي:\n\n';
        const subtotal = getSubtotal();
        const deliveryCost = getDeliveryCost();
        const finalTotal = subtotal + deliveryCost;
        const deliveryOptionName = document.querySelector('input[name="delivery-option"]:checked').parentElement.textContent.trim().split(':')[0];
        
        // ** التعديل الجديد: استخراج الملاحظة **
        const orderNote = document.getElementById('order-note').value.trim(); 

        // 1. بناء رسالة الطلبات
        cart.forEach((item, index) => {
            let itemDetails = `(${item.quantity}x) ${item.name}`;
            let optionsLine = '';

            for (const key in item.options) {
                const option = item.options[key];
                if (option.name) {
                    optionsLine += ` +${option.name}`;
                }
            }

            if (optionsLine) {
                itemDetails += ` [${optionsLine.trim()}]`;
            }
            message += `- ${itemDetails}\n`;
        });
        
        // 2. إضافة الملاحظات (إذا وُجدت)
        if (orderNote.length > 0) {
            message += '\n-----------------------\n';
            message += '✍️ ملاحظات العميل:\n' + orderNote + '\n';
        }

        // 3. إضافة الملخص النهائي
        message += '\n====================\n';
        message += `طريقة الاستلام: ${deliveryOptionName}\n`;
        message += `الإجمالي الفرعي: ${subtotal.toFixed(0)} ريال\n`;
        message += `رسوم التوصيل: ${deliveryCost.toFixed(0)} ريال\n`;
        message += `الإجمالي النهائي المطلوب: ${finalTotal.toFixed(0)} ريال\n`;
        message += '====================\n';


        // فتح رابط الواتساب
        window.open('https://wa.me/' + phoneNumber + '?text=' + encodeURIComponent(message), '_blank');
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

    // تحديث الإجمالي عند تغيير خيار التوصيل
    DELIVERY_OPTIONS.forEach(option => {
        option.addEventListener('change', updateTotal);
    });

    // زر إرسال الطلب عبر واتساب
    SEND_ORDER_BTN.addEventListener('click', sendOrderViaWhatsApp);


    // وظيفة الإضافة إلى السلة من أي مكان في الصفحة
    document.querySelectorAll('.add-to-cart-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const card = event.target.closest('.menu-card');
            const itemId = card.dataset.itemId;
            const itemName = card.querySelector('.item-title').textContent.trim();
            
            let basePriceElement = card.querySelector('.base-price');
            let basePriceText = basePriceElement ? basePriceElement.textContent.replace(' ريال', '').trim() : '0';
            let basePrice = parseInt(basePriceText);
            
            let selectedOptions = {};

            // التعامل مع المنتجات التي فيها خيارات (مثل اللحم والدجاج)
            const radioButtons = card.querySelectorAll('input[type="radio"]:checked');
            if (radioButtons.length > 0) {
                radioButtons.forEach(radio => {
                    const group = radio.name;
                    const optionPrice = parseInt(radio.value);
                    const optionName = radio.nextElementSibling ? radio.nextElementSibling.textContent.trim() : '';
                    
                    basePrice += optionPrice;
                    selectedOptions[group] = { name: optionName, price: optionPrice };
                });
            }
            
            addToCart(itemId, itemName, basePrice, selectedOptions);
        });
    });

    // تحديث شاشة العرض عند التحميل الأولي
    updateCartDisplay();
});
