'use strict';
let MassPainter = require('./MassPainter');
module.exports = class VolumePainter extends MassPainter{
    constructor(painterCore, canvas) {
        super(painterCore, canvas);

        this.doOnVolumeRange =  this.doOnVolumeRange.bind(this);
        this.core.on("volumeRange", this.doOnVolumeRange);

        this.doOnMoneyFlow =  this.doOnMoneyFlow.bind(this);
        this.core.on("moneyFlow", this.doOnMoneyFlow);
    }

    doOnMoneyFlow() {
        this.doOnData();
    }

    doOnVolumeRange(){
        this.updateHeightPerUnit();
        this.clearDrawCache();        
        
    }

    clearDrawCache() {
        this.drawCache = [];
        this.drawMoneyFlowCache = [];
        this.canvas2DCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawBorder();
    }
    
    updateHeightPerUnit() {
        if (!this.canvas) return;
        let h = this.canvas.height;
        let lastv = this.heightPerUnit;
        this.heightPerUnit = h / this.core.volumeHigh;
        return lastv != this.heightPerUnit;
    }

    getVolumeY(volume) {
        let y = Math.round(this.canvas.height - volume * this.heightPerUnit);
        return y;
    }

   drawSingle(x, idx, dataArr) {
        let data = dataArr[idx];
        let data_pre = idx>0 ? dataArr[idx-1] : null;

        let open = data.open;
        let close = data.close;
        
        let preclose = data_pre.close;
        let vol = data.amount;

        let ctx = this.canvas2DCtx;
        let color =  close < open ? '#4caf50' : (close > open ? '#f44336':  (preclose > close ? '#4caf50' : '#f44336' ));
        ctx.strokeStyle = color;
       
        let w = this.core.unitWidth;
        ctx.fillStyle = color;
        
        ctx.fillRect(x, this.canvas.height, w - 1, -Math.round(vol * this.heightPerUnit));

    //    this.drawMoneyFlow(x, idx, dataArr);
        if (data.netamount !== undefined) {
            let rox_net = data.netamount -data.r0_net;
            
            ctx.fillStyle = data.r0_net > 0 ? '#B6B6B6' : '#727272';
            let r0_height = Math.round(Math.abs(data.r0_net) * this.heightPerUnit);
            ctx.fillRect(x, this.canvas.height, w - 1, -r0_height);

            ctx.fillStyle = rox_net > 0 ? '#FFEB3B' : '#FF9800';
            ctx.fillRect(x, this.canvas.height - r0_height, w - 1, -Math.round(Math.abs(rox_net) * this.heightPerUnit));

        }

        if (idx === 0) return;
        let unitWidth = this.core.unitWidth;
        let aves = [8, 13, 21];
        let avecolors = ["#FFEB3B", "#00BCD4", "#9C27B0"];
        for (let i = 0; i < aves.length; i++) {
            let avy = this.getVolumeY(data["ave_amount_" + aves[i]]);
            let avpy = this.getVolumeY(data_pre["ave_amount_" + aves[i]]);
            ctx.strokeStyle = avecolors[i];
            ctx.beginPath();
            ctx.moveTo(x + unitWidth/2, avy);
            ctx.lineTo(x - unitWidth/2, avpy);

            if (this.hasDrawCache(idx+1)) {
                let data_next = dataArr[idx + 1];
                let avny = this.getVolumeY(data_next["ave_amount_" + aves[i]]);
                ctx.moveTo(x+this.core.unitWidth, avny);
                ctx.lineTo(x, avy);

            }
            ctx.stroke();
        }

    }


    // getVolumeY(vol) {
    //    return this.canvas.height -Math.round(vol * this.heightPerUnit);
    // }
}
