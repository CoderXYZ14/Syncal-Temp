# Setup Guide

## Environment Configuration

Create a `.env.local` file in the root directory with these variables:

```env
# NextAuth (REQUIRED)
# For localhost development:
# NEXTAUTH_URL=http://localhost:3000
# For ngrok/HTTPS development (replace with your ngrok URL):
NEXTAUTH_URL=https://your-ngrok-subdomain.ngrok-free.app
NEXTAUTH_SECRET=4g9NeWegy3k6os/W9yQdKRRribePyqnbb2zOGhZxmGc=

# MongoDB (REQUIRED)
MONGODB_URI=mongodb://localhost:27017/google-calendar-tracker

# Google OAuth & Calendar API (REQUIRED)
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
```

## Fixing OAuth Callback Error

The "State cookie was missing" error is caused by missing environment variables. Make sure:

1. **Set NEXTAUTH_SECRET**: Use the generated secret above (or generate a new one with `openssl rand -base64 32`)

2. **Set NEXTAUTH_URL**: Must match your development URL exactly

3. **Google OAuth Setup**:

   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create credentials for "Web application"
   - Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
   - Copy Client ID and Secret to your `.env.local`

4. **Restart the server** after adding environment variables:
   ```bash
   pnpm dev
   ```

## Troubleshooting

If you still get OAuth errors:

1. Clear your browser cookies for localhost:3000
2. Try incognito/private browsing mode
3. Check that all environment variables are set correctly
4. Verify Google OAuth setup in Cloud Console

## MongoDB Setup

For local development:

```bash
# Install MongoDB locally or use Docker
docker run -d -p 27017:27017 --name mongodb mongo

# Or use MongoDB Atlas (cloud)
# Update MONGODB_URI with your Atlas connection string
```
