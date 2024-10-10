
class Room {

    constructor({
        id,
        players = [],
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
    addPlayer(playerId) {
        if (!this.players.includes(playerId)) {
            this.players.push(playerId)
        }
        if (Object.keys(this.players).length === 1) {
            this.firstPlayer = playerId;
        } else {
            this.secondPlayer = playerId
        }

    }
    removePlayer(playerId) {
        this.players = this.players.filter((players) => players.id !== playerId)
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

    processeAttack(attackerId, target, position) {
        
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