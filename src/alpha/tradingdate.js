'use strict';
let from "./io";

module.exports = class TradingDate {
    constructor() {}

    static load(kdata) {
        TradingDate.arrayData = kdata;
        TradingDate.dateIndexMap = {};

        for (let i = 0; i < kdata.length; i++) {
            TradingDate.dateIndexMap[kdata[i].date] = i;
        }
    }

    static getIndex(date) {
        return TradingDate.dateIndexMap[date];
    }

    static getNext(date) {
        let idx = TradingDate.dateIndexMap[date];
        if (idx === TradingDate.arrayData.length - 1) return null;

        return TradingDate.arrayData[idx + 1].date
    }

    static getPrevious(date) {
        let idx = TradingDate.dateIndexMap[date];
        if (idx === 0) return null;
        return TradingDate.arrayData[idx - 1].date
    }
}


IO.httpGetStockJson("SH999999", function(json) {
    console.log("SH99999", json.length)
    TradingDate.load(json);
});

TradingDate.arrayData = null;
TradingDate.dateIndexMap = {};