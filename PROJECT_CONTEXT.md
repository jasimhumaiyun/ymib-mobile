# YMIB Project Context

> **Last Updated**: 2025-06-03 | **Status**: Milestone 3 Complete ✅
> **Development Team**: Human + Claude + ChatGPT (Collaborative Pair Programming)

## 🎯 Project Vision

**Your Message in a Bottle (YMIB)** is a location-based social app where users can drop virtual "messages in bottles" at specific geographic locations for others to discover. Think of it as digital geocaching meets social messaging.

## 📱 Core Features (Planned)

### Milestone 1: Foundation ✅ (COMPLETE)
- [x] Expo TypeScript project scaffold
- [x] Supabase integration
- [x] React Query setup
- [x] Health check functionality
- [x] Basic navigation structure
- [x] Professional development environment (.cursorrules)
- [x] Comprehensive documentation (README.md)
- [x] Git repository setup with proper commit history

### Milestone 2: Map & Exploration ✅ (COMPLETE)
- [x] Bottom tab navigation (Home + Explore)
- [x] Interactive map with Google Maps provider
- [x] Real-time bottle updates via Supabase subscriptions
- [x] Segmented control for filtering (All/Tossed/Found)
- [x] Bottle markers with status-based colors
- [x] Cross-platform marker optimization (iOS jitter fix)
- [x] Smooth filtering transitions
- [x] Clean, country-level map styling
- [x] useBottles hook for data management
- [x] Google Maps API key configuration

### Milestone 3: Toss Bottle Flow ✅ (COMPLETE)
- [x] FAB (Floating Action Button) on home screen
- [x] Toss bottle modal with message input
- [x] Photo picker integration (expo-image-picker)
- [x] Location permissions and current position
- [x] Photo upload to Supabase storage with public URLs
- [x] toss_bottle Supabase edge function (deployed and working)
- [x] Success screen with bottle ID and password
- [x] Real-time map updates (new bottles appear instantly)
- [x] Haptic feedback on successful toss
- [x] Complete database schema (bottles + bottle_events tables)
- [x] Storage RLS policies for public photo access
- [x] Database RLS policies for public bottle access
- [x] Error handling and user feedback
- [x] Cross-platform permissions (iOS + Android)

### Milestone 4: Authentication & Profiles (NEXT)
- [ ] User authentication (Supabase Auth)
- [ ] User profiles
- [ ] Message ownership
- [ ] QR code "Find Bottle" flow

### Milestone 5: Advanced Features
- [ ] Real-time notifications
- [ ] Message categories/types
- [ ] Advanced filtering
- [ ] Social features (likes, replies)

## 🏗️ Technical Architecture

### Tech Stack
- **Frontend**: Expo (React Native) with TypeScript
- **Backend**: Supabase (PostgreSQL + Auth + Real-time + Storage + Edge Functions)
- **State Management**: React Query (@tanstack/react-query)
- **Maps**: React Native Maps with Google provider
- **Navigation**: Expo Router (File-based routing)
- **Photo Handling**: Expo Image Picker + Supabase Storage

### Project Structure
```
ymib-mobile/
├── app/
│   ├── (tabs)/             # Tab navigation screens
│   │   ├── _layout.tsx     # Tab navigator
│   │   ├── index.tsx       # Home screen with FAB
│   │   └── explore.tsx     # Map exploration screen
│   ├── toss/
│   │   └── success.tsx     # Success screen after tossing
│   ├── toss.tsx           # Toss bottle modal
│   └── _layout.tsx        # Root layout with QueryClient
├── src/
│   ├── hooks/             # Custom hooks (useBottles, usePingSupabase)
│   ├── lib/               # Utilities and configurations
│   ├── types/             # TypeScript type definitions
│   └── constants/         # App constants
├── supabase/
│   └── functions/
│       └── toss_bottle/   # Edge function for bottle creation
├── assets/                # Images, fonts, etc.
├── .cursorrules          # Development guidelines
├── PROJECT_CONTEXT.md    # This file
└── ...
```

### Database Schema (Production)
```sql
-- Bottles table
CREATE TABLE bottles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message TEXT,
  photo_url TEXT,
  lat DOUBLE PRECISION NOT NULL,
  lon DOUBLE PRECISION NOT NULL,
  status TEXT CHECK (status IN ('adrift', 'found')) DEFAULT 'adrift',
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bottle events table (for real-time updates)
CREATE TABLE bottle_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bottle_id UUID REFERENCES bottles(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('cast_away', 'found')) NOT NULL,
  lat DOUBLE PRECISION,
  lon DOUBLE PRECISION,
  text TEXT,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Storage bucket: 'bottles' (public access for photo URLs)
```

## 🔧 Current State

### What's Working ✅
- ✅ Expo TypeScript project with Expo Router navigation
- ✅ Supabase client configured (`src/lib/supabase.ts`)
- ✅ Health check hook implemented (`src/hooks/usePingSupabase.ts`)
- ✅ React Query setup with QueryClientProvider
- ✅ Bottom tab navigation with Home and Explore tabs
- ✅ Interactive map with Google Maps provider
- ✅ Bottle data fetching with `useBottles` hook
- ✅ Real-time bottle updates via Supabase subscriptions
- ✅ Segmented control filtering (All/Tossed/Found) with smooth transitions
- ✅ Status-based marker colors (blue for adrift, green for found)
- ✅ Cross-platform marker optimization (iOS deterministic jitter)
- ✅ Clean map styling (countries only, no POIs/buildings)
- ✅ Stable map positioning during filter changes
- ✅ FAB (Floating Action Button) on home screen
- ✅ Toss bottle modal with message input and photo picker
- ✅ Location permissions and current position detection
- ✅ Photo upload to Supabase storage with public URLs
- ✅ toss_bottle Supabase edge function (deployed and working)
- ✅ Success screen with bottle ID and password
- ✅ Haptic feedback on successful bottle toss
- ✅ Real-time map updates (new bottles appear instantly)
- ✅ Complete database schema with RLS policies
- ✅ Storage RLS policies for public photo access
- ✅ Error handling and user feedback
- ✅ Professional development environment (.cursorrules)
- ✅ Comprehensive project documentation

### What's Next 🚧
- [ ] User authentication (Supabase Auth)
- [ ] User profiles and message ownership
- [ ] QR code "Find Bottle" flow
- [ ] find_bottle edge function
- [ ] Bottle detail view with full message content

### Environment Variables
```bash
# .env (you need to update with real values)
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
IOS_GOOGLE_MAPS_KEY=your_ios_google_maps_key
ANDROID_GOOGLE_MAPS_KEY=your_android_google_maps_key
```

### Key Dependencies
```json
{
  "@supabase/supabase-js": "^2.49.9",
  "@tanstack/react-query": "^5.79.2",
  "expo": "~53.0.9",
  "expo-router": "~5.0.7",
  "expo-haptics": "~14.1.4",
  "expo-image-picker": "~16.1.4",
  "expo-location": "~18.1.5",
  "react-native-maps": "1.20.1",
  "react-native-safe-area-context": "5.4.0"
}
```

## 🎯 Milestone 3 Achievements

### Complete End-to-End Bottle Tossing Flow
1. **User taps FAB** on home screen
2. **Enters message** in toss modal
3. **Optionally selects photo** from device gallery
4. **Grants location permission** and gets current position
5. **Photo uploads** to Supabase storage (if selected)
6. **Edge function creates** bottle record in database
7. **Success screen shows** bottle ID and password
8. **Real-time update** adds new blue marker to map instantly
9. **Haptic feedback** confirms successful toss

### Technical Infrastructure
- ✅ **Supabase Storage**: Public bucket for bottle photos
- ✅ **Edge Functions**: Deployed toss_bottle function
- ✅ **Database Schema**: Complete bottles + bottle_events tables
- ✅ **RLS Policies**: Public access for bottles and storage
- ✅ **Real-time Subscriptions**: Instant map updates
- ✅ **Cross-platform Support**: iOS and Android permissions
- ✅ **Error Handling**: Comprehensive user feedback

## 📝 Recent Changes

- **2025-06-03**: ✅ **MILESTONE 3 COMPLETE** 
  - Fixed database schema by adding missing `message` and `photo_url` columns
  - Deployed working toss_bottle edge function with comprehensive error handling
  - Implemented complete photo upload flow to Supabase storage
  - Added storage RLS policies for public photo access
  - Added database RLS policies for public bottle access
  - Verified end-to-end bottle tossing flow working on both platforms
  - Real-time map updates working perfectly
  - Cleaned up unnecessary files and code
  - Updated project documentation

- **2025-01-27**: ✅ **MILESTONE 2 COMPLETE** 
  - Implemented bottom tab navigation with Home and Explore screens
  - Created interactive map with Google Maps provider
  - Added bottle data fetching with useBottles hook
  - Implemented real-time bottle updates via Supabase subscriptions
  - Created segmented control for filtering bottles by status
  - Added status-based marker colors (blue for adrift, green for found)
  - Solved iOS marker overlapping with deterministic jitter algorithm
  - Optimized Android for smooth filter transitions
  - Implemented marker memoization for performance
  - Added clean map styling (countries only)
  - Configured Google Maps API keys in app.config.js

---

**Ready for Milestone 4: Authentication & Profiles** 🚀

*Remember to update this file whenever significant changes are made to the project!* 