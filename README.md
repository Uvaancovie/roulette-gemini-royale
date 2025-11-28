# 🎰 Covies Casino - AI Royale

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react)
![Gemini](https://img.shields.io/badge/AI-Gemini%202.5-8E75B2?logo=google)
![Vite](https://img.shields.io/badge/Vite-5.2-646CFF?logo=vite)

**Covies Casino** is a next-generation European Roulette web application. It combines a high-fidelity 3D-style interface with a **Google Gemini-powered AI Dealer** that provides personality-driven commentary, strategic advice, and dynamic reactions to your gameplay.

---

## ✨ Features

### 🧠 AI Intelligence
*   **Reactive Dealer**: The dealer watches every bet. They will mock you for betting against the odds, celebrate your big wins, and offer sympathy when the zero hits.
*   **Strategy Engine**: Click the **"Strategy"** button (brain icon) to consult the *Gemini Probability Engine*. It analyzes the last 15 spins for statistical anomalies and suggests bets based on variance logic.
*   **Personality Engine**: Choose from 6 distinct personalities (Classic, Cat, Alien, Zombie, Clown, Cyber), each with unique emoji sets and reaction styles.

### 🎮 Gameplay Experience
*   **European Rules**: Standard Single-Zero wheel (House edge: 2.7%).
*   **Dynamic Board**: Hover over any betting area (e.g., "Even", "1st 12") to see exactly which numbers light up on the grid.
*   **Smart Controls**:
    *   **Undo**: Remove the last placed chip.
    *   **Double**: Instantly double all bets on the table.
    *   **Rebet**: Repeat the exact betting pattern from the previous spin.
*   **Session History**: A detailed log of every spin, tracking timestamps, winning numbers, and net profit/loss.

### 🎨 Visuals & Immersion
*   **Physics Simulation**: The wheel spins with randomized deceleration curves, preventing predictable outcomes.
*   **Win Effects**: Particle explosions, shockwaves, and gold lighting effects scale based on the size of your win.
*   **Responsive Design**: A seamless experience across Desktop, Tablet, and Mobile devices.

---

## 🕹️ User Guide

### How to Play
1.  **Select a Chip**: Tap the chip values at the bottom ($1, $5, $25, $100, $500).
2.  **Place Your Bets**: Tap any number or region on the board.
    *   *Inside Bets*: Single numbers (Straight).
    *   *Outside Bets*: Red/Black, Even/Odd, Dozens, Columns.
3.  **Spin**: Press the big **SPIN** button.
4.  **Watch the Result**: The wheel will spin for 4 seconds. The AI dealer will comment on the result immediately.

### Using the AI
*   **Chat**: The dealer chats automatically during the "Spinning" and "Result" phases.
*   **Ask for a Tip**: When the wheel is idle, click the **Strategy** button in the chat bubble. The AI will analyze the "Hot/Cold" numbers and suggest a move.
*   **Customize**: Click the **Gear (⚙️)** icon in the top right to change the dealer's avatar or upload your own image.

---

## 🚀 Installation & Development

### Prerequisites
*   **Node.js** (v18 or higher)
*   **npm** (v9 or higher)
*   **Google Gemini API Key**: Get one for free at [aistudio.google.com](https://aistudio.google.com/).

### Quick Start

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/yourusername/covies-casino.git
    cd covies-casino
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment**
    Create a `.env` file in the root directory:
    ```env
    API_KEY=your_actual_api_key_here
    ```

4.  **Run Locally**
    ```bash
    npm run dev
    ```
    Open `http://localhost:3000` in your browser.

---

## ☁️ Deployment Guide

### Vercel (Recommended)
This project is optimized for Vercel deployment.

1.  Push your code to a GitHub repository.
2.  Log in to [Vercel](https://vercel.com) and click **"Add New Project"**.
3.  Import your repository.
4.  **Environment Variables**:
    *   In the Vercel project settings, add a new variable:
    *   Name: `API_KEY`
    *   Value: `your_google_gemini_api_key`
5.  Click **Deploy**.

*Note: The `vite.config.ts` is already configured to expose `process.env.API_KEY` to the client-side application during the build process.*

---

## 🛠️ Architecture

For a deep dive into the code structure, state management, and AI prompt engineering, please consult the **[ARCHITECTURE.md](./ARCHITECTURE.md)** file.

**Key Technologies:**
*   **Vite**: Fast tooling and bundling.
*   **React 18**: Component-based UI logic.
*   **Tailwind CSS**: Utility-first styling.
*   **@google/genai**: Direct SDK integration for AI features.

---

## 🧩 Customization

### Changing Payouts
Modify `src/constants.ts` to adjust the game rules.
```typescript
export const PAYOUTS = {
  [BetType.STRAIGHT]: 35, // Change to 30 for harder difficulty?
  ...
};
```

### Changing Chip Values
Modify `src/constants.ts`:
```typescript
export const CHIP_VALUES = [1, 10, 50, 200, 1000]; // High roller mode
```

---

## ❓ Troubleshooting

**Issue: "Gemini API Error" in console**
*   *Cause*: The API key is missing or invalid.
*   *Fix*: Check your `.env` file locally or your Deployment Settings in Vercel. Ensure the key has permissions for `gemini-2.5-flash`.

**Issue: Styles look broken (Vertical numbers)**
*   *Cause*: CSS failed to load.
*   *Fix*: Ensure you are not using `importmap` in `index.html`. Run `npm install` again to ensure Tailwind dependencies are linked.

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

*Created for Covies Casino.*
