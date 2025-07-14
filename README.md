# Fit-Lynk Gym Management System

A comprehensive gym management application built with React, TypeScript, and Supabase.

## Features

- **Member Management** - Add, track, and manage gym members with auto-generated IDs
- **Attendance Tracking** - QR code-based check-in/check-out system
- **Payment Management** - Track payments and billing
- **Analytics & Reports** - Comprehensive insights and performance tracking
- **Trainer Management** - Manage gym staff and schedules
- **SMS Notifications** - Automated welcome and expiry reminders via Twilio
- **Mobile App** - Android app with Capacitor integration

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **UI**: Tailwind CSS + shadcn/ui components
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions)
- **Mobile**: Capacitor for Android
- **SMS**: Twilio integration
- **Charts**: Recharts for analytics

## Setup Instructions

### 1. Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Supabase Configuration (automatically configured)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Twilio Configuration (for SMS notifications)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
```

### 2. Supabase Setup

The database schema is automatically created via migrations. Key tables include:
- `gyms` - Gym information
- `gym_owners` - Gym owner authentication
- `members` - Gym members with auto-generated IDs
- `membership_plans` - Subscription plans
- `payments` - Payment records
- `attendance` - Check-in/check-out records

### 3. SMS Configuration

To enable SMS notifications:

1. **Create a Twilio Account**:
   - Sign up at [Twilio](https://www.twilio.com/)
   - Get your Account SID, Auth Token, and Phone Number

2. **Configure Environment Variables**:
   - Add your Twilio credentials to the Supabase Edge Function environment
   - Set the variables in your Supabase dashboard under Settings > Edge Functions

3. **Test SMS Functionality**:
   - Add a new member to test welcome SMS
   - Use the bulk SMS feature to test expiry reminders

### 4. Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### 5. Android App

```bash
# Build and open in Android Studio
npm run android

# Build development version
npm run android:dev

# Sync web assets to Android
npm run cap:sync
```

## SMS Notifications

The system supports automated SMS notifications:

### Welcome SMS
- Automatically sent when a new member is added
- Can be disabled in SMS settings

### Expiry Reminders
- Sent to members whose plans expire in 5 days (configurable)
- Can be sent manually or automatically
- Tracks notification status to avoid duplicates

### Configuration
- Access SMS settings through the Settings page
- Configure notification timing and content
- Monitor SMS delivery status

## Database Functions

Key database functions:
- `generate_gym_member_id()` - Auto-generates unique member IDs per gym
- `get_expiring_members()` - Finds members with expiring plans
- `mark_notification_sent()` - Tracks SMS notification status

## Security

- Row Level Security (RLS) enabled on all tables
- Gym owners can only access their own gym data
- Authentication handled by Supabase Auth
- SMS credentials secured in environment variables

## Deployment

The app can be deployed to:
- **Web**: Netlify (configured in `netlify.toml`)
- **Mobile**: Android APK generation via Capacitor

## Support

For issues or questions:
1. Check the console logs for detailed error messages
2. Verify Twilio credentials are correctly configured
3. Ensure Supabase connection is working
4. Check that all required environment variables are set

## License

This project is proprietary software for gym management.