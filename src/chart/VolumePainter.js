'use strict';
let MassPainter = require('./MassPainter');
module.exports = class VolumePainter extends MassPainter{
    constructor(painterCore, canvas) {
        super(painterCore, canvas);

        this.doOnVolumeRange =  this.doOnVolumeRange.bind(this);
        this.core.on("volumeRange", this.doOnVolumeRange);
    }

    doOnVolumeRange(){
        this.updateHeightPerUnit();
        this.clearDrawCache();        
        
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

    drawSingle(x, data, data_pre) {
        let open = data.open;
        let close = data.close;
        
        let preclose = data_pre.close;
        let vol = data.volume;

        let ctx = this.canvas2DCtx;
        let color =  close < open ? '#4caf50' : (close > open ? '#f44336':  (preclose > close ? '#4caf50' : '#f44336' ));
        ctx.strokeStyle = color;
       
        let w = this.core.unitWidth;
        ctx.fillStyle = color;
        
        ctx.fillRect(x, this.canvas.height, w - 1,-Math.round(vol * this.heightPerUnit));

    }
}
