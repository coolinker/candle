'use strict';
// const EventEmitter = require('events');
import EventEmitter from "events";
import MovingAverageUtil  from "../alpha/MovingAverageUtil";

module.exports = class PainterCore extends EventEmitter {
    constructor() {
        super();
        this.reset();
    }

    reset() {
        this.arrayData = null;
        this.unitWidth = 7;
        this.priceHigh = 0;
        this.priceLow = 10000;
        this.volumeHigh = -1;
        this.volumeLow= Number.MAX_SAFE_INTEGER;
        this.dateIndexMap = {};
        this.drawRangeStart = -1;
        this.drawRangeEnd = -1;
        this.reservedSpaces = 10;
        this.drawPortWidth = null;
    }
    
    updateUnitWidth(n){
        let neww = this.unitWidth + n*2;

        //Canvas width maximum value in Chrome is 32767;
        if (neww * this.arrayData.length > 32767) return;

        if (neww < 1 || neww > 15) return;
        this.unitWidth = neww;
        this.emit("unitWidth", neww);
        this.updateDrawPort(this.getDateOfCurrentRange(), this.drawPortWidth);
    }

    getCanvasWidth(){
        return this.unitWidth * this.arrayData.length;
    }

    updateDrawPort(dateStr, w) {
        if (!this.arrayData) return;
        let max = this.arrayData.length;
        let idx = this.dateIndexMap[dateStr];
        if (idx === undefined) return;
        this.drawPortWidth = w;
        let showtotal = Math.ceil(this.drawPortWidth/this.unitWidth);
        let start = -1;
        let end = -1;
        let half = Math.ceil(showtotal/2)
        if (half+idx > max+this.reservedSpaces) {
                start = max-showtotal+this.reservedSpaces;
                end = max-1;            
        } else {
            start = idx - half;
            end = Math.min(idx+ half, max-1);
        }
       console.log("------------", start, idx, end, half, dateStr, max)

        this.setDrawRange(start, end);
    }

    setDrawRange(start, end) {
        if (!this.arrayData) return;
        //let changed = this.drawRangeStart !== start || this.drawRangeEnd !== end;
        //if (!changed) return;

        let kdata = this.arrayData;
        let mlow = Number.MAX_SAFE_INTEGER;
        let mhigh = -1;
        let mvlow = Number.MAX_SAFE_INTEGER;
        let mvhigh = -1;
        for (let i = start; i <= end; i++) {
            let high = kdata[i].high;
            if (mhigh < high) mhigh = high;
            let low = kdata[i].low;
            if (mlow > low) mlow = low;

            let vhigh = kdata[i].amount;
            if (mvhigh < vhigh) mvhigh = vhigh;
            let vlow = kdata[i].amount;
            if (mvlow > vlow) mvlow = vlow;
        }

        if (this.priceHigh !== mhigh || this.priceLow !== mlow) {
            this.priceHigh = mhigh;
            this.priceLow =  mlow;
            
            this.emit("priceRange", true);
        }

        if(this.volumeHigh !== mvhigh || this.volumeLow !== mvlow) {
            this.volumeHigh = mvhigh;
            this.volumeLow = mvlow;
            this.emit("volumeRange", true);
        }

        this.drawRangeStart = start;
        this.drawRangeEnd = end;
        console.log("-----start/end", start, end, this.arrayData.length-1)
        MovingAverageUtil.buildFields(["close", "amount"], 8, start-1, end, this.arrayData);
        MovingAverageUtil.buildFields(["close", "amount"], 13, start-1, end, this.arrayData);
        MovingAverageUtil.buildFields(["close", "amount"], 21, start-1, end, this.arrayData);
        this.emit("range", true)
    }

    getDateOfCurrentRange() {
        let idx = this.drawRangeStart + Math.round((this.drawRangeEnd -this.drawRangeStart)/2);
        //console.log(this.drawRangeStart, this.arrayData[this.drawRangeStart].date, idx, this.arrayData[idx].date, this.drawRangeEnd, this.arrayData[this.drawRangeEnd].date)
        return this.arrayData[idx].date;
    }

    moveDrawPort(n, w) {
        let len = this.arrayData.length;
        let showtotal = Math.ceil(w/this.unitWidth);
        let start = Math.min(len-1, Math.max(0, this.drawRangeStart+n));
        let end = start+showtotal;
        //let end = Math.min(len-1, Math.max(0, this.drawRangeEnd+n));
        
        if (end-len >= this.reservedSpaces) return;
        end = Math.min(end, len-1);
        this.setDrawRange(start, end);
    }

    loadData(kdata) {
        this.reset();
        let len = kdata.length;
        let i = len>4500 ? len-4500 : 0;
        this.arrayData = kdata.slice(i, len);
        for (; i < len; i++) {
            this.dateIndexMap[kdata[i].date] = i;
        }
        this.emit("data");
    }
    
    updateMoneyFlow(json){
        console.log("updateMoneyFlow", json.length)
        this.emit("moneyFlow")
    }

    getDataIndexByX(x) {
        return Math.floor(x/this.unitWidth);
    }

    getDataByIndex(idx) {
        return this.arrayData[idx];
    }
}
