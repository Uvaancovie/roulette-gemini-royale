/**
 * Helper function to get the color of a roulette number
 */
export const getNumberColor = (num) => {
  if (num === 0) return 'green';
  const redNumbers = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
  return redNumbers.has(num) ? 'red' : 'black';
};

/**
 * Calculate total winnings based on bets and winning number
 */
export const calculateWinnings = (bets, winningNumber) => {
  let totalWinnings = 0;
  const winningColor = getNumberColor(winningNumber);

  bets.forEach(bet => {
    let won = false;
    switch (bet.type) {
      case 'STRAIGHT': if (bet.target === winningNumber) won = true; break;
      case 'RED': if (winningColor === 'red') won = true; break;
      case 'BLACK': if (winningColor === 'black') won = true; break;
      case 'EVEN': if (winningNumber !== 0 && winningNumber % 2 === 0) won = true; break;
      case 'ODD': if (winningNumber !== 0 && winningNumber % 2 !== 0) won = true; break;
      case 'LOW': if (winningNumber >= 1 && winningNumber <= 18) won = true; break;
      case 'HIGH': if (winningNumber >= 19 && winningNumber <= 36) won = true; break;
      case 'DOZEN_1': if (winningNumber >= 1 && winningNumber <= 12) won = true; break;
      case 'DOZEN_2': if (winningNumber >= 13 && winningNumber <= 24) won = true; break;
      case 'DOZEN_3': if (winningNumber >= 25 && winningNumber <= 36) won = true; break;
      case 'COLUMN_1': if (winningNumber !== 0 && winningNumber % 3 === 1) won = true; break;
      case 'COLUMN_2': if (winningNumber !== 0 && winningNumber % 3 === 2) won = true; break;
      case 'COLUMN_3': if (winningNumber !== 0 && winningNumber % 3 === 0) won = true; break;
    }
    if (won) {
      totalWinnings += bet.amount + (bet.amount * bet.payoutRatio);
    }
  });

  return totalWinnings;
};
