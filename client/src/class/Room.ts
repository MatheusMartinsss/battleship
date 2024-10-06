import { Grid } from "./Grid";

export class Room {

    id: string;
    players: any
    status: string
    turnId: string;
    winnerId: string
    firstPlayer: string
    secondPlayer: string
    started: boolean
    focusTable: string

    constructor({
        id = '',
        players = {},
        status = 'waiting',
        turnId = '',
        winnerId = '',
        started = false,
        firstPlayer = '',
        secondPlayer = '',
        focusTable = ''
    }) {
        this.focusTable = focusTable
        this.started = started
        this.id = id
        this.players = players
        this.status = status
        this.turnId = turnId
        this.winnerId = winnerId
        this.firstPlayer = firstPlayer
        this.secondPlayer = secondPlayer
    }

    addPlayers(data: any, socketId: string) {
        for (const id in data) {
            this.players[id] = {
                ...data[id],
                grid: new Grid({
                    gridCellSize: 40,
                    isStarted: false,
                    isTurn: false,
                    height: 400,
                    isSecondTable: id === socketId ? false : true,
                    width: 400,
                    lineWidth: 1,
                    isReady: false,
                    position: {
                        x: 0,
                        y: 0
                    }
                })
            }
      
            if (id !== socketId) {
                this.secondPlayer = id
            } else {
                this.focusTable = id
                this.firstPlayer = id
                this.players[id].grid.addRect(1, 1, 1)
                this.players[id].grid.addRect(1, 2, 2)
                this.players[id].grid.addRect(1, 3, 3)
                this.players[id].grid.addRect(1, 4, 4)
            }
        }
    }

    update(state: any) {
        this.status = state.status
        this.id = state.id
        this.turnId = state.turnId
        this.winnerId = state.winnerId
    }
}