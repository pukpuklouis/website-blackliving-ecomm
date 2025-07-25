import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { Env } from '../index';

const products = new Hono<{ Bindings: Env }>();

// Validation schemas
const createProductSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  category: z.enum(['simmons-black', 'accessories', 'us-imports']),
  variants: z.array(z.object({
    size: z.string(),
    firmness: z.string().optional(),
    price: z.number().positive(),
    originalPrice: z.number().positive().optional(),
  })),
  features: z.array(z.string()),
  specifications: z.record(z.string()),
  inStock: z.boolean().default(true),
  featured: z.boolean().default(false),
});

const updateProductSchema = createProductSchema.partial();

// GET /api/products - List all products
products.get('/', async (c) => {
  try {
    const { category, featured, inStock } = c.req.query();
    
    // Build query based on filters
    let query = 'SELECT * FROM products WHERE 1=1';
    const params: any[] = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    if (featured !== undefined) {
      query += ' AND featured = ?';
      params.push(featured === 'true' ? 1 : 0);
    }

    if (inStock !== undefined) {
      query += ' AND inStock = ?';
      params.push(inStock === 'true' ? 1 : 0);
    }

    query += ' ORDER BY created_at DESC';

    const result = await c.env.DB.prepare(query).bind(...params).all();
    
    return c.json({
      success: true,
      data: result.results,
      total: result.results.length
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    return c.json({ error: 'Failed to fetch products' }, 500);
  }
});

// GET /api/products/:id - Get single product
products.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    
    const result = await c.env.DB.prepare(
      'SELECT * FROM products WHERE id = ?'
    ).bind(id).first();

    if (!result) {
      return c.json({ error: 'Product not found' }, 404);
    }

    return c.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error fetching product:', error);
    return c.json({ error: 'Failed to fetch product' }, 500);
  }
});

// POST /api/products - Create new product (Admin only)
products.post('/', 
  zValidator('json', createProductSchema),
  async (c) => {
    try {
      // TODO: Add authentication middleware to check admin role
      const data = c.req.valid('json');
      
      const id = crypto.randomUUID();
      const now = new Date().toISOString();

      await c.env.DB.prepare(`
        INSERT INTO products (
          id, name, description, category, variants, features, 
          specifications, inStock, featured, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id,
        data.name,
        data.description,
        data.category,
        JSON.stringify(data.variants),
        JSON.stringify(data.features),
        JSON.stringify(data.specifications),
        data.inStock ? 1 : 0,
        data.featured ? 1 : 0,
        now,
        now
      ).run();

      return c.json({
        success: true,
        data: { id, ...data, created_at: now, updated_at: now }
      }, 201);

    } catch (error) {
      console.error('Error creating product:', error);
      return c.json({ error: 'Failed to create product' }, 500);
    }
  }
);

// PUT /api/products/:id - Update product (Admin only)
products.put('/:id',
  zValidator('json', updateProductSchema),
  async (c) => {
    try {
      // TODO: Add authentication middleware to check admin role
      const id = c.req.param('id');
      const data = c.req.valid('json');

      const updateFields: string[] = [];
      const updateValues: any[] = [];

      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) {
          updateFields.push(`${key} = ?`);
          if (typeof value === 'object') {
            updateValues.push(JSON.stringify(value));
          } else if (typeof value === 'boolean') {
            updateValues.push(value ? 1 : 0);
          } else {
            updateValues.push(value);
          }
        }
      });

      if (updateFields.length === 0) {
        return c.json({ error: 'No fields to update' }, 400);
      }

      updateFields.push('updated_at = ?');
      updateValues.push(new Date().toISOString());
      updateValues.push(id);

      const query = `UPDATE products SET ${updateFields.join(', ')} WHERE id = ?`;
      
      const result = await c.env.DB.prepare(query).bind(...updateValues).run();

      if (result.changes === 0) {
        return c.json({ error: 'Product not found' }, 404);
      }

      return c.json({
        success: true,
        message: 'Product updated successfully'
      });

    } catch (error) {
      console.error('Error updating product:', error);
      return c.json({ error: 'Failed to update product' }, 500);
    }
  }
);

// DELETE /api/products/:id - Delete product (Admin only)
products.delete('/:id', async (c) => {
  try {
    // TODO: Add authentication middleware to check admin role
    const id = c.req.param('id');

    const result = await c.env.DB.prepare(
      'DELETE FROM products WHERE id = ?'
    ).bind(id).run();

    if (result.changes === 0) {
      return c.json({ error: 'Product not found' }, 404);
    }

    return c.json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting product:', error);
    return c.json({ error: 'Failed to delete product' }, 500);
  }
});

export default products;