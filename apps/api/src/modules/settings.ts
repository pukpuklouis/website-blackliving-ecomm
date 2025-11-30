import { Hono } from 'hono';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { settings } from '@blackliving/db/schema';
import { createId } from '@paralleldrive/cuid2';
import { requireAdmin } from '../middleware/auth';

type Env = {
    Variables: {
        db: any;
        cache: any;
        user: any;
    };
};

const app = new Hono<Env>();

// Validation Schemas
const remoteZoneSchema = z.object({
    id: z.string(),
    city: z.string(),
    district: z.string().optional(),
    surcharge: z.number().min(0),
});

const logisticSettingsSchema = z.object({
    baseFee: z.number().min(0),
    freeShippingThreshold: z.number().min(0),
    remoteZones: z.array(remoteZoneSchema).default([]),
});

// GET /api/settings/:key - Get setting by key
app.get('/:key', async (c) => {
    try {
        const db = c.get('db');
        const key = c.req.param('key');

        const [setting] = await db
            .select()
            .from(settings)
            .where(eq(settings.key, key))
            .limit(1);

        if (!setting) {
            // Return 404 if not found
            return c.json(
                {
                    success: false,
                    error: 'Not Found',
                    message: 'Setting not found',
                },
                404
            );
        }

        return c.json({
            success: true,
            data: setting.value,
        });
    } catch (error) {
        console.error('Error fetching setting:', error);
        return c.json(
            {
                success: false,
                error: 'Internal Server Error',
                message: 'Failed to fetch setting',
            },
            500
        );
    }
});

// PUT /api/settings/:key - Update setting by key (Admin only)
app.put('/:key', requireAdmin(), async (c) => {
    try {
        const db = c.get('db');
        const key = c.req.param('key');
        const body = await c.req.json();

        // Validate based on key (currently only logistic_settings supported)
        if (key === 'logistic_settings') {
            const validation = logisticSettingsSchema.safeParse(body);
            if (!validation.success) {
                return c.json(
                    {
                        success: false,
                        error: 'Validation Error',
                        message: 'Invalid settings format',
                        details: validation.error.errors,
                    },
                    400
                );
            }
        }

        // Check if setting exists
        const [existingSetting] = await db
            .select()
            .from(settings)
            .where(eq(settings.key, key))
            .limit(1);

        let result;
        const now = new Date();

        if (existingSetting) {
            // Update
            [result] = await db
                .update(settings)
                .set({
                    value: body,
                    updatedAt: now,
                })
                .where(eq(settings.key, key))
                .returning();
        } else {
            // Insert
            [result] = await db
                .insert(settings)
                .values({
                    id: createId(),
                    key,
                    value: body,
                    updatedAt: now,
                })
                .returning();
        }

        return c.json({
            success: true,
            data: result.value,
            message: 'Setting updated successfully',
        });
    } catch (error) {
        console.error('Error updating setting:', error);
        return c.json(
            {
                success: false,
                error: 'Internal Server Error',
                message: 'Failed to update setting',
            },
            500
        );
    }
});

export default app;
