import { GoogleGenAI } from "@google/genai";
import { GameHistory, PlacedBet, BetType } from "../types";

// Initialize the client
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
    const historyStr = history.slice(0, 10).map(h => h.number).join(', ');
    const redCount = history.filter(h => h.color === 'red').length;
    const blackCount = history.filter(h => h.color === 'black').length;
    
    const prompt = `
      You are a superstitious roulette strategist (AI Advisor).
      Recent numbers: [${historyStr}].
      Red/Black split in last 10: ${redCount}/${blackCount}.
      User Balance: $${balance}.

      Give a specific, short betting tip (max 15 words).
      Base it on "Gambler's Fallacy" or "Hot Hand" logic.
      Example: "Red is hot, ride the streak!" or "Black is due, bet big."
      Do not be neutral. Be opinionated.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 1.0,
        maxOutputTokens: 50,
      }
    });

    return response.text || "Follow your gut.";
  } catch (error) {
    return "The spirits are silent right now.";
  }
};