// Simple D1 seeding script that can be executed with Wrangler
// This creates sample data for all tables

console.log('🌱 Starting D1 database seeding...');

// Sample data to insert
const sampleData = {
  users: [
    {
      id: 'user_admin_001',
      name: 'Louis Chen',
      email: 'pukpuk.tw@gmail.com',
      email_verified: 1,
      role: 'admin',
      phone: '+886-912-345-678',
      image: 'https://lh3.googleusercontent.com/a/ACg8ocJZWZvXJZ4YyeVNF9tD-V553wXeGPOn3hXM-lvst-p15Jg-d4oQ=s96-c',
      preferences: '{"theme":"light","notifications":true}',
      created_at: Date.now(),
      updated_at: Date.now()
    },
    {
      id: 'user_customer_001',
      name: '王小明',
      email: 'wang@example.com',
      email_verified: 1,
      role: 'customer',
      phone: '+886-987-654-321',
      preferences: '{"theme":"light","emailUpdates":true}',
      created_at: Date.now(),
      updated_at: Date.now()
    }
  ],

  customer_profiles: [
    {
      id: 'customer_001',
      user_id: 'user_customer_001',
      customer_number: 'CU202501001',
      name: '王小明',
      email: 'wang@example.com',
      phone: '+886-987-654-321',
      birthday: '1985-06-15',
      gender: 'male',
      address: '{"city":"台北市","district":"信義區","street":"信義路五段7號","postalCode":"110"}',
      shipping_addresses: '[{"city":"台北市","district":"信義區","street":"信義路五段7號","postalCode":"110"}]',
      total_spent: 150000,
      order_count: 3,
      avg_order_value: 50000,
      last_purchase_at: Date.now() - 86400000 * 30, // 30 days ago
      first_purchase_at: Date.now() - 86400000 * 365, // 1 year ago
      favorite_categories: '["simmons-black","accessories"]',
      segment: 'vip',
      lifetime_value: 200000,
      churn_risk: 'low',
      last_contact_at: Date.now() - 86400000 * 10,
      contact_preference: 'email',
      notes: '重要VIP客戶，對品質要求極高',
      source: 'google_ads',
      created_at: Date.now(),
      updated_at: Date.now()
    },
    {
      id: 'customer_002',
      customer_number: 'CU202501002',
      name: '李美華',
      email: 'lee@example.com',
      phone: '+886-912-888-999',
      birthday: '1990-03-22',
      gender: 'female',
      address: '{"city":"新北市","district":"板橋區","street":"文化路一段188號","postalCode":"220"}',
      total_spent: 45000,
      order_count: 1,
      avg_order_value: 45000,
      segment: 'new',
      lifetime_value: 60000,
      churn_risk: 'medium',
      contact_preference: 'phone',
      notes: '首次購買客戶',
      source: 'facebook_ads',
      created_at: Date.now(),
      updated_at: Date.now()
    }
  ],

  customer_tags: [
    {
      id: 'tag_001',
      name: 'VIP客戶',
      color: '#8B5CF6',
      description: '消費金額超過50萬的頂級客戶',
      category: 'behavioral',
      created_at: Date.now()
    },
    {
      id: 'tag_002',
      name: '回購客戶',
      color: '#10B981',
      description: '有多次購買記錄的忠實客戶',
      category: 'behavioral',
      created_at: Date.now()
    }
  ],

  customer_tag_assignments: [
    {
      id: 'assign_001',
      customer_profile_id: 'customer_001',
      customer_tag_id: 'tag_001',
      assigned_by: 'admin',
      assigned_at: Date.now()
    },
    {
      id: 'assign_002',
      customer_profile_id: 'customer_001',
      customer_tag_id: 'tag_002',
      assigned_by: 'admin',
      assigned_at: Date.now()
    }
  ],

  customer_interactions: [
    {
      id: 'interaction_001',
      customer_profile_id: 'customer_001',
      type: 'call',
      title: '產品諮詢電話',
      description: '客戶詢問新款床墊規格與價格',
      performed_by: 'Louis Chen',
      metadata: '{"duration":"15分鐘","outcome":"已發送報價單"}',
      created_at: Date.now() - 86400000 * 2
    }
  ],

  orders: [
    {
      id: 'ORD-001',
      order_number: 'BL-2024-001',
      customer_id: 'customer_001',
      customer_name: '王小明',
      customer_email: 'wang@example.com',
      customer_phone: '+886-987-654-321',
      items: '[{"productId":"prod_001","name":"席夢思黑牌床墊","price":89000,"quantity":1}]',
      subtotal: 89000,
      shipping_fee: 0,
      tax: 0,
      total_amount: 89000,
      shipping_address: '{"name":"王小明","city":"台北市","street":"信義路五段7號"}',
      payment_method: 'credit_card',
      payment_status: 'paid',
      order_status: 'delivered',
      notes: '客戶要求週末配送',
      created_at: Date.now() - 86400000 * 15,
      updated_at: Date.now() - 86400000 * 10
    }
  ],

  appointments: [
    {
      id: 'apt_001',
      customer_name: '張三豐',
      customer_email: 'zhang@example.com',
      customer_phone: '+886-922-333-444',
      appointment_date: Date.now() + 86400000 * 10, // 10 days from now
      time_slot: '14:00-15:00',
      service_type: 'showroom_visit',
      status: 'confirmed',
      notes: '希望試躺床墊，比較不同硬度',
      preferred_products: '["席夢思黑牌","美國進口枕頭"]',
      assigned_staff: 'Louis Chen',
      created_at: Date.now(),
      updated_at: Date.now()
    }
  ]
};

// Execute seeding
export default {
  async fetch(request, env) {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      console.log('Clearing existing data...');
      
      // Clear existing data (optional)
      await env.DB.prepare('DELETE FROM customer_interactions').run();
      await env.DB.prepare('DELETE FROM customer_tag_assignments').run();
      await env.DB.prepare('DELETE FROM customer_tags').run(); 
      await env.DB.prepare('DELETE FROM customer_profiles').run();
      await env.DB.prepare('DELETE FROM appointments').run();
      await env.DB.prepare('DELETE FROM orders').run();

      console.log('Inserting sample data...');

      // Insert users
      for (const user of sampleData.users) {
        await env.DB.prepare(`
          INSERT OR REPLACE INTO users (
            id, name, email, email_verified, role, phone, image, preferences, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          user.id, user.name, user.email, user.email_verified, user.role,
          user.phone, user.image, user.preferences, user.created_at, user.updated_at
        ).run();
      }

      // Insert customer profiles
      for (const profile of sampleData.customer_profiles) {
        await env.DB.prepare(`
          INSERT INTO customer_profiles (
            id, user_id, customer_number, name, email, phone, birthday, gender,
            address, shipping_addresses, total_spent, order_count, avg_order_value,
            last_purchase_at, first_purchase_at, favorite_categories, segment,
            lifetime_value, churn_risk, last_contact_at, contact_preference,
            notes, source, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          profile.id, profile.user_id, profile.customer_number, profile.name,
          profile.email, profile.phone, profile.birthday, profile.gender,
          profile.address, profile.shipping_addresses, profile.total_spent,
          profile.order_count, profile.avg_order_value, profile.last_purchase_at,
          profile.first_purchase_at, profile.favorite_categories, profile.segment,
          profile.lifetime_value, profile.churn_risk, profile.last_contact_at,
          profile.contact_preference, profile.notes, profile.source,
          profile.created_at, profile.updated_at
        ).run();
      }

      // Insert customer tags
      for (const tag of sampleData.customer_tags) {
        await env.DB.prepare(`
          INSERT INTO customer_tags (id, name, color, description, category, created_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(tag.id, tag.name, tag.color, tag.description, tag.category, tag.created_at).run();
      }

      // Insert tag assignments
      for (const assignment of sampleData.customer_tag_assignments) {
        await env.DB.prepare(`
          INSERT INTO customer_tag_assignments (
            id, customer_profile_id, customer_tag_id, assigned_by, assigned_at
          ) VALUES (?, ?, ?, ?, ?)
        `).bind(
          assignment.id, assignment.customer_profile_id, assignment.customer_tag_id,
          assignment.assigned_by, assignment.assigned_at
        ).run();
      }

      // Insert interactions
      for (const interaction of sampleData.customer_interactions) {
        await env.DB.prepare(`
          INSERT INTO customer_interactions (
            id, customer_profile_id, type, title, description, performed_by, metadata, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          interaction.id, interaction.customer_profile_id, interaction.type,
          interaction.title, interaction.description, interaction.performed_by,
          interaction.metadata, interaction.created_at
        ).run();
      }

      // Insert orders
      for (const order of sampleData.orders) {
        await env.DB.prepare(`
          INSERT INTO orders (
            id, order_number, customer_id, customer_name, customer_email, customer_phone,
            items, subtotal, shipping_fee, tax, total_amount, shipping_address,
            payment_method, payment_status, order_status, notes, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          order.id, order.order_number, order.customer_id, order.customer_name,
          order.customer_email, order.customer_phone, order.items, order.subtotal,
          order.shipping_fee, order.tax, order.total_amount, order.shipping_address,
          order.payment_method, order.payment_status, order.order_status,
          order.notes, order.created_at, order.updated_at
        ).run();
      }

      // Insert appointments
      for (const appointment of sampleData.appointments) {
        await env.DB.prepare(`
          INSERT INTO appointments (
            id, customer_name, customer_email, customer_phone, appointment_date,
            time_slot, service_type, status, notes, preferred_products,
            assigned_staff, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          appointment.id, appointment.customer_name, appointment.customer_email,
          appointment.customer_phone, appointment.appointment_date, appointment.time_slot,
          appointment.service_type, appointment.status, appointment.notes,
          appointment.preferred_products, appointment.assigned_staff,
          appointment.created_at, appointment.updated_at
        ).run();
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'Database seeded successfully!',
        insertedData: {
          users: sampleData.users.length,
          customer_profiles: sampleData.customer_profiles.length,
          customer_tags: sampleData.customer_tags.length,
          customer_tag_assignments: sampleData.customer_tag_assignments.length,
          customer_interactions: sampleData.customer_interactions.length,
          orders: sampleData.orders.length,
          appointments: sampleData.appointments.length
        }
      }), {
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Seeding failed:', error);
      return new Response(JSON.stringify({
        success: false,
        error: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};