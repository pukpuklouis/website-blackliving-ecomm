import { Hono } from 'hono';
import { reindexAll } from '../modules/search';

type Env = {
    Bindings: {
        DB: D1Database;
        CACHE: KVNamespace;
        R2: R2Bucket;
        NODE_ENV: string;
    };
    Variables: {
        db: any;
        cache: any;
        storage: any;
        user: any;
        session: any;
    };
};

const app = new Hono<Env>();

// Require admin role for reindex endpoint
const requireAdmin = async (c: any, next: any) => {
    const user = c.get('user');
    if (!user || user.role !== 'admin') {
        return c.json(
            {
                success: false,
                error: 'Unauthorized',
                message: 'Admin access required',
            },
            403
        );
    }
    await next();
};

// POST /api/search/reindex - Trigger full content reindex
app.post('/reindex', requireAdmin, async (c) => {
    try {
        // Start reindex process
        const result = await reindexAll(c);

        return c.json({
            success: true,
            data: {
                indexed: result.indexed,
                errors: result.errors,
            },
            message: result.errors.length === 0
                ? `成功索引 ${result.indexed} 個文件`
                : `已索引 ${result.indexed} 個文件，發生 ${result.errors.length} 個錯誤`,
        });
    } catch (error) {
        console.error('Error during reindex:', error);
        return c.json({
            success: false,
            error: 'Internal Server Error',
            message: '重新索引失敗',
        }, 500);
    }
});

export default app;