import { create } from "zustand";
import Water from '../assets/water.png'
import Explosion from '../assets/explosion0.png'
import Splash from '../assets/Splash.png'
import Wave from '../assets/Wave.png'
import cruiser from '../assets/Ships/Cruiser/Cruiser.png'
import destroyer from '../assets/Ships/Destroyer/Destroyer.png'
import carrier from '../assets/Ships/Carrier/Carrier.png'
import submarine from '../assets/Ships/Submarine/Submarine.png'
import patrol from '../assets/Ships/PatrolBoat/Patrol.png'

type ShipType = {
    id: number;
    size: number;
    type: "Destroyer" | "Submarine" | "Patrol" | "Carrier" | "Cruiser"
    sprite: any
    orientation: 'horizontal' | 'vertical';
};

type PlaceShipParams = {
    col: number;
    row: number;
    ship: ShipType;
};


type Player = {
    id: string;
    roomId: string;
    table1: Cell[][];
    table2: Cell[][];
    ships: Ship[];
    isReady: boolean;
    connected: boolean;
    score: number;
};

type Cell = {
    row: number;
    col: number;
    hasShip: boolean;
    isHit: boolean;
    rectId: number | null;
};

type Ship = {
    id: number;
    lasPositions: Array<{ row: number; col: number }>;
    positions: Array<{ row: number; col: number }>;
    size: number;
    isSunk: boolean;
};

type RoomPlayer = {
    id: string;
    name: string;
    isReady: boolean;
    score: number;
    connected: boolean
}


type Room = {
    id: string;
    player1: RoomPlayer,
    player2: RoomPlayer,
    status: "waiting" | "placing" | "battling" | "finished";
    turnId: string | null;
    winnerId: string | null;
};



type PlayerTable = {
    position: any,
    width: number
    height: number
    gridCellSize: number,
    draggedRect: null | number,
    lineWidth: number,
    ships: Ship[],
    grid: Cell[][],
    backGround: any,
    sprites: any,
    canvas: null | HTMLCanvasElement,
}

// Update shipSizes enum with all needed ships
enum shipSizes {
    Destroyer = 3,
    Carrier = 5,  // Typically Carrier is the largest ship (5 cells)
    Submarine = 3,
    Patrol = 2,
    Cruiser = 2
}

// Add helper function to get ship size
const getShipSize = (shipType: ShipType["type"]): number => {
    switch (shipType) {
        case "Destroyer": return shipSizes.Destroyer;
        case "Carrier": return shipSizes.Carrier;
        case "Submarine": return shipSizes.Submarine;
        case "Patrol": return shipSizes.Patrol;
        case "Cruiser": return shipSizes.Cruiser;
        default: return 0;
    }
};
type GameState = {

    room: Room | null;
    currentPlayer: Player | null;
    opponent: Player | null;
    currentCanvas: HTMLCanvasElement | null
    table2: PlayerTable
    table1: PlayerTable
    joinRoom: (room: Room, player: Player) => void;
    placeShip: ({ col, row, ship }) => void
    moveShip: (col: number, row: number, shipId: number) => void
};

const createEmptyGrid = () =>
    Array(10).fill(null).map((_, row) =>
        Array(10).fill(null).map((_, col) => ({
            row,
            col,
            hasShip: false,
            isHit: false,
            rectId: null
        }))

    );

const loadSprites = () => {

    const backGround = new Image();
    const explosion = new Image()
    const splash = new Image()
    const wave = new Image()
    const Cruiser = new Image()
    const Carrier = new Image()
    const Patrol = new Image()
    const Submarine = new Image()
    const Destroyer = new Image()
    backGround.src = Water
    explosion.src = Explosion
    splash.src = Splash
    wave.src = Wave
    Cruiser.src = cruiser
    Carrier.src = carrier
    Patrol.src = patrol
    Submarine.src = submarine
    Destroyer.src = destroyer

    return {
        backGround,
        explosion,
        splash,
        wave,
        Cruiser,
        Carrier,
        Patrol,
        Submarine,
        Destroyer
    }

}

export function createGrid() {
    const backGround = new Image();
    const explosion = new Image()
    const splash = new Image()
    const wave = new Image()
    backGround.src = Water
    explosion.src = Explosion
    splash.src = Splash
    wave.src = Wave

    return {
        position: {
            x: 0,
            y: 0,
        },
        width: 400,
        height: 400,
        gridCellSize: 40,
        draggedRect: null,
        lineWidth: 1,
        ships: [],
        grid: createEmptyGrid(),
        backGround: backGround,
        sprites: {
            explosion: explosion,
            splash: splash,
            wave: wave,
        },
        canvas: null,
    }
}

export const useGameStore = create((set, get) => ({
    // Initial state
    room: null,
    currentPlayer: null,
    isPlayerTurn: false,
    isBattling: false,
    currentCanvas: null,
    opponent: null,
    role: '',
    sprites: loadSprites(),
    table2: createGrid(),
    table1: createGrid(),
    // Actions
    joinRoom: (room, player, opponent, role) => {

        set({
            room,
            role,
            opponent,
            currentPlayer: player,
        });
    },

    addShip: ({ col, row, type, orientation }) => {

        const { table1, sprites } = get();

        const positions = [];

        const shipSize = getShipSize(type)


        const newShips = [...table1.ships];

        for (let i = 0; i < shipSize; i++) {
            positions.push({
                row: orientation === 'vertical' ? row + i : row,
                col: orientation === 'horizontal' ? col + i : col
            });
        }


        const isValid = positions.every(pos =>
            pos.row >= 0 && pos.row < 10 &&
            pos.col >= 0 && pos.col < 10 &&
            !table1.grid[pos.col][pos.row].hasShip
        );

        if (!isValid) {
            console.error('Invalid ship placement');
            return;
        }

        const newGrid = table1.grid.map(row =>
            row.map(cell => ({ ...cell }))
        );

        positions.forEach(pos => {
            newGrid[pos.col][pos.row] = {
                ...newGrid[pos.col][pos.row],
                rectId: type,
                hasShip: true
            };
        });

        const updatedShip = {
            id: type,
            lastPositions: positions,
            positions,
            size: shipSize,
            type: type,
            sprite: sprites[type],
            orientation: orientation,
            isSunk: false
        };

        newShips.push(updatedShip);

        set({
            table1: {
                ...table1,
                grid: newGrid,
                ships: newShips
            }
        });
    },
    placeShip: ({ col, row, id }: PlaceShipParams) => {
        const { table1, sprites } = get();


        const newShips = [...table1.ships];

        const existingShipIndex = newShips.findIndex(s => s.id === id);


        const ship = newShips[existingShipIndex]
        // 1. Calculate all positions the ship will occupy
        const positions = [];
        for (let i = 0; i < ship.size; i++) {
            positions.push({
                row: ship.orientation === 'vertical' ? row + i : row,
                col: ship.orientation === 'horizontal' ? col + i : col
            });
        }

        // 2. Validate placement
        const isValid = positions.every(pos =>
            pos.row >= 0 && pos.row < 10 &&
            pos.col >= 0 && pos.col < 10 &&
            !table1.grid[pos.col][pos.row].hasShip
        );

        if (!isValid) {
            console.error('Invalid ship placement');
            return;
        }

        // 3. Create copies of state
        const newGrid = table1.grid.map(row =>
            row.map(cell => ({ ...cell }))
        );

        // 4. Remove existing ship if replacing

        newShips[existingShipIndex].lastPositions.forEach(pos => {
            newGrid[pos.col][pos.row] = {
                ...newGrid[pos.col][pos.row],
                rectId: null,
                hasShip: false
            };
        })

        positions.forEach(pos => {
            newGrid[pos.col][pos.row] = {
                ...newGrid[pos.col][pos.row],
                rectId: ship.id,
                hasShip: true
            };
        });



        // 6. Update/create ship
        const updatedShip = {
            ...ship,
            lastPositions: positions,
            positions,

        };
        newShips[existingShipIndex] = updatedShip;
        set({
            table1: {
                ...table1,
                grid: newGrid,
                ships: newShips
            }
        });
    },
    moveShip: ({ col, row, shipId }) => {

        const { table1 } = get();
        const positions = [];
        const newShips = [...table1.ships];

        const existingShipIndex = newShips.findIndex(s => s.id === shipId);


        const ship = newShips[existingShipIndex]
        for (let i = 0; i < ship.size; i++) {
            positions.push({
                row: ship.orientation === 'vertical' ? row + i : row,
                col: ship.orientation === 'horizontal' ? col + i : col
            });
        }

        const isValid = positions.every(pos =>
            pos.row >= 0 && pos.row < 10 &&
            pos.col >= 0 && pos.col < 10 &&
            !table1.grid[pos.col][pos.row].hasShip
        );

        if (!isValid) {
            console.error('Invalid ship placement');
            return;
        }

        const updatedShip = {
            ...ship,
            positions,
        };

        if (existingShipIndex >= 0) {
            newShips[existingShipIndex] = updatedShip;
        } else {
            newShips.push(updatedShip);
        }

        set({
            table1: {
                ...table1,
                ships: newShips
            }
        });

    },
    updateOpponent: (data) => {
        const { opponent } = get();
        set({
            opponent: {
                ...opponent,
                ...data
            }
        })
    },
    updateRoom: (data) => {
        const { room, updatePlayerTurn } = get();

        set({
            room: {
                ...room,
                ...data
            }
        })
        if (data.status == 'battling') {
            updatePlayerTurn()
        }
    },

    getOpponentStatus: () => {
        const { role, room } = get()
        
        if (role == 'player1') {
            return room.player2
        }
        return room.player1

    },
    updatePlayerTurn: () => {
        const { room, currentPlayer } = get()
        set({
            isPlayerTurn: room.status == 'battling' && room.turnId == currentPlayer.id ? true : false
        })
    }

}));