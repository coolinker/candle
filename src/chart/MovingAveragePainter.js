'use strict';

module.exports = class CandlePainter {
    constructor(canvas, height){
        this.canvas2DCtx = canvas.getContext('2d');
        this.arrayData = null;
        this.candlestickWidth = 10;
        this.priceHigh  = 0;
        this.priceLow = 10000;
        this.dateIndexMap = {};
        this.heightPerPriceUnit = null;
        this.height = (!!height ? height : 500);
        this.bottomPadding = 50;
    }

    loadArrayData(kdata) {
        this.arrayData = kdata;
        for (let i = 0; i<kdata.length; i++) {
            let high = kdata[i].high;
            if (this.priceHigh<high) this.priceHigh = high;
            let low = kdata[i].low;
            if (this.priceLow > low) this.priceLow = low;
            this.dateIndexMap[kdata[i].date] = i;
        }
        this.updateHeightPerPriceUnit();
    }
    
    updateHeightPerPriceUnit() {
        this.heightPerPriceUnit = (this.height-this.bottomPadding)/(100*(this.priceHigh-this.priceLow));
    }

    draw(start, end) {
        for (let i = start; i<=end; i++) {
            let x = i*this.candlestickWidth;
            this.drawCandle(x, this.arrayData[i], i>0?this.arrayData[i-1]:null);
        }
    }

    drawCandle(x, data, data_pre) {
        let open = data.open;
        let close = data.close;
        let high = data.high;
        let low = data.low;
        let ctx = this.canvas2DCtx;
        let color = data_pre ? (data_pre.close > data.close ? '#0f0' : '#f00') : (data.close < data.open ? '#0f0' : '#f00');
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.moveTo(x + this.candlestickWidth/2, this.getPriceY(high));
        ctx.lineTo(x + this.candlestickWidth/2, this.getPriceY(low));     
        ctx.stroke();
        ctx.fillStyle = color;
        let openY = this.getPriceY(open);
        let closeY = this.getPriceY(close);
        ctx.fillRect(x+1, openY,  this.candlestickWidth-2, closeY-openY);
        
    }

    getPriceY(price) {
        let y = this.height - this.bottomPadding - Math.round((price - this.priceLow)*100*this.heightPerPriceUnit);
        return y;
    }
}