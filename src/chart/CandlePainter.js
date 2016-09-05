'use strict';
let MassPainter = require('./MassPainter');
module.exports = class CandlePainter extends MassPainter {
    constructor(painterCore, canvas) {
        super(painterCore, canvas);

        this.doOnPriceRange = this.doOnPriceRange.bind(this);
        this.core.on("priceRange", this.doOnPriceRange);
        this.topPadding = 50;
        this.bottomPadding = 50;
        this.bottomBorder = 1;
        this.topBorder = 1;
    }

    doOnPriceRange() {
        if (this.updateHeightPerUnit()) {
            this.clearDrawCache();
        }

    }

    updateHeightPerUnit() {
        if (!this.canvas || this.core.priceHigh === 0) return false;
        let ly = this.getPriceY(this.core.priceLow);
        let hy = this.getPriceY(this.core.priceHigh);
        let h = this.canvas.height;
        let lastv = this.heightPerUnit;
        if (this.heightPerUnit && (ly < h && ly > h - 2 * this.bottomPadding && hy < 2 * this.topPadding && hy > 0)) return false;
        // console.log(this.heightPerUnit, this.core.priceLow, ly, this.core.priceHigh, hy);

        this.heightPerUnit = (h - this.bottomPadding - this.topPadding) / (100 * (this.core.priceHigh - this.core.priceLow));
        //console.log("updateHeightPerUnit", lastv, h - this.bottomPadding, this.core.priceHigh, this.core.priceLow, this.heightPerUnit)
        return lastv != this.heightPerUnit;
    }

    drawSingle(x, idx, dataArr) {
        let data = dataArr[idx];

        let open = data.open;
        let close = data.close;
        let high = data.high;
        let low = data.low;
        let ctx = this.canvas2DCtx;
        let w = this.core.unitWidth;
        let xp = Math.floor(x + w / 2);

        if (data.match) {
            ctx.setLineDash([2, 4]);
            ctx.strokeStyle = 'rgba(130, 130, 130, 1)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(xp, 0);
            ctx.lineTo(xp, this.canvas.height);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        let color = (data.close === data.open ? '#ffffff' : (data.close < data.open ? '#4caf50' : '#f44336'));
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.moveTo(xp, this.getPriceY(high));
        ctx.lineTo(xp, this.getPriceY(low));
        ctx.stroke();
        ctx.fillStyle = color;
        let openY = this.getPriceY(open);
        let closeY = this.getPriceY(close);

        ctx.fillRect(x, openY, w - 1, openY === closeY ? 1 : (closeY - openY));

        if (data.ex) {
            ctx.lineWidth = 1;
            ctx.strokeStyle = '#424242';
            ctx.strokeText('E', xp - 5, this.canvas.height - 3);
        }

        if (idx === 0) return;
        let data_pre = dataArr[idx - 1];
        let aves = this.core.aves; //[8, 13, 21, 55];
        let avecolors = this.core.avecolors; //["#FFEB3B", "#00BCD4", "#9C27B0", "#DBDBDB"];
        for (let i = 0; i < aves.length; i++) {
            let avy = this.getPriceY(data["ave_close_" + aves[i]]);
            let avpy = this.getPriceY(data_pre["ave_close_" + aves[i]]);
            ctx.strokeStyle = avecolors[i];

            ctx.beginPath();
            ctx.moveTo(xp, avy);
            ctx.lineTo(xp - this.core.unitWidth, avpy);

            if (this.hasDrawCache(idx + 1)) {
                let data_next = dataArr[idx + 1];
                let avny = this.getPriceY(data_next["ave_close_" + aves[i]]);
                ctx.moveTo(xp + this.core.unitWidth, avny);
                ctx.lineTo(xp, avy);

            }

            ctx.stroke();
        }


    }

    getPriceY(price) {
        let y = Math.round(this.canvas.height - this.bottomPadding - (price - this.core.priceLow) * 100 * this.heightPerUnit);
        return y;
    }
}