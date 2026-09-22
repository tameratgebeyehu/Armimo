<p align="center">
  <img src="./assets/logo.png" width="120" height="120" alt="Armimo Logo" style="border-radius: 24px;" />
</p>

<h1 align="center">Armimo · አርምሞ</h1>

<p align="center">
  <strong>A premium, cross-platform focus and study companion combining Pomodoro workflows, ambient soundscapes, intelligent timetable scheduling, and dual Gregorian–Ethiopian calendar tracking.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React%20Native-0.76-61DAFB?logo=react&logoColor=white&style=flat-square" alt="React Native" />
  <img src="https://img.shields.io/badge/Expo-SDK%2052-000020?logo=expo&logoColor=white&style=flat-square" alt="Expo SDK" />
  <img src="https://img.shields.io/badge/TypeScript-5.3-3178C6?logo=typescript&logoColor=white&style=flat-square" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Platform-iOS%20%7C%20Android-green?style=flat-square" alt="Platforms" />
  <img src="https://img.shields.io/badge/License-MIT-blue?style=flat-square" alt="License" />
</p>

---

## 📖 Overview

**Armimo** (*አርምሞ* — Amharic for *deep contemplation, tranquility, or quietude*) is engineered to help students, developers, and professionals cultivate sustained deep work without burnout. 

Unlike generic productivity tools, Armimo bridges modern cognitive focus methodologies with cultural date intelligence through a dual-calendar engine, tactile micro-animations, non-intrusive notification architecture, and localized Amharic support.

---

## 🌟 Core Highlights

### ⏱️ Dynamic Focus Engine
- **Counter-Clockwise Unwinding Ring**: Smooth SVG circular countdown that dynamically unwinds counter-clockwise as time elapses.
- **Organic Breathing Rhythm**: Looped native-driven breathing animation (`0.98` to `1.02` scale using `Easing.sin`) that assists with paced breathing during intense concentration.
- **Cycle Control**: Configurable Pomodoro presets (Work, Short Break, Long Break, Deep Focus intervals).
- **Celebration Modals**: Staggered footer-to-header slide-up completion dialogs featuring clean vector glyphs, glowing halos, and native haptic feedback (`expo-haptics`).

### 📅 Dual Calendar Intelligence (Gregorian & Ethiopian)
- **High-Precision Calculations**: Julian Day Number (JDN) mathematical model computing Gregorian-to-Ethiopian dates covering leap years from 1901 to 2099 GC.
- **Activity Heatmap**: GitHub-style interactive heatmap displaying daily focus density.
- **Day Drill-Down**: Tap any date cell to inspect exact study durations, completed tasks, and historical session logs.
- **Streak Continuity Engine**: Dynamic streak computations that calculate study continuity on-the-fly.

### 🎧 Ambient Audio Engine
- **Background Soundscapes**: Integrated `expo-av` audio service streaming loopable focus soundscapes (Rain, Wind, White Noise, Night Ambience).
- **Zero-Friction Controls**: Instant audio toggling and volume adjustments directly from the active timer view.

### 📋 Task Management & Timetable
- **Date-Specific Slots**: Mark recurring classes or study sessions complete for a specific date without modifying future occurrences.
- **Responsive Touch Targets**: Ergonomically tuned hit-slops on checkboxes to ensure immediate tactile response.
- **Fluid Layout Animations**: Real-time filtering (**All, Today, Completed, Upcoming, Overdue**) powered by React Native `LayoutAnimation`.

### 🔔 Smart Notification Delivery
- **7-Day Rolling Window**: Prevents duplicate triggers by scheduling rolling, date-based local alerts instead of fragile weekly intervals.
- **Adaptive Suppression**: Automatically cancels streak and daily goal alerts once you reach your target for the day.
- **Android Notification Channels**: Distinct high-importance channels with system sounds, heads-up banners, and custom vibration patterns.

### 🎨 Adaptive Design & Micro-Interactions
- **Time-of-Day Adaptive Header**: Header gradients dynamically adapt from morning sunlight gold to midday cyan and midnight indigo.
- **Bouncing Touchables**: Spring-physics touch feedback scaling cards to `0.96` on touch and rebounding crisply upon release.
- **Dual-Language Localization**: Instant runtime switching between English (`en`) and Amharic (`am`).

---

## 🛠️ Architecture & Tech Stack

```
Armimo Architecture
├── Presentation Layer     -> React Native, Custom Design Tokens, ThemeProvider (Dark/Light)
├── Animation Pipeline     -> React Native Animated (useNativeDriver), LayoutAnimation
├── State & Storage        -> Zustand with AsyncStorage persistence
├── Audio & Sensors        -> Expo AV (Ambient Audio), Expo Haptics (Physical Feedback)
├── Notifications          -> Expo Notifications (Rolling 7-day triggers, Android Channels)
└── Calendar Services      -> JDN-based Ethiopian/Gregorian calendar conversion utilities
```

| Technology | Purpose |
| :--- | :--- |
| **React Native (0.76)** | Native runtime and components |
| **Expo (SDK 52)** | Cross-platform build tools and native module ecosystem |
| **TypeScript (5.3)** | Type safety across store, UI, and business logic |
| **Zustand** | Lightweight, reactive state stores (`focusStore`, `taskStore`, `settingsStore`, `timetableStore`) |
| **React Native SVG** | Scalable circular timer visualizations |
| **Expo Notifications** | Offline scheduled alerts and background notifications |
| **Expo Haptics** | Tactile physical feedback for UI interactions |

---

## 📂 Project Structure

```text
Armimo/
├── assets/                  # App branding, icon, and splash assets
├── src/
│   ├── components/          # Reusable UI primitives (AppButton, AppCard, AppModal, etc.)
│   ├── constants/           # Focus modes, ambient audio URLs, subject palettes
│   ├── localization/        # Translation maps for English and Amharic
│   ├── navigation/          # React Navigation bottom tabs and stack routing
│   ├── notifications/       # NotificationService scheduling & channel configuration
│   ├── screens/             # Screen implementations
│   │   ├── analytics/       # Heatmap, distribution charts, and metrics
│   │   ├── focus/           # Pomodoro timer, ambient sound controller, celebration modals
│   │   ├── onboarding/      # First-launch setup, language/theme preferences
│   │   ├── settings/        # App configuration, focus duration defaults, notifications
│   │   ├── tasks/           # Filterable task management and checklist
│   │   ├── timetable/       # Recurring study schedules and timetable grid
│   │   └── HomeScreen.tsx   # Dashboard, active goals, and quick actions
│   ├── store/               # Zustand store definitions with persistence
│   ├── theme/               # Design tokens, typography, and dynamic palette hooks
│   ├── types/               # TypeScript interfaces, schemas, and models
│   └── utils/               # Calendar math, audio manager, date formatters
├── App.tsx                  # Root component and font/asset preloaders
├── app.json                 # Expo project configuration
├── eas.json                 # EAS build configuration
└── package.json             # Dependencies and scripts
```

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18 or later recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Expo Go](https://expo.dev/go) on your mobile device (or an Android Emulator / iOS Simulator)

### Installation
1. **Clone the repository:**
   ```bash
   git clone https://github.com/tameratgebeyehu/Armimo.git
   cd Armimo
   ```

2. **Install project dependencies:**
   ```bash
   npm install
   ```

3. **Start the Expo development server:**
   ```bash
   npm start
   ```

4. **Launch on your preferred platform:**
   - Press <kbd>a</kbd> for Android emulator / device
   - Press <kbd>i</kbd> for iOS simulator
   - Press <kbd>w</kbd> for Web browser
   - Scan the terminal QR code with **Expo Go** on Android or Camera on iOS

---

## 🧪 Quality & Type Checking

To verify TypeScript code compilation:

```bash
npm run type-check
```

To run linting:

```bash
npm run lint
```

---

## 📦 Building Standalone Binaries (EAS)

Armimo is pre-configured for Expo Application Services (EAS Build).

1. Install EAS CLI:
   ```bash
   npm install -g eas-cli
   ```

2. Generate an Android preview APK:
   ```bash
   eas build --platform android --profile preview
   ```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<p align="center">
  Crafted with care by <a href="https://github.com/tameratgebeyehu">Tamerat Gebeyehu</a>
</p>
