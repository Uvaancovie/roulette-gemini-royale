# 🎰 Covies Casino - AI Royale

**Covies Casino** is a next-generation, 3D-styled European Roulette web application powered by **Google Gemini**. It transforms the classic casino experience by integrating an AI dealer that provides dynamic, personality-driven commentary and statistical strategy tips based on real-time gameplay data.

## ✨ Features

### 🤖 AI-Powered Dealer
*   **Dynamic Commentary**: The dealer (powered by Gemini 2.5 Flash) reacts intelligently to wins, losses, and betting patterns (e.g., chasing numbers, safe betting).
*   **Strategy Engine**: Activate "Tip Mode" to receive analysis on probability, variance, and gambler's fallacy based on the session history.
*   **Customizable Avatars**: Choose from 6 preset personalities (Classic, Cat, Alien, Zombie, Clown, Cyber) or upload your own dealer image.

### 🎲 Core Gameplay
*   **European Rules**: Standard 37-pocket wheel (Single Zero) with authentic payouts.
*   **Advanced Betting Board**: Support for Inside Bets (Straight, Split, Street, Corner, Line) and Outside Bets (Red/Black, Even/Odd, High/Low, Dozens, Columns).
*   **Interactive Highlighting**: Hover over any bet area to see exactly which numbers are covered on the board.
*   **Smart Controls**: Undo, Clear, Double, and Rebet previous patterns.

### 🎨 Visual Experience
*   **Physics-Simulated Wheel**: SVG-based animation with randomized deceleration for realistic spins.
*   **Immersive UI**: "Felt" textures, dynamic lighting, particle explosions on wins, and responsive layouts.
*   **Session Tracking**: Detailed history log tracking every spin, wager, and net profit.

## 🛠️ Tech Stack

*   **Framework**: React 18 (TypeScript)
*   **Build Tool**: Vite
*   **Styling**: Tailwind CSS
*   **AI Integration**: Google GenAI SDK (`@google/genai`)
*   **State Management**: React Hooks
*   **Icons/Fonts**: Google Fonts (Inter, JetBrains Mono)

## 🚀 Getting Started

### Prerequisites
*   Node.js (v18+)
*   A Google Gemini API Key (Get one at [aistudio.google.com](https://aistudio.google.com/))

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/covies-casino.git
    cd covies-casino
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Environment Configuration**
    Create a `.env` file in the root directory:
    ```env
    API_KEY=your_google_gemini_api_key_here
    ```

4.  **Run Development Server**
    ```bash
    npm run dev
    ```
    Access the app at `http://localhost:3000`.

## 📂 Project Structure

```
/
├── src/
│   ├── components/     # UI Components (Wheel, Board, Chat, etc.)
│   ├── services/       # Gemini API interaction logic
│   ├── App.tsx         # Main game loop and state
│   ├── constants.ts    # Rules, payouts, wheel order
│   ├── types.ts        # TypeScript interfaces
│   ├── index.css       # Tailwind imports and custom animations
├── index.html          # Entry point
├── vite.config.ts      # Vite configuration
└── tailwind.config.js  # Theme configuration
```

## 📜 License
This project is open-source and available under the MIT License.
