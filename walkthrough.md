# GA4 Observer System

The new "Observer" monitoring system is now fully integrated into your SaaS!

### What was built:
1. **Database Schema:** Added the `ga4_monitors` table to `schema.sql` to persistently store user alert configurations.
2. **Google OAuth Update:** Added the `https://www.googleapis.com/auth/analytics.readonly` scope in the login flow so we have permission to query GA4 Data API.
3. **Frontend Dashboard:** Created a new page (`/observer`) allowing users to select a property, pick a metric (Sessions, Conversions, Revenue, Active Users), set a threshold (e.g. -20%), and specify an alert email.
4. **Backend Engine:**
   - `/api/ga4/properties`: Fetches the user's GA4 properties.
   - `/api/ga4/monitors`: CRUD operations to save and load their monitors from Cloudflare D1.
   - `/api/ga4/cron`: The cron-job endpoint that securely loops through all active monitors, fetches GA4 data using the user's token, calculates the percentage change, and dispatches HTML alert emails if thresholds are breached.

### How to finalize it:
Because we added a new table to your database, you need to tell Cloudflare to apply the update.

1. **Apply the Database Update:** 
   Run this in your terminal:
   ```bash
   npx wrangler d1 execute gtm_automation_d1 --remote --file=./schema.sql
   ```
2. **Setup the Cron Job (Optional for testing, required for production):**
   Cloudflare Pages functions don't run automatically. You'll want to use an external ping service (like cron-job.org or GitHub Actions) to send an hourly `GET` request to:
   `https://[YOUR_APP_DOMAIN]/api/ga4/cron?token=YOUR_SECRET`
3. **Add Email API Key:**
   To actually send the emails, sign up for a free [Resend](https://resend.com) account, get an API key, and add it to your Cloudflare Pages Environment Variables as `RESEND_API_KEY`.
