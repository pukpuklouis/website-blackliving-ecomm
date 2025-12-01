export async function verifyTurnstile(c: any, token: string) {
    const secret = c.env.TURNSTILE_SECRET_KEY;
    if (!secret) {
        throw new Error('Turnstile secret key not configured');
    }

    const ip =
        c.req.header('cf-connecting-ip') ||
        c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
        c.req.header('x-real-ip') ||
        '';

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            secret,
            response: token,
            remoteip: ip,
        }),
    });

    if (!response.ok) {
        console.error('Turnstile verification failed with status', response.status);
        return false;
    }

    const data = (await response.json()) as { success: boolean; 'error-codes'?: string[] };

    if (!data.success) {
        console.error('Turnstile verification failed. Token:', token.substring(0, 10) + '...');
        console.error('Cloudflare Error Codes:', data['error-codes']);
    }

    return data.success === true;
}
