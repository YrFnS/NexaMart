import { SHIPPING_CONFIG } from '@/lib/config';
import { db } from '@/lib/db';

// ─── FAQ Data — CONFIG/REFERENCE DATA (not mock) ───────────────────────────────
const faqCategories = [
  {
    id: 'account',
    title: 'Account & Registration',
    titleAr: 'الحساب والتسجيل',
    icon: 'User',
    questions: [
      {
        id: 'faq-1',
        question: 'How do I create an account on NexaMart?',
        questionAr: 'كيف أنشئ حساباً على نكسا مارت؟',
        answer: 'To create an account, click the "Sign Up" button on the homepage. You can register using your email address, phone number, or through social media accounts (Google, Facebook). Fill in your basic information and verify your email/phone to complete registration.',
        answerAr: 'لإنشاء حساب، اضغط على زر "تسجيل" في الصفحة الرئيسية. يمكنك التسجيل باستخدام بريدك الإلكتروني أو رقم هاتفك أو من خلال حسابات التواصل الاجتماعي (جوجل، فيسبوك). املأ معلوماتك الأساسية وتحقق من بريدك الإلكتروني/هاتفك لإكمال التسجيل.',
      },
      {
        id: 'faq-2',
        question: 'I forgot my password. How do I reset it?',
        questionAr: 'نسيت كلمة المرور. كيف أعيد تعيينها؟',
        answer: 'Click "Forgot Password" on the login page. Enter your registered email address or phone number. You will receive a verification code to reset your password. Follow the instructions in the email/SMS to create a new password.',
        answerAr: 'اضغط على "نسيت كلمة المرور" في صفحة تسجيل الدخول. أدخل بريدك الإلكتروني المسجل أو رقم هاتفك. ستتلقى رمز تحقق لإعادة تعيين كلمة المرور. اتبع التعليمات في البريد الإلكتروني/الرسالة القصيرة لإنشاء كلمة مرور جديدة.',
      },
      {
        id: 'faq-3',
        question: 'How do I update my profile information?',
        questionAr: 'كيف أحدث معلومات ملفي الشخصي؟',
        answer: 'Go to your Profile page and click "Edit Profile". You can update your name, email, phone number, profile picture, and shipping addresses. Make sure to save your changes before leaving the page.',
        answerAr: 'اذهب إلى صفحة ملفك الشخصي واضغط على "تعديل الملف الشخصي". يمكنك تحديث اسمك وبريدك الإلكتروني ورقم هاتفك وصورتك الشخصية وعناوين الشحن. تأكد من حفظ التغييرات قبل مغادرة الصفحة.',
      },
      {
        id: 'faq-4',
        question: 'Can I have both buyer and seller accounts?',
        questionAr: 'هل يمكنني امتلاك حساب مشتري وبائع معاً؟',
        answer: 'Yes! NexaMart allows you to use a single account for both buying and selling. Simply go to your profile and click "Switch to Seller" to set up your seller dashboard. You can switch between buyer and seller modes anytime.',
        answerAr: 'نعم! يسمح نكسا مارت باستخدام حساب واحد للشراء والبيع معاً. ما عليك سوى الذهاب إلى ملفك الشخصي والضغط على "التحول إلى بائع" لإعداد لوحة البائع. يمكنك التبديل بين وضع المشتري والبائع في أي وقت.',
      },
      {
        id: 'faq-5',
        question: 'How do I verify my account (KYC)?',
        questionAr: 'كيف أتحقق من حسابي (KYC)؟',
        answer: 'Go to Profile > Verification and upload a valid government-issued ID (passport, national ID, or driver\'s license). Verification usually takes 1-2 business days. Verified accounts get a blue badge and access to additional features.',
        answerAr: 'اذهب إلى الملف الشخصي > التحقق وارفع هوية حكومية صالحة (جواز سفر أو بطاقة وطنية أو رخصة قيادة). عادة ما يستغرق التحقق من يوم إلى يومين عملين. تحصل الحسابات المتحققة على شارة زرقاء والوصول إلى ميزات إضافية.',
      },
    ],
  },
  {
    id: 'orders',
    title: 'Orders & Shipping',
    titleAr: 'الطلبات والشحن',
    icon: 'Package',
    questions: [
      {
        id: 'faq-6',
        question: 'How do I track my order?',
        questionAr: 'كيف أتتبع طلبي؟',
        answer: 'Go to Orders > select your order > click "Track Order". You can see real-time updates on your shipment status including pickup, transit, and delivery. You\'ll also receive push notifications and SMS updates on your order status.',
        answerAr: 'اذهب إلى الطلبات > اختر طلبك > اضغط على "تتبع الطلب". يمكنك رؤية تحديثات فورية على حالة شحنتك بما في ذلك الاستلام والعبور والتوصيل. ستتلقى أيضاً إشعارات فورية ورسائل SMS حول حالة طلبك.',
      },
      {
        id: 'faq-7',
        question: 'What are the shipping options and delivery times?',
        questionAr: 'ما هي خيارات الشحن وأوقات التوصيل؟',
        answer: `We offer Standard (5-7 days), Express (2-3 days), and Same-Day delivery (select cities). Shipping costs vary based on package weight, dimensions, and destination. Orders over $${SHIPPING_CONFIG.freeShippingThreshold} qualify for free standard shipping. Use our Shipping Calculator for exact rates.`,
        answerAr: `نقدم الشحن العادي (5-7 أيام)، السريع (2-3 أيام)، والتوصيل في نفس اليوم (مدن مختارة). تختلف تكاليف الشحن بناءً على وزن الطرد وأبعاده والوجهة. الطلبات فوق $${SHIPPING_CONFIG.freeShippingThreshold} مؤهلة للشحن المجاني. استخدم حاسبة الشحن للحصول على الأسعار الدقيقة.`,
      },
      {
        id: 'faq-8',
        question: 'Can I change my shipping address after placing an order?',
        questionAr: 'هل يمكنني تغيير عنوان الشحن بعد تقديم الطلب؟',
        answer: 'You can change your shipping address within 1 hour of placing your order, as long as it hasn\'t been shipped yet. Go to Orders > select order > click "Modify Address". After shipping, contact our support team for assistance.',
        answerAr: 'يمكنك تغيير عنوان الشحن خلال ساعة واحدة من تقديم طلبك، طالما لم يتم شحنه بعد. اذهب إلى الطلبات > اختر الطلب > اضغط على "تعديل العنوان". بعد الشحن، تواصل مع فريق الدعم للمساعدة.',
      },
      {
        id: 'faq-9',
        question: 'Do you ship internationally?',
        questionAr: 'هل تشحنون دولياً؟',
        answer: 'Yes, NexaMart ships to over 15 countries across the MENA region and internationally. We work with trusted carriers like Aramex, DHL Express, and SMSA Express. Shipping costs and delivery times vary by destination. Check our Shipping Calculator for details.',
        answerAr: 'نعم، يشحن نكسا مارت إلى أكثر من 15 دولة في منطقة الشرق الأوسط وشمال أفريقيا ودولياً. نعمل مع شركات شحن موثوقة مثل أرامكس وDHL إكسبرس وSMSA إكسبرس. تختلف تكاليف الشحن وأوقات التوصيل حسب الوجهة. تحقق من حاسبة الشحن للتفاصيل.',
      },
      {
        id: 'faq-10',
        question: 'What if my order is delayed?',
        questionAr: 'ماذا لو تأخر طلبي؟',
        answer: 'If your order is delayed beyond the estimated delivery date, check the tracking information first. If there\'s no update for 3+ days, contact our support team or the seller directly through our chat system. We guarantee delivery or a full refund for significantly delayed orders.',
        answerAr: 'إذا تأخر طلبك عن تاريخ التوصيل المقدر، تحقق من معلومات التتبع أولاً. إذا لم يكن هناك تحديث لأكثر من 3 أيام، تواصل مع فريق الدعم أو البائع مباشرة عبر نظام الدردشة. نضمن التوصيل أو استرداد كامل المبلغ للطلبات المتأخرة بشكل كبير.',
      },
    ],
  },
  {
    id: 'returns',
    title: 'Returns & Refunds',
    titleAr: 'الإرجاعات والاسترداد',
    icon: 'RotateCcw',
    questions: [
      {
        id: 'faq-11',
        question: 'What is your return policy?',
        questionAr: 'ما هي سياسة الإرجاع الخاصة بكم؟',
        answer: 'NexaMart offers a 14-day return policy for most items. Products must be unused, in original packaging, and with all tags attached. Some categories like perishables, underwear, and customized items may not be eligible for returns. Check the product page for specific return eligibility.',
        answerAr: 'يقدم نكسا مارت سياسة إرجاع لمدة 14 يوماً لمعظم المنتجات. يجب أن تكون المنتجات غير مستخدمة وفي تغليفها الأصلي مع جميع البطاقات. بعض الفئات مثل المواد القابلة للتلف والملابس الداخلية والمنتجات المخصصة قد لا تكون مؤهلة للإرجاع. تحقق من صفحة المنتج لأهلية الإرجاع المحددة.',
      },
      {
        id: 'faq-12',
        question: 'How do I request a return or refund?',
        questionAr: 'كيف أطلب إرجاع أو استرداد؟',
        answer: 'Go to Orders > select order > click "Return Item". Choose the item(s), select a reason, add photos if applicable, and choose your preferred resolution (refund, exchange, or store credit). You\'ll receive a confirmation email once the request is submitted.',
        answerAr: 'اذهب إلى الطلبات > اختر الطلب > اضغط على "إرجاع المنتج". اختر المنتج/المنتجات، حدد السبب، أضف صوراً إن أمكن، واختر الحل المفضل (استرداد أو استبدال أو رصيد المتجر). ستتلقى بريداً إلكترونياً تأكيدياً بمجرد تقديم الطلب.',
      },
      {
        id: 'faq-13',
        question: 'How long do refunds take?',
        questionAr: 'كم تستغرق عملية الاسترداد؟',
        answer: 'Refunds are processed within 3-5 business days after we receive the returned item. The refund will be credited to your original payment method. Credit card refunds may take an additional 5-10 business days to appear on your statement. Wallet refunds are instant.',
        answerAr: 'تتم معالجة الاسترداد خلال 3-5 أيام عمل بعد استلامنا المنتج المرتجع. سيتم إيداع المبلغ في طريقة الدفع الأصلية. قد يستغرق استرداد بطاقة الائتمان 5-10 أيام عمل إضافية للظهور في كشف حسابك. استرداد المحفظة فوري.',
      },
      {
        id: 'faq-14',
        question: 'Who pays for return shipping?',
        questionAr: 'من يدفع تكاليف شحن الإرجاع؟',
        answer: 'If the return is due to a defective item, wrong product, or seller error, the seller covers return shipping. If you\'re returning due to change of mind, you may be responsible for return shipping costs. Free returns are available for NexaMart+ members.',
        answerAr: 'إذا كان الإرجاع بسبب منتج معيب أو منتج خاطئ أو خطأ البائع، يتحمل البائع تكاليف شحن الإرجاع. إذا كنت ترجع بسبب تغيير الرأي، قد تتحمل تكاليف شحن الإرجاع. الإرجاع المجاني متاح لأعضاء نكسا مارت+.',
      },
      {
        id: 'faq-15',
        question: 'Can I exchange an item instead of returning it?',
        questionAr: 'هل يمكنني استبدال منتج بدلاً من إرجاعه؟',
        answer: 'Yes! When submitting a return request, select "Exchange" as your preferred resolution. You can exchange for a different size, color, or variant of the same product. If the new item costs more, you\'ll pay the difference. If it costs less, the difference will be refunded.',
        answerAr: 'نعم! عند تقديم طلب إرجاع، اختر "استبدال" كحل مفضل. يمكنك الاستبدال بحجم أو لون أو نسخة مختلفة من نفس المنتج. إذا كان المنتج الجديد يكلف أكثر، ستدفع الفرق. إذا كان يكلف أقل، سيتم استرداد الفرق.',
      },
    ],
  },
  {
    id: 'payments',
    title: 'Payments & Billing',
    titleAr: 'المدفوعات والفواتير',
    icon: 'CreditCard',
    questions: [
      {
        id: 'faq-16',
        question: 'What payment methods do you accept?',
        questionAr: 'ما هي طرق الدفع المقبولة؟',
        answer: 'We accept credit/debit cards (Visa, Mastercard), Apple Pay, Google Pay, NexaMart Wallet, Zain Cash, STC Pay, and bank transfers. Cash on Delivery (COD) is available in select cities. All transactions are secured with SSL encryption.',
        answerAr: 'نقبل بطاقات الائتمان/الخصم (فيزا، ماستركارد)، Apple Pay، Google Pay، محفظة نكسا مارت، Zain Cash، STC Pay، والتحويل البنكي. الدفع عند الاستلام متاح في مدن مختارة. جميع المعاملات مؤمنة بتشفير SSL.',
      },
      {
        id: 'faq-17',
        question: 'How does the escrow payment system work?',
        questionAr: 'كيف يعمل نظام الدفع بالضمان؟',
        answer: 'When you place an order, your payment is held in our secure escrow account. The seller only receives the payment after you confirm receipt of the item and are satisfied with it. This protects both buyers and sellers from fraud.',
        answerAr: 'عند تقديم طلب، يتم احتجاز دفعتك في حساب الضمان الآمن لدينا. لا يتلقى البائع الدفع إلا بعد تأكيدك استلام المنتج ورضاك عنه. يحمي هذا المشترين والبائعين من الاحتيال.',
      },
      {
        id: 'faq-18',
        question: 'Can I use multiple coupons on one order?',
        questionAr: 'هل يمكنني استخدام كوبونات متعددة على طلب واحد؟',
        answer: 'Currently, only one coupon can be applied per order. However, you can combine a coupon with NexaMart Wallet balance and loyalty points for maximum savings. Subscribe to our newsletter for exclusive multi-coupon events.',
        answerAr: 'حالياً، يمكن تطبيق كوبون واحد فقط لكل طلب. ومع ذلك، يمكنك الجمع بين الكوبون ورصيد محفظة نكسا مارت ونقاط الولاء للحد الأقصى من التوفير. اشترك في نشرتنا الإخبارية لفعاليات الكوبونات المتعددة الحصرية.',
      },
      {
        id: 'faq-19',
        question: 'Is my payment information secure?',
        questionAr: 'هل معلومات الدفع الخاصة بي آمنة؟',
        answer: 'Absolutely. NexaMart uses bank-level 256-bit SSL encryption to protect your payment information. We never store your full credit card details on our servers. All transactions are PCI DSS compliant and monitored 24/7 for fraud detection.',
        answerAr: 'بالتأكيد. يستخدم نكسا مارت تشفير SSL بمستوى البنوك 256 بت لحماية معلومات الدفع الخاصة بك. لا نخزن تفاصيل بطاقتك الائتمانية الكاملة على خوادمنا أبداً. جميع المعاملات متوافقة مع PCI DSS ومراقبة على مدار الساعة لكشف الاحتيال.',
      },
      {
        id: 'faq-20',
        question: 'How do I get an invoice for my purchase?',
        questionAr: 'كيف أحصل على فاتورة مشترياتي؟',
        answer: 'Invoices are automatically generated for every purchase. You can download them from Orders > select order > "Download Invoice". For VAT invoices, make sure your tax ID is added in your profile settings. Business accounts can set up automatic invoice generation.',
        answerAr: 'يتم إنشاء الفواتير تلقائياً لكل عملية شراء. يمكنك تنزيلها من الطلبات > اختر الطلب > "تنزيل الفاتورة". لفواتير ضريبة القيمة المضافة، تأكد من إضافة رقمك الضريبي في إعدادات ملفك الشخصي. يمكن للحسابات التجارية إعداد إنشاء الفواتير التلقائي.',
      },
    ],
  },
  {
    id: 'selling',
    title: 'Selling on NexaMart',
    titleAr: 'البيع على نكسا مارت',
    icon: 'Store',
    questions: [
      {
        id: 'faq-21',
        question: 'How do I become a seller on NexaMart?',
        questionAr: 'كيف أصبح بائعاً على نكسا مارت؟',
        answer: 'Click "Sell on NexaMart" in the menu and complete our seller onboarding process. You\'ll need to provide business details, upload verification documents, and set up your store. Approval typically takes 1-2 business days. There are no listing fees for basic accounts.',
        answerAr: 'اضغط على "بع على نكسا مارت" في القائمة وأكمل عملية تسجيل البائع. ستحتاج إلى تقديم تفاصيل العمل وتحميل مستندات التحقق وإعداد متجرك. عادة ما يستغرق الموافقة من يوم إلى يومين عملين. لا توجد رسوم إدراج للحسابات الأساسية.',
      },
      {
        id: 'faq-22',
        question: 'What are the seller fees and commissions?',
        questionAr: 'ما هي رسوم وعمولات البائع؟',
        answer: 'NexaMart charges a commission of 5-15% depending on the product category. There are no setup fees or monthly subscriptions for basic selling. Premium store subscriptions start at $29.99/month with lower commission rates and additional features. Payment is deducted automatically from your earnings.',
        answerAr: 'يفرض نكسا مارت عمولة تتراوح بين 5-15٪ حسب فئة المنتج. لا توجد رسوم إعداد أو اشتراكات شهرية للبيع الأساسي. تبدأ اشتراكات المتجر المميز من 29.99$/شهر مع معدلات عمولة أقل وميزات إضافية. يتم خصم الدفع تلقائياً من أرباحك.',
      },
      {
        id: 'faq-23',
        question: 'How do I manage my inventory and orders?',
        questionAr: 'كيف أدير مخزوني وطلباتي؟',
        answer: 'Use the Seller Dashboard to manage your products, inventory, orders, and analytics. You can add/edit products, set pricing and variations, track order status, and view sales reports. Our mobile app also allows you to manage your store on the go.',
        answerAr: 'استخدم لوحة البائع لإدارة منتجاتك ومخزونك وطلباتك وتحليلاتك. يمكنك إضافة/تعديل المنتجات وتعيين التسعير والتنويعات وتتبع حالة الطلب وعرض تقارير المبيعات. يتيح لك تطبيقنا المحمول أيضاً إدارة متجرك وأنت في التنقل.',
      },
      {
        id: 'faq-24',
        question: 'How do I get paid as a seller?',
        questionAr: 'كيف أتلقى الدفع ك بائع؟',
        answer: 'After the buyer confirms receipt, funds are released from escrow to your NexaMart Wallet. You can withdraw to your bank account, or via supported payment methods. Payouts are processed within 2-3 business days. Minimum withdrawal amount is $50.',
        answerAr: 'بعد تأكيد المشتري الاستلام، يتم تحرير الأموال من الضمان إلى محفظة نكسا مارت. يمكنك السحب إلى حسابك البنكي أو عبر طرق الدفع المدعومة. تتم المعالجة خلال 2-3 أيام عمل. الحد الأدنى للسحب هو 50$.',
      },
      {
        id: 'faq-25',
        question: 'Can I promote my listings for better visibility?',
        questionAr: 'هل يمكنني ترويج إدراجاتي لرؤية أفضل؟',
        answer: 'Yes! NexaMart offers several promotion options: Bump Up (+300% views, $2.99), Featured Ad (+500% views, $9.99), Premium Ad (+800% views, $19.99), Urgent Badge (+200% views, $4.99), and Spotlight (+1200% views, $29.99). Go to Seller Dashboard > Ad Center to promote your listings.',
        answerAr: 'نعم! يقدم نكسا مارت عدة خيارات ترويج: رفع (+300٪ مشاهدات، 2.99$)، إعلان مميز (+500٪ مشاهدات، 9.99$)، إعلان بريميوم (+800٪ مشاهدات، 19.99$)، شارة عاجل (+200٪ مشاهدات، 4.99$)، وسبوتلايت (+1200٪ مشاهدات، 29.99$). اذهب إلى لوحة البائع > مركز الإعلانات لترويج إدراجاتك.',
      },
    ],
  },
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'tickets') {
      // Get real help tickets from DB
      try {
        const tickets = await db.helpTicket.findMany({
          include: {
            user: { select: { name: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
        });

        const mapped = tickets.map((t) => ({
          id: t.id,
          category: t.category || '',
          subject: t.subject,
          subjectAr: '',
          description: t.description || '',
          descriptionAr: '',
          status: t.status,
          priority: t.priority,
          createdAt: t.createdAt.toISOString(),
          updatedAt: t.updatedAt.toISOString(),
          responseCount: 0,
        }));

        return Response.json({ tickets: mapped, total: mapped.length });
      } catch {
        return Response.json({ tickets: [], total: 0 });
      }
    }

    if (action === 'faq') {
      return Response.json({ categories: faqCategories });
    }

    // Default: return both FAQ and tickets
    let tickets: unknown[] = [];
    try {
      const dbTickets = await db.helpTicket.findMany({
        include: {
          user: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      tickets = dbTickets.map((t) => ({
        id: t.id,
        category: t.category || '',
        subject: t.subject,
        subjectAr: '',
        description: t.description || '',
        descriptionAr: '',
        status: t.status,
        priority: t.priority,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
        responseCount: 0,
      }));
    } catch {
      // DB query failed, return empty tickets
    }

    return Response.json({
      faqCategories,
      tickets,
      ticketTotal: tickets.length,
    });
  } catch (error) {
    console.error('Help API error:', error);
    return Response.json({ error: 'Failed to fetch help data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { category, subject, description, priority, userId } = body;

    if (!category || !subject || !description) {
      return Response.json(
        { error: 'Missing required fields: category, subject, description' },
        { status: 400 }
      );
    }

    const validCategories = ['order_issue', 'return_refund', 'payment_problem', 'account_issue', 'seller_dispute', 'technical_problem', 'other'];
    if (!validCategories.includes(category)) {
      return Response.json(
        { error: 'Invalid category' },
        { status: 400 }
      );
    }

    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    const ticketPriority = validPriorities.includes(priority) ? priority : 'medium';

    // Create ticket in DB if userId is provided
    if (userId) {
      try {
        const ticket = await db.helpTicket.create({
          data: {
            userId,
            subject,
            description,
            category,
            priority: ticketPriority,
            status: 'open',
          },
        });

        return Response.json({
          ticket: {
            id: ticket.id,
            category: ticket.category,
            subject: ticket.subject,
            description: ticket.description,
            priority: ticket.priority,
            status: ticket.status,
            createdAt: ticket.createdAt.toISOString(),
            updatedAt: ticket.updatedAt.toISOString(),
            responseCount: 0,
          },
          message: 'Ticket submitted successfully. We will get back to you within 24 hours.',
          messageAr: 'تم تقديم التذكرة بنجاح. سنتواصل معك خلال 24 ساعة.',
        }, { status: 201 });
      } catch {
        return Response.json(
          { error: 'Failed to create ticket. Please try again.' },
          { status: 500 }
        );
      }
    }

    // No userId provided
    return Response.json(
      { error: 'User ID is required to create a ticket.' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Submit Ticket API error:', error);
    return Response.json({ error: 'Failed to submit ticket' }, { status: 500 });
  }
}
