'use strict';
// const EventEmitter = require('events');
import EventEmitter from 'events';
import DataBuildPipe from '../alpha/databuildpipe';
import MatchFunctionUtil from '../alpha/matchfunctionutil';
//import MovingAverageUtil from "../alpha/movingaverageutil";

//Canvas width maximum value in Chrome is 32767;
let CHROME_CANVAS_MAX_LENGTH = 32767;
let MAX_COLUMN_WIDTH = 7;
module.exports = class PainterCore extends EventEmitter {
    constructor() {
        super();
        this.reset();
        this.aves = [8, 13, 21, 55];
        this.unitWidth = 7;
        this.avecolors = ['rgba(255, 235, 60, 1)', "#00BCD4", "#9C27B0", "#DBDBDB"];
    }

    reset() {
        this.arrayData = null;
        //this.unitWidth = 7;
        this.priceHigh = 0;
        this.priceLow = 10000;
        this.matchCasesRangeMax = Number.MIN_SAFE_INTEGER;
        this.dateIndexMap = {};
        this.drawRangeStart = -1;
        this.drawRangeEnd = -1;
        this.reservedSpaces = 10;
        this.drawPortWidth = null;

        this.rangeFields = this.getDefaultRangeFields();
    }

    scanData(str) {
        let re = MatchFunctionUtil.scan(this.arrayData, str, {});
        console.log("scanData", re)
        this.emit('scan', re);
        return re;
    }

    getDefaultRangeFields() {
        return {
            'amount': {
                high: Number.MIN_SAFE_INTEGER,
                low: Number.MAX_SAFE_INTEGER
            },
            'netsummax_r0': {
                high: Number.MIN_SAFE_INTEGER,
                low: Number.MAX_SAFE_INTEGER
            },
            'netsummax_r0_duration': {
                high: Number.MIN_SAFE_INTEGER,
                low: Number.MAX_SAFE_INTEGER
            }
        };
    }

    zoom(start, end) {
        if (end - start < 5) return;

        let neww = Math.round(this.drawPortWidth / (end - start));
        if (neww % 2 === 0) neww -= 1;
        neww = Math.max(1, Math.min(MAX_COLUMN_WIDTH, neww));
        if (neww === this.unitWidth) return;

        if (neww * this.arrayData.length > CHROME_CANVAS_MAX_LENGTH) return;

        this.unitWidth = neww;
        this.emit("unitWidth", neww);
        this.updateDrawPort(this.getMiddleDateOfRange(start, end), this.drawPortWidth);
    }

    updateUnitWidth(n) {
        let neww = this.unitWidth + n * 2;

        if (neww * this.arrayData.length > CHROME_CANVAS_MAX_LENGTH) return;
        if (neww < 1 || neww > MAX_COLUMN_WIDTH) return;
        this.unitWidth = neww;
        this.emit("unitWidth", neww);
        this.updateDrawPort(this.getMiddleDateOfRange(), this.drawPortWidth);
    }

    getCanvasWidth() {
        return this.unitWidth * this.arrayData.length;
    }

    getNextDate(date) {
        let len = this.arrayData.length;
        for (let i = 0; i < len; i++) {
            let d = this.arrayData[i].date;
            if (new Date(d) >= date) return d;
        }
    }

    updateDrawPort(dateStr, w) {
        if (!this.arrayData) return;
        console.log("updateDrawPort", dateStr, w)
        let max = this.arrayData.length;
        let idx = this.dateIndexMap[dateStr];
        if (idx === undefined) {
            dateStr = this.getNextDate(new Date(dateStr));
            idx = this.dateIndexMap[dateStr];
        }
        this.drawPortWidth = w;
        let showtotal = Math.ceil(this.drawPortWidth / this.unitWidth);
        let start = -1;
        let end = -1;
        let half = Math.ceil(showtotal / 2)
        if (half + idx > max + this.reservedSpaces) {
            start = Math.max(0, max - showtotal + this.reservedSpaces);
            end = max - 1;
        } else {
            start = Math.max(0, idx - half);
            end = Math.min(idx + half, max - 1);
        }
        //console.log("------------", start, idx, end, half, dateStr, max)

        this.setDrawRange(start, end);
    }

    setDrawRange(start, end) {
        if (!this.arrayData) return;
        let kdata = this.arrayData;


        let mlow = Number.MAX_SAFE_INTEGER;
        let mhigh = -1;
        let mvlow = Number.MAX_SAFE_INTEGER;
        let mvhigh = -1;
        let rfds = this.getDefaultRangeFields();

        for (let i = start; i <= end; i++) {
            let data = kdata[i];
            let high = data.high;
            if (mhigh < high) mhigh = high;
            let low = data.low;
            if (mlow > low) mlow = low;

            // let vhigh = data.amount;
            // if (mvhigh < vhigh) mvhigh = vhigh;
            // let vlow = data.amount;
            // if (mvlow > vlow) mvlow = vlow;
            for (let att in rfds) {
                let hl = rfds[att];
                if (data[att] > hl.high) hl.high = data[att];
                if (data[att] < hl.low) hl.low = data[att];
            }
        }

        if (this.priceHigh !== mhigh || this.priceLow !== mlow) {
            this.priceHigh = mhigh;
            this.priceLow = mlow;

            this.emit("priceRange", true);
        }
        let chnagedRange;
        for (let att in this.rangeFields) {
            if (this.rangeFields[att].high !== rfds[att].high || this.rangeFields[att].low !== rfds[att].low) {
                this.rangeFields[att].high = rfds[att].high;
                this.rangeFields[att].low = rfds[att].low;
                chnagedRange = att;
            }
        }
        if (chnagedRange) {
            this.emit(chnagedRange + "Range");
            //console.log("event-----", chnagedRange + "Range", rfds[chnagedRange])
        }

        this.matchCasesRangeMax = this.getMatchCasesMax();
        // if (this.volumeHigh !== mvhigh || this.volumeLow !== mvlow) {
        //     this.volumeHigh = mvhigh;
        //     this.volumeLow = mvlow;
        //     this.emit("volumeRange", true);
        // }
        this.drawRangeStart = start;
        this.drawRangeEnd = end;
        //console.log("-----start/end", start, end, this.arrayData.length-1)
        // MovingAverageUtil.buildFields(["close", "amount"], 8, start - 1, end, this.arrayData);
        // MovingAverageUtil.buildFields(["close", "amount"], 13, start - 1, end, this.arrayData);
        // MovingAverageUtil.buildFields(["close", "amount"], 21, start - 1, end, this.arrayData);

        this.emit("range", true)
    }

    getMiddleDateOfRange(start, end) {
        if (start === undefined) start = this.drawRangeStart;
        if (end === undefined) end = this.drawRangeEnd;

        if (!this.arrayData) return;
        let idx = start + Math.round((end - start) / 2);
        return this.arrayData[idx].date;
    }

    moveDrawPort(n, w) {
        let len = this.arrayData.length;
        let showtotal = Math.ceil(w / this.unitWidth);
        let start = Math.min(len - 1, Math.max(0, this.drawRangeStart + n));
        let end = start + showtotal;
        //let end = Math.min(len-1, Math.max(0, this.drawRangeEnd+n));

        if (end - len >= this.reservedSpaces) return;
        end = Math.min(end, len - 1);
        this.setDrawRange(start, end);
    }

    moveToPattern(drct, w) {
        let len = this.arrayData.length;
        if (drct > 0) {
            for (let i = this.drawRangeEnd - 10; i < len; i++) {
                if (this.arrayData[i].match) {
                    this.updateDrawPort(this.arrayData[i].date, this.drawPortWidth)
                    return;
                }
            }
        } else {
            for (let i = this.drawRangeStart + 10; i >= 0; i--) {
                if (this.arrayData[i].match) {
                    this.updateDrawPort(this.arrayData[i].date, this.drawPortWidth)
                    return;
                }
            }
        }
    }

    addMatchCases(sid, matchOnDate) {
        let data = this.arrayData;
        for (let i = 0; i < data.length; i++) {
            let d = data[i].date;
            let r = Number(matchOnDate[d]);
            if (r !== undefined) {
                if (!data[i].matchCases) data[i].matchCases = {
                    pending: [],
                    bull: [],
                    bear: []
                };
                if (r === 0) data[i].matchCases.pending.push(sid);
                else if (r === 1) data[i].matchCases.bull.push(sid);
                else if (r === -1) data[i].matchCases.bear.push(sid);
                // data[i].matchCases.push(sid);

            }
        }

        this.matchCasesRangeMax = this.getMatchCasesMax();
        this.emit("matchCases")
    }

    getMatchCasesMax() {
        let data = this.arrayData;
        let max = Number.MIN_SAFE_INTEGER;
        for (let i = this.drawRangeStart; i >= 0 && i <= this.drawRangeEnd; i++) {
            if (!data[i].matchCases) continue;
            let c = data[i].matchCases;
            let t = c.bull.length + c.bear.length + c.pending.length;
            if (t > max) max = t;
        }

        return max;
    }

    clearMatchCases() {
        let data = this.arrayData;
        for (let i = 0; i < data.length; i++) {
            if (data[i].matchCases) data[i].matchCases = undefined;
        }
        this.emit("matchCases")
    }

    loadData(kdata) {
        let temp = this.arrayData;
        this.reset();
        let len = kdata.length;
        let i = len > 4500 ? len - 4500 : 0;
        this.arrayData = kdata.slice(i, len);
        DataBuildPipe.build(0, this.arrayData.length - 1, this.arrayData);
        for (let n = 0; n < this.arrayData.length; n++) {
            this.dateIndexMap[this.arrayData[n].date] = n;
        }

        for (let j = 0; temp && j < temp.length; j++) {
            let date = temp[j].date;
            if (!this.dateIndexMap[date]) continue;
            this.arrayData[this.dateIndexMap[date]].matchCases = temp[j].matchCases;
        }
        this.emit("data");
    }

    updateMoneyFlow(json) {
        console.log("updateMoneyFlow", json.length)
        this.emit("moneyFlow")
    }

    getDataIndexByX(x) {
        return Math.floor(x / this.unitWidth);
    }

    getDataByIndex(idx) {
        return this.arrayData[idx];
    }
}
