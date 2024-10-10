
class Player {

    constructor({
        id,
        rects,
        eRects,
        status,
        grid,
        roomId,
        enemyGrid,
        isReady = false,
        score = 0
    }) {
        this.id = id
        this.roomId = roomId
        this.rects = rects
        this.enemyGrid = enemyGrid
        this.grid = grid,
            this.eRects = eRects
        this.status = status
        this.isReady = isReady
    }

    setReady() {
        this.isReady = true
    }

    addRects(rects) {
        this.rects = rects
    }
    addERects(rects) {
        this.rects = rects
    }
}
module.exports = Player