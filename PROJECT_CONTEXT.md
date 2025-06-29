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
│   │   ├── _layout.tsx    # Bottom tab navigation (Home/Explore/Profile)
│   │   ├── index.tsx      # Home screen with unified scan button
│   │   ├── explore.tsx    # Map with bottle markers
│   │   └── profile.tsx    # User profile with bottle history & stats
│   ├── scan.tsx           # QR scanning with smart routing
│   ├── toss.tsx           # CREATE flow for new bottles
│   ├── found.tsx          # FIND/RETOSS flow for existing bottles
│   └── _layout.tsx        # Root layout
├── src/
│   ├── components/
│   │   ├── BottleJourney.tsx           # Original journey component
│   │   ├── EnhancedBottleJourney.tsx   # Enhanced with nested replies
│   │   └── UnifiedQRScanner.tsx        # Smart bottle scanner
│   ├── lib/
│   │   └── supabase.ts    # Supabase client config
│   └── services/          # API service functions
└── supabase/             # Database schema & functions
```

## Current Development Status

### ✅ **Completed Milestones**

#### **Milestone 1: Core Foundation** 
- Expo setup with TypeScript
- Supabase integration
- Basic navigation structure
- Database schema design

#### **Milestone 2: Basic Bottle System**
- QR code scanning functionality  
- Database operations (create/read bottles)
- Photo upload to Supabase Storage
- Basic toss and found flows

#### **Milestone 3: Maps & Discovery**
- Interactive map with react-native-maps
- Real-time bottle markers on map
- Location-based bottle discovery
- Map clustering for performance

#### **Milestone 4: Complete Bottle Lifecycle**
- Separate "Toss" and "Found" buttons
- Full bottle journey tracking
- Photo attachments working
- Real-time map updates
- End-to-end testing with mock bottles

#### **Milestone 5: Unified Smart Scanner**
- Single "Scan Bottle" button replacing separate toss/found
- Automatic bottle detection (new → CREATE, existing → FIND)
- Smart routing based on database status
- Enhanced UX with loading states
- Test bottles work for complete lifecycle

#### **Milestone 6: Profile Tab & Nested Replies**
- New Profile tab in bottom navigation
- Enhanced bottle journey visualization
- Nested conversation threads (replies to each toss)
- Expandable message interactions
- Rich mock data with conversation examples

#### **Milestone 7: Consistent Naming Convention** ✅ **COMPLETE**
**Objective**: Unified naming convention throughout the app to clearly distinguish bottle interaction types.

**Key Implementation**:
- **CREATE** (🆕): Start a fresh bottle's journey (first-time toss of new bottle)  
- **FIND** (🔍): Discover existing bottles created by others
- **RETOSS** (🔄): Add your message to found bottles and send back out

**Updated Components**:
- **Profile Screen**: Three-tab system (Created/Found/All Conversations) with color coding
- **Home Screen**: Smart routing with CREATE/FIND explanation cards
- **Enhanced Journey**: Step type detection with consistent icon system (🆕/🔄/🔍)
- **Toss Flow**: "🆕 Create Your Message" with journey emphasis
- **Found Flow**: "🔍 Bottle Found!" with "🔄 Add Message & Retoss" option

**Technical Implementation**:
- Unified scanner with smart routing based on bottle database status
- Enhanced bottle journey visualization with action type distinction  
- Comprehensive mock data for testing all interaction patterns
- Consistent terminology across all user-facing elements

### 🎯 **Terminology Standards**
```
Actions:
🆕 CREATE  = Start fresh bottle (new bottle → your first message)
🔍 FIND    = Discover existing bottle (someone else's bottle)
🔄 RETOSS  = Add to found bottle (continue its journey)

User Interface:
- Home: "Scan Bottle" (smart routing)
- Profile Stats: "Bottles Created" vs "Bottles Found"  
- Profile Tabs: Created / Found / All Conversations
- Journey Steps: CREATE (🆕) / RETOSS (🔄) / FIND replies (🔍)
- Flow Screens: "Create Your Message" vs "Add Your Message"
```

### 🚧 **Current Features**

#### **Smart Unified Scanning**
- Single entry point for all bottle interactions
- Automatic detection of bottle status (new vs existing)
- Seamless routing to appropriate flow (CREATE vs FIND)

#### **Enhanced Profile System**
- **Three main tabs:**
  - 🆕 **Bottles Created**: Shows bottles you started
  - 🔍 **Bottles Found**: Shows bottles you discovered & retossed  
  - 💬 **All Conversations**: Combined view of all your bottle interactions

#### **Rich Journey Visualization**
- **Nested conversation threads** with expandable replies
- **Clear visual distinction** between CREATE, RETOSS, and FIND interactions
- **Timeline format** showing bottle's path around the world
- **Mock conversation data** demonstrating international bottle journeys

#### **Test Data & Development**
- Test bottles with realistic conversation examples
- International journey scenarios (NYC→London→Tokyo→Bali)
- Consistent mock data across all screens
- Perfect for demonstrating app functionality

### 🎮 **Demo Experience**
1. **Home Screen**: Tap "Scan Bottle" 
2. **Smart Routing**: Choose Test Bottle 1/2/3
3. **CREATE Flow**: If bottle doesn't exist in DB
4. **FIND Flow**: If bottle exists with conversations
5. **Profile**: View organized bottle history with nested conversations

### 🔄 **Next Development Priorities**

#### **Phase 1: User Authentication** (Next)
- User accounts and login system
- Real bottle ownership tracking  
- Personal bottle statistics
- User profiles with avatars

#### **Phase 2: Real-time Features**
- Live notifications for bottle interactions
- Real-time reply system integration
- Push notifications for new finds
- Live conversation updates

#### **Phase 3: Social Features**  
- Achievement badges and milestones
- Bottle sharing and social discovery
- User following and friend systems
- Leaderboards and community features

#### **Phase 4: Advanced Features**
- Advanced analytics and insights
- Bottle journey predictions
- AI-powered content moderation
- Premium features and monetization

## Technical Implementation Notes

### **Database Schema**
```sql
bottles: id, password_hash, message, photo_url, status, created_at, location
bottle_events: id, bottle_id, event_type, message, photo_url, location, created_at
```

### **Key Components**
- **UnifiedQRScanner**: Smart bottle detection and routing
- **EnhancedBottleJourney**: Nested conversation visualization  
- **Profile System**: Organized bottle history with clear categorization

### **Development Patterns**
- **Consistent naming** throughout all user-facing text
- **Smart routing** based on bottle database status
- **Mock data** for comprehensive testing without auth
- **Modular components** for easy feature expansion

### **Testing Strategy**
- Use Test Bottles 1, 2, 3 for development
- Fresh database state for CREATE flow testing
- Existing bottles for FIND/RETOSS flow testing
- Cross-screen navigation validation

---

**Status**: Milestone 7 Complete - Ready for user authentication phase
**Next Focus**: Real user accounts and bottle ownership tracking 

### **Milestone 8: Bottle Trail Map System** ✅ **COMPLETE**
**Objective**: Show permanent markers on the map for every bottle action, creating a visual trail of the bottle's journey.

**Key Features**:
- **Permanent Trail Markers**: Each CREATE/RETOSS/FIND action leaves a permanent marker on the map
- **Action-Specific Styling**: 
  - 🆕 **CREATE**: Green markers (#4CAF50) - where bottles begin their journey
  - 🔄 **RETOSS**: Blue markers (#2196F3) - where bottles continue their journey  
  - 🔍 **FIND**: Orange markers (#FF9800) - where bottles were discovered
- **Smart Filtering**: Filter by action type (All/Created/Retossed/Found)
- **Trail Visualization**: See complete bottle journeys across the world

**Technical Implementation**:
- `useBottles` hook now fetches complete event history from `bottle_events` table
- `BottleTrailMarker` interface for rich marker data with action types
- Map markers with proper layering (zIndex) and opacity for visual hierarchy
- Compatible with both `event_type`/`type` and `message`/`text` field variations
- Real-time updates via Supabase subscriptions for both bottles and events

**Database Schema Support**:
```sql
bottles: id, password_hash, message, photo_url, status, lat, lon, created_at
bottle_events: id, bottle_id, event_type, lat, lon, message, photo_url, created_at
```

**Map Legend**:
- Green dots: 🆕 Created (where bottles started)
- Blue dots: 🔄 Retossed (where bottles continued) 
- Orange dots: 🔍 Found (where bottles were discovered)

---

## Next Development Phase

### **Phase 2: User Authentication & Ownership**
**Objective**: Real user accounts with bottle ownership tracking and personalized features.

**Planned Features**:
- User registration and authentication
- Personal bottle ownership and tracking
- Real user profile system replacing mock data
- Push notifications for new finds
- Live conversation updates

#### **Phase 3: Social Features**  
- Achievement badges and milestones
- Bottle sharing and social discovery
- User following and friend systems
- Leaderboards and community features

#### **Phase 4: Advanced Features**
- Advanced analytics and insights
- Bottle journey predictions
- AI-powered content moderation
- Premium features and monetization

## Technical Implementation Notes

### **Database Schema**
```sql
bottles: id, password_hash, message, photo_url, status, created_at, location
bottle_events: id, bottle_id, event_type, message, photo_url, location, created_at
```

### **Key Components**
- **UnifiedQRScanner**: Smart bottle detection and routing
- **EnhancedBottleJourney**: Nested conversation visualization  
- **Profile System**: Organized bottle history with clear categorization
- **Trail Map System**: Complete bottle journey visualization with permanent markers

### **Development Patterns**
- **Consistent naming** throughout all user-facing text
- **Smart routing** based on bottle database status
- **Mock data** for comprehensive testing without auth
- **Modular components** for easy feature expansion
- **Trail visualization** showing complete bottle histories on map

### **Testing Strategy**
- Use Test Bottles 1, 2, 3 for development
- Fresh database state for CREATE flow testing
- Existing bottles for FIND/RETOSS flow testing
- Cross-screen navigation validation
- Trail map testing with multiple bottle interactions

---

**Status**: Milestone 8 Complete - Bottle Trail Map System Implemented
**Next Focus**: Real user accounts and bottle ownership tracking

### **Milestone 9: Sea Green Theme & Mysterious Maritime UI** ✅ **COMPLETE**
**Objective**: Transform the app's visual identity from playful baby blue to mysterious sea green with poetic nautical theming.

**Inspiration**: Bottled app's cohesive design system, but with sea green palette and mysterious/poetic tone instead of playful.

**Key Features**:
- **Sea Green Color Palette**: 
  - Primary: Deep sea greens (#009688, #00897B, #00796B)
  - Secondary: Ocean blues for accents
  - Accent colors: Treasure gold, coral reef, pearl white, **mustardy sea yellow (#D4AF37)**
- **Mysterious Maritime Copy**: 
  - Replace "matey" with "voyager," "wanderer," "sea keeper"
  - Poetic language: "whispers," "vessels," "ancient conversations"
  - Nautical terminology without heavy pirate accent
- **Enhanced Visual Elements**:
  - SeaCreatureMascot component (octopus, turtle, jellyfish, seahorse)
  - **Flush bottom navigation bar** with rounded top corners matching mockup
  - **Full-screen green background** extending behind status bar
  - **Transparent Nyma mascot** floating seamlessly in ocean
  - **Properly positioned scan button** above navigation bar
  - **Enhanced header** with larger, bold "Your Message in a Bottle" title
  - Comprehensive theme system with typography, spacing, shadows
  - Ocean-inspired gradients and shadows

**Technical Implementation**:
- `src/constants/theme.ts`: Complete design system with Colors, Typography, Spacing, BorderRadius, Shadows
- `src/components/SeaCreatureMascot.tsx`: Animated sea creature mascot component
- **Flush TabBar component**: Bottom navigation flush to screen with rounded top corners
- **Full-screen layout**: Green background extends to entire screen including status bar
- **Transparent Nyma**: Using `nyma_mascot-removebg.png` for seamless ocean integration
- **Mockup-perfect spacing**: Button and navigation positioning matches design exactly
- React Native compatible font weights and style types

**Design Philosophy**:
- **Mysterious but not dark**: Elegant sea greens with light backgrounds
- **Poetic but not pretentious**: Nautical language that feels natural
- **Maritime but not pirate**: Ocean-inspired without heavy pirate theming
- **Cohesive visual hierarchy**: Consistent spacing, typography, and color usage
- **Clean and focused**: Minimal homepage with clear call-to-action
- **Mockup-perfect**: Exact match to provided design specifications

**Final Status**:
- ✅ Clean homepage with transparent Nyma floating on ocean background
- ✅ Flush bottom navigation with rounded top corners and mustardy yellow accents
- ✅ Full-screen green background extending behind status bar
- ✅ Properly positioned scan button above navigation bar
- ✅ Enhanced header with larger, bold title in mustardy yellow
- ✅ Floating animation for Nyma
- ✅ Perfect spacing and layout matching mockup exactly

---

### **Milestone 10: Database Name Columns & Bug Fixes** ✅ **COMPLETE**
**Objective**: Fix critical issues with name tracking, navigation, and event type display.

**Issues Identified & Fixed**:

#### **1. Database Schema Missing Name Columns** ✅ **FIXED**
- **Problem**: App expected `creator_name`, `tosser_name`, `finder_name` columns but they didn't exist
- **Solution**: Created and ran `add_name_columns.sql` migration
- **Database Changes**:
  ```sql
  -- Added to bottles table
  creator_name TEXT, tosser_name TEXT
  
  -- Added to bottle_events table  
  tosser_name TEXT, finder_name TEXT
  ```

#### **2. AsyncStorage Name Field Clearing** ✅ **FIXED**
- **Problem**: Name field kept clearing on every screen load
- **Root Cause**: `checkUserProfile()` in toss screen was calling `AsyncStorage.removeItem('userName')`
- **Solution**: Removed the clearing logic, now properly persists user names

#### **3. Database Function Event Type Logic** ✅ **FIXED**
- **Problem**: Found events with replies were being marked as "retoss" instead of "found"
- **Root Cause**: Function logic treated any message as retoss
- **Solution**: Updated logic to detect "REPLY:" prefix for found events
- **New Logic**:
  ```typescript
  const isReply = message && message.startsWith("REPLY:");
  const isReToss = message !== undefined && !isReply;
  const eventType = isReToss ? "cast_away" : "found";
  ```

#### **4. Navigation "Go to Chat" Issue** ✅ **FIXED**
- **Problem**: "Go to Chat" button was navigating to bottle journey instead of messages tab
- **Root Cause**: Incorrect assumption that messages tab didn't exist
- **Solution**: Restored proper navigation to `/(tabs)/messages`
- **Current State**: Messages tab exists but shows placeholder "No active chats yet"

#### **5. Database Function Parameter Handling** ✅ **FIXED**
- **Problem**: Database function wasn't receiving/storing name parameters
- **Solution**: Updated `claim_or_toss_bottle` function to:
  - Accept `finderName` and `tosserName` parameters
  - Store `creator_name` and `tosser_name` in bottles table
  - Store `finder_name` and `tosser_name` in bottle_events table
  - Handle both CREATE and FIND flows with proper name tracking

**Technical Implementation**:
- **Database Migration**: `add_name_columns.sql` with proper indexes
- **Edge Function Updates**: Enhanced parameter handling and name storage
- **App Logic Fixes**: Removed AsyncStorage clearing, fixed navigation
- **Event Type Detection**: Smart detection of reply vs retoss actions

**Current Status**:
- ✅ Names properly persist across app sessions
- ✅ Database stores creator, tosser, and finder names
- ✅ Found events correctly show as "found" not "retossed"
- ✅ "Go to Chat" navigates to messages tab
- ✅ All database columns exist and are populated
- ⚠️ Messages tab shows placeholder (needs chat functionality)

---

## Next Development Phase

### **Phase 2: Chat System Implementation**
**Objective**: Build actual chat functionality for the messages tab.

**Planned Features**:
- List of active bottle conversations
- Real-time chat interface for each bottle
- Message history and threading
- Integration with bottle journey system
- Push notifications for new messages

### **Phase 3: User Authentication & Ownership**
**Objective**: Real user accounts with bottle ownership tracking and personalized features.

**Planned Features**:
- User registration and authentication
- Personal bottle ownership and tracking
- Real user profile system replacing mock data
- Push notifications for new finds
- Live conversation updates

### **Milestone 11: Device Identity System & Code Quality Audit** ✅ **COMPLETE**
**Objective**: Implement device-based anonymous identity system and comprehensive code cleanup.

**Key Problem Solved**: Both test devices were sharing the same anonymous identity, making multi-device testing impossible.

#### **Device Identity System** ✅ **IMPLEMENTED**
**Features**:
- **Unique Device IDs**: Each device generates persistent identifier (e.g., `ios_abc123_xyz789`)
- **Auto-Generated Names**: Beautiful anonymous names like "Wanderer123", "Sailor456", "Explorer789"
- **Persistent Storage**: Names and device IDs persist across app sessions using AsyncStorage
- **Customizable Names**: Users can change their name anytime, stored per-device
- **Professional Pattern**: Follows Firebase/Supabase anonymous auth best practices

**Technical Implementation**:
- `src/hooks/useDeviceIdentity.ts`: Complete device identity management
- `app/toss.tsx`: Updated to use device identity instead of AsyncStorage
- **Name Generation**: Nautical prefixes + random numbers for unique identities
- **Fallback System**: Automatic name generation if user leaves field empty

**Testing Benefits**:
- ✅ iPhone gets unique identity (e.g., "Voyager847")  
- ✅ Android emulator gets different identity (e.g., "Navigator251")
- ✅ Each device maintains separate bottle history
- ✅ Multi-device testing of full bottle lifecycle now possible

#### **Comprehensive Code Quality Audit** ✅ **COMPLETE**

**Issues Identified & Fixed**:

##### **1. Duplicate Type Definitions** ✅ **FIXED**
- **Problem**: `BottleTrailMarker` interface duplicated in both `useBottles.ts` and `useBottleTrail.ts`
- **Solution**: Created `src/types/bottle.ts` with shared interfaces
- **New Shared Types**: `BottleTrailMarker`, `Bottle`, `BottleEvent`
- **Updated Imports**: Both hooks now use shared types

##### **2. Debug Logging Cleanup** ✅ **FIXED**
- **Problem**: 50+ console.log statements cluttering the codebase
- **Solution**: Systematically cleaned debug logs while preserving essential error logging
- **Cleaned Files**: 
  - `src/hooks/useBottles.ts` - Removed 13 debug logs
  - `src/hooks/useBottleTrail.ts` - Removed map polling logs
  - `src/hooks/useConversations.ts` - Cleaned fetch logs
  - `app/toss.tsx` - Removed identity logs
  - `app/chat/[bottleId].tsx` - Cleaned chat logs
  - `supabase/functions/claim_or_toss_bottle/index.ts` - Major cleanup

##### **3. Unused Variables & Types** ✅ **FIXED**
- **Removed**: `finder_id` variable in `supabase/functions/find_bottle/index.ts`
- **Deleted**: `src/types/global.d.ts` with unused `BottleMapPoint` interface
- **Cleaned**: Edge function unused auth code

##### **4. Enhanced Cursor Rules** ✅ **UPDATED**
- **Added Critical Code Quality Rules**:
  - Always update PROJECT_CONTEXT.md with significant changes
  - Remove duplicate code, interfaces, and types immediately
  - Clean up debug console.log statements before committing
  - Keep codebase clean and lean - no dead code or unused imports
  - When changing functionality, replace old logic completely
  - Do periodic code quality audits to catch technical debt early
  - Never delete core application logic without explicit confirmation

**Current Codebase Status**:
- ✅ **Zero duplicate interfaces or types**
- ✅ **Minimal debug logging** (only essential error logs remain)
- ✅ **No unused variables or imports**
- ✅ **Consistent type definitions** across all files
- ✅ **Clean, maintainable code structure**
- ✅ **Enhanced development rules** for future quality maintenance

**Testing Strategy Established**:
1. **iPhone Physical Device**: Real user testing with unique identity
2. **Android Emulator**: Different user for multi-device scenarios  
3. **Full Lifecycle Testing**: Create → Find → Reply → Retoss flows
4. **Chat System Testing**: Message exchanges between devices
5. **Map Consistency**: Both devices see same world map data

**Next Phase Ready**: With clean codebase and multi-device identity system, ready for advanced features and user authentication.

---

## Next Development Phase

### **Phase 2: Advanced Chat Features**
**Objective**: Enhance chat system with real-time updates and social features.

**Planned Features**:
- Real-time message updates with Supabase subscriptions
- User blocking and chat moderation
- Message reactions and rich media
- Friends list and social drawer
- Push notifications for new messages

### **Phase 3: User Authentication Migration**
**Objective**: Migrate from device identity to real user accounts.

**Planned Features**:
- Seamless upgrade from anonymous to registered accounts
- Data migration preserving bottle history
- Cross-device account synchronization
- Social profiles and user discovery