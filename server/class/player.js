
class Player {

    constructor({
        id,
        rects,
        status,
        isReady = false,
        score = 0
    }) {
        this.id = id
        this.rects = rects
        this.status = status
        this.isReady = isReady
    }

    setReady() {
        this.isReady = true
    }

    addRects(rects) {
        this.rects = rects
    }
}