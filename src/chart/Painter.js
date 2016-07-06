'use strict';

module.exports = class Painter {
    constructor(painterCore, canvas) {
        this.canvas = canvas;
        if (this.canvas) this.canvas2DCtx = canvas.getContext('2d');
        this.heightPerUnit = null;
        this.core = painterCore;
        this.doOnData = this.doOnData.bind(this);
        this.core.on("data", this.doOnData);
        this.doOnRange =  this.doOnRange.bind(this);
        this.core.on("range", this.doOnRange);
    }

    doOnData(redraw) {
        if (!this.canvas || !redraw) return;
        this.draw(this.core.drawRangeStart, this.core.drawRangeEnd);
    }

    doOnRange(redraw) {
        console.log("doOnRange", redraw,  this.core.drawRangeStart, this.core.drawRangeEnd)
        if (!this.canvas || !redraw) return;
        this.updateHeightPerUnit();
        this.draw(this.core.drawRangeStart, this.core.drawRangeEnd);
    }

    setCanvas(canvas){
        this.canvas = canvas;
        if (this.canvas) this.canvas2DCtx = canvas.getContext('2d');
    }

    draw(start, end) {
        this.updateHeightPerUnit();
        let w = this.core.unitWidth;
        const data = this.core.arrayData;
        console.log("draw", start, end, data.length, w)
        for (let i = start; i <= end && i>=0; i++) {
            let x = (i-start) * w;
            this.drawSingle(x, data[i], i > 0 ? data[i - 1] : null);
        }
    }

    drawSingle(x, data, data_pre) {
    }

    updateHeightPerUnit() {
    }

}
