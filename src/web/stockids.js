'use strict';
import IO from "./io";

class StockIDs {
    constructor() {}

    static load(ids) {
        StockIDs.arrayData = ids;
        for (let i = 0; i < ids.length; i++) {
            StockIDs.idIndexMap[ids[i]] = i;
        }
    }
    
    static validSid(sid) {
        if (sid === 'SH000001') sid = 'SH999999';
        return StockIDs.idIndexMap[sid] !== undefined ? sid : null;
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

    static getIDsByIndex(start, count) {
        if (StockIDs.arrayData === null) return [];
        return StockIDs.arrayData.slice(start, start + count)
    }

    static getTotalCount() {
        return StockIDs.arrayData.length;
    }

    static getSidByIndex(idx) {
        return StockIDs.arrayData[idx];
    }

    static divideToGroups(n) {
        let len = StockIDs.getTotalCount();
        let glen = Math.round(len / n);
        let arr = [];
        for (let i = 0; i < n; i++) {
            arr.push(i * glen);
        }
        return arr;
    }
}

// IO.httpGetStockIdsJson("", function(json) {
//     StockIDs.load(json);
// });

fetch(self.location.origin + '/api', {
    method: 'POST',
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    },
    body: '{"filter":"", "action":"stockIds"}'
}).then(function(res) {
    return res.json();
}).then(function(json) {
    console.log("httpGetStockIdsJson =>", json.length);
    // callback(json);
    StockIDs.load(json);
});

StockIDs.arrayData = null;
StockIDs.idIndexMap = {};

export default StockIDs;