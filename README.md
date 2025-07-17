# Google Calendar Tracker

A real-time Google Calendar integration built with Next.js 14, featuring OAuth authentication, webhooks for push notifications, and a responsive UI.

## Features

- **OAuth Authentication**: Secure Google OAuth2 integration
- **Real-time Updates**: Google Calendar webhook notifications for instant updates
- **Calendar Management**: View, create, and manage calendar events
- **Responsive UI**: Modern, clean interface built with Tailwind CSS
- **MongoDB Integration**: Persistent storage for events and user data

## Setup Instructions

### 1. Environment Variables

Create a `.env.local` file in the root directory:

```env
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# MongoDB
MONGODB_URI=mongodb://localhost:27017/google-calendar-tracker

# Google OAuth & Calendar API
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 2. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google Calendar API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
   - Add your domain for production
5. Copy the Client ID and Client Secret to your `.env.local`

### 3. MongoDB Setup

- Install MongoDB locally or use MongoDB Atlas
- Update the `MONGODB_URI` in your `.env.local`

### 4. Install Dependencies

```bash
pnpm install
```

### 5. Run the Application

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## How It Works

### Authentication Flow

1. User clicks "Sign in with Google"
2. OAuth flow redirects to Google for authentication
3. User grants calendar permissions
4. Access tokens are stored securely in MongoDB

### Real-time Updates

1. After authentication, a Google Calendar webhook is automatically set up
2. When calendar events change, Google sends notifications to `/api/webhook/calendar`
3. The webhook updates the local database with latest events
4. Frontend automatically reflects changes on next refresh

### API Endpoints

- `GET/POST /api/calendar/events` - Fetch and create calendar events
- `POST /api/calendar/webhook/setup` - Setup Google Calendar webhooks
- `POST /api/webhook/calendar` - Receive webhook notifications from Google

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Authentication**: NextAuth.js
- **Database**: MongoDB with Mongoose
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Notifications**: Sonner
- **API**: Google Calendar API v3

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── calendar/events/route.ts
│   │   ├── calendar/webhook/setup/route.ts
│   │   └── webhook/calendar/route.ts
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   └── SessionProvider.tsx
├── lib/
│   ├── auth.ts
│   ├── dbConnect.ts
│   └── googleCalendar.ts
├── models/
│   ├── User.ts
│   └── CalendarEvent.ts
└── types/
    └── next-auth.d.ts
```

## Production Deployment

1. Update `NEXTAUTH_URL` to your production domain
2. Add production domain to Google OAuth authorized origins
3. Set up webhook endpoint to be publicly accessible
4. Update MongoDB connection for production database

## License

MIT License
