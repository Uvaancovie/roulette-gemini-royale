# Covies Casino - Technical Architecture & Developer Guide

## 1. System Overview

**Covies Casino** is a Single Page Application (SPA) built with **React 18**, **TypeScript**, **Vite**, and **Tailwind CSS**. It simulates a European Roulette game with a persistent 3D-style UI and integrates **Google Gemini** (via `@google/genai`) to provide a dynamic, personality-driven AI dealer.

### Tech Stack
*   **Runtime**: Browser (Client-side execution)
*   **Framework**: React 18.3.1
*   **Build System**: Vite 5.2
*   **Styling**: Tailwind CSS 3.4 (Utility-first)
*   **AI**: Google GenAI SDK (`gemini-2.5-flash`)
*   **Icons**: Native Emojis & CSS Shapes (No external icon libraries to reduce bundle size)

---

## 2. Directory Structure & Responsibilities

```text
/src
  ├── App.tsx                 # [CORE] Main Game Loop, State Container, Layout
  ├── types.ts                # [MODEL] Global TypeScript Interfaces & Enums
  ├── constants.ts            # [CONFIG] Wheel order, Payout rules, Color logic, Avatars
  ├── index.css               # [STYLE] Tailwind directives & Custom Keyframe Animations
  ├── services/
  │   └── geminiService.ts    # [AI] Interface for Dealer Commentary & Strategy Engine
  └── components/
      ├── RouletteWheel.tsx   # [UI] SVG-based physics simulation of the wheel
      ├── BettingBoard.tsx    # [UI] Interactive grid for placing bets
      ├── ChipSelector.tsx    # [UI] Controls for selecting wager amounts
      ├── DealerChat.tsx      # [UI] Displays AI messages & Avatar animations
      ├── StatsPanel.tsx      # [UI] Visualization of game history (Hot/Cold numbers)
      ├── GameControls.tsx    # [UI] Buttons for Spin, Clear, Undo, Double, Rebet
      └── ...Modals.tsx       # [UI] Overlays for History, Settings, and Confirmations
```

---

## 3. Data Models (`types.ts`)

The application relies on strict typing to ensure calculation accuracy.

*   **`BetType` (Enum)**: Defines valid bet categories (`STRAIGHT`, `RED`, `DOZEN_1`, etc.).
*   **`PlacedBet` (Interface)**: Represents a single action by the user.
    *   `id`: Unique identifier (for Undo logic).
    *   `type`: The `BetType`.
    *   `target`: The specific number (0-36) or string identifier ("RED", "1st 12").
    *   `amount`: Value of the chip.
    *   `payoutRatio`: Multiplier for winnings (e.g., 35 for Straight, 1 for Red/Black).
*   **`GameHistory` (Interface)**: Tracks the `number` and `color` of past spins.

---

## 4. Core Game Loop Logic (`App.tsx`)

`App.tsx` serves as the centralized state manager. It does not use Redux/Context, relying instead on React Hooks for simplicity and performance.

### A. Betting Phase
1.  **User Action**: User selects a chip (`selectedChip`) and clicks a cell on `BettingBoard`.
2.  **State Update**: `executeBet` appends a new `PlacedBet` object to the `betActions` array.
3.  **Aggregation**: `currentAggregatedBets` (memoized) groups individual chips by board position to display stack totals visually.

### B. Spinning Phase
1.  **Trigger**: User clicks "SPIN".
2.  **Locking**: `isSpinning` is set to `true`, disabling board interaction.
3.  **AI Context**: `getDealerCommentary('SPINNING'...)` is called with current bets to generate anticipation text.
4.  **RNG**: A random integer (0-36) is generated as `targetNumber`.
5.  **Animation**: `RouletteWheel` receives `targetNumber` and animates the rotation using CSS transforms (`rotate()`).

### C. Resolution Phase
1.  **Trigger**: `RouletteWheel` calls `onSpinComplete` callback after animation ends (4s).
2.  **Calculation**: The app iterates through *every* placed bet and compares it against the `targetNumber` using logic in `handleSpinComplete`.
    *   *Example*: `if (bet.type === BetType.RED && getNumberColor(targetNumber) === 'red') totalWinnings += ...`
3.  **State Update**:
    *   Balance updated (`prev + winnings`).
    *   History updated (`[newResult, ...prev]`).
    *   Emotion state set (`WIN` or `LOSS`) to trigger Avatar animations.
4.  **AI Reaction**: `getDealerCommentary('RESULT'...)` is called with the outcome to generate reaction text.

---

## 5. AI Integration (`geminiService.ts`)

The app uses `gemini-2.5-flash` for low-latency responses.

### Dealer Persona
*   **Prompt Engineering**: The service constructs a prompt containing:
    *   **Persona**: "Witty, high-stakes casino dealer."
    *   **Context**: Current bets, recent history, and game phase (Spinning vs Result).
    *   **Instructions**: "Be short, sassy, reacting to specific numbers."

### Probability Engine (Tip Mode)
*   **Logic**: Calculates statistical deviations (Red vs Black %, Hot numbers) locally in TypeScript.
*   **Prompt**: Feeds this raw data to Gemini with instructions to act as a "Probability Engine" outputting structured `ANALYSIS` | `SUGGESTION` | `CONFIDENCE` formats.

---

## 6. Styling & UI Conventions

*   **Tailwind CSS**: Used exclusively. No external CSS files except `index.css` for `@tailwind` directives.
*   **Responsive Design**: Mobile-first approach.
    *   `w-full md:w-auto`: Elements expand on mobile, sizing naturally on desktop.
    *   `text-xs md:text-sm`: Typography scales up on larger screens.
*   **Visual Effects**:
    *   **Felt Texture**: Created via CSS background patterns (`bg-felt-900`).
    *   **Animations**: Custom keyframes in `tailwind.config.js` (`particle-explode`, `shockwave`, `flash-slice`) handle game events.

---

## 7. Key Algorithms

### Board Highlighting (`getCoveredNumbers` in `constants.ts`)
Used to provide visual feedback when hovering a bet area.
*   **Input**: `BetType` (e.g., `COLUMN_1`).
*   **Logic**: Iterates 0-36, applying the rules of Roulette (modulo arithmetic for columns/dozens) to return an array of numbers.
*   **Output**: `Set<number>` passed to `BettingBoard` to light up cells.

### Wheel Physics
*   **CSS**: Uses `cubic-bezier(0.25, 0.1, 0.25, 1)` for a realistic deceleration curve.
*   **Math**: Calculates `finalAngle` = `(360 * 5 rotations) + (Angle of Target Slice) + (Random Jitter)`.
