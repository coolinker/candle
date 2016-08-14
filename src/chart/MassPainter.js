'use strict';

module.exports = class MassPainter {
    constructor(painterCore, canvas) {
        this.canvas = canvas;
        if (this.canvas) this.canvas2DCtx = canvas.getContext('2d');
        this.heightPerUnit = null;
        this.core = painterCore;
        this.doOnData = this.doOnData.bind(this);
        this.core.on("data", this.doOnData);
        this.doOnRange =  this.doOnRange.bind(this);
        this.core.on("range", this.doOnRange);
        this.doOnUnitWidth = this.doOnUnitWidth.bind(this);
        this.core.on("unitWidth", this.doOnUnitWidth)
        

        this.topBorder = 0;
        this.bottomBorder = 0;
        this.drawCache = [];
        this.lastDrawHeight = -1;
    }

    doOnData() {
        if (!this.canvas) return;
        this.canvas.width = this.core.getCanvasWidth();
        // console.log("canvas width changed:", this.canvas.width)
        this.clearDrawCache();
        this.draw(this.core.drawRangeStart, this.core.drawRangeEnd);
    }

    doOnUnitWidth(w) {
        if (!this.canvas) return;
        this.canvas.width = this.core.getCanvasWidth();
        this.clearDrawCache();
        // console.log("MassPainter doOnUnitWidth:", this.canvas.width)
        //this.draw(this.core.drawRangeStart, this.core.drawRangeEnd);
        // this.doOnRange();
    }

    doOnRange() {
        if (!this.canvas) return;
        // console.log("MassPainter doOnRange", this.core.unitWidth)
        this.draw(this.core.drawRangeStart, this.core.drawRangeEnd);
    }

    setCanvas(canvas){
        this.canvas = canvas;
        if (this.canvas) this.canvas2DCtx = canvas.getContext('2d');
    }

    draw(start, end) {
        if (this.didDrawHeightChanged()) {
            this.updateHeightPerUnit();
            this.clearDrawCache();
        }

        // if (this.updateHeightPerUnit()) {
        //     this.clearDrawCache();
        //     this.canvas2DCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        // }

        let w = this.core.unitWidth;
        const data = this.core.arrayData;
        var drawcount = 0;
        //console.log("draw", start, end, data.length, w)
        for (let i = start; i <= end && i>=0; i++) {
            let x = i  * w;
            if (this.hasDrawCache(i)) continue;
            drawcount++;
            //this.drawSingle(x, data[i], i > 0 ? data[i - 1] : null);
            this.drawSingle(x, i, data, start, end);
            this.drawCache[i] = true;
        }

        // if (drawcount>1)
        //     console.log("draw new signles", start, start*w, drawcount);
        this.lastDrawHeight = this.canvas.height;
    }

    hasDrawCache(i){
        return this.drawCache[i];
    }

    didDrawHeightChanged() {
        //console.log("changed", this.canvas.height,  this.lastDrawHeight)
        return this.canvas.height != this.lastDrawHeight;
    }

    clearDrawCache() {
        this.drawCache = [];
        this.canvas2DCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawBorder();
    }

    drawBorder(){
        //console.log("border draw", this.topBorder, this.bottomBorder)
        let canvas = this.canvas;
        let ctx = this.canvas2DCtx
         ctx.strokeStyle = '#424242';
        if (this.topBorder > 0) {
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(canvas.width, 0);
            ctx.lineWidth = this.topBorder;
            ctx.stroke();
        }
        if (this.bottomBorder > 0) {
            ctx.moveTo(0, canvas.height-1);
            ctx.lineTo(canvas.width, canvas.height-1);
            ctx.lineWidth = this.bottomBorder;
            ctx.stroke();
        }

    }

    drawSingle(x, idx, dataArr) {

    }

    updateHeightPerUnit() {
        return true;
    }

    // getPriceByY(y) {
    //     let low = this.core.priceLow;
    //     return low + Math.round(y/this.heightPerUnit)/100;
    // }

    // getPriceY(price) {
    //     return (this.core.priceHigh - price)*100*this.core.heightPerUnit;
    // }
    
    // getVolumeByY(y) {
        
    // }
}
