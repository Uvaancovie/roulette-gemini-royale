# 🎰 Covies Casino

**Covies Casino** is a premium, next-generation web-based European Roulette application. It combines high-fidelity UI design with an AI-powered dealer that provides dynamic commentary and strategic analysis based on live gameplay.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18-blue)
![Vite](https://img.shields.io/badge/Vite-5.0-purple)
![Gemini](https://img.shields.io/badge/Powered%20by-Google%20Gemini-orange)

## ✨ Features

*   **Authentic European Roulette**: Standard 37-pocket wheel (Single Zero) with accurate payout ratios.
*   **AI Dealer Personality**: Powered by **Google Gemini 2.5 Flash**. The dealer reacts to your wins, losses, and specific betting patterns with witty commentary.
*   **Strategy Engine**: Toggle "Tip Mode" to ask the AI for advice based on statistical variance, hot/cold numbers, and gambler's fallacy analysis.
*   **Dynamic Visuals**:
    *   Physics-based SVG wheel animation.
    *   Particle effects for winning numbers.
    *   Atmospheric "Felt" textures and lighting effects.
*   **Comprehensive Betting**:
    *   Support for Straight, Split (visualized), Street, Corner, Line, Column, Dozen, and Even-Money bets.
    *   Drag/Hover highlighting to see exactly which numbers are covered.
*   **Game Controls**: Undo, Clear, Double, and Rebet functionalities.
*   **Session History**: Detailed tracking of past spins, net profit/loss, and win frequency.
*   **Responsive Design**: Fully optimized for Desktop, Tablet, and Mobile play.

## 🛠️ Tech Stack

*   **Frontend Framework**: React 18 (TypeScript)
*   **Build Tool**: Vite
*   **Styling**: Tailwind CSS
*   **AI Integration**: Google GenAI SDK (`@google/genai`)
*   **Icons & Fonts**: Inter, JetBrains Mono (Google Fonts)
*   **Notifications**: React Hot Toast

## 🚀 Getting Started

### Prerequisites

*   Node.js (v18 or higher)
*   npm or yarn
*   A Google Gemini API Key (Get one at [aistudio.google.com](https://aistudio.google.com/))

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/covies-casino.git
    cd covies-casino
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables**
    Create a `.env` file in the root directory and add your Gemini API Key:
    ```env
    API_KEY=your_actual_api_key_here
    ```

4.  **Run the development server**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📦 Deployment (Vercel)

This project is optimized for Vercel deployment.

1.  Push your code to a GitHub repository.
2.  Import the project into Vercel.
3.  **Crucial**: In the Vercel Project Settings > Environment Variables, add:
    *   **Key**: `API_KEY`
    *   **Value**: Your Google Gemini API Key.
4.  Deploy!

## 📂 Project Structure

```
/
├── public/             # Static assets
├── src/
│   ├── components/     # React components (Wheel, Board, Chat, etc.)
│   ├── services/       # Gemini AI integration logic
│   ├── App.tsx         # Main application controller
│   ├── constants.ts    # Game rules, payouts, and configuration
│   ├── types.ts        # TypeScript interfaces
│   ├── index.css       # Tailwind and custom CSS
│   └── main.tsx        # Entry point
├── index.html          # HTML root
├── package.json        # Dependencies
└── vite.config.ts      # Build configuration
```

## 🎮 How to Play

1.  **Select Chips**: Choose a chip value from the bottom selector ($1 - $500).
2.  **Place Bets**: Click on the board to place chips. You can bet on specific numbers, colors, or groups.
3.  **Spin**: Click the "SPIN" button to start the round.
4.  **Win/Loss**: The wheel spins, and the AI dealer announces the result and updates your balance.
5.  **Consult the AI**: Click the "Strategy" button in the dealer chat bubble to get a probability-based tip for the next spin.

## 📄 License

This project is open-source and available under the MIT License.
