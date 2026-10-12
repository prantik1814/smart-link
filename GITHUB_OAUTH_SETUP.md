# GitHub OAuth Setup Guide

To enable GitHub OAuth for saving to Gists, you need to register a GitHub OAuth App.

## Step 1: Register GitHub OAuth App

1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Click "New OAuth App"
3. Fill in the details:
   - **Application name**: Music Smart Link Editor
   - **Homepage URL**: `http://localhost:5173` (for development) or your production URL
   - **Authorization callback URL**: `http://localhost:5173/oauth/callback` (for development) or `https://yourdomain.com/oauth/callback`

## Step 2: Get Credentials

After creating the app, you'll get:
- **Client ID**: Copy this
- **Client Secret**: Generate and copy this (keep it secure!)

## Step 3: Start OAuth Proxy Server

The OAuth implementation now uses a local proxy server to handle token exchange:

1. **Install proxy dependencies:**
   ```bash
   # Copy the proxy package.json
   cp oauth-proxy-package.json package-proxy.json
   cd /tmp && npm init -y && npm install express cors node-fetch
   ```

2. **Start the proxy server:**
   ```bash
   # From your project directory
   node oauth-proxy.js
   ```

   The proxy will run on `http://localhost:3001`

3. **Your OAuth app is already configured!**
   - Client ID: `Ov23liIuWC6urHcAWj6r`
   - Proxy handles the secure token exchange
   - No need to expose client secret in frontend

## Step 4: Test OAuth Flow

1. Start the proxy server: `node oauth-proxy.js`
2. Start your dev server: `npm run dev`
3. Click "Connect with GitHub" in the form
4. Authorize the application
5. You should be logged in and ready to save to Gists!

## Step 4: Production Considerations

⚠️ **Important**: In production, the token exchange should be done on your backend server, not in the frontend code, to protect your client secret.

### Backend Implementation (Recommended)

Create a backend endpoint that:
1. Receives the OAuth code from the frontend
2. Exchanges it for an access token using the client secret
3. Returns the access token to the frontend

### Frontend-Only (Development Only)

For development/testing, you can use the frontend-only approach, but:
- Never expose your client secret in production
- Consider using environment variables
- Implement proper CORS on your backend

## Step 5: Test the Flow

1. Click "Connect with GitHub"
2. Authorize the application
3. You should be redirected back and authenticated
4. Test saving a configuration to Gist

## OAuth App Permissions

Required scopes:
- `gist` - Create and manage gists

The app only requests minimal permissions needed for the functionality.

## Security Notes

- Use HTTPS in production
- Store client secret securely (environment variables)
- Consider implementing token refresh if needed
- Validate the OAuth state parameter to prevent CSRF attacks
