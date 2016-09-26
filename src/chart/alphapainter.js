'use strict';
let MassPainter = require('./masspainter');
module.exports = class AlphaPainter extends MassPainter {
    constructor(painterCore, canvas) {
        super(painterCore, canvas);
        this.topPadding = 25;
        this.doOnMatchCases = this.doOnMatchCases.bind(this);
        this.core.on("matchCases", this.doOnMatchCases);

        this.doOnScan = this.doOnScan.bind(this);
        this.core.on("scan", this.doOnScan);

    }

    doOnScan() {
        console.log("doOnScan AlphaPainter")
        this.clearDrawCache();
        this.draw(this.core.drawRangeStart, this.core.drawRangeEnd);
    }

    doOnMatchCases() {
        if (this.updateHeightPerUnit()) {
            //console.log("AlphaPainter panter doOnValueRange----------------------clear draw")
            this.clearDrawCache();
            this.draw(this.core.drawRangeStart, this.core.drawRangeEnd);
        }
    }

    updateHeightPerUnit() {
        if (!this.canvas) return;
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
        //console.log("-----------------------", idx, x, data.date, data.matchCases)
        if (data.matchCases) {
            let cases = data.matchCases;
            let totalcases = cases.pending.length + cases.bull.length + cases.bear.length;
            let mcmax = Math.max(this.core.matchCasesRangeMax, 100);

            let h = Math.round(totalcases * 0.8 * this.canvas.height / mcmax);
            //let clr = Math.round(130 + 125 * cases.bull.length / totalcases);
            //ctx.strokeStyle = 'rgba(' + clr + ', ' + clr + ', ' + clr + ', 1)';
            ctx.strokeStyle = 'rgba(255,255,255, ' + (0.3 + 0.7 * cases.bull.length / totalcases) + ')';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(xp, this.canvas.height - h - 1);
            ctx.lineTo(xp, this.canvas.height - 1);
            ctx.stroke();
        }

    }

}