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

# YMIB (Your Message in a Bottle) 🌊

> **Status**: Milestone 3 Complete ✅ | **Last Updated**: 2025-06-03

A location-based social app where users can drop virtual "messages in bottles" at specific geographic locations for others to discover. Built with Expo, TypeScript, and Supabase.

## ✨ Features

### ✅ Currently Working
- 🗺️ **Interactive Map** - Explore bottles on Google Maps with real-time updates
- 📍 **Location-Based Messaging** - Drop bottles at your current location
- 📸 **Photo Support** - Attach photos to your bottle messages
- 🔄 **Real-Time Updates** - See new bottles appear instantly on the map
- 📱 **Cross-Platform** - Works on both iOS and Android
- 🎯 **Smart Filtering** - Filter bottles by status (All/Tossed/Found)
- 📳 **Haptic Feedback** - Tactile confirmation when tossing bottles

### 🚧 Coming Next (Milestone 4)
- 🔐 User authentication and profiles
- 🔍 QR code bottle discovery
- 👤 Message ownership and history

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator or Android Emulator (or physical device)

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
   # Edit .env with your actual values
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Run on device/simulator**
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Scan QR code with Expo Go app on physical device

## 🔧 Environment Setup

Create a `.env` file with the following variables:

```bash
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Google Maps API Keys
IOS_GOOGLE_MAPS_KEY=your-ios-google-maps-key
ANDROID_GOOGLE_MAPS_KEY=your-android-google-maps-key
```

### Getting API Keys

1. **Supabase**: Create a project at [supabase.com](https://supabase.com)
2. **Google Maps**: Get API keys from [Google Cloud Console](https://console.cloud.google.com)

## 🏗️ Tech Stack

- **Frontend**: Expo (React Native) with TypeScript
- **Backend**: Supabase (PostgreSQL + Real-time + Storage + Edge Functions)
- **State Management**: React Query (@tanstack/react-query)
- **Maps**: React Native Maps with Google provider
- **Navigation**: Expo Router (File-based routing)
- **Photo Handling**: Expo Image Picker + Supabase Storage

## 📱 How It Works

### Tossing a Bottle
1. Tap the **+** button on the home screen
2. Write your message
3. Optionally add a photo
4. Tap "Toss!" to drop it at your current location
5. Get a unique bottle ID and password
6. Watch it appear on the map in real-time!

### Exploring Bottles
1. Go to the **Explore** tab
2. Use the filter controls (All/Tossed/Found)
3. Blue markers = bottles adrift
4. Green markers = bottles found
5. Tap markers to see basic info

## 🗂️ Project Structure

```
ymib-mobile/
├── app/                    # Expo Router screens
│   ├── (tabs)/            # Tab navigation
│   │   ├── index.tsx      # Home screen with FAB
│   │   └── explore.tsx    # Map exploration
│   ├── toss/
│   │   └── success.tsx    # Success screen
│   └── toss.tsx          # Toss bottle modal
├── src/
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utilities and config
│   └── types/            # TypeScript definitions
├── supabase/
│   └── functions/        # Edge functions
└── assets/               # Images and fonts
```

## 🎯 Development Milestones

- ✅ **Milestone 1**: Foundation (Expo + Supabase + Navigation)
- ✅ **Milestone 2**: Map & Exploration (Interactive map + Real-time updates)
- ✅ **Milestone 3**: Toss Bottle Flow (Complete bottle creation with photos)
- 🚧 **Milestone 4**: Authentication & Profiles (User accounts + QR discovery)
- 📋 **Milestone 5**: Advanced Features (Notifications + Social features)

## 🤝 Contributing

This is a collaborative project between human developers and AI assistants. Please read `PROJECT_CONTEXT.md` for detailed development guidelines and current status.

### Development Guidelines
- Follow TypeScript best practices
- Use conventional commits
- Update documentation when adding features
- Test on both iOS and Android
- Follow the established code patterns

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Repository**: https://github.com/jasimhumaiyun/ymib-mobile
- **Supabase**: https://supabase.com
- **Expo**: https://expo.dev

---

**Ready to drop your first message in a bottle?** 🍾✨
