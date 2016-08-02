'use strict';

module.exports = class PointerPainter {
    constructor(painterCore, canvas) {
        this.setCanvas(canvas);
        this.core = painterCore;
        this.doOnData = this.doOnData.bind(this);
        this.core.on("data", this.doOnData);
        this.doOnRange = this.doOnRange.bind(this);
        this.core.on("range", this.doOnRange);
        this.mouseMoveHandler = null;
        this.lastPointerX = -1;
    }

    getNearDisplayYs(data, valueToY) {
        let Ys = {};
        Ys.open = valueToY.open;
        let closey = valueToY.close;
        let labelh = 10;
        let bull = closey < valueToY.open;

        if (Math.abs(closey - Ys.open) < labelh) {
            Ys.close = Ys.open + (bull ? -labelh : labelh);
        } else {
            Ys.close = valueToY.close;
        }

        if (bull) {
            Ys.high = Math.min(valueToY.high, Ys.close - labelh);
            Ys.low = Math.max(valueToY.low, Ys.open + labelh);
        } else {
            Ys.high = Math.min(valueToY.high, Ys.open - labelh);
            Ys.low = Math.max(valueToY.low, Ys.close + labelh);
        }
        // console.log(valueToY, Ys)
        Ys.volume = valueToY.volume;
        Ys.date = valueToY.date;
        return Ys;
    }

    getDisplayYs(data, valueToY) {
        let Ys = {};
        let lineh = 12;
        let dy = valueToY.date;
        Ys.date = dy;
        Ys.low = dy - lineh;
        Ys.close = data.close<data.open?Ys.low-lineh: Ys.low-lineh*2;
        Ys.open = data.open<=data.close?Ys.low-lineh: Ys.low-lineh*2;
        Ys.high = Ys.low - lineh*3;
        Ys.volume = valueToY.volumeStart+lineh-2;
        return Ys
    }

    updatePointer(x, dataIndex, valueToY) {
        x = x - x % this.core.unitWidth;
        if (this.lastPointerX !== x) {
            this.clear();
            let data = this.core.getDataByIndex(dataIndex);
            let pdata = this.core.getDataByIndex(dataIndex-1);
            this.drawPointer(x);
            this.lastPointerX = x;

            let Ys = this.getDisplayYs(data, valueToY);

            let vol = data.volume;
            let voly = valueToY.volume;
            let xpos = x + this.core.unitWidth + 2;
            this.drawNumber(vol , xpos, Ys.volume, "rgba(255, 255, 255, 0.5)");
            this.drawNumber(Math.round(data.amount / 10000)+"万", xpos, Ys.volume+10, "rgba(255, 255, 255, 0.5)");
            //this.drawNumberLine(x + this.core.unitWidth / 2, voly, xpos, Ys.volume);

            this.drawNumber(data.open, xpos, Ys.open, "rgba(255, 255, 255, 0.5)");
            //this.drawNumberLine(x + this.core.unitWidth / 2, valueToY.open, xpos, Ys.open);
            //f44336  4caf50
            if (pdata) {
                let cls = data.close;
                 let inc = Math.round(10000*(cls-pdata.close)/pdata.close)/100;
                let display = (inc === 0 ? cls : (cls + '('+inc+'%)'));
                let clr = inc === 0 ? "rgba(255, 255, 255, 0.8)" : (inc > 0 ? "rgba(244, 67, 54, 0.8)" : "rgba(76, 175, 80, 0.8)")
                this.drawNumber(display, xpos, Ys.close, clr);
            } else {
                this.drawNumber(data.close, xpos, Ys.close, "rgba(255, 255, 255, 1)");    
            }
            
            //this.drawNumberLine(x + this.core.unitWidth / 2, valueToY.close, xpos, Ys.close);

            this.drawNumber(data.high, xpos, Ys.high, "rgba(255, 255, 255, 0.5)");
            //this.drawNumberLine(x + this.core.unitWidth / 2, valueToY.high, xpos, Ys.high);

            this.drawNumber(data.low, xpos, Ys.low, "rgba(255, 255, 255, 0.5)");
            //this.drawNumberLine(x + this.core.unitWidth / 2, valueToY.low, xpos, Ys.low);

            this.drawNumber(data.date, xpos, Ys.date, "rgba(255, 255, 255, 0.5)");
            //this.drawNumberLine(x + this.core.unitWidth / 2, valueToY.date, xpos, Ys.date);

        }

    }


clear() {
    this.canvas2DCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
}

drawNumberLine(x, y, tox, toy) {
    let ctx = this.canvas2DCtx;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(tox, toy);
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
    ctx.stroke();
}

drawNumber(val, x, y, color) {
    let ctx = this.canvas2DCtx;
    ctx.lineWidth = 1;
    ctx.strokeStyle = color;
    ctx.strokeText(val, x, y)
}

drawPointer(x) {
    let ctx = this.canvas2DCtx;
    ctx.strokeStyle = "#424242";
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, this.canvas.height);
    ctx.moveTo(x + this.core.unitWidth, 0);
    ctx.lineTo(x + this.core.unitWidth, this.canvas.height);
    ctx.lineWidth = 1;
    ctx.stroke();
}

doOnData(redraw) {

}

doOnRange(redraw) {

}

setCanvas(canvas) {
    this.canvas = canvas;
    if (this.canvas && this.mouseMoveHandler) {
        this.canvas2DCtx = canvas.getContext('2d');
        // this.mouseMoveHandler = this.mouseMoveHandler.bind(this);
        canvas.addEventListener('mousemove', this.mouseMoveHandler, false);
    }
}


}
