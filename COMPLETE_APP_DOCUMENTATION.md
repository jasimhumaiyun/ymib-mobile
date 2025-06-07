# YMIB (Your Message in a Bottle) - Complete App Documentation

## 📱 **App Overview**

**Name**: Your Message in a Bottle (YMIB)  
**Platform**: React Native with Expo  
**Backend**: Supabase (PostgreSQL + Real-time + Storage + Edge Functions)  
**Maps**: Google Maps  
**State Management**: React Query (TanStack Query)  
**Navigation**: Expo Router with file-based routing  

### **Core Concept**
Users create digital "bottles" containing messages and photos, cast them into virtual oceans where others can find, read, reply to, and retoss them, creating global journeys and conversations.

---

## 🏗️ **Technical Architecture**

### **Tech Stack**
- **Frontend**: React Native 0.79.2, Expo 53.0.9, TypeScript
- **Navigation**: Expo Router (file-based routing)
- **Backend**: Supabase (PostgreSQL, Real-time, Storage, Edge Functions)
- **State Management**: TanStack React Query v5
- **Maps**: react-native-maps with Google Maps
- **Styling**: StyleSheet with custom theme system
- **Camera/Photos**: expo-image-picker, expo-camera
- **Location**: expo-location
- **QR Codes**: expo-barcode-scanner

### **Database Schema**
```sql
-- Main bottles table
bottles: {
  id: UUID (primary key),
  password_hash: TEXT (6-char password),
  message: TEXT (user's message),
  photo_url: TEXT (optional photo),
  status: TEXT ('adrift' | 'found'),
  lat: FLOAT (latitude),
  lon: FLOAT (longitude),
  created_at: TIMESTAMP,
  creator_name: TEXT (optional),
  tosser_name: TEXT (optional)
}

-- Events tracking bottle journey
bottle_events: {
  id: UUID (primary key),
  bottle_id: UUID (foreign key),
  event_type: TEXT ('cast_away' | 'found'),
  lat: FLOAT,
  lon: FLOAT,
  message: TEXT,
  photo_url: TEXT (optional),
  tosser_name: TEXT (optional),
  parent_reply_id: UUID (for nested replies - NEW),
  created_at: TIMESTAMP
}
```

### **File Structure**
```
app/
├── (tabs)/
│   ├── _layout.tsx          # Custom tab bar with ocean theme
│   ├── index.tsx            # Home/Toss screen
│   ├── explore.tsx          # World Map screen
│   └── profile.tsx          # Profile screen
├── bottle-journey.tsx       # Bottle journey viewer
├── found.tsx               # Found bottle flow (modal)
├── scan.tsx               # QR scanner (modal)
├── toss.tsx               # Toss creation flow (modal)
└── _layout.tsx            # Root layout

src/
├── components/
│   ├── BottleJourney.tsx   # Simple journey display
│   └── EnhancedBottleJourney.tsx  # Advanced journey with nested replies
├── hooks/
│   └── useBottles.ts       # Main data fetching hook
├── lib/
│   └── supabase.ts         # Supabase client
└── constants/
    └── theme.ts            # Ocean-themed design system
```

---

## 🎨 **Design System**

### **Ocean Theme Colors**
- **Primary Ocean**: `#004D40` (deep ocean)
- **Sea Green**: `#00695C` (land on maps)
- **Mustard Sea**: `#D4AF37` (accent color for buttons/active states)
- **Treasure Gold**: `#FFB300` (created bottle markers)
- **Seaweed Green**: `#4CAF50` (found bottle markers)
- **Ocean Blue**: `#03A9F4` (retossed bottle markers)

### **Visual Identity**
- **Background**: Ocean scene image (`homepage_BG_new.png`) used throughout
- **Typography**: System fonts with ocean-themed messaging
- **Shadows**: Custom ocean-themed shadows
- **Borders**: Rounded corners (8-24px radius)
- **Spacing**: Consistent 4px-based spacing system

---

## 📱 **Screen-by-Screen Breakdown**

## **1. ROOT LAYOUT** (`app/_layout.tsx`)

### **Purpose**
Root level layout that wraps the entire app.

### **Components**
- Sets up navigation with Expo Router
- Provides global styling and theme
- Handles deep linking setup

---

## **2. TAB LAYOUT** (`app/(tabs)/_layout.tsx`)

### **Purpose**
Custom tab bar implementation with ocean theme.

### **Visual Design**
- **Background**: Ocean image with transparent overlays
- **Tab Bar**: Floating glass-morphism style with rounded top corners
- **Logo**: Only shows on Home tab (conditional rendering)
- **Active State**: Mustard yellow icons and text

### **Tabs**
1. **Home** (`index`) - House icon
2. **World Map** (`explore`) - Globe icon  
3. **Profile** (`profile`) - Person icon

### **Header Logic**
- **Home Tab**: Shows large YMIB logo (800x200px)
- **Other Tabs**: No logo, clean header

---

## **3. HOME/TOSS SCREEN** (`app/(tabs)/index.tsx`)

### **Purpose**
Main landing screen where users create new message bottles.

### **Visual Layout**
- **Background**: Full ocean scene image
- **Logo**: Large YMIB logo at top (only on this tab)
- **Main Button**: Large "Cast Your Message" button (mustard yellow)
- **Subtitle**: "Send your thoughts across the digital seas"

### **User Interactions**

#### **Main Button Click → Navigates to Toss Flow**
```typescript
router.push('/toss')
```

### **What Happens**
1. User sees ocean-themed landing page
2. Clicks "Cast Your Message" 
3. App navigates to toss creation modal (`/toss`)

---

## **4. TOSS CREATION FLOW** (`app/toss.tsx`)

### **Purpose**
Modal screen for creating new message bottles.

### **Flow Steps**

#### **Step 1: Compose Message**
- **Input**: Multi-line text input (500 char limit)
- **Placeholder**: "What message will you cast into the digital seas?"
- **Photo Options**: 
  - "📸 Take Photo" button
  - "🖼️ Choose from Gallery" button
- **Validation**: Message required, photo optional

#### **Step 2: Tossing Animation**
- **Trigger**: User clicks "Toss Your Bottle!" 
- **Process**:
  1. Gets user's GPS location
  2. Uploads photo to Supabase Storage (if provided)
  3. Calls `toss_bottle` edge function
  4. Shows animated bottle tossing sequence
- **Animation**: Bottle flies up and spins away (6-second sequence)

#### **Step 3: Success**
- **Display**: Success message with bottle ID
- **Action**: "Continue Exploring" button returns to home

### **Technical Process**
```typescript
// 1. Get location
const location = await Location.getCurrentPositionAsync()

// 2. Upload photo (if any)
const photoUrl = await uploadPhoto(photo)

// 3. Call edge function
const { data } = await supabase.functions.invoke('toss_bottle', {
  body: { message, photoUrl, lat, lon }
})

// 4. Create bottle in database with random 6-char password
// 5. Create initial 'cast_away' event
// 6. Return bottle ID and password
```

### **Database Operations**
1. **Insert into bottles table**: Creates new bottle record
2. **Insert into bottle_events table**: Creates 'cast_away' event
3. **Upload to storage bucket**: Stores photo if provided

---

## **5. WORLD MAP SCREEN** (`app/(tabs)/explore.tsx`)

### **Purpose**
Global map showing all bottle activities worldwide.

### **Visual Design**
- **Background**: Ocean scene image
- **Header**: "Global Ocean Chart" title
- **Subtitle**: Dynamic message count ("X messages drift across the seas")
- **Map**: Custom styled Google Map with ocean theme
- **Legend**: Floating legend showing marker types

### **Custom Map Styling**
```typescript
const customMapStyle = [
  {
    "featureType": "water",
    "elementType": "geometry", 
    "stylers": [{ "color": "#004D40" }] // Deep ocean
  },
  {
    "featureType": "landscape",
    "elementType": "geometry.fill",
    "stylers": [{ "color": "#00695C" }] // Sea green land
  },
  // Hides roads, POIs for clean nautical look
]
```

### **Filter System**
4 filter tabs above map:
1. **All** - Shows all markers
2. **Created** - Shows only creation points (gold markers)
3. **Found** - Shows only discovery points (green markers)  
4. **Retossed** - Shows only retoss points (blue markers)

### **Marker Types**
- **Created** (`#FFB300`): 🆕 Where bottles began their journey
- **Found** (`#4CAF50`): 🔍 Where bottles were discovered
- **Retossed** (`#03A9F4`): 🔄 Where bottles continued their journey

### **Data Source**
Uses `useBottles(true)` hook which:
1. Fetches all bottles from database
2. Fetches all bottle_events 
3. Creates trail markers for each action
4. Applies intelligent spacing for overlapping markers
5. Real-time updates via Supabase subscriptions

### **User Interactions**
- **Filter Tabs**: Change displayed markers
- **Map Pan/Zoom**: Standard map navigation
- **Marker Tap**: Shows info popup with message preview

---

## **6. PROFILE SCREEN** (`app/(tabs)/profile.tsx`)

### **Purpose**
User's personal dashboard showing their bottle statistics and activity.

### **Visual Layout**
- **Background**: Ocean scene image
- **Header**: "Your Ocean Journey" title
- **Stats Cards**: 3 mustard yellow cards showing metrics
- **Main Action**: "View Bottle Journeys" button
- **Recent Activity**: List of recent bottle interactions

### **Stats Display**
```
🆕 Created: X    🔍 Found: Y    🔄 Retossed: Z
```

### **Stats Logic**
Uses same `useBottles(true)` hook as world map:
1. Counts unique bottles by action type
2. Deduplicates trail markers to avoid double-counting
3. **Created**: Bottles user originally created
4. **Found**: Bottles user discovered and interacted with
5. **Retossed**: Bottles user retossed back into circulation

### **Recent Activity Cards**
Shows last 5 bottle interactions:
- **Card Design**: Dark ocean background with rounded corners
- **Content**: Type, date, bottle ID, message preview
- **Icons**: Emoji representing action type

### **Main Action Button**
"View Bottle Journeys" → Navigates to individual bottle journey pages

### **User Interactions**
- **Stats Cards**: Visual only, no interaction
- **Activity Cards**: Could navigate to bottle journey (not implemented)
- **Main Button**: Opens bottle journey viewer

---

## **7. QR SCANNER** (`app/scan.tsx`)

### **Purpose**
Modal for scanning QR codes on bottles to discover them.

### **Camera Interface**
- **Full Screen**: Camera viewfinder takes full screen
- **Overlay**: Semi-transparent overlay with scan area
- **Instructions**: "Point camera at bottle QR code"
- **Dev Mode**: Shows clickable bottle list in development

### **Scan Process**
1. **Camera Permission**: Requests camera access
2. **QR Detection**: Uses `expo-barcode-scanner`
3. **Data Extraction**: Parses bottle ID and password from QR
4. **Route Decision**: Calls `checkBottleStatusAndRoute()`

### **Routing Logic**
```typescript
function checkBottleStatusAndRoute(id, password) {
  // Check bottle status in database
  const bottle = await fetchBottle(id, password)
  
  if (bottle.status === 'adrift') {
    // Fresh bottle or retossed bottle
    router.push('/found', { bottleId: id, bottlePassword: password })
  } else if (bottle.status === 'found') {
    // Already found, can retoss
    router.push('/found', { bottleId: id, bottlePassword: password })
  }
}
```

### **Dev Mode Features**
- **Test Bottles**: List of sample bottles for testing
- **Click to Scan**: Simulates scanning without camera
- **Bottle Info**: Shows bottle ID and password

---

## **8. FOUND BOTTLE FLOW** (`app/found.tsx`)

### **Purpose**
Complete flow for interacting with discovered bottles.

### **Flow Steps Overview**
1. **Loading** - Fetching bottle information
2. **Viewing** - Displaying bottle content with "Mark as Found" button
3. **Replying** - Adding reply message and photo
4. **Ask Retoss** - Option to retoss immediately or save for later
5. **Adding** - Composing new message for retoss
6. **Retossing** - Animation and processing
7. **Success** - Confirmation and return home

---

### **STEP 1: LOADING**
- **Display**: "🔍 Finding bottle..." with loading spinner
- **Process**: 
  1. Validates bottle ID and password
  2. Fetches bottle data from database
  3. Fetches complete event history
  4. Determines current bottle state

### **Bottle State Logic**
```typescript
// Key logic for determining bottle state
const hasFoundEvent = allEvents?.some(event => event.event_type === 'found')
const shouldGoToRetoss = bottle.status === 'found' && hasFoundEvent

if (shouldGoToRetoss) {
  // Bottle currently found, go to retoss options
  setStep('askRetoss')
} else {
  // Bottle is adrift (fresh or retossed), can be found
  setStep('viewing') 
}
```

---

### **STEP 2: VIEWING** 
**Visual Layout**:
- **Header**: "Bottle Found!"
- **Subtitle**: "Discovered by: Anonymous • Continue its journey!"
- **Bottle Card**: Shows original message and photo
- **Journey Button**: "🍾 View Bottle Journey" 
- **Action Button**: "Mark as Found & Reply"

**User Interactions**:
- **View Journey Button** → Opens journey modal
- **Mark as Found Button** → Creates found event, goes to Step 3

**Technical Process**:
```typescript
const handleMarkAsFound = async () => {
  // 1. Get current location
  const location = await Location.getCurrentPositionAsync()
  
  // 2. Create FOUND event in database
  await supabase.from('bottle_events').insert({
    bottle_id: bottleId,
    event_type: 'found',
    lat: location.latitude,
    lon: location.longitude,
    message: 'Bottle found', // System message
    created_at: new Date().toISOString()
  })
  
  // 3. Move to replying step
  setStep('replying')
}
```

---

### **STEP 3: REPLYING**
**Visual Layout**:
- **Header**: "Reply to Sender"
- **Conversation View**: Shows original message with nested reply area
- **Reply Input**: Multi-line text input (300 char limit)
- **Photo Options**: Take photo or choose from gallery
- **Action Buttons**: "Skip Reply" | "Submit Reply & Continue"

**User Interactions**:
- **Photo Buttons** → Launch camera or gallery picker
- **Skip Reply** → Go directly to Step 4 (askRetoss)
- **Submit Reply** → Save reply and go to Step 4

**Technical Process**:
```typescript
const handleSubmitReply = async () => {
  // 1. Get location
  const location = await Location.getCurrentPositionAsync()
  
  // 2. Upload photo if provided
  const photoUrl = await uploadPhoto(replyPhoto)
  
  // 3. Create reply event with special format
  await supabase.from('bottle_events').insert({
    bottle_id: bottleId,
    event_type: 'found', 
    lat: location.latitude,
    lon: location.longitude,
    message: `REPLY: ${replyMessage}`, // Special prefix for replies
    photo_url: photoUrl,
    parent_reply_id: parentReplyId, // For nested replies
    created_at: new Date().toISOString()
  })
  
  setStep('askRetoss')
}
```

---

### **STEP 4: ASK RETOSS**
**Visual Layout**:
- **Header**: "🔄 Retoss Bottle?"
- **Message**: "Would you like to retoss this bottle now or save it for later?"
- **Buttons**: "Save for Later" | "Retoss Now"

**User Interactions**:
- **Save for Later** → Shows save confirmation, returns home
- **Retoss Now** → Go to Step 5 (adding)

---

### **STEP 5: ADDING** 
**Visual Layout**:
- **Header**: "Add Your Message"
- **Subtitle**: "Continue this bottle's journey with your story!"
- **Message Input**: Multi-line text (500 char limit)
- **Photo Section**: Optional photo selection
- **Action Button**: "Retoss Bottle!"

**User Interactions**:
- **Photo Buttons** → Camera or gallery
- **Retoss Button** → Process retoss and go to Step 6

---

### **STEP 6: RETOSSING**
**Visual Layout**:
- **Header**: "Retossing bottle..."
- **Subtitle**: "Adding your message and sending it back into the world 🌊"
- **Animation**: Same bottle tossing animation as original toss

**Technical Process**:
```typescript
const handleReToss = async () => {
  // 1. Get location
  const location = await Location.getCurrentPositionAsync()
  
  // 2. Upload photo if provided
  const photoUrl = await uploadPhoto(newPhoto)
  
  // 3. Call edge function to retoss
  const { data } = await supabase.functions.invoke('claim_or_toss_bottle', {
    body: {
      id: bottleId,
      password: bottlePassword, 
      message: newMessage || 'Continuing the journey...',
      photoUrl,
      lat: location.latitude,
      lon: location.longitude
    }
  })
  
  setStep('success')
}
```

**Edge Function Logic**:
```typescript
// claim_or_toss_bottle function determines action based on message parameter
const isReToss = message !== undefined
const newStatus = isReToss ? "adrift" : "found"
const eventType = isReToss ? "cast_away" : "found"

// Updates bottle record and creates new event
```

---

### **STEP 7: SUCCESS**
**Visual Layout**:
- **Icon**: "🌊" 
- **Header**: "Bottle Retossed!"
- **Message**: "Your message has been added to this bottle's journey..."
- **Button**: "Continue Exploring" → Returns home

---

## **9. BOTTLE JOURNEY VIEWER** (`app/bottle-journey.tsx`)

### **Purpose**
Detailed view of a bottle's complete journey through all tosses and replies.

### **Entry Points**
1. From found flow "View Bottle Journey" button
2. From profile "View Bottle Journeys" (planned)
3. Direct navigation with bottleId parameter

### **Journey Display Logic**

#### **Data Processing**
```typescript
// 1. Fetch bottle data and all events
const bottle = await supabase.from('bottles').select('*').eq('id', bottleId)
const allEvents = await supabase.from('bottle_events').select('*').eq('bottle_id', bottleId)

// 2. Build journey structure
const castAwayEvents = allEvents.filter(e => e.event_type === 'cast_away')
const foundEvents = allEvents.filter(e => e.event_type === 'found')

// 3. Associate replies with their parent toss events
castAwayEvents.forEach((castEvent, index) => {
  // Time-based association: found events between this cast and next cast
  const currentCastTime = new Date(castEvent.created_at).getTime()
  const nextCastTime = castAwayEvents[index + 1]?.created_at || Infinity
  
  const relevantReplies = foundEvents.filter(foundEvent => {
    const foundTime = new Date(foundEvent.created_at).getTime()
    return foundTime > currentCastTime && foundTime < nextCastTime
  })
  
  // Build nested reply tree for this journey step
  journeyStep.replies = buildReplyTree(relevantReplies)
})
```

#### **Nested Reply System**
```typescript
// Supports replies to replies using parent_reply_id
const buildReplyTree = (events, parentId = undefined) => {
  const directReplies = events.filter(e => e.parent_reply_id === parentId)
  
  return directReplies.map(event => ({
    id: event.id,
    message: event.message.replace('REPLY: ', ''), // Remove prefix
    photo_url: event.photo_url,
    created_at: event.created_at,
    finder_name: event.tosser_name || 'Anonymous',
    replies: buildReplyTree(events, event.id) // Recursive nesting
  }))
}
```

### **Visual Components**

#### **Journey Steps**
Each major toss (cast_away event) creates a journey step:
- **1st CREATE**: Shows original message with "Original Creator" label
- **2nd+ RETOSS**: Shows retoss message with "Anonymous" tosser

#### **Reply Structure**
```
🍾 1st CREATE: "Original message"
├── 💬 Reply: "First reply" [Reply Button]
│   ├── 💬 Reply to Reply: "Nested reply 1" [Reply Button]
│   └── 💬 Reply to Reply: "Nested reply 2" [Reply Button]
└── 💬 Reply: "Second reply" [Reply Button]

🔄 1st RETOSS: "Continued message"  
└── 💬 Reply: "Reply to retoss" [Reply Button]
```

#### **Reply Buttons**
Each reply has a "Reply" button that:
1. Navigates to found.tsx with `parent_reply_id` parameter
2. Enables nested conversation threading
3. Limited to 3 levels deep to prevent UI issues

### **User Interactions**
- **Expand/Collapse**: Tap journey step to show/hide replies
- **Reply Button**: Create nested reply to any message
- **Retoss Button**: Available if bottle can be retossed
- **Back Navigation**: Return to previous screen

### **Retoss Availability**
Shows retoss button if:
- Bottle has found events (been discovered)
- Last event is a found event (currently found)
- Bottle status is 'found'

---

## **10. ENHANCED BOTTLE JOURNEY COMPONENT** (`src/components/EnhancedBottleJourney.tsx`)

### **Purpose**
Reusable component for displaying bottle journeys with advanced features.

### **Features**
- **Expandable Steps**: Click to show/hide replies
- **Visual Nesting**: Indented replies with depth limits
- **Reply Threading**: Support for nested conversations
- **Photo Display**: Shows photos in journey steps and replies
- **Responsive Design**: Adapts to different screen sizes

### **Props**
```typescript
interface EnhancedBottleJourneyProps {
  journey: JourneyStep[];
  bottleId?: string; // For reply functionality
}
```

### **Visual Styling**
- **Main Pills**: Rounded containers for each journey step
- **Reply Pills**: Smaller, indented containers for replies
- **Color Coding**: Different colors for CREATE vs RETOSS
- **Typography**: Ocean-themed fonts and colors
- **Shadows**: Depth with custom ocean shadows

---

## 🔄 **Data Flow & State Management**

### **Primary Data Hook: `useBottles`**
Central hook that powers both World Map and Profile screens.

```typescript
export function useBottles(isMapActive: boolean = true) {
  return useQuery({
    queryKey: ['bottles-trail'],
    queryFn: async (): Promise<BottleTrailMarker[]> => {
      // 1. Fetch all bottles
      const bottles = await supabase.from('bottles').select('*')
      
      // 2. For each bottle, fetch its complete event history
      for (const bottle of bottles) {
        const events = await supabase.from('bottle_events')
          .select('*')
          .eq('bottle_id', bottle.id)
          .order('created_at', { ascending: true })
        
        // 3. Create trail markers for each action
        events.forEach((event, index) => {
          if (event.event_type === 'cast_away') {
            const castAwayIndex = events.slice(0, index + 1)
              .filter(e => e.event_type === 'cast_away').length - 1
            
            const actionType = castAwayIndex === 0 ? 'created' : 'retossed'
            
            markers.push({
              id: `${bottle.id}-${event.id}`,
              bottleId: bottle.id,
              actionType,
              status: bottle.status,
              lat: event.lat,
              lon: event.lon,
              message: event.message,
              photo_url: event.photo_url,
              created_at: event.created_at
            })
          }
        })
      }
      
      return markers
    }
  })
}
```

### **Real-time Updates**
```typescript
// Subscribe to changes in bottles and bottle_events tables
const channel = supabase
  .channel('bottles-realtime')
  .on('postgres_changes', { 
    event: '*', 
    schema: 'public', 
    table: 'bottles' 
  }, (payload) => {
    queryClient.invalidateQueries(['bottles-trail'])
  })
  .on('postgres_changes', { 
    event: '*', 
    schema: 'public', 
    table: 'bottle_events' 
  }, (payload) => {
    queryClient.invalidateQueries(['bottles-trail'])
  })
  .subscribe()
```

### **Smart Polling**
- **Real-time First**: Attempts Supabase real-time subscriptions
- **Fallback Polling**: Every 5 minutes if real-time fails
- **Activity-based**: Only polls when map is active
- **Cleanup**: Proper subscription cleanup on unmount

---

## 🚀 **Edge Functions (Supabase)**

### **1. `toss_bottle` Function**
**Purpose**: Creates new bottles

```typescript
export default async (req) => {
  const { message, photoUrl, lat, lon } = await req.json()
  
  // Generate random 6-character password
  const password = crypto.randomUUID().slice(0, 6)
  
  // Insert bottle
  const bottle = await client.from("bottles").insert({
    message,
    photo_url: photoUrl,
    lat,
    lon,
    status: "adrift",
    password_hash: password,
  }).select().single()
  
  // Create initial cast_away event
  await client.from("bottle_events").insert({
    bottle_id: bottle.id,
    event_type: "cast_away", 
    lat,
    lon,
    message,
    photo_url: photoUrl,
  })
  
  return { id: bottle.id, password }
}
```

### **2. `claim_or_toss_bottle` Function**
**Purpose**: Handles both finding and retossing bottles

```typescript
export default async (req) => {
  const { id, password, message, photoUrl, lat, lon } = await req.json()
  
  // Fetch existing bottle
  const bottle = await client.from("bottles")
    .select("*")
    .eq("id", id)
    .maybeSingle()
  
  if (!bottle) {
    // Bottle doesn't exist - would create new one (not used in current flow)
    return createNewBottle(...)
  }
  
  // Validate password
  if (bottle.password_hash !== password) {
    return new Response("Invalid password", { status: 401 })
  }
  
  // Determine action based on message parameter
  const isReToss = message !== undefined
  const newStatus = isReToss ? "adrift" : "found"
  const eventType = isReToss ? "cast_away" : "found"
  
  // Update bottle
  const updatedBottle = await client.from("bottles").update({
    message: isReToss ? message : bottle.message,
    photo_url: photoUrl || bottle.photo_url,
    lat,
    lon, 
    status: newStatus,
    found_at: new Date().toISOString()
  }).eq("id", id).select().single()
  
  // Create event
  await client.from("bottle_events").insert({
    bottle_id: id,
    event_type: eventType,
    lat,
    lon,
    message: isReToss ? message : bottle.message,
    photo_url: photoUrl || bottle.photo_url
  })
  
  return { success: true, bottle: updatedBottle }
}
```

---

## 🗂️ **Complete User Journey Flows**

### **Flow 1: Create New Bottle**
1. **Home Screen** → Click "Cast Your Message"
2. **Toss Modal** → Enter message + optional photo → "Toss Your Bottle!"
3. **Processing** → Get location → Upload photo → Call edge function
4. **Animation** → 6-second bottle tossing animation
5. **Success** → Show bottle ID → "Continue Exploring" → Home

**Database Changes**:
- New record in `bottles` table (status: 'adrift')
- New record in `bottle_events` table (event_type: 'cast_away')

### **Flow 2: Find Fresh Bottle**
1. **Scan QR** → Get bottle ID/password → Check status
2. **Status**: 'adrift' → Navigate to Found Modal
3. **Found Modal - Viewing** → "Mark as Found & Reply"
4. **Found Modal - Replying** → Enter reply + photo → "Submit Reply"
5. **Found Modal - Ask Retoss** → "Retoss Now" or "Save for Later"
6. **Found Modal - Adding** → Enter new message → "Retoss Bottle!"
7. **Found Modal - Animation** → Retossing animation
8. **Found Modal - Success** → "Continue Exploring" → Home

**Database Changes**:
- Update `bottles` table (status: 'found' → 'adrift')
- Add `bottle_events` record (event_type: 'found', message: 'Bottle found')
- Add `bottle_events` record (event_type: 'found', message: 'REPLY: user_message')
- Add `bottle_events` record (event_type: 'cast_away', message: new_message)

### **Flow 3: Find Already Found Bottle**
1. **Scan QR** → Get bottle ID/password → Check status
2. **Status**: 'found' with found events → Navigate to Found Modal
3. **Found Modal - Ask Retoss** → Skip viewing/replying steps
4. **Continue with retoss flow...**

### **Flow 4: View World Map**
1. **World Map Tab** → Auto-loads all bottle data
2. **Filter Selection** → Choose All/Created/Found/Retossed
3. **Map Interaction** → Pan, zoom, tap markers
4. **Marker Info** → See bottle details in popup

### **Flow 5: View Profile Stats**
1. **Profile Tab** → Shows calculated stats
2. **Recent Activity** → See last 5 interactions
3. **View Journeys** → Navigate to bottle journey viewer

### **Flow 6: View Bottle Journey**
1. **Entry** → From found modal or profile
2. **Journey Display** → See complete bottle history
3. **Expand Steps** → Show/hide replies for each toss
4. **Reply to Replies** → Create nested conversations
5. **Retoss Option** → If available, retoss from journey view

---

## 🎯 **Key Features & Capabilities**

### **Current Working Features**
✅ **Toss Creation**: Full flow with animation  
✅ **QR Scanning**: Camera + dev mode testing  
✅ **Found Flow**: Complete 7-step modal flow  
✅ **World Map**: Custom themed map with filters  
✅ **Profile Stats**: Real-time calculated statistics  
✅ **Bottle Journey**: Full journey viewer with nested replies  
✅ **Real-time Updates**: Live data synchronization  
✅ **Photo Support**: Camera + gallery integration  
✅ **Location Services**: GPS for toss/find locations  
✅ **Ocean Theme**: Consistent design throughout  

### **Advanced Features**
✅ **Nested Replies**: Reply to replies with threading  
✅ **Smart Marker Spacing**: Prevents overlapping on map  
✅ **Intelligent State Management**: Proper found/adrift logic  
✅ **Custom Map Styling**: Nautical chart appearance  
✅ **Responsive Design**: Works on all screen sizes  
✅ **Error Handling**: Graceful failures with ocean-themed messages  

### **Database Features**
✅ **Complex Event Tracking**: Full bottle lifecycle  
✅ **Photo Storage**: Supabase storage integration  
✅ **Real-time Subscriptions**: Live updates  
✅ **Edge Functions**: Server-side business logic  
✅ **Password Protection**: 6-character bottle passwords  
✅ **Nested Reply Support**: parent_reply_id relationships  

---

## 🐛 **Known Issues & Limitations**

### **Current Known Issues**
1. **Database Schema**: `parent_reply_id` column needs to be added to production
2. **Mock Authentication**: Uses AsyncStorage names instead of real auth
3. **Dev Dependencies**: Some Expo packages need updates
4. **Reply Threading**: UI could be more intuitive for nested replies

### **Technical Limitations**
- **No User Authentication**: Everything is anonymous
- **No Push Notifications**: No alerts for new finds/replies
- **No Offline Support**: Requires internet connection
- **No Image Optimization**: Photos uploaded at full resolution
- **No Content Moderation**: No filtering of inappropriate content

### **Future Enhancements Needed**
- Real user authentication system
- Push notification for bottle interactions
- Offline mode with sync
- Image compression and optimization
- Content moderation and reporting
- Social features (user profiles, following)
- Advanced analytics and insights

---

## 📊 **Performance Considerations**

### **Optimization Strategies**
- **React Query Caching**: Prevents unnecessary API calls
- **Marker Virtualization**: Efficient map rendering
- **Image Lazy Loading**: Photos load as needed
- **Smart Polling**: Only when screens are active
- **Subscription Cleanup**: Prevents memory leaks

### **Scalability Notes**
- **Database Indexing**: Proper indexes on frequently queried fields
- **Edge Function Efficiency**: Minimal processing in serverless functions
- **Real-time Scaling**: Supabase handles connection scaling
- **Storage Optimization**: Consider CDN for global photo delivery

---

This documentation represents the complete current state of the YMIB app as of the latest development session. Every screen, flow, interaction, and technical detail has been documented to provide full context for further development. 