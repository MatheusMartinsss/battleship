
class Room {

    constructor({
        id,
        players = {},
        status = 'waiting',
        turnId = '',
        winnerId = '',
        firstPlayer = '',
        secondPlayer = ''
    }) {

        this.id = id
        this.firstPlayer = firstPlayer
        this.secondPlayer = secondPlayer
        this.players = players
        this.status = status
        this.turnId = turnId
        this.winnerId = winnerId
    }
    addPlayer(playerId, data) {
        this.players[playerId] = data
        this.players[playerId].score = 0;
        if (Object.keys(this.players).length === 1) {
            this.firstPlayer = playerId;
        } else {
            this.secondPlayer = playerId
        }

    }
    nextTurn() {
        const playersId = Object.keys(this.players);

        const nextPlayerId = playersId.find(playerId => playerId !== this.turnId);

        if (nextPlayerId) {
            this.turnId = nextPlayerId;
        } else {
            console.error('No other player found to take the next turn.');
        }
    }

    verifyPlayersIsAlready() {
        const verifyallPlayersIsReady = Object.values(this.players).every(player => player.isReady === true);
        if (verifyallPlayersIsReady) {
            this.status = 'started'
            this.turnId = this.firstPlayer
        }
        return verifyallPlayersIsReady
    }

    processeAttack(attackerId, targetId, position) {
        const target = this.players[targetId];
        const hitRect = Object.values(target.rects).find((rect) => rect.col == position.col && rect.row == position.row);

        let response = {
            hited: !!hitRect,
            position: position,
            rectHit: hitRect || null,
            attackerId,
            targetId,
            nextTurnId: targetId
        };
        if (response.hited) {
            this.players[attackerId].score++
        }
        this.nextTurn();
        response.nextTurnId = this.turnId;
        return response;
    }

}
module.exports = Room