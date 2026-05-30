import { db } from '@/lib/db';
import { SHIPPING_CONFIG, TAX_CONFIG, COMMISSION_CONFIG, AUTH_CONFIG } from '@/lib/config';

// IMPORTANT: Seed route is POST-only for security.
// GET requests are blocked by middleware.ts to prevent accidental/unauthorized database wipes.
// Must include admin auth header: X-Admin-Key or Authorization: Bearer <token>
export async function POST() {
  try {
    // ─── CLEANUP: Delete all data in correct dependency order ───────────────────
    await db.invoice.deleteMany({});
    await db.dispute.deleteMany({});
    await db.return.deleteMany({});
    await db.orderItem.deleteMany({});
    await db.order.deleteMany({});
    await db.payout.deleteMany({});
    await db.staff.deleteMany({});
    await db.storeReview.deleteMany({});
    await db.helpTicket.deleteMany({});
    await db.banner.deleteMany({});
    await db.priceAlert.deleteMany({});
    await db.auction.deleteMany({});
    await db.coupon.deleteMany({});
    await db.flashSale.deleteMany({});
    await db.car.deleteMany({});
    await db.property.deleteMany({});
    await db.classified.deleteMany({});
    await db.job.deleteMany({});
    await db.service.deleteMany({});
    await db.app.deleteMany({});
    await db.chatMessage.deleteMany({});
    await db.wishlist.deleteMany({});
    await db.review.deleteMany({});
    await db.notification.deleteMany({});
    await db.address.deleteMany({});
    await db.product.deleteMany({});
    await db.store.deleteMany({});
    await db.category.deleteMany({});
    await db.platformSettings.deleteMany({});
    await db.user.deleteMany({});

    const now = new Date();

    // ─── USERS ────────────────────────────────────────────────────────────────────
    const users = await db.user.createMany({
      data: [
        { email: AUTH_CONFIG.demoUser.email, name: 'Demo User', phone: '+9647701234567', role: 'buyer', loyaltyTier: AUTH_CONFIG.demoUser.loyaltyTier, loyaltyPoints: AUTH_CONFIG.demoUser.loyaltyPoints, walletBalance: AUTH_CONFIG.demoUser.walletBalance, aiCredits: 10, isVerified: true },
        { email: 'seller@nexamart.com', name: 'TechStore Pro', phone: '+9647709876543', role: 'seller', loyaltyTier: 'platinum', loyaltyPoints: 5200, walletBalance: 4520.0, aiCredits: 25, isVerified: true },
        { email: 'admin@nexamart.com', name: 'Admin User', role: 'admin', isVerified: true, loyaltyPoints: 0, walletBalance: 0, aiCredits: 999 },
        { email: 'fashion@nexamart.com', name: 'Fashion Hub Seller', role: 'seller', isVerified: true, loyaltyPoints: 100, walletBalance: 500, aiCredits: 5 },
        { email: 'home@nexamart.com', name: 'Home Essentials Seller', role: 'seller', isVerified: true, loyaltyPoints: 100, walletBalance: 500, aiCredits: 5 },
        { email: 'beauty@nexamart.com', name: 'Beauty World Seller', role: 'seller', isVerified: true, loyaltyPoints: 100, walletBalance: 500, aiCredits: 5 },
        { email: 'sports@nexamart.com', name: 'Sports Zone Seller', role: 'seller', isVerified: true, loyaltyPoints: 100, walletBalance: 500, aiCredits: 5 },
        { email: 'ahmed@nexamart.com', name: 'Ahmed Al-Rashid', phone: '+966501234567', role: 'buyer', isVerified: true, loyaltyPoints: 320, walletBalance: 75, aiCredits: 5 },
        { email: 'fatima@nexamart.com', name: 'Fatima Al-Zahra', phone: '+971501112233', role: 'buyer', isVerified: true, loyaltyPoints: 180, walletBalance: 220, aiCredits: 3 },
        { email: 'omar@nexamart.com', name: 'Omar Hassan', phone: '+962799887766', role: 'buyer', isVerified: false, loyaltyPoints: 50, walletBalance: 0, aiCredits: 0 },
      ],
    });

    const allUsers = await db.user.findMany({ orderBy: { createdAt: 'asc' } });
    const [user, seller, admin, seller2, seller3, seller4, seller5, buyer2, buyer3, buyer4] = allUsers;

    // ─── CATEGORIES ───────────────────────────────────────────────────────────────
    await db.category.createMany({
      data: [
        { name: 'Electronics', nameAr: 'إلكترونيات', slug: 'electronics', icon: 'smartphone', image: '/categories/electronics.jpg', productCount: 156 },
        { name: 'Fashion', nameAr: 'أزياء', slug: 'fashion', icon: 'shirt', image: '/categories/fashion.jpg', productCount: 243 },
        { name: 'Home & Garden', nameAr: 'المنزل والحديقة', slug: 'home-garden', icon: 'home', image: '/categories/home.jpg', productCount: 89 },
        { name: 'Beauty & Health', nameAr: 'الجمال والصحة', slug: 'beauty', icon: 'sparkles', image: '/categories/beauty.jpg', productCount: 167 },
        { name: 'Sports & Outdoors', nameAr: 'رياضة', slug: 'sports', icon: 'dumbbell', image: '/categories/sports.jpg', productCount: 78 },
        { name: 'Toys & Games', nameAr: 'ألعاب', slug: 'toys', icon: 'gamepad-2', image: '/categories/toys.jpg', productCount: 56 },
        { name: 'Automotive', nameAr: 'سيارات', slug: 'automotive', icon: 'car', image: '/categories/auto.jpg', productCount: 34 },
        { name: 'Books & Media', nameAr: 'كتب ووسائط', slug: 'books', icon: 'book-open', image: '/categories/books.jpg', productCount: 112 },
        { name: 'Food & Groceries', nameAr: 'طعام وبقالة', slug: 'food', icon: 'shopping-basket', image: '/categories/food.jpg', productCount: 95 },
        { name: 'Jewelry & Watches', nameAr: 'مجوهرات وساعات', slug: 'jewelry', icon: 'watch', image: '/categories/jewelry.jpg', productCount: 67 },
      ],
    });

    const categories = await db.category.findMany({ orderBy: { createdAt: 'asc' } });

    // ─── STORES ───────────────────────────────────────────────────────────────────
    await db.store.createMany({
      data: [
        { name: 'TechStore Pro', nameAr: 'متجر التقنية', slug: 'techstore-pro', description: 'Your one-stop shop for the latest tech gadgets and electronics', descriptionAr: 'وجهتك الأولى لأحدث الأجهزة والإلكترونيات', logo: '', banner: '', ownerId: seller.id, isVerified: true, rating: 4.8, reviewCount: 342, productCount: 45, tier: 'pro', commission: 8 },
        { name: 'Fashion Hub', nameAr: 'مركز الأزياء', slug: 'fashion-hub', description: 'Trendy fashion for everyone', descriptionAr: 'أزياء عصرية للجميع', logo: '', banner: '', ownerId: seller2.id, isVerified: true, rating: 4.6, reviewCount: 189, productCount: 78, tier: 'pro', commission: 10 },
        { name: 'Home Essentials', nameAr: 'أساسيات المنزل', slug: 'home-essentials', description: 'Everything for your home', descriptionAr: 'كل ما تحتاجه لمنزلك', logo: '', banner: '', ownerId: seller3.id, isVerified: true, rating: 4.5, reviewCount: 156, productCount: 34, tier: 'free', commission: 12 },
        { name: 'Beauty World', nameAr: 'عالم الجمال', slug: 'beauty-world', description: 'Premium beauty products', descriptionAr: 'منتجات تجميل فاخرة', logo: '', banner: '', ownerId: seller4.id, isVerified: true, rating: 4.7, reviewCount: 267, productCount: 56, tier: 'pro', commission: 9 },
        { name: 'Sports Zone', nameAr: 'المنطقة الرياضية', slug: 'sports-zone', description: 'Gear up for any sport', descriptionAr: 'استعد لأي رياضة', logo: '', banner: '', ownerId: seller5.id, isVerified: false, rating: 4.3, reviewCount: 98, productCount: 23, tier: 'free', commission: 10 },
      ],
    });

    const stores = await db.store.findMany({ orderBy: { createdAt: 'asc' } });

    // ─── PRODUCTS ─────────────────────────────────────────────────────────────────
    await db.product.createMany({
      data: [
        { id: 'WHP-001', name: 'Wireless Bluetooth Headphones Pro', nameAr: 'سماعات بلوتوث لاسلكية برو', description: 'Premium noise-cancelling wireless headphones with 40-hour battery life.', descriptionAr: 'سماعات لاسلكية متميزة بعزل الضوضاء مع بطارية تدوم 40 ساعة', price: 89.99, originalPrice: 129.99, images: '["/images/products/headphones-pro.png"]', categoryId: categories[0].id, storeId: stores[0].id, stock: 150, rating: 4.7, reviewCount: 234, soldCount: 1520, isFeatured: true, isSale: true, hasFreeShipping: true, variations: '{"color":["Black","White","Navy"]}', tieredPricing: '[{"minQty":5,"price":82.99},{"minQty":10,"price":75.99}]', tags: '["wireless","bluetooth","headphones"]', sku: 'WHP-001' },
        { id: 'SWU-002', name: 'Smart Watch Ultra', nameAr: 'ساعة ذكية ألترا', description: 'Advanced smartwatch with health monitoring, GPS, and 7-day battery life.', descriptionAr: 'ساعة ذكية متقدمة مع مراقبة الصحة وGPS وبطارية 7 أيام', price: 249.99, originalPrice: 349.99, images: '["/images/products/smart-watch-ultra.png"]', categoryId: categories[0].id, storeId: stores[0].id, stock: 75, rating: 4.8, reviewCount: 567, soldCount: 3200, isFeatured: true, isNew: true, isSale: true, hasFreeShipping: true, variations: '{"color":["Titanium","Black","Orange"],"size":["42mm","46mm"]}', tags: '["smartwatch","fitness","gps"]', sku: 'SWU-002' },
        { id: 'PLJ-003', name: 'Premium Leather Jacket', nameAr: 'سترة جلد فاخرة', description: 'Handcrafted genuine leather jacket with premium stitching.', descriptionAr: 'سترة جلد طبيعي مصنوعة يدوياً بخياطة فاخرة', price: 199.99, originalPrice: 299.99, images: '["/images/products/leather-jacket.png"]', categoryId: categories[1].id, storeId: stores[1].id, stock: 45, rating: 4.5, reviewCount: 89, soldCount: 430, isFeatured: true, isSale: true, hasFreeShipping: true, variations: '{"color":["Black","Brown","Tan"],"size":["S","M","L","XL"]}', tags: '["leather","jacket","premium"]', sku: 'PLJ-003' },
        { id: 'UHC-004', name: '4K Ultra HD Camera', nameAr: 'كاميرا 4K ألترا HD', description: 'Professional-grade 4K camera with 30x optical zoom and WiFi.', descriptionAr: 'كاميرا احترافية بدقة 4K مع تقريب بصري 30x وWiFi', price: 599.99, originalPrice: 799.99, images: '["/images/products/4k-camera.png"]', categoryId: categories[0].id, storeId: stores[0].id, stock: 30, rating: 4.9, reviewCount: 156, soldCount: 890, isFeatured: true, isNew: true, isSale: true, hasFreeShipping: true, variations: '{"color":["Black"]}', tieredPricing: '[{"minQty":3,"price":549.99}]', tags: '["camera","4k","professional"]', sku: 'UHC-004' },
        { id: 'OSS-005', name: 'Organic Skincare Set', nameAr: 'مجموعة العناية بالبشرة العضوية', description: 'Complete organic skincare routine with cleanser, toner, and serum.', descriptionAr: 'روتين عناية بالبشرة عضوي كامل', price: 79.99, originalPrice: 119.99, images: '["/images/products/skincare-set.png"]', categoryId: categories[3].id, storeId: stores[3].id, stock: 200, rating: 4.6, reviewCount: 312, soldCount: 2100, isFeatured: true, isSale: true, variations: '{"type":["Normal","Oily","Dry"]}', tags: '["organic","skincare","beauty"]', sku: 'OSS-005' },
        { id: 'GMK-006', name: 'Gaming Mechanical Keyboard', nameAr: 'لوحة مفاتيح ميكانيكية للألعاب', description: 'RGB mechanical gaming keyboard with Cherry MX switches.', descriptionAr: 'لوحة مفاتيح ميكانيكية RGB بمفاتيح Cherry MX', price: 149.99, originalPrice: 189.99, images: '["/images/products/gaming-keyboard.png"]', categoryId: categories[0].id, storeId: stores[0].id, stock: 120, rating: 4.7, reviewCount: 445, soldCount: 1890, isSale: true, hasFreeShipping: true, variations: '{"switch":["Red","Blue","Brown"],"layout":["US","Arabic"]}', tags: '["gaming","keyboard","mechanical"]', sku: 'GMK-006' },
        { id: 'RSP-007', name: 'Running Shoes Pro Max', nameAr: 'حذاء جري برو ماكس', description: 'Lightweight running shoes with advanced cushioning.', descriptionAr: 'حذاء جري خفيف الوزن مع وسائد متقدمة', price: 129.99, originalPrice: 169.99, images: '["/images/products/running-shoes.png"]', categoryId: categories[4].id, storeId: stores[4].id, stock: 80, rating: 4.4, reviewCount: 178, soldCount: 670, isNew: true, isSale: true, hasFreeShipping: true, variations: '{"color":["Black/White","Blue/Orange"],"size":["7","8","9","10","11"]}', tags: '["running","shoes","sports"]', sku: 'RSP-007' },
        { id: 'SHH-008', name: 'Smart Home Hub', nameAr: 'مركز المنزل الذكي', description: 'Central smart home controller compatible with all platforms.', descriptionAr: 'جهاز تحكم مركزي للمنزل الذكي متوافق مع جميع المنصات', price: 179.99, originalPrice: 229.99, images: '["/images/products/smart-home-hub.png"]', categoryId: categories[2].id, storeId: stores[2].id, stock: 55, rating: 4.3, reviewCount: 92, soldCount: 340, isNew: true, hasFreeShipping: true, variations: '{"color":["White","Black"]}', tags: '["smart-home","iot"]', sku: 'SHH-008' },
        { id: 'DPN-009', name: 'Diamond Pendant Necklace', nameAr: 'قلادة بدلاية ألماس', description: 'Elegant diamond pendant in 18K white gold.', descriptionAr: 'قلادة أنيقة بدلاية ألماس من الذهب الأبيض عيار 18', price: 899.99, originalPrice: 1199.99, images: '["/images/products/gold-jewelry.png"]', categoryId: categories[9].id, storeId: stores[1].id, stock: 15, rating: 4.9, reviewCount: 67, soldCount: 89, isFeatured: true, isSale: true, hasFreeShipping: true, variations: '{"metal":["White Gold","Yellow Gold"],"size":["16in","18in"]}', tags: '["diamond","necklace"]', sku: 'DPN-009' },
        { id: 'EMD-010', name: 'Espresso Machine Deluxe', nameAr: 'آلة إسبريسو ديلوكس', description: 'Professional espresso machine with built-in grinder.', descriptionAr: 'آلة إسبريسو احترافية مع مطحنة مدمجة', price: 449.99, originalPrice: 599.99, images: '["/images/products/organic-tea.png"]', categoryId: categories[2].id, storeId: stores[2].id, stock: 25, rating: 4.6, reviewCount: 134, soldCount: 560, isSale: true, hasFreeShipping: true, variations: '{"color":["Silver","Black"]}', tags: '["espresso","coffee"]', sku: 'EMD-010' },
        { id: 'KET-011', name: 'Kids Educational Tablet', nameAr: 'لوح تعليمي للأطفال', description: 'Fun educational tablet for kids with parental controls.', descriptionAr: 'لوح تعليمي ممتع للأطفال مع رقابة أبوية', price: 149.99, originalPrice: 199.99, images: '["/images/products/wireless-earbuds.png"]', categoryId: categories[5].id, storeId: stores[0].id, stock: 60, rating: 4.2, reviewCount: 89, soldCount: 340, isNew: true, isSale: true, variations: '{"color":["Blue","Pink","Green"]}', tags: '["kids","tablet","educational"]', sku: 'KET-011' },
        { id: 'YMP-012', name: 'Yoga Mat Premium', nameAr: 'سجادة يوغا فاخرة', description: 'Extra thick non-slip yoga mat with alignment lines.', descriptionAr: 'سجادة يوغا سميكة غير قابلة للانزلاق مع خطوط محاذاة', price: 39.99, originalPrice: 59.99, images: '["/images/products/leather-bag.png"]', categoryId: categories[4].id, storeId: stores[4].id, stock: 300, rating: 4.5, reviewCount: 267, soldCount: 1560, isSale: true, variations: '{"color":["Purple","Teal","Black"]}', tieredPricing: '[{"minQty":10,"price":34.99},{"minQty":50,"price":29.99}]', tags: '["yoga","fitness"]', sku: 'YMP-012' },
        { id: 'OUD-013', name: 'Royal Oud Perfume', nameAr: 'عطر العود الملكي', description: 'Exquisite Arabian oud perfume with notes of sandalwood, amber, and rose. Long-lasting luxury fragrance.', descriptionAr: 'عطر عود عربي رائع بنوتات خشب الصندل والعنبر والورد', price: 129.99, originalPrice: 179.99, images: '["/images/products/skincare-set.png"]', categoryId: categories[3].id, storeId: stores[3].id, stock: 90, rating: 4.8, reviewCount: 423, soldCount: 2800, isFeatured: true, isNew: true, isSale: true, hasFreeShipping: true, variations: '{"size":["30ml","50ml","100ml"]}', tags: '["oud","perfume","arabian"]', sku: 'OUD-013' },
        { id: 'ABB-014', name: 'Arabic Calligraphy Art Set', nameAr: 'طقم خط عربي', description: 'Professional Arabic calligraphy set with bamboo pens, ink, and practice paper. Includes instructional booklet.', descriptionAr: 'طقم خط عربي احترافي مع أقلام الخيزران والحبر وورق التمرين', price: 34.99, originalPrice: 49.99, images: '["/images/products/skincare-set.png"]', categoryId: categories[7].id, storeId: stores[2].id, stock: 45, rating: 4.6, reviewCount: 87, soldCount: 320, isSale: true, variations: '{}', tags: '["calligraphy","arabic","art"]', sku: 'ABB-014' },
        { id: 'DTE-015', name: 'Emirati Dates Gift Box', nameAr: 'صندوق تمرات إماراتي هدية', description: 'Premium Emirati dates stuffed with almonds and coated with chocolate. Luxury gift packaging.', descriptionAr: 'تمر إماراتي فاخر محشي باللوز ومغلف بالشوكولاتة. تغليف هدايا فاخر', price: 54.99, originalPrice: 74.99, images: '["/images/products/wireless-earbuds.png"]', categoryId: categories[8].id, storeId: stores[2].id, stock: 200, rating: 4.9, reviewCount: 198, soldCount: 1450, isFeatured: true, isSale: true, hasFreeShipping: true, variations: '{"size":["500g","1kg"]}', tags: '["dates","gift","emirati"]', sku: 'DTE-015' },
      ],
    });

    const allProducts = await db.product.findMany({ orderBy: { createdAt: 'asc' } });

    // ─── ORDERS + ORDER ITEMS ─────────────────────────────────────────────────────
    await db.order.createMany({
      data: [
        { orderNumber: 'ORD-001', userId: user.id, storeId: stores[0].id, status: 'delivered', subtotal: 89.99, shippingCost: 0, discount: 10, tax: 6.30, total: 86.29, paymentMethod: 'credit_card', paymentStatus: 'paid', shippingAddress: JSON.stringify({ fullName: 'Demo User', address1: '123 Main St', city: 'Baghdad', country: 'Iraq' }) },
        { orderNumber: 'ORD-002', userId: user.id, storeId: stores[1].id, status: 'shipped', subtotal: 199.99, shippingCost: 0, discount: 0, tax: 14.00, total: 213.99, paymentMethod: 'wallet', paymentStatus: 'paid', shippingAddress: JSON.stringify({ fullName: 'Demo User', address1: '123 Main St', city: 'Baghdad', country: 'Iraq' }), trackingNumber: 'TRK-XYZ-123', carrier: 'DHL Express' },
        { orderNumber: 'ORD-003', userId: user.id, storeId: stores[0].id, status: 'processing', subtotal: 249.99, shippingCost: 0, discount: 25, tax: 15.75, total: 240.74, paymentMethod: 'credit_card', paymentStatus: 'paid', shippingAddress: JSON.stringify({ fullName: 'Demo User', address1: '456 Oak Ave', city: 'Erbil', country: 'Iraq' }) },
        { orderNumber: 'ORD-004', userId: user.id, storeId: stores[3].id, status: 'pending', subtotal: 79.99, shippingCost: 5.99, discount: 0, tax: 5.60, total: 91.58, paymentMethod: 'zain_cash', paymentStatus: 'pending', shippingAddress: JSON.stringify({ fullName: 'Demo User', address1: '789 Pine Rd', city: 'Basra', country: 'Iraq' }) },
        { orderNumber: 'ORD-005', userId: buyer2.id, storeId: stores[0].id, status: 'delivered', subtotal: 149.99, shippingCost: 0, discount: 15, tax: 9.45, total: 144.44, paymentMethod: 'credit_card', paymentStatus: 'paid', shippingAddress: JSON.stringify({ fullName: 'Ahmed Al-Rashid', address1: 'King Fahd Road', city: 'Riyadh', country: 'Saudi Arabia' }) },
        { orderNumber: 'ORD-006', userId: buyer2.id, storeId: stores[2].id, status: 'shipped', subtotal: 449.99, shippingCost: 0, discount: 0, tax: 31.50, total: 481.49, paymentMethod: 'credit_card', paymentStatus: 'paid', shippingAddress: JSON.stringify({ fullName: 'Ahmed Al-Rashid', address1: 'Olaya District', city: 'Riyadh', country: 'Saudi Arabia' }), trackingNumber: 'TRK-ABC-456', carrier: 'Aramex' },
        { orderNumber: 'ORD-007', userId: buyer3.id, storeId: stores[3].id, status: 'delivered', subtotal: 129.99, shippingCost: 0, discount: 0, tax: 9.10, total: 139.09, paymentMethod: 'apple_pay', paymentStatus: 'paid', shippingAddress: JSON.stringify({ fullName: 'Fatima Al-Zahra', address1: 'Dubai Marina Walk', city: 'Dubai', country: 'UAE' }) },
        { orderNumber: 'ORD-008', userId: buyer3.id, storeId: stores[0].id, status: 'cancelled', subtotal: 599.99, shippingCost: 0, discount: 0, tax: 42.00, total: 641.99, paymentMethod: 'credit_card', paymentStatus: 'refunded', shippingAddress: JSON.stringify({ fullName: 'Fatima Al-Zahra', address1: 'JBR Walk', city: 'Dubai', country: 'UAE' }), notes: 'Customer changed mind, refund processed' },
      ],
    });

    const orders = await db.order.findMany({ orderBy: { createdAt: 'asc' } });

    if (allProducts.length >= 15 && orders.length >= 8) {
      await db.orderItem.createMany({
        data: [
          { orderId: orders[0].id, productId: allProducts[0].id, quantity: 1, price: 89.99, total: 89.99 },
          { orderId: orders[1].id, productId: allProducts[2].id, quantity: 1, price: 199.99, total: 199.99 },
          { orderId: orders[2].id, productId: allProducts[1].id, quantity: 1, price: 249.99, total: 249.99 },
          { orderId: orders[3].id, productId: allProducts[4].id, quantity: 1, price: 79.99, total: 79.99 },
          { orderId: orders[4].id, productId: allProducts[5].id, quantity: 1, price: 149.99, total: 149.99 },
          { orderId: orders[5].id, productId: allProducts[9].id, quantity: 1, price: 449.99, total: 449.99 },
          { orderId: orders[6].id, productId: allProducts[12].id, quantity: 1, price: 129.99, total: 129.99 },
          { orderId: orders[7].id, productId: allProducts[3].id, quantity: 1, price: 599.99, total: 599.99 },
        ],
      });
    }

    // ─── REVIEWS ──────────────────────────────────────────────────────────────────
    if (allProducts.length >= 13) {
      await db.review.createMany({
        data: [
          { userId: user.id, productId: allProducts[0].id, rating: 5, comment: 'Amazing sound quality! The noise cancellation is top-notch.', isVerified: true, helpful: 45 },
          { userId: buyer2.id, productId: allProducts[0].id, rating: 4, comment: 'Great headphones but a bit heavy for extended use.', isVerified: true, helpful: 23 },
          { userId: user.id, productId: allProducts[1].id, rating: 5, comment: 'Best smartwatch I ever owned. Battery life is incredible!', isVerified: true, helpful: 67 },
          { userId: user.id, productId: allProducts[2].id, rating: 4, comment: 'Beautiful leather quality. Fits perfectly.', isVerified: true, helpful: 12 },
          { userId: user.id, productId: allProducts[4].id, rating: 5, comment: 'My skin has improved so much since using this set!', isVerified: true, helpful: 89 },
          { userId: buyer2.id, productId: allProducts[5].id, rating: 4, comment: 'Excellent keyboard for gaming. Cherry MX Brown is perfect.', isVerified: true, helpful: 34 },
          { userId: buyer3.id, productId: allProducts[12].id, rating: 5, comment: 'The oud fragrance is absolutely divine. Lasts all day!', isVerified: true, helpful: 56 },
          { userId: buyer4.id, productId: allProducts[14].id, rating: 5, comment: 'Best dates I have ever had. Gift box presentation is stunning.', isVerified: true, helpful: 78 },
        ],
      });
    }

    // ─── WISHLIST ─────────────────────────────────────────────────────────────────
    if (allProducts.length >= 13) {
      await db.wishlist.createMany({
        data: [
          { userId: user.id, productId: allProducts[3].id },
          { userId: user.id, productId: allProducts[8].id },
          { userId: buyer2.id, productId: allProducts[1].id },
          { userId: buyer2.id, productId: allProducts[5].id },
          { userId: buyer3.id, productId: allProducts[12].id },
          { userId: buyer3.id, productId: allProducts[14].id },
        ],
      });
    }

    // ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
    await db.notification.createMany({
      data: [
        { userId: user.id, title: 'Welcome to NexaMart!', titleAr: 'مرحباً بك في نكسا مارت!', message: 'Start exploring thousands of products.', messageAr: 'ابدأ استكشاف آلاف المنتجات.', type: 'system' },
        { userId: user.id, title: 'Order shipped!', titleAr: 'تم شحن طلبك!', message: 'Order ORD-002 is on its way.', messageAr: 'الطلب ORD-002 في طريقه.', type: 'order' },
        { userId: user.id, title: 'Flash Sale!', titleAr: 'عرض فلاش!', message: 'Up to 70% off on electronics.', messageAr: 'خصومات تصل إلى 70% على الإلكترونيات.', type: 'promotion' },
        { userId: user.id, title: 'Price Drop Alert', titleAr: 'تنبيه انخفاض السعر!', message: 'Smart Watch Ultra is now 30% off!', messageAr: 'الساعة الذكية ألترا الآن بخصم 30%!', type: 'promotion' },
        { userId: buyer2.id, title: 'Welcome to NexaMart!', titleAr: 'مرحباً بك في نكسا مارت!', message: 'Discover great deals from across the MENA region.', messageAr: 'اكتشف عروض رائعة من منطقة الشرق الأوسط وشمال أفريقيا.', type: 'system' },
        { userId: buyer2.id, title: 'Your order has been delivered', titleAr: 'تم توصيل طلبك', message: 'Order ORD-005 has been delivered successfully.', messageAr: 'تم توصيل الطلب ORD-005 بنجاح.', type: 'order', isRead: true },
        { userId: buyer3.id, title: 'Welcome to NexaMart!', titleAr: 'مرحباً بك في نكسا مارت!', message: 'Explore the finest products from the Arab world.', messageAr: 'استكشف أجود المنتجات من العالم العربي.', type: 'system' },
      ],
    });

    // ─── ADDRESSES ────────────────────────────────────────────────────────────────
    await db.address.createMany({
      data: [
        { userId: user.id, label: 'Home', fullName: 'Demo User', phone: '+9647701234567', address1: '123 Main Street', city: 'Baghdad', state: 'Baghdad', postalCode: '10001', country: 'Iraq', isDefault: true },
        { userId: user.id, label: 'Office', fullName: 'Demo User', phone: '+9647701234567', address1: '456 Business Avenue', city: 'Erbil', state: 'Erbil', postalCode: '44001', country: 'Iraq', isDefault: false },
        { userId: buyer2.id, label: 'Home', fullName: 'Ahmed Al-Rashid', phone: '+966501234567', address1: 'King Fahd Road, Al Olaya', city: 'Riyadh', state: 'Riyadh', postalCode: '12211', country: 'Saudi Arabia', isDefault: true },
        { userId: buyer2.id, label: 'Work', fullName: 'Ahmed Al-Rashid', phone: '+966501234567', address1: 'Prince Sultan Street', city: 'Jeddah', state: 'Makkah', postalCode: '21589', country: 'Saudi Arabia', isDefault: false },
        { userId: buyer3.id, label: 'Home', fullName: 'Fatima Al-Zahra', phone: '+971501112233', address1: 'Dubai Marina Walk, Tower B', city: 'Dubai', state: 'Dubai', postalCode: '00000', country: 'UAE', isDefault: true },
      ],
    });

    // ─── PLATFORM SETTINGS ────────────────────────────────────────────────────────
    await db.platformSettings.createMany({
      data: [
        { key: 'siteName', value: 'NexaMart' },
        { key: 'siteTagline', value: 'AI-Powered Multi-Vendor Commerce' },
        { key: 'commissionRate', value: String(COMMISSION_CONFIG.defaultRate) },
        { key: 'proSubscriptionPrice', value: String(COMMISSION_CONFIG.proSubscriptionPrice) },
        { key: 'aiTokenPrice10', value: '4.99' },
        { key: 'aiTokenPrice50', value: '19.99' },
        { key: 'aiTokenPrice100', value: '34.99' },
        { key: 'freeShippingThreshold', value: String(SHIPPING_CONFIG.freeShippingThreshold) },
        { key: 'defaultShippingRate', value: '5.99' },
        { key: 'taxRate', value: String(TAX_CONFIG.defaultRate) },
        { key: 'escrowPeriodDays', value: '7' },
        { key: 'refundPolicyDays', value: '30' },
      ],
    });

    // ─── FLASH SALES ──────────────────────────────────────────────────────────────
    await db.flashSale.createMany({
      data: [
        { title: 'Electronics Mega Sale', titleAr: 'تخفيضات الإلكترونيات الكبرى', discount: 40, startDate: new Date(now.getTime() - 2 * 60 * 60 * 1000), endDate: new Date(now.getTime() + 22 * 60 * 60 * 1000), isActive: true },
        { title: 'Fashion Weekend Deal', titleAr: 'عرض أزياء نهاية الأسبوع', discount: 30, startDate: new Date(now.getTime() - 6 * 60 * 60 * 1000), endDate: new Date(now.getTime() + 18 * 60 * 60 * 1000), isActive: true },
        { title: 'Beauty Flash Offer', titleAr: 'عرض الجمال السريع', discount: 25, startDate: new Date(now.getTime() + 24 * 60 * 60 * 1000), endDate: new Date(now.getTime() + 48 * 60 * 60 * 1000), isActive: true },
        { title: 'Ramadan Special', titleAr: 'عرض رمضان الخاص', discount: 50, startDate: new Date(now.getTime() - 12 * 60 * 60 * 1000), endDate: new Date(now.getTime() + 12 * 60 * 60 * 1000), isActive: true },
      ],
    });

    // ─── COUPONS ──────────────────────────────────────────────────────────────────
    await db.coupon.createMany({
      data: [
        { code: 'WELCOME10', discount: 10, type: 'percentage', minOrder: 50, maxDiscount: 25, usageLimit: 1000, usedCount: 234, storeId: null, isActive: true, expiresAt: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000) },
        { code: 'TECH20', discount: 20, type: 'percentage', minOrder: 100, maxDiscount: 50, usageLimit: 500, usedCount: 78, storeId: stores[0].id, isActive: true, expiresAt: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000) },
        { code: 'FLAT15', discount: 15, type: 'fixed', minOrder: 75, usageLimit: 2000, usedCount: 890, storeId: null, isActive: true, expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) },
        { code: 'BEAUTY25', discount: 25, type: 'percentage', minOrder: 60, maxDiscount: 40, usageLimit: 300, usedCount: 45, storeId: stores[3].id, isActive: true, expiresAt: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000) },
        { code: 'RAMADAN30', discount: 30, type: 'percentage', minOrder: 100, maxDiscount: 75, usageLimit: 500, usedCount: 312, storeId: null, isActive: true, expiresAt: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000) },
        { code: 'DUBAI50', discount: 50, type: 'fixed', minOrder: 200, usageLimit: 100, usedCount: 23, storeId: stores[0].id, isActive: true, expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) },
      ],
    });

    // ─── AUCTIONS ─────────────────────────────────────────────────────────────────
    if (allProducts.length >= 10) {
      await db.auction.createMany({
        data: [
          { productId: allProducts[3].id, startPrice: 400.0, currentPrice: 520.0, reservePrice: 500.0, startTime: new Date(now.getTime() - 24 * 60 * 60 * 1000), endTime: new Date(now.getTime() + 48 * 60 * 60 * 1000), status: 'active', bidCount: 12 },
          { productId: allProducts[8].id, startPrice: 600.0, currentPrice: 750.0, reservePrice: 700.0, startTime: new Date(now.getTime() - 12 * 60 * 60 * 1000), endTime: new Date(now.getTime() + 36 * 60 * 60 * 1000), status: 'active', bidCount: 8 },
          { productId: allProducts[9].id, startPrice: 300.0, currentPrice: 300.0, reservePrice: 350.0, startTime: new Date(now.getTime() + 24 * 60 * 60 * 1000), endTime: new Date(now.getTime() + 72 * 60 * 60 * 1000), status: 'upcoming', bidCount: 0 },
          { productId: allProducts[1].id, startPrice: 150.0, currentPrice: 220.0, startTime: new Date(now.getTime() - 72 * 60 * 60 * 1000), endTime: new Date(now.getTime() - 12 * 60 * 60 * 1000), status: 'ended', bidCount: 15, winnerId: buyer2.id },
          { productId: allProducts[12].id, startPrice: 80.0, currentPrice: 145.0, reservePrice: 120.0, startTime: new Date(now.getTime() - 6 * 60 * 60 * 1000), endTime: new Date(now.getTime() + 18 * 60 * 60 * 1000), status: 'active', bidCount: 22 },
        ],
      });
    }

    // ─── APPS ─────────────────────────────────────────────────────────────────────
    await db.app.createMany({
      data: [
        { name: 'NexaShop Manager', nameAr: 'مدير نكسا شوب', description: 'Manage your store, orders, and inventory on the go.', descriptionAr: 'أدر متجرك وطلباتك ومخزونك أثناء التنقل.', icon: '/apps/nexashop.png', category: 'Business', developer: 'NexaMart Inc.', rating: 4.5, installs: 25000, price: 0, isFree: true },
        { name: 'Price Tracker Pro', nameAr: 'متتبع الأسعار برو', description: 'Track prices across multiple stores and get alerts when prices drop.', descriptionAr: 'تتبع الأسعار عبر متاجر متعددة واحصل على تنبيهات عند انخفاض الأسعار.', icon: '/apps/price-tracker.png', category: 'Shopping', developer: 'DealFinder Labs', rating: 4.3, installs: 18000, price: 0, isFree: true },
        { name: 'Inventory AI', nameAr: 'ذكاء المخزون', description: 'AI-powered inventory management with demand forecasting.', descriptionAr: 'إدارة المخزون بالذكاء الاصطناعي مع التنبؤ بالطلب.', icon: '/apps/inventory-ai.png', category: 'Business', developer: 'SmartCommerce', rating: 4.7, installs: 8500, price: 9.99, isFree: false },
        { name: 'Review Analyzer', nameAr: 'محلل التقييمات', description: 'Analyze customer reviews with AI to improve your products.', descriptionAr: 'حلل تقييمات العملاء بالذكاء الاصطناعي لتحسين منتجاتك.', icon: '/apps/review-analyzer.png', category: 'Analytics', developer: 'InsightAI', rating: 4.1, installs: 5200, price: 4.99, isFree: false },
        { name: 'Social Seller Hub', nameAr: 'مركز البائع الاجتماعي', description: 'Connect your store to social media and manage sales channels.', descriptionAr: 'اربط متجرك بوسائل التواصل الاجتماعي وأدر قنوات البيع.', icon: '/apps/social-seller.png', category: 'Marketing', developer: 'SocialMart', rating: 4.4, installs: 12000, price: 0, isFree: true },
        { name: 'Shipping Optimizer', nameAr: 'محسن الشحن', description: 'Find the best shipping rates and routes for your deliveries.', descriptionAr: 'ابحث عن أفضل أسعار الشحن والمسارات لتوصيلاتك.', icon: '/apps/shipping-opt.png', category: 'Logistics', developer: 'LogiTech Solutions', rating: 4.0, installs: 6700, price: 0, isFree: true },
        { name: 'Halal Commerce Suite', nameAr: 'حزمة التجارة الحلال', description: 'Islamic commerce compliance tools. Verify halal certification and manage Sharia-compliant transactions.', descriptionAr: 'أدوات الامتثال التجاري الإسلامي. تحقق من شهادات الحلال وأدر المعاملات المتوافقة مع الشريعة.', icon: '/apps/halal-suite.png', category: 'Business', developer: 'HalalTech', rating: 4.8, installs: 15000, price: 14.99, isFree: false },
      ],
    });

    // ─── CHAT MESSAGES ────────────────────────────────────────────────────────────
    await db.chatMessage.createMany({
      data: [
        { senderId: user.id, receiverId: seller.id, message: 'Hi, is the Smart Watch Ultra still available?', isRead: true },
        { senderId: seller.id, receiverId: user.id, message: 'Yes it is! We have it in Titanium, Black, and Orange. Which color would you prefer?', isRead: true },
        { senderId: user.id, receiverId: seller.id, message: 'I would like the Black one in 46mm. Does it come with a warranty?', isRead: false },
        { senderId: buyer2.id, receiverId: seller3.id, message: 'Hello, can you provide more details about the Espresso Machine?', isRead: false },
        { senderId: buyer3.id, receiverId: seller4.id, message: 'Salaam! Do you have the Royal Oud in the 100ml size?', isRead: true },
        { senderId: seller4.id, receiverId: buyer3.id, message: 'Wa alaikum salaam! Yes, we have it in stock. Would you like to place an order?', isRead: false },
        { senderId: buyer2.id, receiverId: seller.id, message: 'What is the warranty coverage on the 4K Camera?', isRead: false },
        { senderId: buyer4.id, receiverId: seller3.id, message: 'Hi, when will the Emirati Dates be back in stock?', isRead: false },
      ],
    });

    // ─── CARS ─────────────────────────────────────────────────────────────────────
    await db.car.createMany({
      data: [
        { title: 'Toyota Camry 2023 - Excellent Condition', titleAr: 'تويوتا كامري 2023 - حالة ممتازة', description: 'Well-maintained Toyota Camry 2023 with full service history. One owner, no accidents.', descriptionAr: 'تويوتا كامري 2023 صيانة كاملة، مالك واحد، بدون حوادث.', price: 24500, year: 2023, make: 'Toyota', model: 'Camry', trim: 'XSE', mileage: 18000, fuelType: 'gasoline', transmission: 'automatic', bodyType: 'sedan', condition: 'used', color: 'Pearl White', images: '["/cars/camry-1.jpg"]', city: 'Dubai', country: 'UAE', sellerId: seller.id, storeId: stores[0].id, status: 'active', isFeatured: true, views: 342 },
        { title: 'BMW X5 2022 - Luxury SUV', titleAr: 'بي إم دبليو X5 2022 - SUV فاخر', description: 'Premium BMW X5 with M Sport package. Panoramic roof, heads-up display, and Harman Kardon sound system.', descriptionAr: 'بي إم دبليو X5 باقة M الرياضية. سقف بانورامي ونظام صوت Harman Kardon.', price: 52000, year: 2022, make: 'BMW', model: 'X5', trim: 'M Sport', mileage: 32000, fuelType: 'gasoline', transmission: 'automatic', bodyType: 'suv', condition: 'used', color: 'Carbon Black', images: '["/cars/bmw-x5-1.jpg"]', city: 'Riyadh', country: 'Saudi Arabia', sellerId: seller.id, storeId: stores[0].id, status: 'active', isFeatured: true, views: 567 },
        { title: 'Mercedes C-Class 2024 - Brand New', titleAr: 'مرسيدس سي كلاس 2024 - جديدة', description: 'Brand new Mercedes C300 with AMG Line. Advanced driver assistance and MBUX infotainment.', descriptionAr: 'مرسيدس C300 جديدة بخط AMG. مساعد سائق متقدم ونظام ترفيه MBUX.', price: 48000, year: 2024, make: 'Mercedes-Benz', model: 'C-Class', trim: 'C300 AMG Line', mileage: 500, fuelType: 'gasoline', transmission: 'automatic', bodyType: 'sedan', condition: 'new', color: 'Obsidian Black', images: '["/cars/mercedes-c-1.jpg"]', city: 'Amman', country: 'Jordan', sellerId: seller2.id, storeId: stores[1].id, status: 'active', isFeatured: true, views: 789 },
        { title: 'Honda Civic 2021 - Reliable Daily Driver', titleAr: 'هوندا سيفيك 2021 - سيارة يومية موثوقة', description: 'Reliable Honda Civic with sporty looks. Great fuel economy, Honda Sensing safety suite.', descriptionAr: 'هوندا سيفيك موثوقة بمظهر رياضي. اقتصاد وقود ممتاز.', price: 16500, year: 2021, make: 'Honda', model: 'Civic', trim: 'Sport', mileage: 45000, fuelType: 'gasoline', transmission: 'automatic', bodyType: 'sedan', condition: 'used', color: 'Rallye Red', images: '["/cars/civic-1.jpg"]', city: 'Baghdad', country: 'Iraq', sellerId: seller.id, status: 'active', views: 234 },
        { title: 'Tesla Model 3 2023 - Electric', titleAr: 'تيسلا موديل 3 2023 - كهربائية', description: 'Tesla Model 3 Long Range with Autopilot. Supercharger network access and zero emissions.', descriptionAr: 'تيسلا موديل 3 طويلة المدى مع القيادة الذاتية. وصول لشبكة Supercharger.', price: 38500, year: 2023, make: 'Tesla', model: 'Model 3', trim: 'Long Range', mileage: 12000, fuelType: 'electric', transmission: 'automatic', bodyType: 'sedan', condition: 'used', color: 'Midnight Silver', images: '["/cars/tesla-3-1.jpg"]', city: 'Dubai', country: 'UAE', sellerId: seller2.id, storeId: stores[1].id, status: 'active', isFeatured: true, views: 923 },
        { title: 'Nissan Patrol 2023 - Desert Ready', titleAr: 'نيسان باترول 2023 - جاهز للصحراء', description: 'Nissan Patrol V8 with off-road package. Full service history, never been in sand dunes. GCC specs.', descriptionAr: 'نيسان باترول V8 مع حزمة الطرق الوعرة. تاريخ صيانة كامل، مواصفات الخليج.', price: 42000, year: 2023, make: 'Nissan', model: 'Patrol', trim: 'LE V8', mileage: 25000, fuelType: 'gasoline', transmission: 'automatic', bodyType: 'suv', condition: 'used', color: 'Sand Beige', images: '["/cars/patrol-1.jpg"]', city: 'Kuwait City', country: 'Kuwait', sellerId: seller3.id, storeId: stores[2].id, status: 'active', isFeatured: true, views: 678 },
        { title: 'Toyota Land Cruiser 2022', titleAr: 'تويوتا لاند كروزر 2022', description: 'Iconic Land Cruiser with full options. White exterior, beige leather interior. One owner, GCC specs.', descriptionAr: 'لاند كروزر الأيقوني بكل الخيارات. خارجي أبيض وداخلي جلد بيج. مالك واحد.', price: 55000, year: 2022, make: 'Toyota', model: 'Land Cruiser', trim: 'VXR', mileage: 28000, fuelType: 'diesel', transmission: 'automatic', bodyType: 'suv', condition: 'used', color: 'Super White', images: '["/cars/landcruiser-1.jpg"]', city: 'Muscat', country: 'Oman', sellerId: seller5.id, status: 'active', isFeatured: true, views: 1100 },
      ],
    });

    // ─── PROPERTIES ───────────────────────────────────────────────────────────────
    await db.property.createMany({
      data: [
        { title: 'Luxury 2BR Apartment in Dubai Marina', titleAr: 'شقة فاخرة غرفتين في دبي مارينا', description: 'Stunning 2-bedroom apartment with full sea view in Dubai Marina. High floor, modern finishes.', descriptionAr: 'شقة غرفتين مذهلة بإطلالة بحرية كاملة في دبي مارينا.', price: 185000, listingType: 'sale', propertyType: 'apartment', bedrooms: 2, bathrooms: 2, area: 120, isFurnished: true, city: 'Dubai', country: 'UAE', address: 'Dubai Marina Walk, Tower A, Floor 35', images: '["/properties/dubai-marina-1.jpg"]', agentName: 'Mohammed Al-Fahim', agentPhone: '+971501234567', isVerifiedAgent: true, sellerId: seller.id, storeId: stores[0].id, status: 'active', isFeatured: true, views: 1245 },
        { title: 'Modern 3BR Villa in Riyadh', titleAr: 'فيلا حديثة 3 غرف في الرياض', description: 'Spacious 3-bedroom villa in Al Nakheel district with private garden and maid room.', descriptionAr: 'فيلا واسعة 3 غرف في حي النخيل مع حديقة خاصة وغرفة خادمة.', price: 950000, listingType: 'sale', propertyType: 'villa', bedrooms: 3, bathrooms: 3, area: 350, isFurnished: false, city: 'Riyadh', country: 'Saudi Arabia', address: 'Al Nakheel District, Street 15', images: '["/properties/riyadh-villa-1.jpg"]', agentName: 'Abdullah Al-Salem', agentPhone: '+966509876543', isVerifiedAgent: true, sellerId: seller2.id, storeId: stores[1].id, status: 'active', isFeatured: true, views: 876 },
        { title: 'Cozy Studio for Rent in Amman', titleAr: 'استوديو مريح للإيجار في عمّان', description: 'Modern studio apartment in Abdoun area. Fully furnished with kitchen appliances and AC.', descriptionAr: 'استوديو حديث في منطقة عبدون. مفروش بالكامل مع أجهزة مطبخ وتكييف.', price: 650, listingType: 'rent', propertyType: 'apartment', bedrooms: 1, bathrooms: 1, area: 55, isFurnished: true, city: 'Amman', country: 'Jordan', address: 'Abdoun, Building 23, Floor 4', images: '["/properties/amman-studio-1.jpg"]', agentName: 'Lina Haddad', agentPhone: '+962795551234', isVerifiedAgent: false, sellerId: seller3.id, storeId: stores[2].id, status: 'active', views: 432 },
        { title: 'Commercial Office Space in Baghdad', titleAr: 'مكتب تجاري في بغداد', description: 'Prime commercial office space in Karrada district. 200 sqm, fully equipped with internet and parking.', descriptionAr: 'مكتب تجاري مميز في الكرادة. 200 متر مربع، مجهز بالكامل.', price: 2500, listingType: 'rent', propertyType: 'commercial', bedrooms: null, bathrooms: 2, area: 200, isFurnished: true, city: 'Baghdad', country: 'Iraq', address: 'Karrada Main Street, Tower 7, Floor 8', images: '["/properties/baghdad-office-1.jpg"]', agentName: 'Ali Al-Jabri', agentPhone: '+9647701122334', isVerifiedAgent: true, sellerId: seller.id, storeId: stores[0].id, status: 'active', views: 198 },
        { title: 'Luxury Penthouse in Doha', titleAr: 'بنتهاوس فاخر في الدوحة', description: 'Exclusive penthouse with panoramic views of West Bay. 4 bedrooms, private terrace, and concierge service.', descriptionAr: 'بنتهاوس حصري بإطلالات بانورامية على الخليج الغربي. 4 غرف وتراس خاص.', price: 3200000, listingType: 'sale', propertyType: 'apartment', bedrooms: 4, bathrooms: 4, area: 380, isFurnished: true, city: 'Doha', country: 'Qatar', address: 'West Bay, The Pearl, Tower 12', images: '["/properties/doha-penthouse-1.jpg"]', agentName: 'Khalid Al-Thani', agentPhone: '+97455551234', isVerifiedAgent: true, sellerId: seller.id, storeId: stores[0].id, status: 'active', isFeatured: true, views: 2310 },
        { title: 'Furnished Apartment in Cairo', titleAr: 'شقة مفروشة في القاهرة', description: 'Beautiful 2-bedroom furnished apartment in Zamalek. Nile view, balcony, and modern amenities.', descriptionAr: 'شقة مفروشة جميلة غرفتين في الزمالك. إطلالة على النيل وشرفة.', price: 1200, listingType: 'rent', propertyType: 'apartment', bedrooms: 2, bathrooms: 2, area: 140, isFurnished: true, city: 'Cairo', country: 'Egypt', address: 'Zamalek, 26 July Street', images: '["/properties/cairo-apt-1.jpg"]', agentName: 'Hassan Mahmoud', agentPhone: '+201001234567', isVerifiedAgent: true, sellerId: seller4.id, storeId: stores[3].id, status: 'active', isFeatured: false, views: 345 },
      ],
    });

    // ─── CLASSIFIEDS ──────────────────────────────────────────────────────────────
    await db.classified.createMany({
      data: [
        { title: 'IKEA Sofa Set - Like New', titleAr: 'طقم أريكة إيكيا - كالجديدة', description: '3-piece IKEA sofa set in beige fabric. Less than 6 months old, moving sale.', descriptionAr: 'طقم أريكة إيكيا 3 قطع بقماش بيج. عمرها أقل من 6 أشهر، بيع بسبب الانتقال.', price: 450, categoryId: categories[2].id, condition: 'used', city: 'Dubai', country: 'UAE', images: '["/classifieds/sofa-1.jpg"]', contactPhone: '+971501234567', sellerId: user.id, status: 'active', isFeatured: true, views: 156, expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) },
        { title: 'Samsung 65" Smart TV', titleAr: 'تلفزيون سامسونج 65 بوصة ذكي', description: 'Samsung QLED 65-inch Smart TV, 4K resolution. Comes with wall mount.', descriptionAr: 'تلفزيون سامسونج QLED 65 بوصة ذكي، دقة 4K. يأتي مع حائط.', price: 380, categoryId: categories[0].id, condition: 'used', city: 'Riyadh', country: 'Saudi Arabia', images: '["/classifieds/tv-1.jpg"]', contactPhone: '+966509876543', sellerId: buyer2.id, status: 'active', views: 89, expiresAt: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000) },
        { title: 'iPhone 14 Pro Max 256GB', titleAr: 'آيفون 14 برو ماكس 256 جيجا', description: 'Unlocked iPhone 14 Pro Max in Deep Purple. Battery health 94%.', descriptionAr: 'آيفون 14 برو ماكس مفتوح بلون بنفسجي غامق. صحة البطارية 94%.', price: 750, categoryId: categories[0].id, condition: 'used', city: 'Amman', country: 'Jordan', images: '["/classifieds/iphone-1.jpg"]', contactPhone: '+962795551234', sellerId: user.id, status: 'active', isFeatured: true, views: 312, expiresAt: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000) },
        { title: 'Office Desk with Chair', titleAr: 'مكتب عمل مع كرسي', description: 'Large L-shaped office desk with ergonomic chair. Perfect for home office.', descriptionAr: 'مكتب عمل كبير بشكل L مع كرسي مريح. مثالي لمكتب منزلي.', price: 220, categoryId: categories[2].id, condition: 'new', city: 'Baghdad', country: 'Iraq', images: '["/classifieds/desk-1.jpg"]', contactPhone: '+9647701122334', sellerId: seller3.id, status: 'active', views: 67, expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) },
        { title: 'PlayStation 5 with 3 Games', titleAr: 'بلايستيشن 5 مع 3 ألعاب', description: 'PS5 Disc Edition with Spider-Man 2, God of War Ragnarok, and FIFA 24.', descriptionAr: 'بلايستيشن 5 نسخة القرص مع Spider-Man 2 وGod of War Ragnarok وFIFA 24.', price: 520, categoryId: categories[5].id, condition: 'used', city: 'Dubai', country: 'UAE', images: '["/classifieds/ps5-1.jpg"]', contactPhone: '+971509876543', sellerId: buyer2.id, status: 'active', isFeatured: true, views: 245, expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) },
        { title: 'Arabic Darbuka Drum', titleAr: 'طبلة دربكة عربية', description: 'Handcrafted Egyptian darbuka with mother-of-pearl inlay. Professional quality sound.', descriptionAr: 'دربكة مصرية مصنوعة يدوياً بترصيع من أم اللؤلؤ. جودة صوت احترافية.', price: 85, categoryId: categories[7].id, condition: 'new', city: 'Cairo', country: 'Egypt', images: '["/classifieds/darbuka-1.jpg"]', contactPhone: '+201009998877', sellerId: buyer3.id, status: 'active', views: 54, expiresAt: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000) },
      ],
    });

    // ─── JOBS ─────────────────────────────────────────────────────────────────────
    await db.job.createMany({
      data: [
        { title: 'Senior Software Engineer', titleAr: 'مهندس برمجيات أول', description: 'We are looking for a Senior Software Engineer to join our growing team. You will work on building scalable microservices.', descriptionAr: 'نبحث عن مهندس برمجيات أول للانضمام لفريقنا.', company: 'NexaTech Solutions', companyLogo: '/companies/nexatech.png', location: 'Dubai Internet City', city: 'Dubai', country: 'UAE', type: 'full-time', salaryMin: 8000, salaryMax: 14000, currency: 'AED', experienceLevel: 'senior', skills: '["Node.js","TypeScript","AWS","Docker","PostgreSQL"]', category: 'Engineering', contactEmail: 'careers@nexatech.ae', posterId: seller.id, status: 'active', isFeatured: true, views: 567 },
        { title: 'Marketing Manager', titleAr: 'مدير تسويق', description: 'Seeking an experienced Marketing Manager to lead our digital marketing efforts across the MENA region.', descriptionAr: 'نبحث عن مدير تسويق ذو خبرة لقيادة جهود التسويق الرقمي في منطقة الشرق الأوسط.', company: 'Gulf Brands Group', companyLogo: '/companies/gulf-brands.png', location: 'King Fahd Road', city: 'Riyadh', country: 'Saudi Arabia', type: 'full-time', salaryMin: 12000, salaryMax: 18000, currency: 'SAR', experienceLevel: 'mid', skills: '["Digital Marketing","SEO","Social Media","Content Strategy"]', category: 'Marketing', contactEmail: 'hr@gulfbrands.sa', posterId: seller2.id, status: 'active', isFeatured: true, views: 423 },
        { title: 'Accountant', titleAr: 'محاسب', description: 'Join our finance team as an Accountant. Responsibilities include preparing financial statements.', descriptionAr: 'انضم لفريقنا المالي كمحاسب. تشمل المسؤوليات إعداد البيانات المالية.', company: 'Al-Rashid Trading Co.', companyLogo: '/companies/al-rashid.png', location: 'Sharq District', city: 'Kuwait City', country: 'Kuwait', type: 'full-time', salaryMin: 2000, salaryMax: 3500, currency: 'KWD', experienceLevel: 'mid', skills: '["Accounting","Excel","IFRS","SAP"]', category: 'Finance', contactEmail: 'jobs@alrashid.kw', posterId: seller3.id, status: 'active', views: 234 },
        { title: 'UX/UI Designer - Remote', titleAr: 'مصمم UX/UI - عن بعد', description: 'Looking for a talented UX/UI Designer to create beautiful and intuitive interfaces.', descriptionAr: 'نبحث عن مصمم UX/UI موهوب لإنشاء واجهات جميلة وبديهية.', company: 'CreativePixel Agency', companyLogo: '/companies/creativepixel.png', location: 'Remote', city: 'Amman', country: 'Jordan', type: 'remote', salaryMin: 1500, salaryMax: 3000, currency: 'JOD', experienceLevel: 'mid', skills: '["Figma","Adobe XD","User Research","Prototyping"]', category: 'Design', contactEmail: 'design@creativepixel.jo', posterId: seller4.id, status: 'active', isFeatured: true, views: 389 },
        { title: 'Sales Associate - Part Time', titleAr: 'مندوب مبيعات - دوام جزئي', description: 'Part-time Sales Associate position at our electronics store.', descriptionAr: 'وظيفة مندوب مبيعات بدوام جزئي في متجر الإلكترونيات.', company: 'TechZone Retail', companyLogo: '/companies/techzone.png', location: 'Mansour District', city: 'Baghdad', country: 'Iraq', type: 'part-time', salaryMin: 500, salaryMax: 800, currency: 'USD', experienceLevel: 'entry', skills: '["Sales","Customer Service","Communication"]', category: 'Sales', contactEmail: 'hr@techzone.iq', posterId: seller5.id, status: 'active', views: 156 },
        { title: 'Arabic Content Writer - Freelance', titleAr: 'كاتب محتوى عربي - حر', description: 'Freelance Arabic content writer needed for e-commerce product descriptions and blog articles.', descriptionAr: 'مطلوب كاتب محتوى عربي حر لكتابة وصف المنتجات والمقالات.', company: 'NexaMart Content', companyLogo: '/companies/nexamart.png', location: 'Remote', city: 'Cairo', country: 'Egypt', type: 'freelance', salaryMin: 15, salaryMax: 30, currency: 'USD', experienceLevel: 'mid', skills: '["Arabic Writing","SEO","Content Strategy","E-commerce"]', category: 'Content', contactEmail: 'content@nexamart.com', posterId: admin.id, status: 'active', isFeatured: true, views: 678 },
      ],
    });

    // ─── SERVICES ─────────────────────────────────────────────────────────────────
    await db.service.createMany({
      data: [
        { title: 'Professional Home Cleaning', titleAr: 'تنظيف منزلي احترافي', description: 'Deep cleaning service for apartments and villas. Trained staff uses eco-friendly products.', descriptionAr: 'خدمة تنظيف عميقة للشقق والفلل. فريق مدرب يستخدم منتجات صديقة للبيئة.', price: 45, priceUnit: 'visit', category: 'Cleaning', providerName: 'CleanPro Team', providerAvatar: '/providers/cleanpro.png', rating: 4.8, reviewCount: 234, location: 'Dubai Marina & JBR', city: 'Dubai', country: 'UAE', isAvailableToday: true, isVerified: true, providerId: seller.id, status: 'active', isFeatured: true, views: 456 },
        { title: 'AC Maintenance & Repair', titleAr: 'صيانة وإصلاح مكيفات', description: 'Expert AC maintenance and repair service. We handle all brands and models. Same-day emergency service.', descriptionAr: 'خدمة صيانة وإصلاح مكيفات خبيرة. نتعامل مع جميع الماركات. خدمة طوارئ يومية.', price: 35, priceUnit: 'visit', category: 'Maintenance', providerName: 'CoolAir Services', providerAvatar: '/providers/coolair.png', rating: 4.5, reviewCount: 156, location: 'All Riyadh districts', city: 'Riyadh', country: 'Saudi Arabia', isAvailableToday: true, isVerified: true, providerId: seller3.id, status: 'active', isFeatured: true, views: 321 },
        { title: 'Private Math Tutoring', titleAr: 'دروس خصوصية في الرياضيات', description: 'One-on-one math tutoring for students from grade 6 to university level. Online or in-person.', descriptionAr: 'دروس خصوصية في الرياضيات من الصف السادس حتى المستوى الجامعي.', price: 25, priceUnit: 'hour', category: 'Education', providerName: 'Dr. Sarah Khalil', providerAvatar: '/providers/sarah.png', rating: 4.9, reviewCount: 89, location: 'Online & Abdoun Area', city: 'Amman', country: 'Jordan', isAvailableToday: false, isVerified: true, providerId: seller4.id, status: 'active', views: 198 },
        { title: 'Plumbing Services', titleAr: 'خدمات سباكة', description: 'Professional plumbing services for residential and commercial properties. Available 24/7 for emergencies.', descriptionAr: 'خدمات سباكة احترافية للمنازل والممتلكات التجارية. متاح على مدار الساعة للطوارئ.', price: 30, priceUnit: 'visit', category: 'Maintenance', providerName: 'FixIt Plumbing', providerAvatar: '/providers/fixit.png', rating: 4.3, reviewCount: 67, location: 'Baghdad & Erbil', city: 'Baghdad', country: 'Iraq', isAvailableToday: true, isVerified: false, providerId: seller5.id, status: 'active', views: 145 },
        { title: 'Wedding Photography', titleAr: 'تصوير أفراح', description: 'Professional wedding photography and videography. Capture your special day with stunning cinematic quality.', descriptionAr: 'تصوير وفيديو أفراح احترافي. التقط يومك الخاص بجودة سينمائية مذهلة.', price: 500, priceUnit: 'service', category: 'Photography', providerName: 'LensArt Studios', providerAvatar: '/providers/lensart.png', rating: 4.9, reviewCount: 45, location: 'All Qatar', city: 'Doha', country: 'Qatar', isAvailableToday: false, isVerified: true, providerId: seller2.id, status: 'active', isFeatured: true, views: 567 },
        { title: 'Henna Art Services', titleAr: 'خدمات نقش الحناء', description: 'Beautiful traditional and modern henna designs for weddings, Eid, and special occasions. Home service available.', descriptionAr: 'تصاميم حناء تقليدية وعصرية جميلة للأعراس والعيد والمناسبات الخاصة.', price: 50, priceUnit: 'visit', category: 'Beauty', providerName: 'HennaByLayla', providerAvatar: '/providers/henna.png', rating: 4.7, reviewCount: 112, location: 'Jeddah & Makkah', city: 'Jeddah', country: 'Saudi Arabia', isAvailableToday: true, isVerified: true, providerId: seller4.id, status: 'active', isFeatured: true, views: 389 },
      ],
    });

    // ─── RETURNS ──────────────────────────────────────────────────────────────────
    if (orders.length >= 6 && allProducts.length >= 6) {
      await db.return.createMany({
        data: [
          { orderId: orders[0].id, productId: allProducts[0].id, buyerId: user.id, sellerId: seller.id, quantity: 1, refundAmount: 89.99, reason: 'defective', details: 'Left earphone stopped working after 2 weeks of use.', resolution: 'refund', status: 'approved', sellerNote: 'Sorry about the issue. Full refund approved.', timeline: '[{"status":"pending","date":"2024-01-15","note":"Return request submitted"},{"status":"approved","date":"2024-01-16","note":"Seller approved return"}]' },
          { orderId: orders[3].id, productId: allProducts[4].id, buyerId: user.id, sellerId: seller4.id, quantity: 1, refundAmount: 79.99, reason: 'not_as_described', details: 'Product listing said organic, but the label shows synthetic preservatives.', resolution: 'exchange', status: 'pending', timeline: '[{"status":"pending","date":"2024-01-20","note":"Return request submitted"}]' },
          { orderId: orders[4].id, productId: allProducts[5].id, buyerId: buyer2.id, sellerId: seller.id, quantity: 1, refundAmount: 149.99, reason: 'changed_mind', details: 'Decided to go with a different keyboard layout. Product is unopened.', resolution: 'refund', status: 'processing', sellerNote: 'Return accepted. Processing refund.', timeline: '[{"status":"pending","date":"2024-01-22","note":"Return request submitted"},{"status":"processing","date":"2024-01-23","note":"Seller accepted return, refund being processed"}]' },
          { orderId: orders[6].id, productId: allProducts[12].id, buyerId: buyer3.id, sellerId: seller4.id, quantity: 1, refundAmount: 129.99, reason: 'damaged_shipping', details: 'Perfume bottle arrived cracked. The liquid had leaked inside the packaging.', resolution: 'exchange', status: 'approved', sellerNote: 'We apologize. Replacement will be shipped immediately.', timeline: '[{"status":"pending","date":"2024-02-01","note":"Return request submitted"},{"status":"approved","date":"2024-02-01","note":"Seller approved replacement"}]' },
        ],
      });
    }

    // ─── PRICE ALERTS ─────────────────────────────────────────────────────────────
    if (allProducts.length >= 5) {
      await db.priceAlert.createMany({
        data: [
          { userId: user.id, productId: allProducts[1].id, targetPrice: 199.99, currentPrice: 249.99, isActive: true, isNotified: false, expiresAt: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000) },
          { userId: user.id, productId: allProducts[3].id, targetPrice: 499.99, currentPrice: 599.99, isActive: true, isNotified: false, expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) },
          { userId: buyer2.id, productId: allProducts[0].id, targetPrice: 69.99, currentPrice: 89.99, isActive: true, isNotified: false, expiresAt: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000) },
          { userId: buyer3.id, productId: allProducts[12].id, targetPrice: 99.99, currentPrice: 129.99, isActive: true, isNotified: false, expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) },
        ],
      });
    }

    // ─── INVOICES ─────────────────────────────────────────────────────────────────
    if (orders.length >= 6) {
      await db.invoice.createMany({
        data: [
          { orderId: orders[0].id, invoiceNumber: 'INV-001', sellerId: seller.id, buyerId: user.id, subtotal: 89.99, shipping: 0, discount: 10, tax: 6.30, total: 86.29, paymentMethod: 'credit_card', status: 'paid', dueDate: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000) },
          { orderId: orders[1].id, invoiceNumber: 'INV-002', sellerId: seller2.id, buyerId: user.id, subtotal: 199.99, shipping: 0, discount: 0, tax: 14.00, total: 213.99, paymentMethod: 'wallet', status: 'paid', dueDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000) },
          { orderId: orders[2].id, invoiceNumber: 'INV-003', sellerId: seller.id, buyerId: user.id, subtotal: 249.99, shipping: 0, discount: 25, tax: 15.75, total: 240.74, paymentMethod: 'credit_card', status: 'paid', dueDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000) },
          { orderId: orders[3].id, invoiceNumber: 'INV-004', sellerId: seller4.id, buyerId: user.id, subtotal: 79.99, shipping: 5.99, discount: 0, tax: 5.60, total: 91.58, paymentMethod: 'zain_cash', status: 'unpaid', dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) },
          { orderId: orders[4].id, invoiceNumber: 'INV-005', sellerId: seller.id, buyerId: buyer2.id, subtotal: 149.99, shipping: 0, discount: 15, tax: 9.45, total: 144.44, paymentMethod: 'credit_card', status: 'paid', dueDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) },
          { orderId: orders[6].id, invoiceNumber: 'INV-006', sellerId: seller4.id, buyerId: buyer3.id, subtotal: 129.99, shipping: 0, discount: 0, tax: 9.10, total: 139.09, paymentMethod: 'apple_pay', status: 'paid', dueDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000) },
          { orderId: orders[7].id, invoiceNumber: 'INV-007', sellerId: seller.id, buyerId: buyer3.id, subtotal: 599.99, shipping: 0, discount: 0, tax: 42.00, total: 641.99, paymentMethod: 'credit_card', status: 'overdue', dueDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000) },
        ],
      });
    }

    // ─── PAYOUTS ──────────────────────────────────────────────────────────────────
    await db.payout.createMany({
      data: [
        { sellerId: seller.id, storeId: stores[0].id, amount: 1250.0, method: 'bank_transfer', status: 'completed', requestedAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000), processedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), notes: 'Monthly payout - January 2025' },
        { sellerId: seller.id, storeId: stores[0].id, amount: 890.50, method: 'bank_transfer', status: 'processing', requestedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), notes: 'Monthly payout - February 2025' },
        { sellerId: seller2.id, storeId: stores[1].id, amount: 675.0, method: 'wallet', status: 'pending', requestedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), notes: 'Payout request - pending review' },
        { sellerId: seller3.id, storeId: stores[2].id, amount: 340.0, method: 'bank_transfer', status: 'completed', requestedAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000), processedAt: new Date(now.getTime() - 17 * 24 * 60 * 60 * 1000), notes: 'Monthly payout - January 2025' },
        { sellerId: seller4.id, storeId: stores[3].id, amount: 920.0, method: 'wallet', status: 'pending', requestedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), notes: 'Payout request - pending review' },
      ],
    });

    // ─── DISPUTES ─────────────────────────────────────────────────────────────────
    if (orders.length >= 5) {
      await db.dispute.createMany({
        data: [
          { orderId: orders[2].id, buyerId: user.id, sellerId: seller.id, reason: 'Item not as described - Smart Watch Ultra arrived with scratched screen', description: 'I received the Smart Watch Ultra yesterday and the screen has visible scratches. Listed as new but appears to be returned/refurbished.', status: 'open', resolution: null, aiSummary: 'Buyer claims product arrived with scratches despite being listed as new. Recommend requesting photos from buyer.' },
          { orderId: orders[3].id, buyerId: user.id, sellerId: seller4.id, reason: 'Payment processed but order still pending after 7 days', description: 'Order placed 7 days ago with Zain Cash payment. Payment deducted but order status still pending and seller not responding.', status: 'under_review', resolution: null, aiSummary: 'Buyer reports order stuck in pending for 7 days with confirmed payment. Seller non-responsive. Recommend escalating.' },
          { orderId: orders[4].id, buyerId: buyer2.id, sellerId: seller.id, reason: 'Wrong keyboard layout received', description: 'I ordered Arabic layout but received US layout keyboard. Product page clearly showed Arabic layout option.', status: 'resolved', resolution: 'Seller sent replacement Arabic layout keyboard at no additional cost. Buyer confirmed receipt.', aiSummary: 'Buyer received wrong product variation. Seller promptly resolved by sending replacement. Case closed.' },
        ],
      });
    }

    // ─── STAFF ────────────────────────────────────────────────────────────────────
    await db.staff.createMany({
      data: [
        { storeId: stores[0].id, userId: seller2.id, role: 'manager', inviteEmail: 'fashion@nexamart.com', status: 'active' },
        { storeId: stores[0].id, userId: admin.id, role: 'viewer', inviteEmail: 'admin@nexamart.com', status: 'active' },
        { storeId: stores[1].id, userId: seller3.id, role: 'editor', inviteEmail: 'home@nexamart.com', status: 'active' },
        { storeId: stores[3].id, userId: seller5.id, role: 'viewer', inviteEmail: 'sports@nexamart.com', status: 'pending' },
      ],
    });

    // ─── BANNERS ──────────────────────────────────────────────────────────────────
    await db.banner.createMany({
      data: [
        { title: 'Mega Electronics Sale', titleAr: 'تخفيضات الإلكترونيات الكبرى', image: '/banners/electronics-sale.jpg', link: '/deals?category=electronics', position: 'home_top', isActive: true, startDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), endDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) },
        { title: 'Ramadan Collection', titleAr: 'مجموعة رمضان', image: '/banners/ramadan-collection.jpg', link: '/products?tag=ramadan', position: 'home_mid', isActive: true, startDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), endDate: new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000) },
        { title: 'New Arrivals in Fashion', titleAr: 'وصولات جديدة في الأزياء', image: '/banners/fashion-new.jpg', link: '/products?category=fashion&sort=newest', position: 'home_top', isActive: true, startDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), endDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000) },
        { title: 'Eid Al-Fitr Special', titleAr: 'عرض عيد الفطر الخاص', image: '/banners/eid-special.jpg', link: '/deals?tag=eid', position: 'home_mid', isActive: true, startDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), endDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000) },
        { title: 'Arabian Oud Collection', titleAr: 'مجموعة العود العربية', image: '/banners/oud-collection.jpg', link: '/products?tag=oud', position: 'product_page', isActive: true, startDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), endDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) },
      ],
    });

    // ─── HELP TICKETS ─────────────────────────────────────────────────────────────
    await db.helpTicket.createMany({
      data: [
        { userId: user.id, subject: 'Cannot update shipping address on order', description: 'I need to change the shipping address for my pending order ORD-004, but the edit button is greyed out.', category: 'orders', status: 'open', priority: 'high' },
        { userId: buyer2.id, subject: 'Refund not received after 10 days', description: 'I returned an item and the seller approved the return, but it has been 10 days and I have not received my refund.', category: 'payments', status: 'in_progress', priority: 'high' },
        { userId: buyer3.id, subject: 'Product images not loading', description: 'When I browse the store on my iPhone, product images take very long to load or show blank.', category: 'technical', status: 'open', priority: 'medium' },
        { userId: buyer4.id, subject: 'How to add multiple addresses?', description: 'I want to add my home and work addresses but can only see one address field. Is it possible to add more?', category: 'account', status: 'resolved', priority: 'low' },
        { userId: seller2.id, subject: 'Commission rate seems incorrect', description: 'My store commission shows 10% but I signed up for the pro plan which should be 8%. Please review.', category: 'billing', status: 'in_progress', priority: 'high' },
      ],
    });

    // ─── STORE REVIEWS ────────────────────────────────────────────────────────────
    await db.storeReview.createMany({
      data: [
        { storeId: stores[0].id, userId: user.id, rating: 5, comment: 'Excellent store! Fast shipping and great customer service. Products always as described.' },
        { storeId: stores[0].id, userId: buyer2.id, rating: 4, comment: 'Good store with quality products. Shipping could be faster to Saudi Arabia.' },
        { storeId: stores[1].id, userId: user.id, rating: 5, comment: 'Best fashion store on NexaMart. Always has the latest trends at great prices.' },
        { storeId: stores[2].id, userId: buyer2.id, rating: 4, comment: 'Solid home essentials store. Products are well-packaged and the return process is smooth.' },
        { storeId: stores[3].id, userId: buyer3.id, rating: 5, comment: 'Amazing oud collection! Authentic Arabian fragrances with fast delivery across the UAE.' },
        { storeId: stores[4].id, userId: buyer2.id, rating: 3, comment: 'Decent sports gear but limited selection. Hoping they expand their inventory soon.' },
      ],
    });

    // ─── FINAL COUNTS ─────────────────────────────────────────────────────────────
    const counts = {
      users: await db.user.count(),
      stores: await db.store.count(),
      categories: await db.category.count(),
      products: await db.product.count(),
      orders: await db.order.count(),
      orderItems: await db.orderItem.count(),
      reviews: await db.review.count(),
      wishlists: await db.wishlist.count(),
      notifications: await db.notification.count(),
      addresses: await db.address.count(),
      platformSettings: await db.platformSettings.count(),
      flashSales: await db.flashSale.count(),
      coupons: await db.coupon.count(),
      auctions: await db.auction.count(),
      apps: await db.app.count(),
      chatMessages: await db.chatMessage.count(),
      cars: await db.car.count(),
      properties: await db.property.count(),
      classifieds: await db.classified.count(),
      jobs: await db.job.count(),
      services: await db.service.count(),
      returns: await db.return.count(),
      priceAlerts: await db.priceAlert.count(),
      invoices: await db.invoice.count(),
      payouts: await db.payout.count(),
      disputes: await db.dispute.count(),
      staff: await db.staff.count(),
      banners: await db.banner.count(),
      helpTickets: await db.helpTicket.count(),
      storeReviews: await db.storeReview.count(),
    };

    return Response.json({ success: true, message: 'Database seeded successfully with comprehensive MENA data', counts });
  } catch (error) {
    console.error('Seed error:', error);
    return Response.json({ success: false, error: String(error) }, { status: 500 });
  }
}
