'use strict';
let MassPainter = require('./MassPainter');
module.exports = class CandlePainter  extends MassPainter{
    constructor(painterCore, canvas) {
        super(painterCore, canvas);

        this.doOnPriceRange =  this.doOnPriceRange.bind(this);
        this.core.on("priceRange", this.doOnPriceRange);
        this.topPadding = 20;
        this.bottomPadding = 20;
        this.bottomBorder = 1;
        this.topBorder = 1;
    }

    doOnPriceRange(){
        this.updateHeightPerUnit();
        this.clearDrawCache(); 
    }

    updateHeightPerUnit() {
        if (!this.canvas) return;
        let h = this.canvas.height;
        let lastv = this.heightPerUnit;
        this.heightPerUnit = (h - this.bottomPadding - this.topPadding) / (100 * (this.core.priceHigh - this.core.priceLow));
        // console.log("updateHeightPerUnit", lastv, h - this.bottomPadding, this.core.priceHigh, this.core.priceLow, this.heightPerUnit)
        return lastv != this.heightPerUnit;
    }

    drawSingle(x, data, data_pre) {
        let open = data.open;
        let close = data.close;
        let high = data.high;
        let low = data.low;
        let ctx = this.canvas2DCtx;
        let color = (data.close === data.open ? '#ffffff' : (data.close < data.open ? '#4caf50' : '#f44336')); //data_pre ? (data_pre.close > data.close ? '#4caf50' : '#f44336') : (data.close < data.open ? '#4caf50' : '#f44336');
        ctx.strokeStyle = color;
        ctx.beginPath();
        let w = this.core.unitWidth;
        let xp = Math.floor(x + w / 2);
        ctx.moveTo(xp, this.getPriceY(high));
        ctx.lineTo(xp, this.getPriceY(low));
        ctx.stroke();
        ctx.fillStyle = color;
        let openY = this.getPriceY(open);
        let closeY = this.getPriceY(close);
       
        ctx.fillRect(x, openY, w - 1, openY===closeY ? 1 : (closeY - openY));

    }

    getPriceY(price) {
        let y = Math.round(this.canvas.height - this.bottomPadding  - (price - this.core.priceLow) * 100 * this.heightPerUnit);
        return y;
    }
}
