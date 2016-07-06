'use strict';
const EventEmitter = require('events');

module.exports = class PainterCore extends EventEmitter {
    constructor() {
        super();
        this.reset();
    }

    reset() {
        this.arrayData = null;
        this.unitWidth = 11;
        this.priceHigh = 0;
        this.priceLow = 10000;
        this.volumeHigh = -1;
        this.volumeLow= Number.MAX_SAFE_INTEGER;
        this.dateIndexMap = {};
        this.drawRangeStart = -1;
        this.drawRangeEnd = -1;
    }

    setDrawRange(start, end) {
        if (!this.arrayData) return;
        let changed = this.drawRangeStart !== start || this.drawRangeEnd !== end;
        if (!changed) return;

        let kdata = this.arrayData;
        for (let i = start; i <= end; i++) {
            let high = kdata[i].high;
            if (this.priceHigh < high) this.priceHigh = high;
            let low = kdata[i].low;
            if (this.priceLow > low) this.priceLow = low;

            let vhigh = kdata[i].volume;
            if (this.volumeHigh < vhigh) this.volumeHigh = vhigh;
            let vlow = kdata[i].volume;
            if (this.volumeLow > vlow) this.volumeLow = vlow;

        }

        this.drawRangeStart = start;
        this.drawRangeEnd = end;

        this.emit("range", true)
    }

    loadData(kdata) {
        this.arrayData = kdata;
        for (let i = 0; i < kdata.length; i++) {
            this.dateIndexMap[kdata[i].date] = i;
        }
        this.emit("data", true);
    }


}
