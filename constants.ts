import { RouletteNumber, BetType } from './types';

// European Roulette Wheel Order (Clockwise starting from 0)
export const WHEEL_ORDER = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 
  5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

export const RED_NUMBERS = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36
]);

export const BLACK_NUMBERS = new Set([
  2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35
]);

export const PAYOUTS: Record<BetType, number> = {
  [BetType.STRAIGHT]: 35,
  [BetType.RED]: 1,
  [BetType.BLACK]: 1,
  [BetType.EVEN]: 1,
  [BetType.ODD]: 1,
  [BetType.LOW]: 1,
  [BetType.HIGH]: 1,
  [BetType.DOZEN_1]: 2,
  [BetType.DOZEN_2]: 2,
  [BetType.DOZEN_3]: 2,
  [BetType.COLUMN_1]: 2,
  [BetType.COLUMN_2]: 2,
  [BetType.COLUMN_3]: 2,
};

export const CHIP_VALUES: number[] = [1, 5, 25, 100, 500];

export const getNumberColor = (num: number): 'red' | 'black' | 'green' => {
  if (num === 0) return 'green';
  return RED_NUMBERS.has(num) ? 'red' : 'black';
};

// Helper to get full number objects for the board
export const BOARD_NUMBERS: RouletteNumber[] = Array.from({ length: 37 }, (_, i) => ({
  value: i,
  color: getNumberColor(i),
}));

// Helper to get all numbers covered by a bet type for highlighting
export const getCoveredNumbers = (type: BetType, target: number | string): number[] => {
  const numbers: number[] = [];
  
  for (let i = 0; i <= 36; i++) {
    let include = false;
    const color = getNumberColor(i);

    switch (type) {
      case BetType.STRAIGHT:
        if (i === target) include = true;
        break;
      case BetType.RED:
        if (color === 'red') include = true;
        break;
      case BetType.BLACK:
        if (color === 'black') include = true;
        break;
      case BetType.EVEN:
        if (i !== 0 && i % 2 === 0) include = true;
        break;
      case BetType.ODD:
        if (i !== 0 && i % 2 !== 0) include = true;
        break;
      case BetType.LOW:
        if (i >= 1 && i <= 18) include = true;
        break;
      case BetType.HIGH:
        if (i >= 19 && i <= 36) include = true;
        break;
      case BetType.DOZEN_1:
        if (i >= 1 && i <= 12) include = true;
        break;
      case BetType.DOZEN_2:
        if (i >= 13 && i <= 24) include = true;
        break;
      case BetType.DOZEN_3:
        if (i >= 25 && i <= 36) include = true;
        break;
      case BetType.COLUMN_1: // Bottom row (1, 4, 7...)
        if (i !== 0 && i % 3 === 1) include = true;
        break;
      case BetType.COLUMN_2: // Middle row (2, 5, 8...)
        if (i !== 0 && i % 3 === 2) include = true;
        break;
      case BetType.COLUMN_3: // Top row (3, 6, 9...)
        if (i !== 0 && i % 3 === 0) include = true;
        break;
    }
    if (include) numbers.push(i);
  }
  return numbers;
};