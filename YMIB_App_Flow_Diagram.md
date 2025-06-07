# YMIB App Flow Diagram

```mermaid
graph TB
    %% User Entry Points
    User[👤 User Opens App] --> Home[🏠 Home Screen<br/>Floating Bottle Animation]
    
    %% Main Navigation
    Home --> ScanBtn[📱 Scan Bottle Button]
    Home --> TabNav{Bottom Tab Navigation}
    
    TabNav --> HomeTab[🏠 Home]
    TabNav --> ExploreTab[🗺️ Explore Map]
    TabNav --> ProfileTab[👤 Profile]
    
    %% Smart Scanning Flow
    ScanBtn --> Scanner[📷 Smart QR Scanner<br/>UnifiedQRScanner]
    Scanner --> QRCheck{QR Code Detected?}
    
    QRCheck -->|Valid QR| DBCheck{Bottle exists<br/>in Database?}
    QRCheck -->|Invalid/Cancel| Home
    
    %% Smart Routing Logic
    DBCheck -->|New Bottle| CreateFlow[🆕 CREATE Flow<br/>Start New Journey]
    DBCheck -->|Existing Bottle| FindFlow[🔍 FIND Flow<br/>Discover & Retoss]
    
    %% CREATE Flow (Toss Screen)
    CreateFlow --> TossScreen[📝 Toss Screen<br/>Create Your Message]
    TossScreen --> TossForm[✍️ Add Message & Photo]
    TossForm --> TossLocation[📍 Set Location]
    TossLocation --> TossSubmit[💾 Save to Database]
    TossSubmit --> TossSuccess[✅ Bottle Cast Away!]
    
    %% FIND Flow (Found Screen)
    FindFlow --> FoundScreen[🔍 Found Screen<br/>View Bottle Journey]
    FoundScreen --> ViewJourney[📖 Enhanced Bottle Journey<br/>Nested Conversations]
    ViewJourney --> RetossChoice{Want to Retoss?}
    
    RetossChoice -->|Yes| RetossForm[🔄 Add Your Message]
    RetossChoice -->|No| ViewOnly[👀 View Only]
    
    RetossForm --> RetossLocation[📍 Set New Location]
    RetossLocation --> RetossSubmit[💾 Update Database]
    RetossSubmit --> RetossSuccess[✅ Bottle Retossed!]
    
    %% Map System
    ExploreTab --> MapView[🗺️ Interactive Map<br/>Google Maps Integration]
    MapView --> TrailMarkers[📍 Bottle Trail Markers]
    
    TrailMarkers --> MarkerTypes{Marker Types}
    MarkerTypes --> CreatedMarkers[🟢 Created<br/>Green Dots]
    MarkerTypes --> FoundMarkers[🟠 Found<br/>Orange Dots]  
    MarkerTypes --> RetossedMarkers[🔵 Retossed<br/>Blue Dots]
    
    %% Profile System
    ProfileTab --> ProfileTabs{Profile Tabs}
    ProfileTabs --> CreatedTab[🆕 Bottles Created<br/>Your Started Journeys]
    ProfileTabs --> FoundTab[🔍 Bottles Found<br/>Discovered & Retossed]
    ProfileTabs --> AllTab[💬 All Conversations<br/>Complete History]
    
    %% Database Layer
    subgraph Database[🗄️ Supabase Database]
        BottlesTable[(bottles table<br/>id, password_hash, message,<br/>photo_url, status, lat, lon)]
        EventsTable[(bottle_events table<br/>id, bottle_id, event_type,<br/>message, lat, lon, created_at)]
        StorageBucket[📁 Storage Bucket<br/>Photo Uploads]
    end
    
    %% Data Flow
    TossSubmit --> BottlesTable
    TossSubmit --> EventsTable
    TossSubmit --> StorageBucket
    
    RetossSubmit --> EventsTable
    RetossSubmit --> StorageBucket
    
    %% Real-time Updates
    BottlesTable -.->|Real-time Subscriptions| MapView
    EventsTable -.->|Real-time Subscriptions| MapView
    EventsTable -.->|Real-time Subscriptions| ProfileTab
    
    %% Data Fetching
    MapView --> useBottles[🔄 useBottles Hook<br/>React Query + Supabase]
    ProfileTab --> useBottles
    ViewJourney --> useBottles
    
    useBottles --> Database
    
    %% Success Flows Return to Home
    TossSuccess --> Home
    RetossSuccess --> Home
    ViewOnly --> Home
    
    %% Styling
    classDef userFlow fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef createFlow fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px
    classDef findFlow fill:#fff3e0,stroke:#ef6c00,stroke-width:2px
    classDef database fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef realtime fill:#ffebee,stroke:#c62828,stroke-width:2px,stroke-dasharray: 5 5
    
    class User,Home,TabNav,HomeTab,ExploreTab,ProfileTab userFlow
    class CreateFlow,TossScreen,TossForm,TossLocation,TossSubmit,TossSuccess createFlow
    class FindFlow,FoundScreen,ViewJourney,RetossForm,RetossLocation,RetossSubmit,RetossSuccess findFlow
    class Database,BottlesTable,EventsTable,StorageBucket database
    class useBottles realtime
```

## Legend

### 🎨 **Color Coding**
- **Light Blue**: Main user navigation flows
- **Light Green**: CREATE flow (new bottles)
- **Light Orange**: FIND flow (existing bottles)
- **Light Purple**: Database components
- **Light Red (Dashed)**: Real-time data connections

### 📱 **Key Components**
- **Smart QR Scanner**: Automatically routes to CREATE or FIND based on bottle status
- **Enhanced Bottle Journey**: Shows nested conversations and complete bottle trail
- **Trail Markers**: Color-coded map markers showing bottle activity history
- **Real-time Updates**: Live map and profile updates via Supabase subscriptions

### 🔄 **Main User Flows**
1. **Scan → CREATE**: New bottle → Add message → Cast away
2. **Scan → FIND**: Existing bottle → View journey → Optionally retoss
3. **Explore**: View global bottle trail on interactive map
4. **Profile**: Track personal bottle history across three organized tabs 