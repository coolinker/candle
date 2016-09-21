'use strict';
let MassPainter = require('./masspainter');
module.exports = class AlphaPainter extends MassPainter {
    constructor(painterCore, canvas) {
        super(painterCore, canvas);
        this.topPadding = 25;
        this.doOnValueRange = this.doOnValueRange.bind(this);
        this.core.on("alphaRange", this.doOnValueRange);

        this.doOnScan = this.doOnScan.bind(this);
        this.core.on("scan", this.doOnScan);
    }

    doOnScan() {
        console.log("doOnScan AlphaPainter")
        this.clearDrawCache();
        this.draw(this.core.drawRangeStart, this.core.drawRangeEnd);
    }
    doOnValueRange() {
        if (this.updateHeightPerUnit()) {
            console.log("AlphaPainter panter doOnValueRange----------------------clear draw")
            this.clearDrawCache();
        }
    }

    updateHeightPerUnit() {
        if (!this.canvas) return;
        // let h = this.canvas.height - this.topPadding;
        // let lastv = this.heightPerUnit;
        // let ha = this.getAmountY(this.core.rangeFields.amount.high);
        // if (this.heightPerUnit > 0 && ha > 0 && ha < 2 * this.topPadding) return false;
        // this.heightPerUnit = h / this.core.rangeFields.amount.high;
        // console.log("this.heightPerUnit", this.heightPerUnit)
        // let r = Math.max(this.core.rangeFields.netsummax_r0.high, -this.core.rangeFields.netsummax_r0.low)
        // this.heightPerNetSumMax_r0Unit = 0.5 * h / r;

        // let dh = this.core.rangeFields.netsummax_r0_duration.high;
        // this.heightPerNetSumMax_r0_DurationUnit = 0.5 * h / dh;
        return true;
    }

    getMatchCountY(amount) {
        let y = Math.round(this.canvas.height - amount * this.heightPerUnit);
        return y;
    }

    drawSingle(x, idx, dataArr) {

        let data = dataArr[idx];
        let data_pre = idx > 0 ? dataArr[idx - 1] : null;
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


    }

}