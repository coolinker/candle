'use strict';
import IO from "./io";

class StockIDs {
    constructor() {
    }

    static load(ids) {
        StockIDs.arrayData = ids;
        for (let i = 0; i < ids.length; i++) {
            StockIDs.idIndexMap[ids[i]] = i;
        }
    }

    static getNext(id) {
        let idx = StockIDs.idIndexMap[id];
        if (idx === StockIDs.arrayData.length - 1) return null;

        return StockIDs.arrayData[idx + 1]
    }

    static getPrevious(id) {
        let idx = StockIDs.idIndexMap[id];
        if (idx === 0) return null;
        return StockIDs.arrayData[idx - 1];
    }
}


IO.httpGetStockIdsJson("", function(json) {
    StockIDs.load(json);
});

StockIDs.arrayData = null;
StockIDs.idIndexMap = {};

export default StockIDs;
