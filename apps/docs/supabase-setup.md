# Supabase Setup Guide 🗄️

This guide will walk you through setting up Supabase for your Shelf.nu application. In the current Core target, Supabase provides PostgreSQL and file storage, while active authentication runs through Better Auth behind the Hono API.

> This is the official Core setup at the moment.
> A future Docker Community stack with PostgreSQL + MinIO is planned later,
> but it is not yet the standard supported setup for Core.

## Prerequisites ✅

- A [Supabase account](https://supabase.com/) (free tier available)
- Access to your `.env` file at the **monorepo root** of your local Shelf.nu project

---

## Step 1: Create Your Supabase Project 🆕

1. **Sign up/Login** to [Supabase](https://supabase.com/)
2. **Click "New Project"**
3. **Choose your organization** (or create one)
4. **Fill in project details:**

   - **Name**: `shelf-nu` (or your preferred name)
   - **Database Password**: Create a strong password (save this! 🔐)
   - **Region**: Choose closest to your location
   - **Pricing Plan**: Free tier works great for development

5. **Click "Create new project"**
6. ⏳ Wait for your project to be ready (usually 1-2 minutes)

---

## Step 2: Get Your Connection Details 🔗

### Database Connection Strings

1. **Click the "Connect" button** in your project header
2. **Select "ORM"** → **"Prisma"**
3. **Copy the connection strings** and update your `.env` (replace `[YOUR-PASSWORD]` with your actual database password):

```bash
# Connection pooling (for app runtime)
DATABASE_URL="postgres://postgres.xxxxx:[YOUR-PASSWORD]@xxx.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct connection (for migrations)
DIRECT_URL="postgres://postgres.xxxxx:[YOUR-PASSWORD]@xxx.supabase.com:5432/postgres"
```

> 💡 **Important**: Replace `[YOUR-PASSWORD]` with your actual database password

### API Keys

1. **Go to Project Settings** → **API keys**
2. **Copy the API keys** and update your `.env`:

```bash
SUPABASE_URL="https://your-project-ref.supabase.co"
SUPABASE_ANON_PUBLIC="your-anon-public-key"
SUPABASE_SERVICE_ROLE="your-service-role-key"
```

---

## Step 3: Configure Database Connection Mode 🔧

1. **Go to Project Settings** → **Database**
2. **Find "Connection pooling"** section
3. **Set Mode to "Transaction"**
4. **Click "Save"**

---

## Step 4: Configure Better Auth and legacy Supabase auth prerequisites 🔐

### Better Auth is the active auth provider

Core now authenticates through Better Auth on the backend. Define these variables in the root `.env`:

```bash
BETTER_AUTH_SECRET="replace-with-a-long-random-secret"
BETTER_AUTH_URL="http://localhost:3000"
BETTER_AUTH_BASE_PATH="/api/auth"
```

If you use SSO with Better Auth generic OAuth providers, also define `BETTER_AUTH_SSO_PROVIDERS`.

### Supabase Auth dashboard setup is no longer required for Core

The active Core auth path no longer depends on Supabase Auth runtime settings
such as Auth URL configuration, OTP length, or Supabase SMTP templates.
Keep using Supabase for PostgreSQL and Storage, but do not treat its Auth
dashboard as part of the normal Core authentication setup anymore.

### Auth emails after the Brevo migration

Shelf now sends the main authentication emails from the application backend.
Better Auth owns the active auth path, and Supabase is no longer expected to be
the primary identity provider or email sender for the main Core auth flows.

Current backend-sent flows include:

- login OTP
- signup confirmation OTP
- resend verification OTP
- password reset OTP
- email change OTP

As a result:

1. **You do not need Supabase email templates to be the primary delivery path**
2. **You do not need Supabase SMTP to be the primary sender once Brevo is enabled in the app**
3. **You do not need Supabase Auth dashboard email settings for the normal Core path**

If you operate legacy migration scripts, keep the database access they require.
For day-to-day Core authentication and transactional auth emails, the active
path is Better Auth plus Brevo on the application backend.

---

## Step 5: Create Storage Buckets 🪣

Until the MinIO provider exists in Core, these Supabase buckets remain part of
the expected runtime setup.

Shelf needs several storage buckets for file uploads. For each bucket below:

### Profile Pictures

1. **Go to Storage** → **Buckets**
2. **Click "Create bucket"**
3. **Name**: `profile-pictures`
4. **Make it public**: ✅ Checked
5. **Click "Create"**

**Setup Policies:**

1. **Click on the bucket** → **Policies**
2. **Create policy for INSERT, UPDATE, DELETE** with:
   - **Expression**: `(bucket_id = 'profile-pictures'::text) AND (false)`
   - **Target roles**: `authenticated` and `anon`

### Assets

1. **Create bucket**: `assets`
2. **Public**: ❌ Unchecked
3. **Policies**: Same as above but with `(bucket_id = 'assets'::text) AND (false)`

### Kits

1. **Create bucket**: `kits`
2. **Public**: ❌ Unchecked
3. **Policies**: Same as above but with `(bucket_id = 'kits'::text) AND (false)`

### Files

1. **Create bucket**: `files`
2. **Public**: ✅ Checked
3. **Policies**: Same as above but with `(bucket_id = 'files'::text) AND (false)`

> 💡 **Why these policies?** They prevent direct browser access to modify files while allowing our server to manage them securely.

---

## Step 6: Complete Your .env File 📝

Your `.env` at the **monorepo root** should now look like this:

```bash
# Database connections
DATABASE_URL="postgres://postgres.xxxxx:[YOUR-PASSWORD]@xxx.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgres://postgres.xxxxx:[YOUR-PASSWORD]@xxx.supabase.com:5432/postgres"

# Supabase API
SUPABASE_URL="https://your-project-ref.supabase.co"
SUPABASE_ANON_PUBLIC="your-anon-public-key"
SUPABASE_SERVICE_ROLE="your-service-role-key"

# Better Auth
BETTER_AUTH_SECRET="replace-with-a-long-random-secret"
BETTER_AUTH_URL="https://localhost:3000"
BETTER_AUTH_BASE_PATH="/api/auth"

# App configuration
SESSION_SECRET="your-super-secret-session-key"
SERVER_URL="https://localhost:3000"  # With SSL (recommended)
# SERVER_URL="http://localhost:3000"  # Without SSL
FINGERPRINT="a-custom-host-fingerprint"

# Features (optional - set to false to disable premium features)
ENABLE_PREMIUM_FEATURES="false"

# Email configuration for application emails
EMAIL_PROVIDER="brevo"
BREVO_API_KEY="xkeysib-your-brevo-api-key"
BREVO_SENDER_EMAIL="support@your-domain.com"
BREVO_SENDER_NAME="Patrimoine360"
EMAIL_REPLY_TO="support@your-domain.com"
EMAIL_REPLY_TO_NAME="Support Patrimoine360"
BREVO_TIMEOUT_SECONDS="30"

# Optional SMTP rollback only
# SMTP_HOST="smtp.yourhost.com"
# SMTP_PORT=465
# SMTP_USER="you@example.com"
# SMTP_PWD="yourSMTPpassword"
# SMTP_FROM="Patrimoine360 <support@your-domain.com>"

# Map integration (optional)
MAPTILER_TOKEN="your-maptiler-token"
GEOCODING_USER_AGENT="Your App Name (https://yoursite.com)"

# Security
INVITE_TOKEN_SECRET="your-invite-token-secret"

# Analytics (optional)
MICROSOFT_CLARITY_ID="your-clarity-id"
```

---

## Step 7: Generate Session Secrets 🔐

Generate secure random strings for your secrets:

```bash
# Generate session secret
openssl rand -hex 32

# Generate invite token secret
openssl rand -hex 32

# Generate fingerprint
openssl rand -hex 32
```

Copy these values to your `.env` file.

---

## Step 8: Setup Email (Required) 📧

Core requires email configuration for user authentication, and the target setup
now standardizes outbound delivery on Brevo.

### Recommended Brevo setup

1. Set `EMAIL_PROVIDER="brevo"` in the root `.env`.
2. Configure `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`,
   `BREVO_SENDER_NAME`, `EMAIL_REPLY_TO` and `EMAIL_REPLY_TO_NAME`.
3. Keep `SMTP_*` variables only if you deliberately want an emergency rollback
   transport.
4. Treat Supabase SMTP and Supabase Auth templates as historical legacy
   settings, not as an active dependency of Core.

---

## Step 9: Optional Integrations 🔌

### Map Integration

Get a free [MapTiler](https://www.maptiler.com/) account for location features:

1. Sign up at MapTiler
2. Get your API key
3. Add to your `.env` file:

```bash
MAPTILER_TOKEN="your_token_here"
```

### Geocoding

Shelf.nu uses [OpenStreetMap Nominatim](https://nominatim.openstreetmap.org/) for geocoding addresses into map coordinates. This is a free service that requires no API key or registration.

**Configuration:**

- Set `GEOCODING_USER_AGENT` environment variable to identify your deployment
- Example: `GEOCODING_USER_AGENT="My Company Assets (https://assets.mycompany.com)"`
- Defaults to "Self-hosted Asset Management System" if not set

**How it works:**

- When you add an address to a location, it's automatically geocoded and cached in the database
- Subsequent page loads use the cached coordinates for instant map display
- Rate limit: 1 request per second (automatically handled)

**Important limitations:**

- Nominatim has [usage policies](https://operations.osmfoundation.org/policies/nominatim/) you should be aware of
- For heavy usage, consider running your own Nominatim instance
- The service runs on donated servers with limited capacity

**For production deployments with high geocoding volume:**

- Consider commercial alternatives like MapBox, Google Maps, or MapTiler geocoding APIs
- Set up your own Nominatim server following the [installation guide](https://nominatim.org/release-docs/latest/admin/Installation/)

---

## Verification ✅

Your Supabase setup is complete! You should now have:

- ✅ Supabase project created
- ✅ Database connection strings in `.env`
- ✅ API keys in `.env`
- ✅ Connection mode set to "Transaction"
- ✅ Storage buckets created with policies
- ✅ Backend email configuration completed
- ✅ Session secrets generated
- ✅ Remaining Supabase dependency understood as PostgreSQL + Storage only

## Next Steps 🚀

Now you can return to the main setup and run:

```bash
pnpm webapp:setup
pnpm webapp:dev
```

**With SSL:** Your Shelf.nu app will be available at `https://localhost:3000` 🔒  
**Without SSL:** Your Shelf.nu app will be available at `http://localhost:3000` 🎉

Your app should connect to Supabase successfully.

Important: this confirms the current Core runtime target, not a future
`app + postgres + minio` Docker Community setup.

---

## Troubleshooting 🔧

### Common Issues

**Connection Error**: Double-check your database password and connection strings  
**Auth Not Working**: Verify `BETTER_AUTH_*` variables are present and that the Hono auth handler is mounted correctly
**File Upload Fails**: Ensure storage buckets exist and have proper policies  
**Email Issues**: Test your SMTP settings with a simple email client first

### Getting Help

- 💬 [Join our Discord](https://discord.gg/8he9W7aTJu)
- 📖 [Browse all documentation](./README.md)
- 🐛 [Report issues on GitHub](https://github.com/Shelf-nu/shelf.nu/issues)

---

## Production Setup 🚀

This guide covers development setup. For production deployment, see our [Deployment Guide](./deployment.md).
