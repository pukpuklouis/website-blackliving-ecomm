# Google OAuth Setup for Local Development

## Why Separate OAuth Apps?

**Security Best Practice:** Development and production should use separate OAuth apps to:

- Prevent localhost from being an authorized redirect in production
- Isolate test users from real users
- Allow different scopes and settings per environment

## Setup Steps

### 1. Go to Google Cloud Console

Visit: https://console.cloud.google.com/apis/credentials

### 2. Create New OAuth 2.0 Client ID

1. Click **"+ CREATE CREDENTIALS"**
2. Select **"OAuth client ID"**
3. Choose application type: **"Web application"**
4. Name: **"Black Living - Local Development"**

### 3. Configure Authorized Redirect URIs

Add ONLY localhost URLs for development:

```
http://localhost:8787/api/auth/callback/google
```

**DO NOT** add staging or production URLs to this OAuth app!

### 4. Copy Credentials

After creating:

1. Copy **Client ID** (looks like: `xxxxx.apps.googleusercontent.com`)
2. Copy **Client Secret** (looks like: `GOCSPX-xxxxx`)

### 5. Update .dev.vars

Replace the existing Google credentials in `apps/api/.dev.vars`:

```bash
GOOGLE_CLIENT_ID=your-new-dev-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-new-dev-client-secret
```

## Verification

After setup, your OAuth apps should be:

### Development (localhost)

- **Client ID:** (new dev client ID)
- **Redirect URI:** http://localhost:8787/api/auth/callback/google
- **Used by:** Local dev server only

### Staging/Production

- **Client ID:** (existing staging/production client ID)
- **Redirect URI:** https://blackliving-api-staging.pukpuk-tw.workers.dev/api/auth/callback/google
- **Used by:** Deployed environments only

## Next Steps

After updating `.dev.vars` with the new credentials:

1. Restart your API dev server: `pnpm dev`
2. Test login at http://localhost:5173
3. OAuth callback should redirect to localhost correctly

## Troubleshooting

**Error: "redirect_uri_mismatch"**

- Check that http://localhost:8787/api/auth/callback/google is in authorized redirect URIs
- No trailing slash
- Use http (not https) for localhost

**Error: "invalid_client"**

- Double-check Client ID and Secret are copied correctly
- Ensure no extra spaces in .dev.vars file
