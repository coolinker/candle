'use strict';
let MassPainter = require('./MassPainter');
module.exports = class VolumePainter extends MassPainter {
    constructor(painterCore, canvas) {
        super(painterCore, canvas);
        this.topPadding = 25;
        this.doOnValueRange = this.doOnValueRange.bind(this);
        this.core.on("amountRange", this.doOnValueRange);
        this.core.on("netsummax_r0Range", this.doOnValueRange);
        this.core.on("netsummax_r0_durationRange", this.doOnValueRange);

        this.doOnMoneyFlow = this.doOnMoneyFlow.bind(this);
        this.core.on("moneyFlow", this.doOnMoneyFlow);

    }

    doOnMoneyFlow() {
        this.doOnData();
    }

    doOnValueRange() {
        if (this.updateHeightPerUnit()) {
            this.clearDrawCache();
        }
    }

    clearDrawCache() {
        this.drawCache = [];
        this.drawMoneyFlowCache = [];
        this.canvas2DCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawBorder();
    }

    updateHeightPerUnit() {
        if (!this.canvas) return;
        let h = this.canvas.height - this.topPadding;
        let lastv = this.heightPerUnit;
        let ha = this.getAmountY(this.core.rangeFields.amount.high);
        if (this.heightPerUnit > 0 && ha > 0 && ha < 2 * this.topPadding) return false;
        this.heightPerUnit = h / this.core.rangeFields.amount.high;
        console.log("this.heightPerUnit", this.heightPerUnit)
        let r = Math.max(this.core.rangeFields.netsummax_r0.high, -this.core.rangeFields.netsummax_r0.low)
        this.heightPerNetSumMax_r0Unit = 0.5 * h / r;

        let dh = this.core.rangeFields.netsummax_r0_duration.high;
        this.heightPerNetSumMax_r0_DurationUnit = 0.5 * h / dh;

        return true;
    }

    getAmountY(amount) {
        let y = Math.round(this.canvas.height - amount * this.heightPerUnit);
        return y;
    }

    drawSingle(x, idx, dataArr) {
        let data = dataArr[idx];
        let data_pre = idx > 0 ? dataArr[idx - 1] : null;
        let ctx = this.canvas2DCtx;
        let w = this.core.unitWidth;
        let cw = Math.max(1, w - 1);
        let xp = Math.floor(x + w / 2);

        if (data.netsummax_r0 !== undefined) {
            let nsmr0h = Math.round(data.netsummax_r0 * this.heightPerNetSumMax_r0Unit);
            var grd = ctx.createLinearGradient(0, nsmr0h, 0, 0);
            grd.addColorStop(0, 'rgba(66, 66, 66, 0.5)');
            grd.addColorStop(1, 'rgba(66, 66,66, 0)');
            ctx.fillStyle = grd;
            ctx.fillRect(x, 0, cw, nsmr0h);

            let nsmh = Math.round(data.netsummax * this.heightPerNetSumMax_r0Unit);
            ctx.beginPath();
            ctx.moveTo(x, nsmh);
            ctx.lineTo(x + w, nsmh);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.lineWidth = 1;
            ctx.stroke();

            let nsmr0dh = Math.round(data.netsummax_r0_duration * this.heightPerNetSumMax_r0_DurationUnit);
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, nsmr0dh);
            ctx.strokeStyle = 'rgba(66, 66, 66, 0.8)';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.restore();
        }

        let open = data.open;
        let close = data.close;
        let vol = data.amount;


        if (data_pre) {
            let preclose = data_pre.close;
            let color = close < open ? '#4caf50' : (close > open ? '#f44336' : (preclose > close ? '#4caf50' : '#f44336'));
            ctx.strokeStyle = color;
            ctx.fillStyle = color;
            ctx.fillRect(x, this.canvas.height, cw, -Math.round(vol * this.heightPerUnit));
        }
        //    this.drawMoneyFlow(x, idx, dataArr);
        if (data.netamount !== undefined) {
            let rox_net = data.netamount - data.r0_net;

            ctx.fillStyle = data.r0_net > 0 ? '#B6B6B6' : '#727272';
            let r0_height = Math.round(Math.abs(data.r0_net) * this.heightPerUnit);
            ctx.fillRect(x, this.canvas.height, cw, -r0_height);

            ctx.fillStyle = rox_net > 0 ? '#FFEB3B' : '#FF9800';
            ctx.fillRect(x, this.canvas.height - r0_height, cw, -Math.round(Math.abs(rox_net) * this.heightPerUnit));

        }

        if (idx === 0) return;
        let unitWidth = this.core.unitWidth;
        let aves = this.core.aves; //[8, 13, 21, 55];
        let avecolors = this.core.avecolors; //["#FFEB3B", "#00BCD4", "#9C27B0", "#DBDBDB"];

        for (let i = 0; i < aves.length; i++) {
            let avy = this.getAmountY(data["ave_amount_" + aves[i]]);
            let avpy = this.getAmountY(data_pre["ave_amount_" + aves[i]]);

            ctx.strokeStyle = avecolors[i];
            ctx.beginPath();
            ctx.moveTo(x + Math.floor(unitWidth / 2), avy);
            ctx.lineTo(x - Math.ceil(unitWidth / 2), avpy);

            if (this.hasDrawCache(idx + 1)) {
                let data_next = dataArr[idx + 1];
                let avny = this.getAmountY(data_next["ave_amount_" + aves[i]]);
                ctx.moveTo(x + unitWidth * 3 / 2, avny);
                ctx.lineTo(x + unitWidth / 2, avy);

            }
            ctx.stroke();
        }

    }

}