# Real-time Chat App

A full-stack real-time chat application built with Next.js (App Router), TypeScript, Tailwind CSS, and Supabase.

## Features

- User Authentication (Email & Password)
- Create and Join Chat Rooms
- Real-time Messaging (Supabase Postgres Changes)
- Online Presence & Typing Indicators (Supabase Channels)
- Auto-scroll to latest message
- Responsive Modern UI

## Setup Instructions

### 1. Supabase Project Setup

1. Create a new project on [Supabase](https://supabase.com).
2. Go to the SQL Editor in your Supabase dashboard.
3. Copy the contents of the `supabase_setup.sql` file provided in this repository and run it to create tables, enable Row Level Security (RLS) policies, and enable realtime on `messages` and `rooms`.

### 2. Environment Variables

Create a `.env.local` file in the root of the project and add your Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Install Dependencies and Run

Install the required packages using npm:

```bash
npm install
```

Start the Next.js development server:

```bash
npm run dev
```

Visit `http://localhost:3000` to register an account and start chatting!

## Technical Stack

- Next.js 14 App Router
- Supabase SSR Client (`@supabase/ssr`)
- Tailwind CSS
- Lucide React (Icons)
- date-fns


## PWA Setup Instructions

- to push notifications to mobile devices, we need to use supabase functions
```bash
supabase functions deploy send-push --no-verify-jwt
```