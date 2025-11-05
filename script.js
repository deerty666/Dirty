// ====== بيانات الأصناف ======
const menuItems = [
    {
        id: 'D01',
        name: 'حبة شواية شعبي',
        price: 46.00,
        section: 'الدجاج',
        extras: [
            { id: 'E01', name: 'رز بشاور', price: 4.00 },
            { id: 'E02', name: 'رز مندي', price: 4.00 },
            { id: 'E03', name: 'مثلوثة', price: 4.00 }
        ]
    }
];

// السلة
let cartItems = [];

// ====== إضافة صنف للسلة ======
function addToCart(itemId, extraId = null) {
    const item = menuItems.find(i => i.id === itemId);
    if (!item) return;

    let extra = null;
    if (extraId) extra = item.extras.find(e => e.id === extraId);

    const cartEntry = {
        id: item.id,
        name: item.name + (extra ? ` + ${extra.name}` : ''),
        price: item.price + (extra ? extra.price : 0),
        quantity: 1
    };

    const existingIndex = cartItems.findIndex(i => i.name === cartEntry.name);
    if (existingIndex > -1) cartItems[existingIndex].quantity += 1;
    else cartItems.push(cartEntry);

    alert(`تم إضافة ${cartEntry.name} إلى السلة!`);
    updateCartUI();
}

// ====== تحديث واجهة السلة ======
function updateCartUI() {
    const cartDetails = document.getElementById('cart-details');
    if (cartItems.length === 0) { cartDetails.innerHTML = '<p>السلة فارغة.</p>'; return; }

    let html = '<ul>'; let subtotal = 0;
    cartItems.forEach(item => {
        subtotal += item.price * item.quantity;
        html += `<li>${item.name} ×${item.quantity} (${item.price.toFixed(2)} ر.س لكل وحدة)</li>`;
    });
    html += `</ul><p><strong>المجموع الفرعي:</strong> ${subtotal.toFixed(2)} ر.س</p>`;
    cartDetails.innerHTML = html;
}

// ====== إرسال الطلب عبر واتساب ======
document.getElementById('sendOrderBtn').addEventListener('click', () => {
    if(cartItems.length === 0){ alert('السلة فارغة'); return; }
    const name = document.getElementById('customerName').value.trim();
    const phone = document.getElementById('customerPhone').value.trim();
    if(!name || !phone){ alert('الرجاء إدخال الاسم ورقم الجوال'); return; }

    const deliveryFee = 5.00;
    let subtotal = 0, orderList = '';
    cartItems.forEach(item => {
        subtotal += item.price * item.quantity;
        orderList += `* ${item.name} ×${item.quantity} - ${item.price.toFixed(2)} ر.س%0A`;
    });

    const total = subtotal + deliveryFee;
    const finalMessage = `✅ *مطعم سحايب ديرتي: طلب جديد!*%0A%0A` +
                         `*الاسم:* ${name}%0A*الجوال:* ${phone}%0A` +
                         `%0A--- قائمة الطلبات ---%0A${orderList}` +
                         `%0A---%0A*المجموع الفرعي:* ${subtotal.toFixed(2)} ر.س%0A` +
                         `*رسوم التوصيل:* ${deliveryFee.toFixed(2)} ر.س%0A` +
                         `*الإجمالي النهائي:* ${total.toFixed(2)} ر.س`;

    const phoneNumber = '966536803598';
    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(finalMessage)}`, '_blank');
});

// ====== PWA ======
let deferredPrompt;
const installButton = document.getElementById('installButton');
const installPromoLink = document.getElementById('installPromoLink');
const promptHandler = () => { 
    if(deferredPrompt) deferredPrompt.prompt();
    else alert('لتثبيت المنيو، استخدم خيار "الإضافة إلى الشاشة الرئيسية".');
};
installButton.addEventListener('click', promptHandler);
installPromoLink.addEventListener('click', promptHandler);

window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPrompt = e;
    installButton.style.display = 'block';
    installPromoLink.style.display = 'block';
});

window.onload = updateCartUI;

if('serviceWorker' in navigator){
    window.addEventListener('load', ()=>{ navigator.serviceWorker.register('sw.js'); });
}

// ====== عرض قسم (Placeholder) ======
function openSection(name){
    if(name === 'الدجاج'){
        let extrasOptions = menuItems[0].extras.map(e => `<button onclick="addToCart('D01','${e.id}')">${e.name} +${e.price} ر.س</button>`).join('<br>');
        document.getElementById('menu-sections').innerHTML = `<h2>قسم الدجاج</h2>
            <button onclick="addToCart('D01')">حبة شواية شعبي (46 ر.س)</button><br>${extrasOptions}<br><button onclick="location.reload()">العودة للأقسام</button>`;
    } else alert('سيتم إضافة الأصناف لاحقاً لهذا القسم.');
}
