# Personal Life Hub

A local personal dashboard with:
- receipt upload and preview
- expense tracking and analytics
- habit tracking with streak automation
- notes and reminder scheduling
- SMS reminder support via Twilio

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file in the project root if you want optional extra protections and SMS support:
   ```bash
   # optional: dashboard lock passphrase
   DASHBOARD_SECRET=your-secret-passphrase

   # optional: Twilio SMS reminder support
   TWILIO_ACCOUNT_SID=your-twilio-sid
   TWILIO_AUTH_TOKEN=your-twilio-token
   TWILIO_FROM_NUMBER=+1234567890
   ```

   - The dashboard is accessible by default without signing up.
   - Set `DASHBOARD_SECRET` only if you want a passphrase lock.
   - Twilio settings remain optional. SMS reminders work only when Twilio is configured.

3. Start the server:
   ```bash
   npm start
   ```

4. Open the app in your browser:
   - `http://localhost:3000`

## Security Notes

- The API is protected by a shared secret header.
- The server uses `helmet` and same-origin CORS.
- Do not expose the app to the public internet without additional authentication.
- Keep `.env` private and never commit it to source control.
