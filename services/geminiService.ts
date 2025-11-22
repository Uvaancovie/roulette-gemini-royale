import { GoogleGenAI } from "@google/genai";
import { GameHistory, PlacedBet, BetType } from "../types";

// Initialize the client
// The API key is injected via vite.config.ts from environment variables
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to summarize bets for the AI
const analyzeBets = (bets: PlacedBet[], totalBet: number) => {
  if (!bets || bets.length === 0) return "No bets visible.";

  const straightBets = bets.filter(b => b.type === BetType.STRAIGHT);
  const straightTargets = straightBets.map(b => b.target).join(', ');
  const hasHighStakes = bets.some(b => b.amount >= 100);
  const colorBets = bets.filter(b => b.type === BetType.RED || b.type === BetType.BLACK);
  
  let description = `Total wager: $${totalBet}. `;
  
  if (straightBets.length > 0) {
    description += `Focusing on specific numbers: [${straightTargets}]. `;
  }
  if (colorBets.length > 0) {
    description += `Betting on colors (${colorBets.map(b => b.type).join(', ')}). `;
  }
  if (hasHighStakes) {
    description += "This is a HIGH STAKES bet. ";
  } else if (totalBet < 10) {
    description += "Playing it safe with small bets. ";
  }

  return description;
};

export const getDealerCommentary = async (
  phase: 'SPINNING' | 'RESULT',
  winningNumber: number | null,
  didWin: boolean,
  totalWon: number,
  totalBet: number,
  bets: PlacedBet[],
  history: GameHistory[]
): Promise<string> => {
  try {
    const historyStr = history.slice(0, 5).map(h => h.number).join(', ');
    const betContext = analyzeBets(bets, totalBet);
    
    let prompt = "";

    if (phase === 'SPINNING') {
      prompt = `
        You are a charismatic, slightly sassy casino dealer at a high-stakes Roulette table.
        The wheel is spinning.
        User's Bets: ${betContext}
        Recent history: [${historyStr}].
        
        Give a short, exciting comment (max 15 words).
        React to their specific bets.
        - If they bet straight numbers: "Hunting for that [number], are we?"
        - If high stakes: "Bold money on the table!"
        - If small bets: "Starting slow, I see."
        - If betting 0: "Chasing the green..."
      `;
    } else {
      const netResult = totalWon - totalBet;
      const winStatus = didWin ? `User WON $${totalWon} (Net: ${netResult > 0 ? '+' : ''}${netResult})` : "User LOST everything";
      const winningColor = winningNumber === 0 ? 'Green' : 'Red/Black'; // Simplified for prompt
      
      prompt = `
        You are a witty, personality-filled casino dealer.
        The ball landed on: ${winningNumber} (${winningColor}).
        Result: ${winStatus}.
        User's Bets was: ${betContext}
        Recent history: [${historyStr}].
        
        Give a short reaction (max 15 words).
        - If they won big on a straight number: Act shocked/impressed.
        - If they lost on a specific number: "Ooh, so close to [target]..."
        - If 0 came up and they lost: "The Green Monster eats!"
        - If they won a safe bet (Red/Black): "Slow and steady wins."
        - If they lost big: Be sympathetic but playful.
      `;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.9,
        maxOutputTokens: 60,
      }
    });

    return response.text || (phase === 'SPINNING' ? "Good luck!" : "Interesting result.");
  } catch (error) {
    console.error("Gemini API Error:", error);
    return phase === 'SPINNING' ? "No more bets..." : "The house always wins.";
  }
};

export const getStrategicTip = async (
  history: GameHistory[],
  balance: number
): Promise<string> => {
  try {
    // Statistical Analysis
    const totalSamples = history.length || 1;
    const redCount = history.filter(h => h.color === 'red').length;
    const blackCount = history.filter(h => h.color === 'black').length;
    const greenCount = history.filter(h => h.color === 'green').length;
    
    const redPct = ((redCount / totalSamples) * 100).toFixed(1);
    const blackPct = ((blackCount / totalSamples) * 100).toFixed(1);
    
    // Find Hot Numbers
    const counts: Record<number, number> = {};
    history.forEach(h => counts[h.number] = (counts[h.number] || 0) + 1);
    const sortedNumbers = Object.entries(counts).sort((a,b) => b[1] - a[1]);
    const hotNumber = sortedNumbers.length > 0 ? sortedNumbers[0][0] : 'None';
    
    const historyStr = history.slice(0, 15).map(h => h.number).join(', ');

    const prompt = `
      You are the "Gemini Probability Engine", a sophisticated AI analyzing Roulette variance.
      
      [DATA STREAM]
      Recent Outcomes: [${historyStr}]
      Sample Size: ${totalSamples}
      Distribution: Red ${redPct}% | Black ${blackPct}% | Green ${((greenCount/totalSamples)*100).toFixed(1)}%
      Hot Number: ${hotNumber}
      Player Balance: $${balance}

      [INSTRUCTION]
      Analyze the data for deviations from statistical probability (Gambler's Fallacy, Regression to Mean, Clustering).
      
      [OUTPUT FORMAT]
      ANALYSIS: <Short technical observation, max 10 words>
      SUGGESTION: <Specific bet recommendation>
      CONFIDENCE: <0-100>%

      [EXAMPLES]
      ANALYSIS: Red is under-represented (-12% deviation).
      SUGGESTION: Bet RED (Martingale advisable).
      CONFIDENCE: 78%

      ANALYSIS: Number ${hotNumber} shows anomalous clustering.
      SUGGESTION: Bet Straight ${hotNumber}.
      CONFIDENCE: 65%
      
      Return ONLY the formatted text. No conversational filler.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.5, // Low temp for robotic/math precision
        maxOutputTokens: 100,
      }
    });

    return response.text || "ANALYSIS: Insufficient data for projection.\nSUGGESTION: Bet Low/High.\nCONFIDENCE: 50%";
  } catch (error) {
    return "ANALYSIS: Data stream interrupted.\nSUGGESTION: Manual bet.\nCONFIDENCE: 0%";
  }
};