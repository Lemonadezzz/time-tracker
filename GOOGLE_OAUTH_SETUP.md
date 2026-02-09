# Google OAuth Setup Guide

## ✅ Implementation Complete!

Your Time Tracker now supports **invite-only Google OAuth login**.

## 🔧 Final Setup Steps:

### 1. Add Your Google Credentials to `.env.local`

Replace these values with your actual Google OAuth credentials:

```env
GOOGLE_CLIENT_ID=your_actual_google_client_id
GOOGLE_CLIENT_SECRET=your_actual_google_client_secret
```

### 2. Configure Google Cloud Console

In your Google Cloud Console project:

1. Go to **APIs & Services** → **Credentials**
2. Click on your OAuth 2.0 Client ID
3. Add these **Authorized redirect URIs**:
   - `http://localhost:3000/api/auth/callback/google` (for development)
   - `https://yourdomain.com/api/auth/callback/google` (for production)

### 3. Restart Your Dev Server

```bash
npm run dev
```

## 📋 How It Works:

### For Admins (Inviting Users):
1. Go to **Users & Departments** page
2. Click **Add User**
3. Enter user's **Gmail address** (required)
4. Fill in username, role, and department
5. Leave password empty (OAuth users don't need it)
6. User is now invited!

### For Users (Logging In):
1. Visit the login page
2. Click **"Sign in with Google"**
3. Select their Google account
4. If their email is in the system → ✅ Access granted
5. If their email is NOT in the system → ❌ "Access denied"

## 🔒 Security Features:

- ✅ **Invite-only**: Only pre-registered emails can sign in
- ✅ **No public registration**: Users can't self-register
- ✅ **Admin control**: Only admins can invite users
- ✅ **Audit trail**: All Google logins are logged in system_logs
- ✅ **Works anywhere**: Users can access from any device with their Gmail

## 🎯 User Management:

When adding a user for Google OAuth:
- **Email**: REQUIRED (must be their Gmail)
- **Username**: Can be their name
- **Password**: Leave empty
- **Role**: user/admin/developer
- **Department**: Optional

## 🔄 Dual Login Support:

Your app now supports BOTH:
1. **Traditional login** (username + password)
2. **Google OAuth** (Gmail only)

Users can use whichever method they prefer!

## 🚀 Testing:

1. Add your own Gmail to the users collection
2. Try signing in with Google
3. You should be redirected to `/timer` on success

## ❌ Troubleshooting:

**"Access denied" error?**
- Make sure the Gmail is added to the users collection
- Check that email field matches exactly

**Redirect URI mismatch?**
- Verify the redirect URI in Google Console matches exactly
- Must include `/api/auth/callback/google`

**Session not persisting?**
- Clear browser cache and localStorage
- Check that NEXTAUTH_SECRET is set in .env.local

## 📝 Database Changes:

Users collection now includes:
- `email` - Gmail address (required for OAuth)
- `googleId` - Google account ID (auto-populated on first login)
- `lastLogin` - Timestamp of last login

## 🎉 You're Done!

Your Time Tracker now has secure, invite-only Google OAuth authentication!
