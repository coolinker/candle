'use strict';
let Painter = require('./Painter');
module.exports = class VolumePainter extends Painter{
    // constructor(painterCore, canvas) {
    //     super();
    // }
    updateHeightPerPriceUnit() {
        if (!this.canvas) return;
        let h = this.canvas.height;
        this.heightPerPriceUnit = h / (100 * (this.core.volumeHigh - this.core.valueLow));
    }

    draw(start, end) {
        this.updateHeightPerPriceUnit();
        let w = this.core.unitWidth;
        const data = this.core.arrayData;
        console.log("draw", start, end, data.length, w)
        for (let i = start; i <= end && i>=0; i++) {
            let x = (i-start) * w;
            this.drawCandle(x, data[i], i > 0 ? data[i - 1] : null);
        }
    }

    drawCandle(x, data, data_pre) {
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
        let y = Math.round(this.canvas.height - this.bottomPadding - (price - this.core.valueLow) * 100 * this.heightPerPriceUnit);
        return y;
    }
}
