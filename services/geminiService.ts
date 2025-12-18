import { GameHistory, PlacedBet, BetType } from "../types";
import { getApiUrl } from "../config/api";

// Helper to summarize bets for the AI
const analyzeBets = (bets: PlacedBet[], totalBet: number) => {
  if (!bets || bets.length === 0) return "No bets visible.";

  const straightBets = bets.filter(b => b.type === BetType.STRAIGHT);
  const straightTargets = straightBets.map(b => b.target).join(', ');
  const hasHighStakes = bets.some(b => b.amount >= 100);
  const colorBets = bets.filter(b => b.type === BetType.RED || b.type === BetType.BLACK);
  
  let description = `Total wager: R${totalBet}. `;
  
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
  history: GameHistory[],
  userName?: string,
  userAge?: number,
  userCountry?: string
): Promise<string> => {
  try {
    const historyStr = history.slice(0, 5).map(h => h.number).join(', ');
    const betContext = analyzeBets(bets, totalBet);
    
    let prompt = "";

    if (phase === 'SPINNING') {
      const userContext = userName ? `Player: ${userName}${userAge ? ` (${userAge} years old)` : ''}${userCountry ? ` from ${userCountry}` : ''}. ` : '';
      prompt = `
        You are a charismatic, slightly sassy casino dealer at a high-stakes Roulette table.
        The wheel is spinning.
        ${userContext}
        User's Bets: ${betContext}
        Recent history: [${historyStr}].
        
        Give a short, exciting comment (max 15 words).
        Address the player by name if available.
        React to their specific bets.
        - If they bet straight numbers: "Hunting for that [number], are we?"
        - If high stakes: "Bold money on the table!"
        - If small bets: "Starting slow, I see."
        - If betting 0: "Chasing the green..."
      `;
    } else {
      const netResult = totalWon - totalBet;
      const winStatus = didWin ? `User WON R${totalWon} (Net: ${netResult > 0 ? '+' : ''}R${netResult})` : "User LOST everything";
      const winningColor = winningNumber === 0 ? 'Green' : 'Red/Black'; // Simplified for prompt
      const userContext = userName ? `Player: ${userName}${userAge ? ` (${userAge} years old)` : ''}${userCountry ? ` from ${userCountry}` : ''}. ` : '';
      
      prompt = `
        You are a witty, personality-filled casino dealer.
        The ball landed on: ${winningNumber} (${winningColor}).
        Result: ${winStatus}.
        ${userContext}
        User's Bets was: ${betContext}
        Recent history: [${historyStr}].
        
        Give a short reaction (max 15 words).
        Address the player by name if available.
        - If they won big on a straight number: Act shocked/impressed.
        - If they lost on a specific number: "Ooh, so close to [target]..."
        - If 0 came up and they lost: "The Green Monster eats!"
        - If they won a safe bet (Red/Black): "Slow and steady wins."
        - If they lost big: Be sympathetic but playful.
      `;
    }

    // Use backend API instead of direct Gemini
    const response = await fetch(getApiUrl('/api/chat'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify({ prompt })
    });

    const data = await response.json();
    return data.text || (phase === 'SPINNING' ? "Good luck!" : "Interesting result.");
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

    // Use backend API instead of direct Gemini
    const response = await fetch(getApiUrl('/api/chat'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify({ prompt })
    });

    const data = await response.json();
    return data.text || "ANALYSIS: Insufficient data for projection.\nSUGGESTION: Bet Low/High.\nCONFIDENCE: 50%";
  } catch (error) {
    return "ANALYSIS: Data stream interrupted.\nSUGGESTION: Manual bet.\nCONFIDENCE: 0%";
  }
};

// New function for detailed bet analysis chat
export const getBetAnalysis = async (
  bets: PlacedBet[],
  totalBet: number,
  balance: number,
  history: GameHistory[],
  chatMessage?: string,
  chatHistory?: { id: string; text: string; isUser: boolean; timestamp: Date }[],
  userPreferences?: {
    favoriteBetType: string;
    riskTolerance: string;
    preferredBetAmount: number;
    favoriteNumbers: number[];
  }
): Promise<string> => {
  try {
    // Handle chat messages
    if (chatMessage) {
      const chatContext = chatHistory ? 
        chatHistory.map(msg => `${msg.isUser ? 'Player' : 'AI'}: ${msg.text}`).join('\n') : '';

      const betContext = analyzeBets(bets, totalBet);
      const historyStr = history.slice(0, 5).map(h => h.number).join(', ');

      const userContext = userPreferences ? 
        `Player preferences: Favorite bet ${userPreferences.favoriteBetType}, Risk tolerance: ${userPreferences.riskTolerance}, Preferred bet amount: R${userPreferences.preferredBetAmount}` : '';

      // Generate encouraging, persuasive response
      const prompt = `
You are an AI betting strategist at a casino. Your goal is to encourage players to keep betting while providing helpful analysis.
Be enthusiastic, positive, and persuasive. Always emphasize that "fortune favors the bold" and encourage continued play.

Current Context:
- Player's question: "${chatMessage}"
- Current bets: ${betContext}
- Recent numbers: ${historyStr || 'None yet'}
- Balance: R${balance}
- Total bet: R${totalBet}
${userContext}

Previous conversation:
${chatContext}

Respond conversationally, provide specific advice about their current bets, and encourage them to spin or adjust their bets. Keep responses under 200 words.`;

      // For now, return a mock response. In production, this would call the AI service.
      const responses = [
        `Great question! Your current ${betContext.toLowerCase()} shows you're playing smart. With a ${totalBet > balance * 0.1 ? 'bold' : 'calculated'} approach like this, you're maximizing your excitement while keeping the house edge at just 2.7%. Fortune favors the bold - ready to spin and see what happens? 🎰`,
        
        `I love your strategy! Betting R${totalBet} on ${bets.length > 1 ? 'a mix of bets' : 'that bet'} gives you multiple ways to win. The odds are in your favor for an exciting spin. Remember, every great winner started with confidence just like yours. Let's see what the wheel brings! 🍀`,
        
        `Smart play! Your bet selection shows real understanding of the game. With the house edge at 2.7%, players like you who bet thoughtfully often have the most fun. The wheel is calling - are you feeling lucky today? 💫`,
        
        `Excellent choices! Your R${totalBet} wager on ${bets.map(b => b.type.toLowerCase()).join(' and ')} is perfectly balanced. The casino loves confident players, and confidence like yours often brings big rewards. Ready for that spin? 🎲`
      ];

      return responses[Math.floor(Math.random() * responses.length)];
    }

    if (!bets || bets.length === 0) {
      return `🤖 BET ANALYSIS ENGINE
═══════════════════════════════

No bets detected. Place some chips to see probability calculations!

💡 TIP: Start with outside bets (Red/Black) for better odds (48.6% win chance).`;
    }

    // Calculate detailed statistics for each bet type
    const betAnalysis = bets.map(bet => {
      let probability = 0;
      let payout = 0;
      let expectedValue = 0;
      let analysis = '';

      switch (bet.type) {
        case 'STRAIGHT':
          probability = 2.7; // 1/37 ≈ 2.7%
          payout = 35;
          expectedValue = (probability/100) * payout - (1 - probability/100);
          analysis = `🎯 STRAIGHT BET on ${bet.target}
• Probability: ${probability}% (1 in 37)
• Payout: 35:1
• House Edge: 2.7%
• Expected Value: ${expectedValue.toFixed(3)} per R1 wagered`;
          break;

        case 'RED':
        case 'BLACK':
          probability = 48.6; // 18/37 ≈ 48.6%
          payout = 1;
          expectedValue = (probability/100) * payout - (1 - probability/100);
          analysis = `🎨 COLOR BET (${bet.type})
• Probability: ${probability}% (18 in 37)
• Payout: 1:1
• House Edge: 2.7%
• Expected Value: ${expectedValue.toFixed(3)} per R1 wagered
• Best for: Conservative play`;
          break;

        case 'EVEN':
        case 'ODD':
          probability = 48.6; // 18/37 ≈ 48.6%
          payout = 1;
          expectedValue = (probability/100) * payout - (1 - probability/100);
          analysis = `🔢 ${bet.type.toUpperCase()} BET
• Probability: ${probability}% (18 in 37)
• Payout: 1:1
• House Edge: 2.7%
• Expected Value: ${expectedValue.toFixed(3)} per R1 wagered`;
          break;

        case 'LOW':
        case 'HIGH':
          probability = 48.6; // 18/37 ≈ 48.6%
          payout = 1;
          expectedValue = (probability/100) * payout - (1 - probability/100);
          analysis = `📊 ${bet.type.toUpperCase()} BET (1-18/19-36)
• Probability: ${probability}% (18 in 37)
• Payout: 1:1
• House Edge: 2.7%
• Expected Value: ${expectedValue.toFixed(3)} per R1 wagered`;
          break;

        case 'DOZEN_1':
        case 'DOZEN_2':
        case 'DOZEN_3':
          probability = 32.4; // 12/37 ≈ 32.4%
          payout = 2;
          expectedValue = (probability/100) * payout - (1 - probability/100);
          const dozenName = bet.type === 'DOZEN_1' ? '1st Dozen (1-12)' :
                           bet.type === 'DOZEN_2' ? '2nd Dozen (13-24)' : '3rd Dozen (25-36)';
          analysis = `📅 DOZEN BET (${dozenName})
• Probability: ${probability}% (12 in 37)
• Payout: 2:1
• House Edge: 2.7%
• Expected Value: ${expectedValue.toFixed(3)} per R1 wagered`;
          break;

        case 'COLUMN_1':
        case 'COLUMN_2':
        case 'COLUMN_3':
          probability = 32.4; // 12/37 ≈ 32.4%
          payout = 2;
          expectedValue = (probability/100) * payout - (1 - probability/100);
          analysis = `📋 COLUMN BET
• Probability: ${probability}% (12 in 37)
• Payout: 2:1
• House Edge: 2.7%
• Expected Value: ${expectedValue.toFixed(3)} per R1 wagered`;
          break;
      }

      return analysis;
    });

    // Overall analysis
    const totalExpectedValue = betAnalysis.reduce((sum, analysis) => {
      const evMatch = analysis.match(/Expected Value: ([-\d.]+)/);
      return sum + (evMatch ? parseFloat(evMatch[1]) : 0);
    }, 0);

    const riskLevel = totalBet > balance * 0.1 ? 'HIGH' : totalBet > balance * 0.05 ? 'MEDIUM' : 'LOW';
    const strategyAdvice = totalExpectedValue < -0.05 ?
      '🎲 HIGH RISK: Consider outside bets for better odds' :
      '✅ GOOD CHOICE: Balanced risk-reward ratio';

    // Hot numbers from history
    const counts: Record<number, number> = {};
    history.forEach(h => counts[h.number] = (counts[h.number] || 0) + 1);
    const hotNumbers = Object.entries(counts)
      .sort((a,b) => b[1] - a[1])
      .slice(0, 3)
      .map(([num, count]) => `${num}(${count})`)
      .join(', ');

    const analysisText = `🤖 BET ANALYSIS ENGINE
═══════════════════════════════

${betAnalysis.join('\n\n')}

═══════════════════════════════
💰 TOTAL WAGER: R${totalBet}
📈 OVERALL EXPECTED VALUE: ${totalExpectedValue.toFixed(3)} per R1
⚠️  RISK LEVEL: ${riskLevel}
🎯 STRATEGY: ${strategyAdvice}

🔥 HOT NUMBERS (Recent): ${hotNumbers || 'None yet'}
💡 PRO TIP: The house always has a 2.7% edge, but smart bankroll management wins sessions!

🎰 READY TO SPIN? Let's see what Lady Luck brings! 🍀`;

    return analysisText;
  } catch (error) {
    console.error("Bet Analysis Error:", error);
    return `🤖 BET ANALYSIS ENGINE
═══════════════════════════════

Error calculating probabilities. Please try again!

💡 REMEMBER: All casino games favor the house, but strategic play extends your session!`;
  }
};