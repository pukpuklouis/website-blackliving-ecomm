#!/usr/bin/env node

/**
 * Simple script to add test data to the local database
 */

const { execSync } = require('child_process');

const testData = `
-- Insert test users
INSERT INTO users (id, name, email, image, createdAt, updatedAt) VALUES 
('test-user-1', 'John Doe', 'john@example.com', 'https://example.com/avatar1.jpg', datetime('now'), datetime('now')),
('test-user-2', 'Jane Smith', 'jane@example.com', 'https://example.com/avatar2.jpg', datetime('now'), datetime('now'));

-- Insert test products
INSERT INTO products (id, name, slug, description, price, categoryId, images, isActive, createdAt, updatedAt) VALUES 
('prod-1', 'Simmons Black Label Premium', 'simmons-black-premium', 'Premium Simmons Black Label mattress', 89900, 'simmons-black', '["https://example.com/mattress1.jpg"]', 1, datetime('now'), datetime('now')),
('prod-2', 'Simmons Black Label Deluxe', 'simmons-black-deluxe', 'Deluxe Simmons Black Label mattress', 129900, 'simmons-black', '["https://example.com/mattress2.jpg"]', 1, datetime('now'), datetime('now'));

-- Insert test orders  
INSERT INTO orders (id, userId, status, totalAmount, createdAt, updatedAt) VALUES
('order-1', 'test-user-1', 'pending', 89900, datetime('now'), datetime('now')),
('order-2', 'test-user-2', 'completed', 129900, datetime('now'), datetime('now'));
`;

try {
  console.log('🌱 Seeding test data into local database...');
  
  // Write SQL to temp file
  const fs = require('fs');
  fs.writeFileSync('./temp-seed.sql', testData);
  
  // Execute SQL
  execSync('sqlite3 local-dev.db < temp-seed.sql', { stdio: 'inherit' });
  
  // Clean up
  fs.unlinkSync('./temp-seed.sql');
  
  console.log('✅ Test data seeded successfully!');
  console.log('📊 Run: cd packages/db && pnpm db:studio:local');
  
} catch (error) {
  console.error('❌ Seeding failed:', error.message);
  process.exit(1);
}