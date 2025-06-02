# YMIB Project Context

> **Last Updated**: 2025-01-27 | **Status**: Milestone 1 Complete ✅
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

### Milestone 2: Map & Exploration (NEXT)
- [ ] Interactive map with user location
- [ ] Message clustering on map
- [ ] Basic message dropping
- [ ] Message discovery mechanics

### Milestone 3: Authentication & Profiles
- [ ] User authentication (Supabase Auth)
- [ ] User profiles
- [ ] Message ownership

### Milestone 4: Advanced Features
- [ ] Real-time notifications
- [ ] Message categories/types
- [ ] Advanced filtering
- [ ] Social features (likes, replies)

## 🏗️ Technical Architecture

### Tech Stack
- **Frontend**: Expo (React Native) with TypeScript
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **State Management**: React Query (@tanstack/react-query)
- **Maps**: React Native Maps (planned)
- **Navigation**: Expo Router (planned)

### Project Structure
```
ymib-mobile/
├── src/
│   ├── components/          # Reusable UI components
│   ├── screens/            # Screen components  
│   ├── hooks/              # Custom hooks
│   ├── lib/                # Utilities and configurations
│   ├── types/              # TypeScript type definitions
│   ├── services/           # API services
│   └── constants/          # App constants
├── assets/                 # Images, fonts, etc.
├── .cursorrules           # Development guidelines
├── PROJECT_CONTEXT.md     # This file
└── ...
```

### Database Schema (Planned)
```sql
-- Users (handled by Supabase Auth)
-- Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  content TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  discovered_by UUID[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE
);
```

## 🔧 Current State

### What's Working ✅
- ✅ Expo TypeScript project initialized
- ✅ Supabase client configured (`src/lib/supabase.ts`)
- ✅ Health check hook implemented (`src/hooks/usePingSupabase.ts`)
- ✅ React Query setup with QueryClientProvider
- ✅ Professional development environment (.cursorrules)
- ✅ Comprehensive project documentation
- ✅ Git repository with proper commit history
- ✅ GitHub repository connection established

### What's Next 🚧
- [ ] Set up Expo Router for navigation
- [ ] Implement basic map view with react-native-maps
- [ ] Create message data models and types
- [ ] Set up Supabase database schema

### Environment Variables
```bash
# .env (you need to update with real values)
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE
```

## 🔄 Development Workflow

### Current Sprint Status
**Goal**: ✅ **MILESTONE 1 COMPLETE** - Foundation setup finished successfully

**Next Goal**: Start Milestone 2 - Map & Exploration
- [ ] Set up react-native-maps
- [ ] Implement basic map view
- [ ] Add location permissions
- [ ] Create basic message drop functionality

### Decision Log
1. **2025-01-27**: Chose Expo over React Native CLI for faster development
2. **2025-01-27**: Selected Supabase for backend to minimize infrastructure setup
3. **2025-01-27**: Decided on React Query for state management and caching
4. **2025-01-27**: ✅ Successfully completed baseline project setup with all requirements

### Known Issues
- None currently - baseline setup is fully functional

### Team Notes
- Repository: https://github.com/jasimhumaiyun/ymib-mobile.git
- Development approach: Pair programming with AI assistants
- Focus on professional code quality and documentation
- All team members should read this file before making changes

## 📝 Recent Changes
- **2025-01-27**: ✅ **MILESTONE 1 COMPLETE** 
  - Created comprehensive project structure
  - Implemented Supabase integration with health check
  - Set up React Query for state management
  - Created professional development environment
  - Established git repository with proper documentation
  - Ready to proceed to Milestone 2

---
*Remember to update this file whenever significant changes are made to the project!* 