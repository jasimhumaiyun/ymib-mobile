# YMIB Project Context

> **Last Updated**: 2025-01-27 | **Status**: Milestone 2 Complete ✅
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
- [x] Photo picker integration
- [x] Location permissions and current position
- [x] toss_bottle Supabase edge function
- [x] Success screen with bottle ID and password
- [x] Real-time map updates (new bottles appear instantly)
- [x] Haptic feedback on successful toss

### Milestone 4: Authentication & Profiles (NEXT)
- [ ] User authentication (Supabase Auth)
- [ ] User profiles
- [ ] Message ownership

### Milestone 5: Advanced Features
- [ ] Real-time notifications
- [ ] Message categories/types
- [ ] Advanced filtering
- [ ] Social features (likes, replies)

## 🏗️ Technical Architecture

### Tech Stack
- **Frontend**: Expo (React Native) with TypeScript
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **State Management**: React Query (@tanstack/react-query)
- **Maps**: React Native Maps with Google provider
- **Navigation**: React Navigation (Bottom Tabs)

### Project Structure
```
ymib-mobile/
├── app/
│   └── (tabs)/             # Tab navigation screens
│       ├── _layout.tsx     # Tab navigator
│       ├── index.tsx       # Home screen
│       └── explore.tsx     # Map exploration screen
├── src/
│   ├── components/         # Reusable UI components
│   ├── screens/           # Screen components  
│   ├── hooks/             # Custom hooks (useBottles, usePingSupabase)
│   ├── lib/               # Utilities and configurations
│   ├── types/             # TypeScript type definitions
│   ├── services/          # API services
│   └── constants/         # App constants
├── assets/                # Images, fonts, etc.
├── .cursorrules          # Development guidelines
├── PROJECT_CONTEXT.md    # This file
└── ...
```

### Database Schema (Current)
```sql
-- Bottles table (assumed structure based on useBottles hook)
CREATE TABLE bottles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT CHECK (status IN ('adrift', 'found')),
  lat DOUBLE PRECISION NOT NULL,
  lon DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bottle events table (for real-time updates)
CREATE TABLE bottle_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bottle_id UUID REFERENCES bottles(id),
  type TEXT CHECK (type IN ('cast_away', 'found')),
  lat DOUBLE PRECISION,
  lon DOUBLE PRECISION,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔧 Current State

### What's Working ✅
- ✅ Expo TypeScript project initialized
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
- ✅ toss_bottle Supabase edge function
- ✅ Success screen with bottle ID and password
- ✅ Haptic feedback on successful bottle toss
- ✅ Real-time map updates (new bottles appear instantly)
- ✅ Professional development environment (.cursorrules)
- ✅ Comprehensive project documentation
- ✅ Git repository with proper commit history

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
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE
IOS_GOOGLE_MAPS_KEY=YOUR_IOS_GOOGLE_MAPS_API_KEY
ANDROID_GOOGLE_MAPS_KEY=YOUR_ANDROID_GOOGLE_MAPS_API_KEY
```

## 🔄 Development Workflow

### Current Sprint Status
**Goal**: ✅ **MILESTONE 3 COMPLETE** - Toss Bottle Flow implemented successfully

**Next Goal**: Start Milestone 4 - Authentication & Profiles
- [ ] User authentication (Supabase Auth)
- [ ] User profiles and message ownership
- [ ] QR code "Find Bottle" flow

### Decision Log
1. **2025-01-27**: Chose Expo over React Native CLI for faster development
2. **2025-01-27**: Selected Supabase for backend to minimize infrastructure setup
3. **2025-01-27**: Decided on React Query for state management and caching
4. **2025-01-27**: Implemented React Navigation Bottom Tabs for navigation
5. **2025-01-27**: Chose react-native-maps with Google provider for mapping
6. **2025-01-27**: Implemented real-time updates using Supabase subscriptions
7. **2025-01-27**: Solved iOS marker overlapping with deterministic jitter algorithm
8. **2025-01-27**: Optimized Android performance by removing unnecessary remounting
9. **2025-01-27**: Implemented marker memoization for smooth filter transitions

### Technical Solutions Implemented
- **iOS Marker Overlapping**: Deterministic circular jitter pattern prevents markers from overlapping at same coordinates
- **Cross-Platform Performance**: Platform-specific optimizations (jitter for iOS, smooth transitions for Android)
- **Map Stability**: Region state management prevents position resets during filter changes
- **Marker Optimization**: Memoized marker components prevent unnecessary re-renders
- **Clean UI**: Simplified map styling showing only countries, no POIs or buildings

### Team Notes
- Repository: https://github.com/jasimhumaiyun/ymib-mobile.git
- Development approach: Pair programming with AI assistants
- Focus on professional code quality and documentation
- All team members should read this file before making changes

## 📝 Recent Changes
- **2025-01-27**: ✅ **MILESTONE 3 COMPLETE** 
  - Added FAB (Floating Action Button) to home screen
  - Created toss bottle modal with message input and photo picker
  - Implemented location permissions and current position detection
  - Created toss_bottle Supabase edge function for bottle creation
  - Added success screen showing bottle ID and password
  - Integrated haptic feedback for successful bottle toss
  - Real-time map updates working (new bottles appear instantly)
  - Added iOS and Android permissions for location and photos
  - Ready to proceed to Milestone 4: Authentication & Profiles

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
  - Cleaned up code by removing debug logs and unused imports

---
*Remember to update this file whenever significant changes are made to the project!* 