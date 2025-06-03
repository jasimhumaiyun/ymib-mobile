# YMIB Project Context

> **Last Updated**: 2025-06-03 | **Status**: Milestone 4 In Progress 🚧
> **Development Team**: Human + Claude + ChatGPT (Collaborative Pair Programming)

## 🎯 Project Vision

**Your Message in a Bottle (YMIB)** is a location-based social app where users can drop virtual "messages in bottles" at specific geographic locations for others to discover. Think of it as digital geocaching meets social messaging.

**Key Insight**: Physical bottles are pre-printed with QR codes containing unique IDs and passwords. The app claims/finds existing bottles rather than generating new ones.

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

### Milestone 4: Claim/Find with Printed Bottles 🚧 (IN PROGRESS)
- [x] Database schema updates (creator_id, public_profiles, RLS policies)
- [x] claim_or_toss_bottle edge function (handles pre-printed bottle IDs)
- [x] find_bottle edge function (marks bottles as found)
- [x] Scan screen with QR input and dummy ID mode for development
- [x] Updated FAB to link to scan screen (QR code icon)
- [x] Real-time updates for found events (blue → green markers)
- [x] Removed old toss modal (replaced by scan functionality)
- [ ] User authentication (Supabase Auth)
- [ ] User profiles and ownership tracking
- [ ] QR code camera scanning (currently text input)
- [ ] Find bottle flow integration

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
- **QR Handling**: UUID generation for dev mode, text input for QR data

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
│   ├── scan.tsx           # QR scan/claim screen (replaces toss.tsx)
│   └── _layout.tsx        # Root layout with QueryClient
├── src/
│   ├── hooks/             # Custom hooks (useBottles, usePingSupabase)
│   ├── lib/               # Utilities and configurations
│   ├── types/             # TypeScript type definitions
│   └── constants/         # App constants
├── supabase/
│   └── functions/
│       ├── toss_bottle/   # Legacy edge function
│       ├── claim_or_toss_bottle/  # New claim/toss function
│       └── find_bottle/   # Find bottle function
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
  creator_id UUID REFERENCES public_profiles,  -- NEW: ownership tracking
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Public profiles table (NEW)
CREATE TABLE public_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  username TEXT UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
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
-- RLS policies: Public select, owner modify
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
- ✅ Real-time bottle updates via Supabase subscriptions (cast_away + found events)
- ✅ Segmented control filtering (All/Tossed/Found) with smooth transitions
- ✅ Status-based marker colors (blue for adrift, green for found)
- ✅ Cross-platform marker optimization (iOS deterministic jitter)
- ✅ Clean map styling (countries only, no POIs/buildings)
- ✅ Stable map positioning during filter changes
- ✅ FAB (Floating Action Button) with QR code icon linking to scan screen
- ✅ Scan screen with QR data input and message input
- ✅ Development dummy ID mode for testing without physical bottles
- ✅ claim_or_toss_bottle edge function (deployed and working)
- ✅ find_bottle edge function (deployed and working)
- ✅ Location permissions and current position detection
- ✅ Photo upload to Supabase storage with public URLs
- ✅ Success screen with bottle ID and password
- ✅ Haptic feedback on successful bottle toss
- ✅ Real-time map updates (new bottles appear instantly, found bottles turn green)
- ✅ Complete database schema with RLS policies and profiles
- ✅ Storage RLS policies for public photo access
- ✅ Error handling and user feedback
- ✅ Professional development environment (.cursorrules)
- ✅ Comprehensive project documentation

### What's Next 🚧
- [ ] User authentication (Supabase Auth)
- [ ] User profiles and message ownership
- [ ] QR code camera scanning (replace text input)
- [ ] Find bottle flow integration in scan screen
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
  "react-native-safe-area-context": "5.4.0",
  "react-native-qrcode-scanner": "^1.5.5",
  "react-native-get-random-values": "^1.11.0",
  "uuid": "^10.0.0"
}
```

## 🎯 Milestone 4 Achievements (In Progress)

### Printed Bottle Claim/Find Flow
1. **Physical bottles exist** with pre-printed QR codes (ID + password)
2. **Scan screen handles both** claim/toss and find operations
3. **Development mode** with dummy ID generation for testing
4. **claim_or_toss_bottle function** handles:
   - New bottle claim → creates bottle record + cast_away event
   - Re-toss found bottle → updates status to adrift + new cast_away event
   - Already adrift bottle → returns current status
5. **find_bottle function** marks bottles as found + creates found event
6. **Real-time updates** for both cast_away and found events
7. **Database ownership** tracking with creator_id and profiles

### Technical Infrastructure Updates
- ✅ **Database Schema**: Added creator_id, public_profiles table, RLS policies
- ✅ **Edge Functions**: claim_or_toss_bottle and find_bottle deployed
- ✅ **Real-time Subscriptions**: Added found event listener
- ✅ **Scan Interface**: QR data input with dev dummy mode
- ✅ **Navigation Updates**: FAB now opens scan screen with QR icon

## 📝 Recent Changes

- **2025-06-03**: 🚧 **MILESTONE 4 BEGUN** - Printed-Bottle Claim + Find
  - Updated database schema with creator_id and public_profiles table
  - Created claim_or_toss_bottle edge function for pre-printed bottle handling
  - Created find_bottle edge function for marking bottles as found
  - Implemented scan screen with QR input and dummy ID mode for development
  - Updated FAB to link to scan screen with QR code icon
  - Added real-time updates for found events (blue → green markers)
  - Removed old toss modal (replaced by scan functionality)
  - Deployed new edge functions successfully

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

**Ready to complete Milestone 4: Authentication & Profiles** 🚀

*Remember to update this file whenever significant changes are made to the project!* 