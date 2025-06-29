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
- Smart filtering: All/Tossed/Found bottles with live counters
- Cross-platform optimized performance (iOS/Android)
- Visual pin prioritization (green pins on top)

### 📱 Complete Bottle Lifecycle
- Scan QR codes on printed bottles to claim/toss
- Add custom messages and photos to bottles
- Find bottles and mark them as discovered
- Re-toss found bottles to continue the journey
- Anonymous access - no account required

### ⚡ Real-time Updates
- New bottles appear on map instantly
- Bottle status changes in real-time across devices
- Powered by Supabase real-time subscriptions
- Optimistic UI updates with server sync

## 🛠️ Tech Stack

- **Frontend**: Expo (React Native) + TypeScript
- **Backend**: Supabase (PostgreSQL + Edge Functions + Storage)
- **State Management**: React Query (@tanstack/react-query)  
- **Maps**: Google Maps (react-native-maps)
- **Navigation**: Expo Router
- **Deployment**: Expo EAS Build

## 📱 How It Works

1. **Discover**: Explore the map to find message bottles (blue pins)
2. **Claim**: Scan QR codes on physical bottles to claim them
3. **Toss**: Add your message/photo and drop at your location
4. **Find**: Visit bottle locations to mark them as found (green pins)
5. **Re-toss**: Found bottles can be picked up and tossed again

## 🎯 Current Status

**All Core Milestones Complete** ✅

- ✅ **Foundation**: Expo + Supabase + Navigation
- ✅ **Interactive Map**: Real-time bottles with smooth filtering  
- ✅ **Toss Flow**: Complete bottle creation with photos
- ✅ **Claim/Find Flow**: Full bottle lifecycle management

## 🚧 Development Setup

### Prerequisites
- Node.js 18+
- Expo CLI
- Supabase CLI
- Android Studio / Xcode (for device testing)

### Installation
```bash
# Clone repository
git clone https://github.com/jasimhumaiyun/ymib-mobile.git
cd ymib-mobile

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add your Supabase keys to .env

# Start development server
npx expo start
```

### Database Setup
1. Create a Supabase project
2. Run the SQL migrations in your Supabase dashboard
3. Deploy edge functions: `supabase functions deploy`

## 🔧 Development Tools

### Testing Bottle Lifecycle
- **🔄 Test Lifecycle**: Uses same ID to test state transitions
- **➕ Create New**: Generates random bottles for map testing
- Built-in development mode with testing controls

### Edge Functions
- `claim_or_toss_bottle`: Complete bottle lifecycle management
- `find_bottle`: Mark bottles as found (prepared for future use)
- Anonymous access enabled for seamless UX

## 🌟 Next Steps

**Ready for Production Polish:**
- Professional QR camera scanning
- User authentication system  
- Bottle content viewing modal
- Advanced map clustering
- Push notifications
- User profiles and history

## 📄 License

MIT License - feel free to contribute or fork!

---

**Built with ❤️ using Expo, Supabase, and React Native**
