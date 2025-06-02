# YMIB (Your Message in a Bottle) 🍾

A location-based social app where users can drop virtual "messages in bottles" at specific geographic locations for others to discover. Think digital geocaching meets social messaging.

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- Expo CLI
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/jasimhumaiyun/ymib-mobile.git
   cd ymib-mobile
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Then update `.env` with your Supabase credentials:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE
   ```

4. **Start the development server**
   ```bash
   npx expo start
   ```

## 🏗️ Tech Stack

- **Frontend**: Expo (React Native) with TypeScript
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **State Management**: React Query (@tanstack/react-query)
- **Maps**: React Native Maps (planned)
- **Navigation**: Expo Router (planned)

## 📁 Project Structure

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
├── PROJECT_CONTEXT.md     # Development context and memory
└── ...
```

## 🎯 Development Roadmap

### ✅ Milestone 1: Foundation (COMPLETE)
- [x] Expo TypeScript project scaffold
- [x] Supabase integration
- [x] React Query setup
- [x] Health check functionality
- [x] Professional development environment

### 🚧 Milestone 2: Map & Exploration (NEXT)
- [ ] Interactive map with user location
- [ ] Message clustering on map
- [ ] Basic message dropping
- [ ] Message discovery mechanics

### 📋 Milestone 3: Authentication & Profiles
- [ ] User authentication (Supabase Auth)
- [ ] User profiles
- [ ] Message ownership

### 🔮 Milestone 4: Advanced Features
- [ ] Real-time notifications
- [ ] Message categories/types
- [ ] Advanced filtering
- [ ] Social features (likes, replies)

## 🧑‍💻 Development Team

This is a collaborative project between:
- **Human Developer** (jasimhumaiyun)
- **Claude AI** (Development Assistant)
- **ChatGPT** (Development Assistant)

We practice pair programming with AI assistants, maintaining professional code quality and comprehensive documentation.

## 📚 Documentation

- **[PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md)** - Complete project context and development memory
- **[.cursorrules](./.cursorrules)** - Development guidelines and coding standards

## 🤝 Contributing

This project follows strict development standards:

1. **Read PROJECT_CONTEXT.md** before making changes
2. **Follow the coding standards** defined in .cursorrules
3. **Use conventional commits** (feat:, fix:, docs:, etc.)
4. **Update documentation** when adding features
5. **Test thoroughly** before committing

## 📄 License

[Add your license here]

## 🔗 Links

- **Repository**: https://github.com/jasimhumaiyun/ymib-mobile.git
- **Issues**: [GitHub Issues](https://github.com/jasimhumaiyun/ymib-mobile/issues)
- **Supabase**: [Add your Supabase project URL]

---

*Built with ❤️ by the YMIB team using modern development practices and AI-assisted pair programming.*
