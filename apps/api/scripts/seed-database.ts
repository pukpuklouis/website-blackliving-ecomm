import { createDB } from '@blackliving/db';
import { 
  users, sessions, accounts, verifications,
  products, orders, appointments, posts, reviews, 
  newsletters, contacts, customerProfiles, 
  customerTags, customerTagAssignments, customerInteractions
} from '@blackliving/db/schema';

// Mock D1 database for seeding
const mockD1: D1Database = {
  prepare: (query: string) => ({
    bind: (...params: any[]) => ({
      all: async () => ({ results: [], success: true, meta: {} }),
      first: async () => ({}),
      run: async () => ({ success: true, meta: { changes: 1, last_row_id: 1 } }),
    }),
    all: async () => ({ results: [], success: true, meta: {} }),
    first: async () => ({}),
    run: async () => ({ success: true, meta: { changes: 1, last_row_id: 1 } }),
  }),
  dump: async () => new ArrayBuffer(0),
  batch: async () => [],
  exec: async () => ({ count: 0, duration: 0 }),
} as any;

const db = createDB(mockD1);

export async function seedDatabase() {
  console.log('🌱 Starting database seeding...');

  try {
    // 1. Seed Users (Better Auth)
    await seedUsers();
    
    // 2. Seed Products  
    await seedProducts();
    
    // 3. Seed Customer Profiles & Tags
    await seedCustomers();
    
    // 4. Seed Orders
    await seedOrders();
    
    // 5. Seed Appointments
    await seedAppointments();
    
    // 6. Seed Posts & Reviews
    await seedContent();
    
    // 7. Seed Contact & Newsletter
    await seedCommunications();

    console.log('✅ Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    throw error;
  }
}

async function seedUsers() {
  const userData = [
    {
      id: 'user_admin_001',
      name: 'Louis Chen',
      email: 'pukpuk.tw@gmail.com',
      emailVerified: true,
      role: 'admin',
      phone: '+886-912-345-678',
      image: 'https://lh3.googleusercontent.com/a/ACg8ocJZWZvXJZ4YyeVNF9tD-V553wXeGPOn3hXM-lvst-p15Jg-d4oQ=s96-c',
      preferences: JSON.stringify({ theme: 'light', notifications: true }),
    },
    {
      id: 'user_customer_001',
      name: '王小明',
      email: 'wang@example.com',
      emailVerified: true,
      role: 'customer',
      phone: '+886-987-654-321',
      preferences: JSON.stringify({ theme: 'light', emailUpdates: true }),
    },
    {
      id: 'user_customer_002', 
      name: '李美華',
      email: 'lee@example.com',
      emailVerified: true,
      role: 'customer',
      phone: '+886-912-888-999',
      preferences: JSON.stringify({ emailUpdates: false }),
    }
  ];

  for (const user of userData) {
    await db.insert(users).values(user);
  }
  console.log('✅ Users seeded');
}

async function seedProducts() {
  const productData = [
    {
      id: 'prod_001',
      name: '席夢思黑牌 Classic 獨立筒床墊',
      slug: 'simmons-black-classic',
      description: '席夢思頂級黑牌系列，採用獨立筒彈簧技術，提供絕佳的支撐與舒適度。適合各種睡眠姿勢，讓您享受一夜好眠。',
      category: 'simmons-black',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1541558869434-2840d308329a?w=800',
        'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800'
      ]),
      variants: JSON.stringify([
        {
          id: 'var_001',
          name: '標準雙人 150x188cm',
          sku: 'SB-CL-150',
          price: 89000,
          originalPrice: 110000,
          size: '150x188cm',
          firmness: '中偏硬',
          inStock: true,
          sortOrder: 0
        },
        {
          id: 'var_002', 
          name: '加大雙人 180x188cm',
          sku: 'SB-CL-180',
          price: 109000,
          originalPrice: 130000,
          size: '180x188cm',
          firmness: '中偏硬',
          inStock: true,
          sortOrder: 1
        }
      ]),
      features: JSON.stringify([
        '獨立筒彈簧支撐系統',
        '天然乳膠舒適層',
        '透氣竹炭纖維面料',
        '十年品質保證',
        '免費到府安裝'
      ]),
      specifications: JSON.stringify({
        '彈簧數量': '1000+ 獨立筒',
        '厚度': '32cm',
        '硬度': '中偏硬',
        '保固': '10年',
        '產地': '台灣製造'
      }),
      inStock: true,
      featured: true,
      sortOrder: 0,
      seoTitle: '席夢思黑牌Classic床墊 | 台灣總代理 | 黑哥家居',
      seoDescription: '席夢思頂級黑牌Classic獨立筒床墊，提供極致睡眠品質。十年保固，免費到府安裝，分期0利率。'
    },
    {
      id: 'prod_002',
      name: '防蟎枕頭保護套組',
      slug: 'pillow-protector-set', 
      description: '高品質防蟎枕頭保護套，有效防止塵蟎孳生，保護您的健康睡眠環境。一組包含2個枕頭套。',
      category: 'accessories',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=800'
      ]),
      variants: JSON.stringify([
        {
          id: 'var_002',
          name: '標準尺寸 48x74cm', 
          sku: 'ACC-PP-STD',
          price: 1980,
          size: '48x74cm',
          inStock: true,
          sortOrder: 0
        }
      ]),
      features: JSON.stringify([
        '防蟎抗菌材質',
        '透氣不悶熱',
        '可機洗清潔',
        '包裝附贈2個'
      ]),
      specifications: JSON.stringify({
        '材質': '聚酯纖維',
        '尺寸': '48x74cm',
        '數量': '2個/組',
        '清潔': '可機洗'
      }),
      inStock: true,
      featured: false,
      sortOrder: 0
    },
    {
      id: 'prod_003',
      name: 'Tempur-Pedic 記憶枕',
      slug: 'tempur-pedic-pillow',
      description: '美國原裝進口Tempur-Pedic記憶枕，NASA太空科技材質，完美貼合頭頸曲線。',
      category: 'us-imports',
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800'
      ]),
      variants: JSON.stringify([
        {
          id: 'var_003',
          name: '標準型',
          sku: 'US-TP-STD', 
          price: 4800,
          originalPrice: 5800,
          size: '60x40cm',
          firmness: '中等',
          inStock: true,
          sortOrder: 0
        }
      ]),
      features: JSON.stringify([
        'NASA太空記憶棉',
        '美國原裝進口',
        '完美支撐頭頸',
        '5年品質保證'
      ]),
      specifications: JSON.stringify({
        '尺寸': '60x40x12cm',
        '材質': 'Tempur記憶棉',
        '密度': '50kg/m³',
        '保固': '5年',
        '產地': '美國'
      }),
      inStock: true,
      featured: true,
      sortOrder: 1
    }
  ];

  for (const product of productData) {
    await db.insert(products).values(product);
  }
  console.log('✅ Products seeded');
}

async function seedCustomers() {
  // Customer Tags
  const tagData = [
    {
      id: 'tag_001',
      name: 'VIP客戶',
      color: '#8B5CF6',
      description: '消費金額超過50萬的頂級客戶',
      category: 'behavioral'
    },
    {
      id: 'tag_002', 
      name: '回購客戶',
      color: '#10B981',
      description: '有多次購買記錄的忠實客戶',
      category: 'behavioral'
    },
    {
      id: 'tag_003',
      name: '年輕族群',
      color: '#F59E0B',
      description: '25-35歲的年輕消費族群',
      category: 'demographic'
    },
    {
      id: 'tag_004',
      name: '企業採購',
      color: '#EF4444',
      description: '企業大量採購客戶',
      category: 'custom'
    }
  ];

  for (const tag of tagData) {
    await db.insert(customerTags).values(tag);
  }

  // Customer Profiles
  const customerData = [
    {
      id: 'customer_001',
      userId: 'user_customer_001',
      customerNumber: 'CU202501001',
      name: '王小明',
      email: 'wang@example.com',
      phone: '+886-987-654-321',
      birthday: '1985-06-15',
      gender: 'male',
      address: JSON.stringify({
        city: '台北市',
        district: '信義區',
        street: '信義路五段7號',
        postalCode: '110'
      }),
      shippingAddresses: JSON.stringify([
        {
          city: '台北市',
          district: '信義區', 
          street: '信義路五段7號',
          postalCode: '110'
        }
      ]),
      totalSpent: 150000,
      orderCount: 3,
      avgOrderValue: 50000,
      lastPurchaseAt: new Date('2024-12-15'),
      firstPurchaseAt: new Date('2023-08-20'),
      favoriteCategories: JSON.stringify(['simmons-black', 'accessories']),
      segment: 'vip',
      lifetimeValue: 200000,
      churnRisk: 'low',
      lastContactAt: new Date('2024-12-20'),
      contactPreference: 'email',
      notes: '重要VIP客戶，對品質要求極高，推薦高端產品',
      source: 'google_ads'
    },
    {
      id: 'customer_002',
      userId: 'user_customer_002',
      customerNumber: 'CU202501002', 
      name: '李美華',
      email: 'lee@example.com',
      phone: '+886-912-888-999',
      birthday: '1990-03-22',
      gender: 'female',
      address: JSON.stringify({
        city: '新北市',
        district: '板橋區',
        street: '文化路一段188號',
        postalCode: '220'
      }),
      totalSpent: 45000,
      orderCount: 1,
      avgOrderValue: 45000,
      lastPurchaseAt: new Date('2024-11-30'),
      firstPurchaseAt: new Date('2024-11-30'),
      favoriteCategories: JSON.stringify(['accessories']),
      segment: 'new',
      lifetimeValue: 60000,
      churnRisk: 'medium',
      contactPreference: 'phone',
      notes: '首次購買客戶，對價格較敏感',
      source: 'facebook_ads'
    },
    {
      id: 'customer_003',
      customerNumber: 'CU202501003',
      name: '陳志強',
      email: 'chen@example.com', 
      phone: '+886-955-123-456',
      birthday: '1978-12-05',
      gender: 'male',
      address: JSON.stringify({
        city: '台中市',
        district: '西屯區',
        street: '台灣大道三段99號',
        postalCode: '407'
      }),
      totalSpent: 280000,
      orderCount: 4,
      avgOrderValue: 70000,
      lastPurchaseAt: new Date('2024-10-15'),
      firstPurchaseAt: new Date('2022-05-10'),
      favoriteCategories: JSON.stringify(['simmons-black', 'us-imports']),
      segment: 'regular',
      lifetimeValue: 350000,
      churnRisk: 'low',
      contactPreference: 'email',
      notes: '穩定回購客戶，偏好美國進口產品',
      source: 'referral'
    }
  ];

  for (const customer of customerData) {
    await db.insert(customerProfiles).values(customer);
  }

  // Tag Assignments
  const tagAssignments = [
    { id: 'assign_001', customerProfileId: 'customer_001', customerTagId: 'tag_001', assignedBy: 'admin', assignedAt: Date.now() },
    { id: 'assign_002', customerProfileId: 'customer_001', customerTagId: 'tag_002', assignedBy: 'admin', assignedAt: Date.now() },
    { id: 'assign_003', customerProfileId: 'customer_002', customerTagId: 'tag_003', assignedBy: 'admin', assignedAt: Date.now() },
    { id: 'assign_004', customerProfileId: 'customer_003', customerTagId: 'tag_002', assignedBy: 'admin', assignedAt: Date.now() },
    { id: 'assign_005', customerProfileId: 'customer_003', customerTagId: 'tag_004', assignedBy: 'admin', assignedAt: Date.now() },
  ];

  for (const assignment of tagAssignments) {
    await db.insert(customerTagAssignments).values(assignment);
  }

  // Customer Interactions
  const interactions = [
    {
      id: 'interaction_001',
      customerProfileId: 'customer_001',
      type: 'call',
      title: '產品諮詢電話',
      description: '客戶詢問新款床墊規格與價格',
      performedBy: 'Louis Chen',
      metadata: JSON.stringify({ duration: '15分鐘', outcome: '已發送報價單' }),
      createdAt: Date.now() - 86400000 * 2 // 2 days ago
    },
    {
      id: 'interaction_002',
      customerProfileId: 'customer_001',
      type: 'purchase', 
      title: '完成訂單 ORD-001',
      description: '購買席夢思黑牌Classic床墊',
      performedBy: 'system',
      relatedId: 'ORD-001',
      relatedType: 'order',
      metadata: JSON.stringify({ amount: 89000, method: '信用卡' }),
      createdAt: Date.now() - 86400000 * 7 // 1 week ago
    }
  ];

  for (const interaction of interactions) {
    await db.insert(customerInteractions).values(interaction);
  }

  console.log('✅ Customer data seeded');
}

async function seedOrders() {
  const orderData = [
    {
      id: 'ORD-001',
      orderNumber: 'BL-2024-001',
      customerId: 'customer_001',
      customerName: '王小明',
      customerEmail: 'wang@example.com',
      customerPhone: '+886-987-654-321',
      items: JSON.stringify([
        {
          productId: 'prod_001',
          variantId: 'var_001',
          name: '席夢思黑牌 Classic 獨立筒床墊',
          variant: '標準雙人 150x188cm',
          price: 89000,
          quantity: 1,
          total: 89000
        }
      ]),
      subtotal: 89000,
      shippingFee: 0,
      tax: 0,
      totalAmount: 89000,
      shippingAddress: JSON.stringify({
        name: '王小明',
        phone: '+886-987-654-321',
        city: '台北市',
        district: '信義區',
        street: '信義路五段7號',
        postalCode: '110'
      }),
      billingAddress: JSON.stringify({
        name: '王小明',
        phone: '+886-987-654-321',
        city: '台北市', 
        district: '信義區',
        street: '信義路五段7號',
        postalCode: '110'
      }),
      paymentMethod: 'credit_card',
      paymentStatus: 'paid',
      orderStatus: 'delivered',
      notes: '客戶要求週末配送',
      deliveryDate: new Date('2024-12-20'),
      paidAt: new Date('2024-12-15'),
      shippedAt: new Date('2024-12-18'),
      deliveredAt: new Date('2024-12-20')
    },
    {
      id: 'ORD-002',
      orderNumber: 'BL-2024-002',
      customerId: 'customer_002',
      customerName: '李美華',
      customerEmail: 'lee@example.com',
      customerPhone: '+886-912-888-999',
      items: JSON.stringify([
        {
          productId: 'prod_002',
          variantId: 'var_002',
          name: '防蟎枕頭保護套組',
          variant: '標準尺寸 48x74cm',
          price: 1980,
          quantity: 2,
          total: 3960
        }
      ]),
      subtotal: 3960,
      shippingFee: 150,
      tax: 0,
      totalAmount: 4110,
      shippingAddress: JSON.stringify({
        name: '李美華',
        phone: '+886-912-888-999',
        city: '新北市',
        district: '板橋區',
        street: '文化路一段188號',
        postalCode: '220'
      }),
      paymentMethod: 'bank_transfer',
      paymentStatus: 'pending',
      orderStatus: 'processing',
      notes: '',
      deliveryDate: new Date('2025-01-10')
    }
  ];

  for (const order of orderData) {
    await db.insert(orders).values(order);
  }
  console.log('✅ Orders seeded');
}

async function seedAppointments() {
  const appointmentData = [
    {
      id: 'apt_001',
      customerName: '張三豐',
      customerEmail: 'zhang@example.com',
      customerPhone: '+886-922-333-444',
      appointmentDate: new Date('2025-01-15'),
      timeSlot: '14:00-15:00',
      serviceType: 'showroom_visit',
      status: 'confirmed',
      notes: '希望試躺床墊，比較不同硬度',
      preferredProducts: JSON.stringify(['席夢思黑牌', '美國進口枕頭']),
      assignedStaff: 'Louis Chen',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'apt_002', 
      customerName: '林小雨',
      customerEmail: 'lin@example.com',
      customerPhone: '+886-933-666-777',
      appointmentDate: new Date('2025-01-18'),
      timeSlot: '10:00-11:00',
      serviceType: 'home_consultation',
      status: 'pending',
      notes: '新居裝潢，需要整套寢具建議',
      address: JSON.stringify({
        city: '高雄市',
        district: '左營區',
        street: '博愛二路777號',
        postalCode: '813'
      }),
      assignedStaff: '',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  for (const appointment of appointmentData) {
    await db.insert(appointments).values(appointment);
  }
  console.log('✅ Appointments seeded');
}

async function seedContent() {
  // Posts
  const postData = [
    {
      id: 'post_001',
      title: '如何選擇適合的床墊硬度？',
      slug: 'how-to-choose-mattress-firmness',
      content: '選擇床墊硬度是購買床墊時最重要的考量之一。本文將詳細介紹如何根據睡眠姿勢、體重和個人偏好來選擇最適合的床墊硬度...',
      excerpt: '專業指南：根據睡眠姿勢和體重選擇最適合的床墊硬度',
      featuredImage: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800',
      category: 'sleep_tips',
      tags: JSON.stringify(['床墊選購', '睡眠品質', '購買指南']),
      status: 'published',
      featured: true,
      seoTitle: '床墊硬度選購指南 | 如何選擇適合的床墊 | 黑哥家居',
      seoDescription: '專業床墊硬度選購指南，教您根據睡眠習慣選擇最適合的床墊。提升睡眠品質從選對床墊開始。',
      authorId: 'user_admin_001',
      publishedAt: new Date('2024-12-01'),
      viewCount: 1250
    },
    {
      id: 'post_002',
      title: '席夢思床墊保養小撇步',
      slug: 'simmons-mattress-care-tips',
      content: '席夢思床墊是高品質寢具的代表，正確的保養方式能延長使用壽命並維持最佳睡眠品質...',
      excerpt: '專業保養指南，讓您的席夢思床墊用得更久更舒適',
      featuredImage: 'https://images.unsplash.com/photo-1541558869434-2840d308329a?w=800',
      category: 'product_care',
      tags: JSON.stringify(['席夢思', '床墊保養', '使用技巧']),
      status: 'published',
      featured: false,
      authorId: 'user_admin_001',
      publishedAt: new Date('2024-11-15'),
      viewCount: 890
    }
  ];

  for (const post of postData) {
    await db.insert(posts).values(post);
  }

  // Reviews
  const reviewData = [
    {
      id: 'review_001',
      productId: 'prod_001',
      customerId: 'customer_001',
      customerName: '王小明',
      rating: 5,
      title: '非常滿意的購買體驗',
      content: '床墊品質確實很好，睡起來很舒適，客服服務也很棒！配送人員很專業，安裝也很仔細。',
      verified: true,
      helpful: 8,
      status: 'approved'
    },
    {
      id: 'review_002',
      productId: 'prod_003',
      customerId: 'customer_003',
      customerName: '陳志強',
      rating: 4,
      title: '品質不錯，但價格偏高',
      content: '枕頭品質確實很好，支撐性也不錯，但價格相對較高。整體來說還是值得購買的。',
      verified: true,
      helpful: 5,
      status: 'approved'
    }
  ];

  for (const review of reviewData) {
    await db.insert(reviews).values(review);
  }
  console.log('✅ Content seeded');
}

async function seedCommunications() {
  // Newsletter subscriptions
  const newsletterData = [
    {
      id: 'newsletter_001',
      email: 'subscriber1@example.com',
      name: '訂閱者一',
      status: 'active',
      preferences: JSON.stringify({
        productUpdates: true,
        promotions: true,
        tips: false
      }),
      source: 'website_footer',
      confirmedAt: new Date()
    },
    {
      id: 'newsletter_002',
      email: 'subscriber2@example.com', 
      name: '訂閱者二',
      status: 'active',
      preferences: JSON.stringify({
        productUpdates: false,
        promotions: true,
        tips: true
      }),
      source: 'checkout_page',
      confirmedAt: new Date()
    }
  ];

  for (const newsletter of newsletterData) {
    await db.insert(newsletters).values(newsletter);
  }

  // Contact messages
  const contactData = [
    {
      id: 'contact_001',
      name: '潛在客戶',
      email: 'potential@example.com',
      phone: '+886-987-123-456',
      subject: '產品詢價',
      message: '想了解席夢思床墊的價格和規格，可否提供詳細資料？',
      type: 'inquiry',
      status: 'new',
      source: 'contact_form'
    },
    {
      id: 'contact_002',
      name: '現有客戶',
      email: 'existing@example.com',
      phone: '+886-912-789-123',
      subject: '售後服務',
      message: '床墊使用一年後有點下陷，想了解保固相關事宜。',
      type: 'support',
      status: 'in_progress',
      source: 'phone',
      assignedTo: 'user_admin_001',
      responseAt: new Date()
    }
  ];

  for (const contact of contactData) {
    await db.insert(contacts).values(contact);
  }
  console.log('✅ Communications seeded');
}

// Execute seeding if run directly
if (import.meta.main) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}