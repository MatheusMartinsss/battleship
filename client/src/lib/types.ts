
export type ShipOrientation = 'horizontal' | 'vertical';
export type GamePhase = 'waiting' | 'placing' | 'battling' | 'finished';

export interface Ship {
    id: string;
    type: string;
    size: number;
    positions: Array<{row: number; col: number}>
    orientation: ShipOrientation
    isSunk: boolean
}

export interface Cell {
    hasShip: boolean;
    isHit: boolean;
    shipId: string | null
}

export interface Player {
    
}