export enum BetType {
  STRAIGHT = 'STRAIGHT', // Single number
  RED = 'RED',
  BLACK = 'BLACK',
  EVEN = 'EVEN',
  ODD = 'ODD',
  LOW = 'LOW', // 1-18
  HIGH = 'HIGH', // 19-36
  DOZEN_1 = 'DOZEN_1', // 1st 12
  DOZEN_2 = 'DOZEN_2', // 2nd 12
  DOZEN_3 = 'DOZEN_3', // 3rd 12
  COLUMN_1 = 'COLUMN_1',
  COLUMN_2 = 'COLUMN_2',
  COLUMN_3 = 'COLUMN_3',
}

export interface PlacedBet {
  id: string;
  type: BetType;
  target: number | string; // number for STRAIGHT, string for others
  amount: number;
  payoutRatio: number;
}

export interface RouletteNumber {
  value: number;
  color: 'red' | 'black' | 'green';
}

export interface GameHistory {
  number: number;
  color: 'red' | 'black' | 'green';
}

export type ChipValue = 1 | 5 | 25 | 100 | 500;

export type DealerEmotion = 'IDLE' | 'SPINNING' | 'WIN' | 'LOSS' | 'THINKING';