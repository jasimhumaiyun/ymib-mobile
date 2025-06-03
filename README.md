# Supabase CLI

[![Coverage Status](https://coveralls.io/repos/github/supabase/cli/badge.svg?branch=main)](https://coveralls.io/github/supabase/cli?branch=main) [![Bitbucket Pipelines](https://img.shields.io/bitbucket/pipelines/supabase-cli/setup-cli/master?style=flat-square&label=Bitbucket%20Canary)](https://bitbucket.org/supabase-cli/setup-cli/pipelines) [![Gitlab Pipeline Status](https://img.shields.io/gitlab/pipeline-status/sweatybridge%2Fsetup-cli?label=Gitlab%20Canary)
](https://gitlab.com/sweatybridge/setup-cli/-/pipelines)

[Supabase](https://supabase.io) is an open source Firebase alternative. We're building the features of Firebase using enterprise-grade open source tools.

This repository contains all the functionality for Supabase CLI.

- [x] Running Supabase locally
- [x] Managing database migrations
- [x] Creating and deploying Supabase Functions
- [x] Generating types directly from your database schema
- [x] Making authenticated HTTP requests to [Management API](https://supabase.com/docs/reference/api/introduction)

## Getting started

### Install the CLI

Available via [NPM](https://www.npmjs.com) as dev dependency. To install:

```bash
npm i supabase --save-dev
```

To install the beta release channel:

```bash
npm i supabase@beta --save-dev
```

When installing with yarn 4, you need to disable experimental fetch with the following nodejs config.

```
NODE_OPTIONS=--no-experimental-fetch yarn add supabase
```

> **Note**
For Bun versions below v1.0.17, you must add `supabase` as a [trusted dependency](https://bun.sh/guides/install/trusted) before running `bun add -D supabase`.

<details>
  <summary><b>macOS</b></summary>

  Available via [Homebrew](https://brew.sh). To install:

  ```sh
  brew install supabase/tap/supabase
  ```

  To install the beta release channel:
  
  ```sh
  brew install supabase/tap/supabase-beta
  brew link --overwrite supabase-beta
  ```
  
  To upgrade:

  ```sh
  brew upgrade supabase
  ```
</details>

<details>
  <summary><b>Windows</b></summary>

  Available via [Scoop](https://scoop.sh). To install:

  ```powershell
  scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
  scoop install supabase
  ```

  To upgrade:

  ```powershell
  scoop update supabase
  ```
</details>

<details>
  <summary><b>Linux</b></summary>

  Available via [Homebrew](https://brew.sh) and Linux packages.

  #### via Homebrew

  To install:

  ```sh
  brew install supabase/tap/supabase
  ```

  To upgrade:

  ```sh
  brew upgrade supabase
  ```

  #### via Linux packages

  Linux packages are provided in [Releases](https://github.com/supabase/cli/releases). To install, download the `.apk`/`.deb`/`.rpm`/`.pkg.tar.zst` file depending on your package manager and run the respective commands.

  ```sh
  sudo apk add --allow-untrusted <...>.apk
  ```

  ```sh
  sudo dpkg -i <...>.deb
  ```

  ```sh
  sudo rpm -i <...>.rpm
  ```

  ```sh
  sudo pacman -U <...>.pkg.tar.zst
  ```
</details>

<details>
  <summary><b>Other Platforms</b></summary>

  You can also install the CLI via [go modules](https://go.dev/ref/mod#go-install) without the help of package managers.

  ```sh
  go install github.com/supabase/cli@latest
  ```

  Add a symlink to the binary in `$PATH` for easier access:

  ```sh
  ln -s "$(go env GOPATH)/bin/cli" /usr/bin/supabase
  ```

  This works on other non-standard Linux distros.
</details>

<details>
  <summary><b>Community Maintained Packages</b></summary>

  Available via [pkgx](https://pkgx.sh/). Package script [here](https://github.com/pkgxdev/pantry/blob/main/projects/supabase.com/cli/package.yml).
  To install in your working directory:

  ```bash
  pkgx install supabase
  ```

  Available via [Nixpkgs](https://nixos.org/). Package script [here](https://github.com/NixOS/nixpkgs/blob/master/pkgs/development/tools/supabase-cli/default.nix).
</details>

### Run the CLI

```bash
supabase bootstrap
```

Or using npx:

```bash
npx supabase bootstrap
```

The bootstrap command will guide you through the process of setting up a Supabase project using one of the [starter](https://github.com/supabase-community/supabase-samples/blob/main/samples.json) templates.

## Docs

Command & config reference can be found [here](https://supabase.com/docs/reference/cli/about).

## Breaking changes

We follow semantic versioning for changes that directly impact CLI commands, flags, and configurations.

However, due to dependencies on other service images, we cannot guarantee that schema migrations, seed.sql, and generated types will always work for the same CLI major version. If you need such guarantees, we encourage you to pin a specific version of CLI in package.json.

## Developing

To run from source:

```sh
# Go >= 1.22
go run . help
```

# YMIB (Your Message in a Bottle) 🍾

A location-based social app where users can drop virtual "messages in bottles" at geographic locations for others to discover. Built with Expo (React Native), TypeScript, and Supabase.

## 🚀 Features

### 🗺️ Real-time Map Exploration
- Interactive Google Maps with instant bottle updates
- Blue markers for adrift bottles, green for found bottles
- Smooth filtering: All/Tossed/Found bottles
- Cross-platform optimized performance

### 📱 Bottle Management
- Scan QR codes on printed bottles to claim/toss
- Add custom messages and photos to bottles
- Password-protected bottle finding system
- Complete bottle lifecycle: claim → toss → find → re-toss

### ⚡ Real-time Updates
- New bottles appear on map instantly
- Bottles turn green when found by others
- Powered by Supabase real-time subscriptions

## 🏗️ Tech Stack

- **Frontend**: Expo (React Native) + TypeScript
- **Backend**: Supabase (PostgreSQL + Edge Functions + Real-time)
- **State Management**: React Query
- **Maps**: Google Maps API
- **Navigation**: Expo Router
- **Storage**: Supabase Storage (photos)

## 🏆 Project Status: COMPLETE

All core milestones achieved:
- ✅ **Milestone 1**: Foundation (Expo + Supabase + Navigation)
- ✅ **Milestone 2**: Map & Exploration (Real-time map with filtering)
- ✅ **Milestone 3**: Toss Bottle Flow (Photo upload + Edge functions)
- ✅ **Milestone 4**: Claim/Find Flow (Printed bottles + Complete lifecycle)

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+
- Expo CLI
- iOS Simulator / Android Emulator

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

3. **Environment Setup**
   - Copy `.env.example` to `.env`
   - Add your Supabase credentials and Google Maps API keys
   ```bash
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   IOS_GOOGLE_MAPS_KEY=your_ios_key
   ANDROID_GOOGLE_MAPS_KEY=your_android_key
   ```

4. **Start development server**
   ```bash
   npx expo start
   ```

### Database Setup

The database schema and RLS policies are already configured in production. For local development, the app connects to the production Supabase instance.

### Edge Functions

Pre-deployed Supabase Edge Functions:
- `claim_or_toss_bottle`: Handles bottle claiming and tossing
- `find_bottle`: Marks bottles as found

## 📱 Usage

### For Users
1. **Explore**: Open the app to see nearby bottles on the map
2. **Scan**: Use the QR scanner to claim printed bottles
3. **Toss**: Add your message and photo, then toss at your location
4. **Find**: Discover bottles others have tossed and mark them as found

### For Development
- **DEV Mode**: Use "DEV: Toss Dummy Bottle" button for testing
- **Real-time Testing**: Open multiple devices to see instant updates
- **Photo Testing**: Upload photos to test Supabase storage integration

## 🏗️ Architecture

### Frontend Structure
```
app/
├── (tabs)/
│   ├── index.tsx      # Home screen with map
│   └── explore.tsx    # Map exploration
├── scan.tsx           # QR code scanning
└── _layout.tsx        # Root layout

src/
├── hooks/             # React Query hooks
├── lib/               # Supabase client
├── types/             # TypeScript definitions
└── constants/         # App constants
```

### Backend (Supabase)
- **bottles**: Main bottle records with location and status
- **bottle_events**: Real-time events for map updates
- **public_profiles**: User profile management
- **Storage**: Public bucket for bottle photos

## 🔄 Real-time System

The app uses Supabase real-time subscriptions to provide instant updates:

1. **Cast Away Events**: When bottles are tossed, they appear on all users' maps instantly
2. **Found Events**: When bottles are found, they turn green for all users
3. **Optimistic Updates**: UI updates immediately with server confirmation

## 🚀 Deployment

### Mobile App
Built for deployment with Expo EAS:
```bash
# Build for iOS
eas build --platform ios

# Build for Android  
eas build --platform android
```

### Backend
- Supabase project already configured and deployed
- Edge functions deployed and operational
- Database with RLS policies and real-time enabled

## 🤝 Contributing

This project was built collaboratively with AI assistance. The codebase follows strict TypeScript standards and includes comprehensive error handling.

### Development Guidelines
- Follow the `.cursorrules` file for coding standards
- Update `PROJECT_CONTEXT.md` for significant changes
- Use conventional commits (feat:, fix:, docs:, etc.)
- Test on both iOS and Android before committing

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🎯 Future Enhancements

- User authentication and profiles
- QR code camera scanning
- Social features (comments, ratings)
- Push notifications for nearby bottles
- Bottle history and statistics

---

**Built with ❤️ using Expo, Supabase, and TypeScript**
