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


type orientation = 'horizontal' | 'vertical';

type ShipType = {
    id: number;
    size: number;
    type: "Destroyer" | "Submarine" | "Patrol" | "Carrier" | "Cruiser"
    sprite: any
    orientation: orientation;
};


type PlaceShipParams = {
    col: number;
    row: number;
    id: number;
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
    lastPositions: Array<{ row: number; col: number }>;
    positions: Array<{ row: number; col: number }>;
    orientation: orientation;
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
    isPlayerTurn: boolean
    table2: PlayerTable
    table1: PlayerTable
    role: string;
    addShip: ({ id, col, row, type, orientation }: { id: number, col: number, row: number, type: ShipType['type'], orientation: orientation }) => void
    joinRoom: (room: Room, player: Player, opponent: Player, role: string) => void;
    placeShip: ({ col, row, id }: PlaceShipParams) => void
    moveShip: ({ col, row, shipId }: { col: number, row: number, shipId: number }) => void
    updateOpponent: (data: Player) => void
    updateRoom: (data: Room) => void
    updatePlayerTable: (data: any) => void
    updateEnemyTable: (data: any) => void

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


export const useGameStore = create<GameState>((set, get) => ({
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

    addShip: ({ id, col, row, type, orientation }) => {

        const { table1 } = get();

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
                rectId: id,
                hasShip: true
            };
        });

        const updatedShip = {
            id: id,
            lastPositions: positions,
            positions,
            size: shipSize,
            type: type,
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
        const { table1 } = get();


        const newShips = [...table1.ships];

        const existingShipIndex = newShips.findIndex(s => s.id == id);

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
        const { room } = get();

        set({
            room: {
                ...room,
                ...data
            }
        })
    },

    getOpponentStatus: () => {
        const { role, room } = get()
        return role == 'player1' ? room?.player1 : room?.player2

    },

    updateEnemyTable: (data) => {
        const { table2 } = get()
        set({
            table2: {
                ...table2,
                grid: data
            }
        })
    },
    updatePlayerTable: (data) => {
        const { table1 } = get();
        set({

            table1: {
                ...table1,
                grid: data
            }
        })
    }

}));

export const useIsPlayerTurn = () =>
    useGameStore((state) => {
        // Verifica se há uma sala, se o status é 'battling' e se há um jogador atual
        if (!state.room || state.room.status !== 'battling' || !state.currentPlayer) {
            return false;
        }

        // Verifica se o ID do jogador atual corresponde ao ID do turno na sala
        return state.room.turnId === state.currentPlayer.id;
    });

export const useNamePlayerAttacking = () => useGameStore((state) => {
    return state.room?.player1.id == state.room?.turnId ? state.room?.player1.name : state.room?.player2.name
})
