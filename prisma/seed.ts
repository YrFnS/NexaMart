import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
	const now = new Date();

	// ─── CLEANUP ──────────────────────────────────────────────────────────────────
	await db.auditLog.deleteMany({});
	await db.storeReview.deleteMany({});
	await db.helpTicket.deleteMany({});
	await db.banner.deleteMany({});
	await db.staff.deleteMany({});
	await db.dispute.deleteMany({});
	await db.payout.deleteMany({});
	await db.invoice.deleteMany({});
	await db.priceAlert.deleteMany({});
	await db.return.deleteMany({});
	await db.orderItem.deleteMany({});
	await db.order.deleteMany({});
	await db.chatMessage.deleteMany({});
	await db.wishlist.deleteMany({});
	await db.review.deleteMany({});
	await db.notification.deleteMany({});
	await db.address.deleteMany({});
	await db.service.deleteMany({});
	await db.job.deleteMany({});
	await db.classified.deleteMany({});
	await db.property.deleteMany({});
	await db.car.deleteMany({});
	await db.auction.deleteMany({});
	await db.coupon.deleteMany({});
	await db.flashSale.deleteMany({});
	await db.app.deleteMany({});
	await db.product.deleteMany({});
	await db.store.deleteMany({});
	await db.category.deleteMany({});
	await db.platformSettings.deleteMany({});
	await db.user.deleteMany({});

	// ─── USERS ────────────────────────────────────────────────────────────────────
	const users = await db.user.createMany({
		data: [
			{
				email: "demo@nexamart.com",
				name: "Demo User",
				phone: "+9647701234567",
				role: "buyer",
				loyaltyTier: "gold",
				loyaltyPoints: 2500,
				walletBalance: 150.0,
				aiCredits: 50,
				isVerified: true,
			},
			{
				email: "seller@nexamart.com",
				name: "TechStore Pro",
				phone: "+9647709876543",
				role: "seller",
				loyaltyTier: "platinum",
				loyaltyPoints: 5200,
				walletBalance: 4520.0,
				aiCredits: 25,
				isVerified: true,
			},
			{
				email: "admin@nexamart.com",
				name: "Admin User",
				role: "admin",
				isVerified: true,
				loyaltyPoints: 0,
				walletBalance: 0,
				aiCredits: 999,
			},
			{
				email: "fashion@nexamart.com",
				name: "Fashion Hub Seller",
				role: "seller",
				isVerified: true,
				loyaltyPoints: 100,
				walletBalance: 500,
				aiCredits: 5,
			},
			{
				email: "home@nexamart.com",
				name: "Home Essentials Seller",
				role: "seller",
				isVerified: true,
				loyaltyPoints: 100,
				walletBalance: 500,
				aiCredits: 5,
			},
			{
				email: "beauty@nexamart.com",
				name: "Beauty World Seller",
				role: "seller",
				isVerified: true,
				loyaltyPoints: 100,
				walletBalance: 500,
				aiCredits: 5,
			},
			{
				email: "sports@nexamart.com",
				name: "Sports Zone Seller",
				role: "seller",
				isVerified: true,
				loyaltyPoints: 100,
				walletBalance: 500,
				aiCredits: 5,
			},
			{
				email: "ahmed@nexamart.com",
				name: "Ahmed Al-Rashid",
				phone: "+966501234567",
				role: "buyer",
				isVerified: true,
				loyaltyPoints: 320,
				walletBalance: 75,
				aiCredits: 5,
			},
			{
				email: "fatima@nexamart.com",
				name: "Fatima Al-Zahra",
				phone: "+971501112233",
				role: "buyer",
				isVerified: true,
				loyaltyPoints: 180,
				walletBalance: 220,
				aiCredits: 3,
			},
			{
				email: "omar@nexamart.com",
				name: "Omar Hassan",
				phone: "+962799887766",
				role: "buyer",
				isVerified: false,
				loyaltyPoints: 50,
				walletBalance: 0,
				aiCredits: 0,
			},
		],
	});

	const allUsers = await db.user.findMany({ orderBy: { createdAt: "asc" } });
	const [
		user,
		seller,
		admin,
		seller2,
		seller3,
		seller4,
		seller5,
		buyer2,
		buyer3,
		buyer4,
	] = allUsers;

	// ─── CATEGORIES ───────────────────────────────────────────────────────────────
	await db.category.createMany({
		data: [
			{
				name: "Electronics",
				nameAr: "إلكترونيات",
				slug: "electronics",
				icon: "smartphone",
				productCount: 156,
			},
			{
				name: "Fashion",
				nameAr: "أزياء",
				slug: "fashion",
				icon: "shirt",
				productCount: 243,
			},
			{
				name: "Home & Garden",
				nameAr: "المنزل والحديقة",
				slug: "home-garden",
				icon: "home",
				productCount: 89,
			},
			{
				name: "Beauty & Health",
				nameAr: "الجمال والصحة",
				slug: "beauty",
				icon: "sparkles",
				productCount: 167,
			},
			{
				name: "Sports & Outdoors",
				nameAr: "رياضة",
				slug: "sports",
				icon: "dumbbell",
				productCount: 78,
			},
			{
				name: "Toys & Games",
				nameAr: "ألعاب",
				slug: "toys",
				icon: "gamepad-2",
				productCount: 56,
			},
			{
				name: "Automotive",
				nameAr: "سيارات",
				slug: "automotive",
				icon: "car",
				productCount: 34,
			},
			{
				name: "Books & Media",
				nameAr: "كتب ووسائط",
				slug: "books",
				icon: "book-open",
				productCount: 112,
			},
			{
				name: "Food & Groceries",
				nameAr: "طعام وبقالة",
				slug: "food",
				icon: "shopping-basket",
				productCount: 95,
			},
			{
				name: "Jewelry & Watches",
				nameAr: "مجوهرات وساعات",
				slug: "jewelry",
				icon: "watch",
				productCount: 67,
			},
		],
	});

	const categories = await db.category.findMany({
		orderBy: { createdAt: "asc" },
	});

	// ─── STORES ───────────────────────────────────────────────────────────────────
	await db.store.createMany({
		data: [
			{
				name: "TechStore Pro",
				nameAr: "متجر التقنية",
				slug: "techstore-pro",
				description: "Your one-stop shop for the latest tech gadgets",
				descriptionAr: "وجهتك الأولى لأحدث الأجهزة والإلكترونيات",
				logo: "https://placehold.co/200x200/10b981/ffffff?text=TechStore",
				banner:
					"https://placehold.co/1200x300/059669/ffffff?text=TechStore+Banner",
				ownerId: seller.id,
				isVerified: true,
				rating: 4.8,
				reviewCount: 342,
				productCount: 45,
				tier: "pro",
				commission: 8,
			},
			{
				name: "Fashion Hub",
				nameAr: "مركز الأزياء",
				slug: "fashion-hub",
				description: "Trendy fashion for everyone",
				descriptionAr: "أزياء عصرية للجميع",
				logo: "https://placehold.co/200x200/10b981/ffffff?text=Fashion",
				banner:
					"https://placehold.co/1200x300/059669/ffffff?text=Fashion+Banner",
				ownerId: seller2.id,
				isVerified: true,
				rating: 4.6,
				reviewCount: 189,
				productCount: 78,
				tier: "pro",
				commission: 10,
			},
			{
				name: "Home Essentials",
				nameAr: "أساسيات المنزل",
				slug: "home-essentials",
				description: "Everything for your home",
				descriptionAr: "كل ما تحتاجه لمنزلك",
				logo: "https://placehold.co/200x200/10b981/ffffff?text=Home",
				banner: "https://placehold.co/1200x300/059669/ffffff?text=Home+Banner",
				ownerId: seller3.id,
				isVerified: true,
				rating: 4.5,
				reviewCount: 156,
				productCount: 34,
				tier: "free",
				commission: 12,
			},
			{
				name: "Beauty World",
				nameAr: "عالم الجمال",
				slug: "beauty-world",
				description: "Premium beauty products",
				descriptionAr: "منتجات تجميل فاخرة",
				logo: "https://placehold.co/200x200/10b981/ffffff?text=Beauty",
				banner:
					"https://placehold.co/1200x300/059669/ffffff?text=Beauty+Banner",
				ownerId: seller4.id,
				isVerified: true,
				rating: 4.7,
				reviewCount: 267,
				productCount: 56,
				tier: "pro",
				commission: 9,
			},
			{
				name: "Sports Zone",
				nameAr: "المنطقة الرياضية",
				slug: "sports-zone",
				description: "Gear up for any sport",
				descriptionAr: "استعد لأي رياضة",
				logo: "https://placehold.co/200x200/10b981/ffffff?text=Sports",
				banner:
					"https://placehold.co/1200x300/059669/ffffff?text=Sports+Banner",
				ownerId: seller5.id,
				isVerified: false,
				rating: 4.3,
				reviewCount: 98,
				productCount: 23,
				tier: "free",
				commission: 10,
			},
		],
	});

	const stores = await db.store.findMany({ orderBy: { createdAt: "asc" } });

	// ─── PRODUCTS ─────────────────────────────────────────────────────────────────
	await db.product.createMany({
		data: [
			{
				id: "WHP-001",
				name: "Wireless Bluetooth Headphones Pro",
				nameAr: "سماعات بلوتوث لاسلكية برو",
				description:
					"Premium noise-cancelling wireless headphones with 40-hour battery life.",
				descriptionAr:
					"سماعات لاسلكية متميزة بعزل الضوضاء مع بطارية تدوم 40 ساعة",
				price: 89.99,
				originalPrice: 129.99,
				images:
					'["https://placehold.co/400x400/10b981/ffffff?text=Headphones"]',
				categoryId: categories[0].id,
				storeId: stores[0].id,
				stock: 150,
				rating: 4.7,
				reviewCount: 234,
				soldCount: 1520,
				isFeatured: true,
				isSale: true,
				hasFreeShipping: true,
				variations: '{"color":["Black","White","Navy"]}',
				tieredPricing:
					'[{"minQty":5,"price":82.99},{"minQty":10,"price":75.99}]',
				tags: '["wireless","bluetooth","headphones"]',
				sku: "WHP-001",
			},
			{
				id: "SWU-002",
				name: "Smart Watch Ultra",
				nameAr: "ساعة ذكية ألترا",
				description:
					"Advanced smartwatch with health monitoring, GPS, and 7-day battery life.",
				descriptionAr: "ساعة ذكية متقدمة مع مراقبة الصحة وGPS وبطارية 7 أيام",
				price: 249.99,
				originalPrice: 349.99,
				images:
					'["https://placehold.co/400x400/10b981/ffffff?text=Smart+Watch"]',
				categoryId: categories[0].id,
				storeId: stores[0].id,
				stock: 75,
				rating: 4.8,
				reviewCount: 567,
				soldCount: 3200,
				isFeatured: true,
				isNew: true,
				isSale: true,
				hasFreeShipping: true,
				variations:
					'{"color":["Titanium","Black","Orange"],"size":["42mm","46mm"]}',
				tags: '["smartwatch","fitness","gps"]',
				sku: "SWU-002",
			},
			{
				id: "PLJ-003",
				name: "Premium Leather Jacket",
				nameAr: "سترة جلد فاخرة",
				description:
					"Handcrafted genuine leather jacket with premium stitching.",
				descriptionAr: "سترة جلد طبيعي مصنوعة يدوياً بخياطة فاخرة",
				price: 199.99,
				originalPrice: 299.99,
				images:
					'["https://placehold.co/400x400/10b981/ffffff?text=Leather+Jacket"]',
				categoryId: categories[1].id,
				storeId: stores[1].id,
				stock: 45,
				rating: 4.5,
				reviewCount: 89,
				soldCount: 430,
				isFeatured: true,
				isSale: true,
				hasFreeShipping: true,
				variations:
					'{"color":["Black","Brown","Tan"],"size":["S","M","L","XL"]}',
				tags: '["leather","jacket","premium"]',
				sku: "PLJ-003",
			},
			{
				id: "UHC-004",
				name: "4K Ultra HD Camera",
				nameAr: "كاميرا 4K ألترا HD",
				description:
					"Professional-grade 4K camera with 30x optical zoom and WiFi.",
				descriptionAr: "كاميرا احترافية بدقة 4K مع تقريب بصري 30x وWiFi",
				price: 599.99,
				originalPrice: 799.99,
				images: '["https://placehold.co/400x400/10b981/ffffff?text=4K+Camera"]',
				categoryId: categories[0].id,
				storeId: stores[0].id,
				stock: 30,
				rating: 4.9,
				reviewCount: 156,
				soldCount: 890,
				isFeatured: true,
				isNew: true,
				isSale: true,
				hasFreeShipping: true,
				variations: '{"color":["Black"]}',
				tieredPricing: '[{"minQty":3,"price":549.99}]',
				tags: '["camera","4k","professional"]',
				sku: "UHC-004",
			},
			{
				id: "OSS-005",
				name: "Organic Skincare Set",
				nameAr: "مجموعة العناية بالبشرة العضوية",
				description:
					"Complete organic skincare routine with cleanser, toner, and serum.",
				descriptionAr: "روتين عناية بالبشرة عضوي كامل",
				price: 79.99,
				originalPrice: 119.99,
				images: '["https://placehold.co/400x400/10b981/ffffff?text=Skincare"]',
				categoryId: categories[3].id,
				storeId: stores[3].id,
				stock: 200,
				rating: 4.6,
				reviewCount: 312,
				soldCount: 2100,
				isFeatured: true,
				isSale: true,
				variations: '{"type":["Normal","Oily","Dry"]}',
				tags: '["organic","skincare","beauty"]',
				sku: "OSS-005",
			},
			{
				id: "GMK-006",
				name: "Gaming Mechanical Keyboard",
				nameAr: "لوحة مفاتيح ميكانيكية للألعاب",
				description: "RGB mechanical gaming keyboard with Cherry MX switches.",
				descriptionAr: "لوحة مفاتيح ميكانيكية RGB بمفاتيح Cherry MX",
				price: 149.99,
				originalPrice: 189.99,
				images: '["https://placehold.co/400x400/10b981/ffffff?text=Keyboard"]',
				categoryId: categories[0].id,
				storeId: stores[0].id,
				stock: 120,
				rating: 4.7,
				reviewCount: 445,
				soldCount: 1890,
				isSale: true,
				hasFreeShipping: true,
				variations:
					'{"switch":["Red","Blue","Brown"],"layout":["US","Arabic"]}',
				tags: '["gaming","keyboard","mechanical"]',
				sku: "GMK-006",
			},
			{
				id: "RSP-007",
				name: "Running Shoes Pro Max",
				nameAr: "حذاء جري برو ماكس",
				description: "Lightweight running shoes with advanced cushioning.",
				descriptionAr: "حذاء جري خفيف الوزن مع وسائد متقدمة",
				price: 129.99,
				originalPrice: 169.99,
				images: '["https://placehold.co/400x400/10b981/ffffff?text=Shoes"]',
				categoryId: categories[4].id,
				storeId: stores[4].id,
				stock: 80,
				rating: 4.4,
				reviewCount: 178,
				soldCount: 670,
				isNew: true,
				isSale: true,
				hasFreeShipping: true,
				variations:
					'{"color":["Black/White","Blue/Orange"],"size":["7","8","9","10","11"]}',
				tags: '["running","shoes","sports"]',
				sku: "RSP-007",
			},
			{
				id: "SHH-008",
				name: "Smart Home Hub",
				nameAr: "مركز المنزل الذكي",
				description:
					"Central smart home controller compatible with all platforms.",
				descriptionAr: "جهاز تحكم مركزي للمنزل الذكي متوافق مع جميع المنصات",
				price: 179.99,
				originalPrice: 229.99,
				images: '["https://placehold.co/400x400/10b981/ffffff?text=Smart+Hub"]',
				categoryId: categories[2].id,
				storeId: stores[2].id,
				stock: 55,
				rating: 4.3,
				reviewCount: 92,
				soldCount: 340,
				isNew: true,
				hasFreeShipping: true,
				variations: '{"color":["White","Black"]}',
				tags: '["smart-home","iot"]',
				sku: "SHH-008",
			},
			{
				id: "DPN-009",
				name: "Diamond Pendant Necklace",
				nameAr: "قلادة بدلاية ألماس",
				description: "Elegant diamond pendant in 18K white gold.",
				descriptionAr: "قلادة أنيقة بدلاية ألماس من الذهب الأبيض عيار 18",
				price: 899.99,
				originalPrice: 1199.99,
				images: '["https://placehold.co/400x400/10b981/ffffff?text=Jewelry"]',
				categoryId: categories[9].id,
				storeId: stores[1].id,
				stock: 15,
				rating: 4.9,
				reviewCount: 67,
				soldCount: 89,
				isFeatured: true,
				isSale: true,
				hasFreeShipping: true,
				variations:
					'{"metal":["White Gold","Yellow Gold"],"size":["16in","18in"]}',
				tags: '["diamond","necklace"]',
				sku: "DPN-009",
			},
			{
				id: "OUD-013",
				name: "Royal Oud Perfume",
				nameAr: "عطر العود الملكي",
				description:
					"Exquisite Arabian oud perfume with notes of sandalwood, amber, and rose.",
				descriptionAr: "عطر عود عربي رائع بنوتات خشب الصندل والعنبر والورد",
				price: 129.99,
				originalPrice: 179.99,
				images:
					'["https://placehold.co/400x400/10b981/ffffff?text=Oud+Perfume"]',
				categoryId: categories[3].id,
				storeId: stores[3].id,
				stock: 90,
				rating: 4.8,
				reviewCount: 423,
				soldCount: 2800,
				isFeatured: true,
				isNew: true,
				isSale: true,
				hasFreeShipping: true,
				variations: '{"size":["30ml","50ml","100ml"]}',
				tags: '["oud","perfume","arabian"]',
				sku: "OUD-013",
			},
			{
				id: "DTE-015",
				name: "Emirati Dates Gift Box",
				nameAr: "صندوق تمرات إماراتي هدية",
				description:
					"Premium Emirati dates stuffed with almonds and coated with chocolate.",
				descriptionAr: "تمر إماراتي فاخر محشي باللوز ومغلف بالشوكولاتة",
				price: 54.99,
				originalPrice: 74.99,
				images:
					'["https://placehold.co/400x400/10b981/ffffff?text=Dates+Gift"]',
				categoryId: categories[8].id,
				storeId: stores[2].id,
				stock: 200,
				rating: 4.9,
				reviewCount: 198,
				soldCount: 1450,
				isFeatured: true,
				isSale: true,
				hasFreeShipping: true,
				variations: '{"size":["500g","1kg"]}',
				tags: '["dates","gift","emirati"]',
				sku: "DTE-015",
			},
		],
	});

	const allProducts = await db.product.findMany({
		orderBy: { createdAt: "asc" },
	});

	// ─── ORDERS ───────────────────────────────────────────────────────────────────
	await db.order.createMany({
		data: [
			{
				orderNumber: "ORD-001",
				userId: user.id,
				storeId: stores[0].id,
				status: "delivered",
				subtotal: 89.99,
				shippingCost: 0,
				discount: 10,
				tax: 6.3,
				total: 86.29,
				paymentMethod: "credit_card",
				paymentStatus: "paid",
				shippingAddress: JSON.stringify({
					fullName: "Demo User",
					address1: "123 Main St",
					city: "Baghdad",
					country: "Iraq",
				}),
			},
			{
				orderNumber: "ORD-002",
				userId: user.id,
				storeId: stores[1].id,
				status: "shipped",
				subtotal: 199.99,
				shippingCost: 0,
				discount: 0,
				tax: 14.0,
				total: 213.99,
				paymentMethod: "wallet",
				paymentStatus: "paid",
				shippingAddress: JSON.stringify({
					fullName: "Demo User",
					address1: "123 Main St",
					city: "Baghdad",
					country: "Iraq",
				}),
				trackingNumber: "TRK-XYZ-123",
				carrier: "DHL Express",
			},
			{
				orderNumber: "ORD-003",
				userId: user.id,
				storeId: stores[0].id,
				status: "processing",
				subtotal: 249.99,
				shippingCost: 0,
				discount: 25,
				tax: 15.75,
				total: 240.74,
				paymentMethod: "credit_card",
				paymentStatus: "paid",
				shippingAddress: JSON.stringify({
					fullName: "Demo User",
					address1: "456 Oak Ave",
					city: "Erbil",
					country: "Iraq",
				}),
			},
			{
				orderNumber: "ORD-004",
				userId: user.id,
				storeId: stores[3].id,
				status: "pending",
				subtotal: 79.99,
				shippingCost: 5.99,
				discount: 0,
				tax: 5.6,
				total: 91.58,
				paymentMethod: "zain_cash",
				paymentStatus: "pending",
				shippingAddress: JSON.stringify({
					fullName: "Demo User",
					address1: "789 Pine Rd",
					city: "Basra",
					country: "Iraq",
				}),
			},
			{
				orderNumber: "ORD-005",
				userId: buyer2.id,
				storeId: stores[0].id,
				status: "delivered",
				subtotal: 149.99,
				shippingCost: 0,
				discount: 15,
				tax: 9.45,
				total: 144.44,
				paymentMethod: "credit_card",
				paymentStatus: "paid",
				shippingAddress: JSON.stringify({
					fullName: "Ahmed Al-Rashid",
					address1: "King Fahd Road",
					city: "Riyadh",
					country: "Saudi Arabia",
				}),
			},
			{
				orderNumber: "ORD-006",
				userId: buyer2.id,
				storeId: stores[2].id,
				status: "shipped",
				subtotal: 179.99,
				shippingCost: 0,
				discount: 0,
				tax: 12.6,
				total: 192.59,
				paymentMethod: "credit_card",
				paymentStatus: "paid",
				shippingAddress: JSON.stringify({
					fullName: "Ahmed Al-Rashid",
					address1: "Olaya District",
					city: "Riyadh",
					country: "Saudi Arabia",
				}),
				trackingNumber: "TRK-ABC-456",
				carrier: "Aramex",
			},
			{
				orderNumber: "ORD-007",
				userId: buyer3.id,
				storeId: stores[3].id,
				status: "delivered",
				subtotal: 129.99,
				shippingCost: 0,
				discount: 0,
				tax: 9.1,
				total: 139.09,
				paymentMethod: "apple_pay",
				paymentStatus: "paid",
				shippingAddress: JSON.stringify({
					fullName: "Fatima Al-Zahra",
					address1: "Dubai Marina Walk",
					city: "Dubai",
					country: "UAE",
				}),
			},
		],
	});

	const orders = await db.order.findMany({ orderBy: { createdAt: "asc" } });

	// ─── ORDER ITEMS ──────────────────────────────────────────────────────────────
	if (allProducts.length >= 11 && orders.length >= 7) {
		await db.orderItem.createMany({
			data: [
				{
					orderId: orders[0].id,
					productId: allProducts[0].id,
					quantity: 1,
					price: 89.99,
					total: 89.99,
				},
				{
					orderId: orders[1].id,
					productId: allProducts[2].id,
					quantity: 1,
					price: 199.99,
					total: 199.99,
				},
				{
					orderId: orders[2].id,
					productId: allProducts[1].id,
					quantity: 1,
					price: 249.99,
					total: 249.99,
				},
				{
					orderId: orders[3].id,
					productId: allProducts[4].id,
					quantity: 1,
					price: 79.99,
					total: 79.99,
				},
				{
					orderId: orders[4].id,
					productId: allProducts[5].id,
					quantity: 1,
					price: 149.99,
					total: 149.99,
				},
				{
					orderId: orders[5].id,
					productId: allProducts[7].id,
					quantity: 1,
					price: 179.99,
					total: 179.99,
				},
				{
					orderId: orders[6].id,
					productId: allProducts[9].id,
					quantity: 1,
					price: 129.99,
					total: 129.99,
				},
			],
		});
	}

	// ─── REVIEWS ──────────────────────────────────────────────────────────────────
	if (allProducts.length >= 11) {
		await db.review.createMany({
			data: [
				{
					userId: user.id,
					productId: allProducts[0].id,
					rating: 5,
					comment:
						"Amazing sound quality! The noise cancellation is top-notch.",
					isVerified: true,
					helpful: 45,
				},
				{
					userId: buyer2.id,
					productId: allProducts[0].id,
					rating: 4,
					comment: "Great headphones but a bit heavy for extended use.",
					isVerified: true,
					helpful: 23,
				},
				{
					userId: user.id,
					productId: allProducts[1].id,
					rating: 5,
					comment: "Best smartwatch I ever owned. Battery life is incredible!",
					isVerified: true,
					helpful: 67,
				},
				{
					userId: user.id,
					productId: allProducts[2].id,
					rating: 4,
					comment: "Beautiful leather quality. Fits perfectly.",
					isVerified: true,
					helpful: 12,
				},
				{
					userId: user.id,
					productId: allProducts[4].id,
					rating: 5,
					comment: "My skin has improved so much since using this set!",
					isVerified: true,
					helpful: 89,
				},
				{
					userId: buyer2.id,
					productId: allProducts[5].id,
					rating: 4,
					comment: "Excellent keyboard for gaming. Cherry MX Brown is perfect.",
					isVerified: true,
					helpful: 34,
				},
				{
					userId: buyer3.id,
					productId: allProducts[9].id,
					rating: 5,
					comment: "The oud fragrance is absolutely divine. Lasts all day!",
					isVerified: true,
					helpful: 56,
				},
				{
					userId: buyer4.id,
					productId: allProducts[10].id,
					rating: 5,
					comment:
						"Best dates I have ever had. Gift box presentation is stunning.",
					isVerified: true,
					helpful: 78,
				},
			],
		});
	}

	// ─── CARS ─────────────────────────────────────────────────────────────────────
	await db.car.createMany({
		data: [
			{
				title: "Toyota Camry 2023 - Excellent Condition",
				titleAr: "تويوتا كامري 2023 - حالة ممتازة",
				description:
					"Well-maintained Toyota Camry 2023 with full service history.",
				descriptionAr: "تويوتا كامري 2023 صيانة كاملة، مالك واحد، بدون حوادث.",
				price: 24500,
				year: 2023,
				make: "Toyota",
				model: "Camry",
				trim: "XSE",
				mileage: 18000,
				fuelType: "gasoline",
				transmission: "automatic",
				bodyType: "sedan",
				condition: "used",
				color: "Pearl White",
				images:
					'["https://placehold.co/600x400/059669/ffffff?text=Toyota+Camry"]',
				city: "Dubai",
				country: "UAE",
				sellerId: seller.id,
				storeId: stores[0].id,
				status: "active",
				isFeatured: true,
				views: 342,
			},
			{
				title: "BMW X5 2022 - Luxury SUV",
				titleAr: "بي إم دبليو X5 2022 - SUV فاخر",
				description: "Premium BMW X5 with M Sport package.",
				descriptionAr: "بي إم دبليو X5 باقة M الرياضية.",
				price: 52000,
				year: 2022,
				make: "BMW",
				model: "X5",
				trim: "M Sport",
				mileage: 32000,
				fuelType: "gasoline",
				transmission: "automatic",
				bodyType: "suv",
				condition: "used",
				color: "Carbon Black",
				images: '["https://placehold.co/600x400/059669/ffffff?text=BMW+X5"]',
				city: "Riyadh",
				country: "Saudi Arabia",
				sellerId: seller.id,
				storeId: stores[0].id,
				status: "active",
				isFeatured: true,
				views: 567,
			},
			{
				title: "Tesla Model 3 2023 - Electric",
				titleAr: "تيسلا موديل 3 2023 - كهربائية",
				description: "Tesla Model 3 Long Range with Autopilot.",
				descriptionAr: "تيسلا موديل 3 طويلة المدى مع القيادة الذاتية.",
				price: 38500,
				year: 2023,
				make: "Tesla",
				model: "Model 3",
				trim: "Long Range",
				mileage: 12000,
				fuelType: "electric",
				transmission: "automatic",
				bodyType: "sedan",
				condition: "used",
				color: "Midnight Silver",
				images:
					'["https://placehold.co/600x400/059669/ffffff?text=Tesla+Model+3"]',
				city: "Dubai",
				country: "UAE",
				sellerId: seller2.id,
				storeId: stores[1].id,
				status: "active",
				isFeatured: true,
				views: 923,
			},
			{
				title: "Nissan Patrol 2023 - Desert Ready",
				titleAr: "نيسان باترول 2023 - جاهز للصحراء",
				description: "Nissan Patrol V8 with off-road package. GCC specs.",
				descriptionAr: "نيسان باترول V8 مع حزمة الطرق الوعرة.",
				price: 42000,
				year: 2023,
				make: "Nissan",
				model: "Patrol",
				trim: "LE V8",
				mileage: 25000,
				fuelType: "gasoline",
				transmission: "automatic",
				bodyType: "suv",
				condition: "used",
				color: "Sand Beige",
				images:
					'["https://placehold.co/600x400/059669/ffffff?text=Nissan+Patrol"]',
				city: "Kuwait City",
				country: "Kuwait",
				sellerId: seller3.id,
				storeId: stores[2].id,
				status: "active",
				isFeatured: true,
				views: 678,
			},
		],
	});

	// ─── PROPERTIES ───────────────────────────────────────────────────────────────
	await db.property.createMany({
		data: [
			{
				title: "Luxury 2BR Apartment in Dubai Marina",
				titleAr: "شقة فاخرة غرفتين في دبي مارينا",
				description: "Stunning 2-bedroom apartment with full sea view.",
				descriptionAr: "شقة غرفتين مذهلة بإطلالة بحرية كاملة.",
				price: 185000,
				listingType: "sale",
				propertyType: "apartment",
				bedrooms: 2,
				bathrooms: 2,
				area: 120,
				isFurnished: true,
				city: "Dubai",
				country: "UAE",
				address: "Dubai Marina Walk, Tower A",
				images:
					'["https://placehold.co/600x400/0d9488/ffffff?text=Dubai+Marina"]',
				agentName: "Mohammed Al-Fahim",
				agentPhone: "+971501234567",
				isVerifiedAgent: true,
				sellerId: seller.id,
				storeId: stores[0].id,
				status: "active",
				isFeatured: true,
				views: 1245,
			},
			{
				title: "Modern 3BR Villa in Riyadh",
				titleAr: "فيلا حديثة 3 غرف في الرياض",
				description: "Spacious 3-bedroom villa in Al Nakheel district.",
				descriptionAr: "فيلا واسعة 3 غرف في حي النخيل.",
				price: 950000,
				listingType: "sale",
				propertyType: "villa",
				bedrooms: 3,
				bathrooms: 3,
				area: 350,
				isFurnished: false,
				city: "Riyadh",
				country: "Saudi Arabia",
				address: "Al Nakheel District",
				images:
					'["https://placehold.co/600x400/0d9488/ffffff?text=Riyadh+Villa"]',
				agentName: "Abdullah Al-Salem",
				agentPhone: "+966509876543",
				isVerifiedAgent: true,
				sellerId: seller2.id,
				storeId: stores[1].id,
				status: "active",
				isFeatured: true,
				views: 876,
			},
			{
				title: "Cozy Studio for Rent in Amman",
				titleAr: "استوديو مريح للإيجار في عمّان",
				description: "Modern studio apartment in Abdoun area.",
				descriptionAr: "استوديو حديث في منطقة عبدون.",
				price: 650,
				listingType: "rent",
				propertyType: "apartment",
				bedrooms: 1,
				bathrooms: 1,
				area: 55,
				isFurnished: true,
				city: "Amman",
				country: "Jordan",
				address: "Abdoun, Building 23",
				images:
					'["https://placehold.co/600x400/0d9488/ffffff?text=Amman+Studio"]',
				agentName: "Lina Haddad",
				agentPhone: "+962795551234",
				isVerifiedAgent: false,
				sellerId: seller3.id,
				storeId: stores[2].id,
				status: "active",
				views: 432,
			},
		],
	});

	// ─── CLASSIFIEDS ──────────────────────────────────────────────────────────────
	await db.classified.createMany({
		data: [
			{
				title: "iPhone 14 Pro Max 256GB",
				titleAr: "آيفون 14 برو ماكس 256 جيجا",
				description:
					"Unlocked iPhone 14 Pro Max in Deep Purple. Battery health 94%.",
				descriptionAr: "آيفون 14 برو ماكس مفتوح بلون بنفسجي غامق.",
				price: 750,
				categoryId: categories[0].id,
				condition: "used",
				city: "Amman",
				country: "Jordan",
				images: '["https://placehold.co/600x400/14b8a6/ffffff?text=iPhone+14"]',
				contactPhone: "+962795551234",
				sellerId: user.id,
				status: "active",
				isFeatured: true,
				views: 312,
				expiresAt: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
			},
			{
				title: 'Samsung 65" Smart TV',
				titleAr: "تلفزيون سامسونج 65 بوصة ذكي",
				description: "Samsung QLED 65-inch Smart TV, 4K resolution.",
				descriptionAr: "تلفزيون سامسونج QLED 65 بوصة ذكي.",
				price: 380,
				categoryId: categories[0].id,
				condition: "used",
				city: "Riyadh",
				country: "Saudi Arabia",
				images:
					'["https://placehold.co/600x400/14b8a6/ffffff?text=Samsung+TV"]',
				contactPhone: "+966509876543",
				sellerId: buyer2.id,
				status: "active",
				views: 89,
				expiresAt: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000),
			},
		],
	});

	// ─── JOBS ─────────────────────────────────────────────────────────────────────
	await db.job.createMany({
		data: [
			{
				title: "Senior Software Engineer",
				titleAr: "مهندس برمجيات أول",
				description:
					"Building scalable microservices with Node.js and TypeScript.",
				descriptionAr: "نبحث عن مهندس برمجيات أول للانضمام لفريقنا.",
				company: "NexaTech Solutions",
				companyLogo: "https://placehold.co/200x200/6366f1/ffffff?text=NexaTech",
				location: "Dubai Internet City",
				city: "Dubai",
				country: "UAE",
				type: "full-time",
				salaryMin: 8000,
				salaryMax: 14000,
				currency: "AED",
				experienceLevel: "senior",
				skills: '["Node.js","TypeScript","AWS","Docker"]',
				category: "Engineering",
				contactEmail: "careers@nexatech.ae",
				posterId: seller.id,
				status: "active",
				isFeatured: true,
				views: 567,
			},
			{
				title: "Marketing Manager",
				titleAr: "مدير تسويق",
				description: "Lead digital marketing efforts across the MENA region.",
				descriptionAr: "نبحث عن مدير تسويق ذو خبرة.",
				company: "Gulf Brands Group",
				companyLogo:
					"https://placehold.co/200x200/6366f1/ffffff?text=Gulf+Brands",
				location: "King Fahd Road",
				city: "Riyadh",
				country: "Saudi Arabia",
				type: "full-time",
				salaryMin: 12000,
				salaryMax: 18000,
				currency: "SAR",
				experienceLevel: "mid",
				skills: '["Digital Marketing","SEO","Social Media"]',
				category: "Marketing",
				contactEmail: "hr@gulfbrands.sa",
				posterId: seller2.id,
				status: "active",
				isFeatured: true,
				views: 423,
			},
			{
				title: "UX/UI Designer - Remote",
				titleAr: "مصمم UX/UI - عن بعد",
				description: "Create beautiful and intuitive interfaces.",
				descriptionAr: "نبحث عن مصمم UX/UI موهوب.",
				company: "CreativePixel Agency",
				companyLogo:
					"https://placehold.co/200x200/6366f1/ffffff?text=CreativePixel",
				location: "Remote",
				city: "Amman",
				country: "Jordan",
				type: "remote",
				salaryMin: 1500,
				salaryMax: 3000,
				currency: "JOD",
				experienceLevel: "mid",
				skills: '["Figma","Adobe XD","User Research"]',
				category: "Design",
				contactEmail: "design@creativepixel.jo",
				posterId: seller4.id,
				status: "active",
				isFeatured: true,
				views: 389,
			},
		],
	});

	// ─── SERVICES ─────────────────────────────────────────────────────────────────
	await db.service.createMany({
		data: [
			{
				title: "Professional Home Cleaning",
				titleAr: "تنظيف منزلي احترافي",
				description: "Deep cleaning service for apartments and villas.",
				descriptionAr: "خدمة تنظيف عميقة للشقق والفلل.",
				price: 45,
				priceUnit: "visit",
				category: "Cleaning",
				providerName: "CleanPro Team",
				providerAvatar:
					"https://placehold.co/200x200/8b5cf6/ffffff?text=CleanPro",
				rating: 4.8,
				reviewCount: 234,
				location: "Dubai Marina & JBR",
				city: "Dubai",
				country: "UAE",
				isAvailableToday: true,
				isVerified: true,
				providerId: seller.id,
				status: "active",
				isFeatured: true,
				views: 456,
			},
			{
				title: "AC Maintenance & Repair",
				titleAr: "صيانة وإصلاح مكيفات",
				description: "Expert AC maintenance and repair service.",
				descriptionAr: "خدمة صيانة وإصلاح مكيفات خبيرة.",
				price: 35,
				priceUnit: "visit",
				category: "Maintenance",
				providerName: "CoolAir Services",
				providerAvatar:
					"https://placehold.co/200x200/8b5cf6/ffffff?text=CoolAir",
				rating: 4.5,
				reviewCount: 156,
				location: "All Riyadh districts",
				city: "Riyadh",
				country: "Saudi Arabia",
				isAvailableToday: true,
				isVerified: true,
				providerId: seller3.id,
				status: "active",
				isFeatured: true,
				views: 321,
			},
			{
				title: "Wedding Photography",
				titleAr: "تصوير أفراح",
				description: "Professional wedding photography and videography.",
				descriptionAr: "تصوير وفيديو أفراح احترافي.",
				price: 500,
				priceUnit: "service",
				category: "Photography",
				providerName: "LensArt Studios",
				providerAvatar:
					"https://placehold.co/200x200/8b5cf6/ffffff?text=LensArt",
				rating: 4.9,
				reviewCount: 45,
				location: "All Qatar",
				city: "Doha",
				country: "Qatar",
				isAvailableToday: false,
				isVerified: true,
				providerId: seller2.id,
				status: "active",
				isFeatured: true,
				views: 567,
			},
		],
	});

	// ─── COUPONS ──────────────────────────────────────────────────────────────────
	await db.coupon.createMany({
		data: [
			{
				code: "WELCOME10",
				discount: 10,
				type: "percentage",
				minOrder: 50,
				maxDiscount: 25,
				usageLimit: 1000,
				usedCount: 234,
				storeId: null,
				isActive: true,
				expiresAt: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
			},
			{
				code: "TECH20",
				discount: 20,
				type: "percentage",
				minOrder: 100,
				maxDiscount: 50,
				usageLimit: 500,
				usedCount: 78,
				storeId: stores[0].id,
				isActive: true,
				expiresAt: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000),
			},
			{
				code: "FLAT15",
				discount: 15,
				type: "fixed",
				minOrder: 75,
				usageLimit: 2000,
				usedCount: 890,
				storeId: null,
				isActive: true,
				expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
			},
		],
	});

	// ─── FLASH SALES ──────────────────────────────────────────────────────────────
	await db.flashSale.createMany({
		data: [
			{
				title: "Electronics Mega Sale",
				titleAr: "تخفيضات الإلكترونيات الكبرى",
				discount: 40,
				startDate: new Date(now.getTime() - 2 * 60 * 60 * 1000),
				endDate: new Date(now.getTime() + 22 * 60 * 60 * 1000),
				isActive: true,
			},
			{
				title: "Fashion Weekend Deal",
				titleAr: "عرض أزياء نهاية الأسبوع",
				discount: 30,
				startDate: new Date(now.getTime() - 6 * 60 * 60 * 1000),
				endDate: new Date(now.getTime() + 18 * 60 * 60 * 1000),
				isActive: true,
			},
			{
				title: "Ramadan Special",
				titleAr: "عرض رمضان الخاص",
				discount: 50,
				startDate: new Date(now.getTime() - 12 * 60 * 60 * 1000),
				endDate: new Date(now.getTime() + 12 * 60 * 60 * 1000),
				isActive: true,
			},
		],
	});

	// ─── BANNERS ──────────────────────────────────────────────────────────────────
	await db.banner.createMany({
		data: [
			{
				title: "Mega Electronics Sale",
				titleAr: "تخفيضات الإلكترونيات الكبرى",
				image:
					"https://placehold.co/1200x400/059669/ffffff?text=Electronics+Sale",
				link: "/deals?category=electronics",
				position: "hero",
				sortOrder: 1,
				isActive: true,
				startDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
				endDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
			},
			{
				title: "Ramadan Collection",
				titleAr: "مجموعة رمضان",
				image:
					"https://placehold.co/1200x400/059669/ffffff?text=Ramadan+Collection",
				link: "/products?tag=ramadan",
				position: "hero",
				sortOrder: 2,
				isActive: true,
				startDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
				endDate: new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000),
			},
			{
				title: "New Arrivals in Fashion",
				titleAr: "وصولات جديدة في الأزياء",
				image: "https://placehold.co/1200x400/059669/ffffff?text=New+Fashion",
				link: "/products?category=fashion&sort=newest",
				position: "hero",
				sortOrder: 3,
				isActive: true,
				startDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
				endDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
			},
		],
	});

	// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
	await db.notification.createMany({
		data: [
			{
				userId: user.id,
				title: "Welcome to NexaMart!",
				titleAr: "مرحباً بك في نكسا مارت!",
				message: "Start exploring thousands of products.",
				messageAr: "ابدأ استكشاف آلاف المنتجات.",
				type: "system",
			},
			{
				userId: user.id,
				title: "Order shipped!",
				titleAr: "تم شحن طلبك!",
				message: "Order ORD-002 is on its way.",
				messageAr: "الطلب ORD-002 في طريقه.",
				type: "order",
			},
			{
				userId: user.id,
				title: "Flash Sale!",
				titleAr: "عرض فلاش!",
				message: "Up to 70% off on electronics.",
				messageAr: "خصومات تصل إلى 70% على الإلكترونيات.",
				type: "promotion",
			},
		],
	});

	// ─── ADDRESSES ────────────────────────────────────────────────────────────────
	await db.address.createMany({
		data: [
			{
				userId: user.id,
				label: "Home",
				fullName: "Demo User",
				phone: "+9647701234567",
				address1: "123 Main Street",
				city: "Baghdad",
				state: "Baghdad",
				postalCode: "10001",
				country: "Iraq",
				isDefault: true,
			},
			{
				userId: buyer2.id,
				label: "Home",
				fullName: "Ahmed Al-Rashid",
				phone: "+966501234567",
				address1: "King Fahd Road, Al Olaya",
				city: "Riyadh",
				state: "Riyadh",
				postalCode: "12211",
				country: "Saudi Arabia",
				isDefault: true,
			},
			{
				userId: buyer3.id,
				label: "Home",
				fullName: "Fatima Al-Zahra",
				phone: "+971501112233",
				address1: "Dubai Marina Walk, Tower B",
				city: "Dubai",
				state: "Dubai",
				postalCode: "00000",
				country: "UAE",
				isDefault: true,
			},
		],
	});

	// ─── CHAT MESSAGES ────────────────────────────────────────────────────────────
	await db.chatMessage.createMany({
		data: [
			{
				senderId: user.id,
				receiverId: seller.id,
				message: "Hi, is the Smart Watch Ultra still available?",
				isRead: true,
			},
			{
				senderId: seller.id,
				receiverId: user.id,
				message: "Yes it is! We have it in Titanium, Black, and Orange.",
				isRead: true,
			},
			{
				senderId: user.id,
				receiverId: seller.id,
				message: "I would like the Black one in 46mm.",
				isRead: false,
			},
			{
				senderId: buyer2.id,
				receiverId: seller3.id,
				message: "Hello, can you provide more details?",
				isRead: false,
			},
		],
	});

	// ─── PLATFORM SETTINGS ────────────────────────────────────────────────────────
	await db.platformSettings.createMany({
		data: [
			{ key: "siteName", value: "NexaMart" },
			{ key: "siteTagline", value: "AI-Powered Multi-Vendor Commerce" },
			{ key: "commissionRate", value: "10" },
			{ key: "freeShippingThreshold", value: "100" },
			{ key: "defaultShippingRate", value: "5.99" },
			{ key: "taxRate", value: "15" },
		],
	});

	// ─── COUNTS ───────────────────────────────────────────────────────────────────
	const counts = {
		users: await db.user.count(),
		stores: await db.store.count(),
		categories: await db.category.count(),
		products: await db.product.count(),
		orders: await db.order.count(),
		reviews: await db.review.count(),
		cars: await db.car.count(),
		properties: await db.property.count(),
		classifieds: await db.classified.count(),
		jobs: await db.job.count(),
		services: await db.service.count(),
		coupons: await db.coupon.count(),
		flashSales: await db.flashSale.count(),
		banners: await db.banner.count(),
		chatMessages: await db.chatMessage.count(),
	};

	console.log("✅ Database seeded successfully!");
	console.log("Counts:", JSON.stringify(counts, null, 2));
}

main()
	.catch((e) => {
		console.error("Seed error:", e);
		process.exit(1);
	})
	.finally(async () => {
		await db.$disconnect();
	});
