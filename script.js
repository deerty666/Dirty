// ===== بيانات السلة =====
let cartItems=[];

function openSection(name){
    alert('قسم '+name+' سيتم إضافة الأصناف لاحقاً.');
}

// ===== سلة الطلبات + واتساب =====
function getItemDetails(id){ return cartItems.find(i=>i.id===id); }

function updateCartUI(){
    const cartDetails=document.getElementById('cart-details');
    if(cartItems.length===0){ cartDetails.innerHTML='<p>السلة فارغة.</p>'; return; }
    let html='<ul>'; let subtotal=0;
    cartItems.forEach(item=>{
        const total=item.price*item.quantity;
        subtotal+=total;
        html+=`<li>${item.name} x ${item.quantity} (${total.toFixed(2)} ر.س)</li>`;
    });
    html+=`</ul><p><strong>المجموع الفرعي:</strong> ${subtotal.toFixed(2)} ر.س</p>`;
    cartDetails.innerHTML=html;
}

// إرسال الواتساب
document.getElementById('sendOrderBtn').addEventListener('click',()=>{
    if(cartItems.length===0){ alert('السلة فارغة'); return; }
    const name=document.getElementById('customerName').value.trim();
    const phone=document.getElementById('customerPhone').value.trim();
    if(!name || !phone){ alert('الرجاء إدخال الاسم ورقم الجوال'); return; }
    const deliveryFee=5.00;
    let subtotal=0,orderList='';
    cartItems.forEach(item=>{
        const total=item.price*item.quantity;
        subtotal+=total;
        orderList+=`* ${item.name} (×${item.quantity}) - ${total.toFixed(2)} ر.س%0A`;
    });
    const total=subtotal+deliveryFee;
    const finalMessage=`✅ *مطعم سحايب ديرتي: طلب جديد!*%0A%0A`+
                       `*الاسم:* ${name}%0A*الجوال:* ${phone}%0A`+
                       `%0A--- قائمة الطلبات ---%0A${orderList}`+
                       `%0A---%0A*المجموع الفرعي:* ${subtotal.toFixed(2)} ر.س%0A`+
                       `*رسوم التوصيل:* ${deliveryFee.toFixed(2)} ر.س%0A`+
                       `*الإجمالي النهائي:* ${total.toFixed(2)} ر.س`;
    const phoneNumber='966536803598';
    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(finalMessage)}`,'_blank');
});

// ===== PWA =====
let deferredPrompt;
const installButton=document.getElementById('installButton');
const installPromoLink=document.getElementById('installPromoLink');
const promptHandler=()=>{ 
    if(deferredPrompt){ deferredPrompt.prompt(); }
    else{ alert('لتثبيت المنيو، استخدم خيار "الإضافة إلى الشاشة الرئيسية".'); }
};
if(installButton) installButton.addEventListener('click',promptHandler);
if(installPromoLink) installPromoLink.addEventListener('click',promptHandler);

window.addEventListener('beforeinstallprompt',e=>{
    e.preventDefault();
    deferredPrompt=e;
    installButton.style.display='block';
    installPromoLink.style.display='block';
});

window.onload=updateCartUI;

// Service Worker
if('serviceWorker' in navigator){
    window.addEventListener('load',()=>{ navigator.serviceWorker.register('sw.js')
        .then(reg=>console.log('SW registered',reg))
        .catch(err=>console.log('SW failed',err)); });
}
