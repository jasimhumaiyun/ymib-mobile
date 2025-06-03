# YMIB (Your Message in a Bottle) - Mobile App

## Project Overview
**YMIB** is a location-based social app where users can drop virtual "messages in bottles" at geographic locations for others to discover. Think Pokémon GO meets message boards - users can toss bottles with messages and photos, then others can find them by visiting those locations.

## Tech Stack
- **Frontend**: Expo (React Native) with TypeScript
- **Backend**: Supabase (PostgreSQL + Edge Functions + Storage + Real-time)
- **State Management**: React Query (@tanstack/react-query)
- **Maps**: Google Maps (react-native-maps)
- **Navigation**: Expo Router
- **Deployment**: Expo EAS Build

## Project Structure
```
ymib-mobile/
├── app/                   # Expo Router screens
│   ├── (tabs)/
│   │   ├── _layout.tsx    # Bottom tab navigation
│   │   ├── index.tsx      # Home screen with FAB
│   │   └── explore.tsx    # Map view with bottles
│   ├── _layout.tsx        # Root layout with providers
│   └── scan.tsx           # Bottle scanning/claiming modal
├── src/
│   ├── components/        # Reusable UI components
│   ├── hooks/            # Custom hooks (useBottles)
│   ├── lib/              # Supabase client config
│   └── types/            # TypeScript definitions
├── supabase/
│   ├── functions/        # Edge Functions
│   └── config.toml       # Function configuration
└── assets/               # Images and icons
```

## Development Progress

### ✅ Milestone 1: Foundation (COMPLETE)
- [x] Expo TypeScript project with Expo Router
- [x] Supabase client integration 
- [x] React Query setup for state management
- [x] Basic navigation structure
- [x] Environment configuration

### ✅ Milestone 2: Map & Exploration (COMPLETE)
- [x] Interactive Google Maps integration
- [x] Real-time bottle updates via Supabase subscriptions
- [x] Smooth filtering system (All/Tossed/Found)
- [x] Cross-platform marker optimization (iOS jitter fix)
- [x] Status-based marker colors (blue=adrift, green=found)
- [x] Pin prioritization with zIndex and visual distinction

### ✅ Milestone 3: Toss Bottle Flow (COMPLETE)
- [x] FAB (Floating Action Button) on home screen
- [x] Photo upload to Supabase storage
- [x] Location-based bottle creation
- [x] Edge function deployment (`toss_bottle`)
- [x] Success screen with bottle details
- [x] Real-time map updates after tossing

### ✅ Milestone 4: Claim/Find with Printed Bottles (COMPLETE)
- [x] QR code scanning interface
- [x] Bottle lifecycle management (claim → toss → find → re-toss)
- [x] Edge functions: `claim_or_toss_bottle` and `find_bottle`
- [x] Anonymous function access (JWT bypass)
- [x] Real-time bottle state transitions
- [x] Development testing tools
- [x] Complete bottle state management without duplicates

### 🎯 Next Milestone: Production Polish & Advanced Features
- [ ] Professional QR camera scanning
- [ ] User authentication system
- [ ] Bottle content viewing (messages/photos)
- [ ] Advanced map clustering for dense areas
- [ ] Push notifications for nearby bottles
- [ ] User profiles and bottle history

## Key Features Implemented

### 🗺️ Interactive Map
- **Real-time updates**: New bottles appear instantly on map
- **Smart filtering**: All/Tossed/Found with live counters
- **Cross-platform optimization**: Smooth performance on iOS/Android
- **Visual prioritization**: Green pins render above blue pins
- **Coordinate handling**: Deterministic jitter for overlapping markers

### 📱 Bottle Management
- **Complete lifecycle**: claim → toss → find → re-toss → find...
- **QR code integration**: JSON format with ID and password
- **Location services**: Automatic GPS coordinates
- **Photo uploads**: Supabase storage integration
- **Anonymous access**: No authentication required

### ⚡ Real-time System
- **Supabase subscriptions**: Instant bottle updates across devices  
- **Event-driven architecture**: bottle_events table for all state changes
- **Optimistic updates**: UI updates immediately with real-time sync
- **Duplicate prevention**: Smart bottle update logic

## Technical Implementation

### Database Schema
```sql
-- Core bottles table
bottles (id, status, lat, lon, message, photo_url, creator_id, created_at, updated_at)

-- Event tracking for real-time updates  
bottle_events (bottle_id, type, lat, lon, created_at)

-- User profiles (prepared for auth)
public_profiles (id, created_at, updated_at)
```

### Edge Functions
- **claim_or_toss_bottle**: Handles complete bottle lifecycle
- **find_bottle**: Marks bottles as found (prepared for future use)
- **Anonymous access**: JWT verification disabled via config.toml

### Development Tools
- **Test lifecycle button**: Uses static UUID for state testing
- **Create new bottle button**: Generates random bottles
- **Real-time debugging**: Visual feedback for all operations

## Current Status: MILESTONE 4 COMPLETE ✅

**All core functionality is working:**
- ✅ Interactive map with smooth filtering
- ✅ Real-time bottle updates without app restart
- ✅ Complete bottle lifecycle (claim/toss/find/re-toss)
- ✅ Cross-platform performance optimization
- ✅ Anonymous edge function access
- ✅ Development testing tools
- ✅ Pin visibility and prioritization

**Ready for next phase**: Production polish, user authentication, and advanced features. 