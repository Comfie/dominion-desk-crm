# Gmail SMTP Setup Guide

This guide will help you set up Gmail SMTP for the contact form email functionality.

## Prerequisites

- A Gmail account (comfynyatsine@gmail.com)
- 2-factor authentication enabled on your Google account

## Step-by-Step Setup

### 1. Enable 2-Factor Authentication

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Under "Signing in to Google", click on "2-Step Verification"
3. Follow the prompts to enable 2FA if not already enabled

### 2. Generate App Password

1. Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
2. You may need to sign in again
3. In the "Select app" dropdown, choose **"Mail"**
4. In the "Select device" dropdown, choose **"Other (Custom name)"**
5. Enter a name like **"VeldUnity CRM"**
6. Click **"Generate"**
7. Google will display a 16-character app password (e.g., `abcd efgh ijkl mnop`)
8. **Copy this password immediately** - you won't be able to see it again

### 3. Add to Environment Variables

1. Open your `.env` file (or create it from `.env.example`)
2. Add these lines:

```env
SMTP_USER="comfynyatsine@gmail.com"
SMTP_PASSWORD="your-16-character-app-password"
```

**Important**: Use the app password generated in step 2, NOT your regular Gmail password.

### 4. Restart Your Development Server

After adding the environment variables, restart your Next.js development server:

```bash
npm run dev
```

## Testing

1. Visit `/contact` on your website
2. Fill out the contact form
3. Submit the form
4. You should receive an email at `comfynyatsine@gmail.com`
5. The user should receive a confirmation email

## Troubleshooting

### "Invalid login" Error

- Make sure you're using the app password, not your regular Gmail password
- Ensure there are no spaces in the app password when copying
- Verify 2FA is enabled on your account

### Email Not Sending

- Check that `SMTP_USER` and `SMTP_PASSWORD` are set in your `.env` file
- Verify the environment variables are being loaded (restart dev server)
- Check the console/terminal for error messages

### App Password Not Working

- Try generating a new app password
- Make sure you selected "Mail" as the app type
- Ensure your Google account doesn't have "Less secure app access" enabled (this conflicts with app passwords)

## Security Notes

- **Never commit your `.env` file to git** - it's already in `.gitignore`
- App passwords are safer than your regular password because:
  - They're app-specific
  - They can be revoked individually
  - They don't give access to your full Google account
- If you suspect your app password is compromised, revoke it immediately at [Google App Passwords](https://myaccount.google.com/apppasswords)

## Email Limits

Gmail SMTP has the following limits:

- **500 emails per day** for free Gmail accounts
- **2,000 emails per day** for Google Workspace accounts

For production with high volume, consider:

- SendGrid
- AWS SES
- Mailgun
- Resend

## Production Deployment

When deploying to production (Vercel, etc.):

1. Add the environment variables in your hosting platform's settings:
   - `SMTP_USER=comfynyatsine@gmail.com`
   - `SMTP_PASSWORD=your-app-password`

2. Make sure `NEXTAUTH_URL` is set to your production domain

3. Test the contact form after deployment

## Support

If you encounter issues:

1. Check the server logs for detailed error messages
2. Verify all environment variables are set correctly
3. Test with a simple email first to isolate the problem
