'use strict';
import IO from './io';
import StockIDs from './stockids';
import Zip from '../alpha/zip';
import MatchFunctionUtil from '../alpha/matchfunctionutil';
import UtilsPipe from "../alpha/utilspipe";

let stockFields = ['date', 'open', 'close', 'high', 'low', 'amount', 'netamount', 'r0_net', 'changeratio', 'turnover'];
let cacheMap = {};

module.exports = function(self) {
    let me = this;
    self.addEventListener('message', function(ev) {
        let mn = ev.data['methodName'];
        //console.log("worker on message", mn, module[mn]);
        let params = ev.data['params'];
        params.push(function(result, finished) {
            if (finished === undefined) finished = true;
            self.postMessage({
                mkey: ev.data.mkey,
                result: result,
                finished: finished
            });
        })
        module[mn].apply(me, params)
            // IO.httpGetStockJson(sid, function(json) {
            //     self.postMessage();
            // });
    });

};

module.scanAll = function scanAll(patternStr, callback) {
    //let patternFun = new Function('data', 'n', 'return ' + patternStr);
    let total = StockIDs.getTotalCount();
    let countInDay = {};
    for (let i = 0; i < total; i++) {
        let sid = StockIDs.getSidByIndex(i);
        let cmpdata = module.getStockDataSync(sid, stockFields);
        if (!cmpdata) {
            console.log("data is null", sid, cmpdata)
            continue;
        }
        let decmpdata = Zip.decompressStockJson(cmpdata);
        UtilsPipe.build(0, decmpdata.length - 1, decmpdata);
        let m = MatchFunctionUtil.scan(decmpdata, patternStr, countInDay);
        //module.matchPattern(decmpdata, patternFun);
        // console.log(sid, decmpdata.length, m)
        callback({
            count: i,
            match: m.match,
            cases: m.cases,
            countInDay: countInDay,
            finished: i === total
        }, i === total);
    }

}

// module.matchPattern = function matchPattern(data, patternFun) {
//     let cases = 0,
//         match = 0;
//     for (let i = 0; i < data.length; i++) {
//         if (patternFun(data, i)) {
//             data[i].patternFun = patternFun;
//             cases++;
//             if (module.isBullCase(data, i)) {
//                 match++;
//             }

//         } else {
//             delete data[i].patternFun;
//         }

//     }

//     return {
//         cases: cases,
//         match: match
//     };
// }

// module.isBullCase = function isBullCase(data, idx) {
//     //let re = Math.round(100 * Math.random()) % 2 === 0;
//     let inc = 0.1,
//         dec = -0.05,
//         price = data[idx].close;

//     for (let i = idx + 1; i < data.length; i++) {
//         let d = data[i];
//         if ((d.low - price) / price < dec) return false;
//         if ((d.high - price) / price > inc) return true;
//     }
//     return false;
// }

module.loadStocksDataPage = function loadStocksDataPage(start, count, callback) {
    let total = StockIDs.getTotalCount();
    let pageSize = count;
    count = Math.min(count, total - start);
    //console.log("loadStocksDataPage", start, count)
    module.loadStockIds(start, count, stockFields, function(sids) {

        if (start + count >= total) {
            callback(start + count);
        } else {
            callback(start + count, false);
            module.loadStocksDataPage(start + count, count, callback);
        }
    })
}

module.getStockData = function getStockData(sid, fields, callback) {
    callback(module.getStockDataSync(sid, fields));
}

module.getStockDataSync = function getStockDataSync(sid, fields) {
    let fm = {};
    for (let i = 0; i < fields.length; i++) {
        let f = fields[i];
        for (let j = 0; j < stockFields.length; j++) {
            if (stockFields[j] === f) fm[j] = true;
        }
    }
    let fulldata = cacheMap[sid];
    if (!fulldata) {
        return null;
    }

    let data = [];
    let r = stockFields.length;
    for (let i = 0; i < fulldata.length; i++) {
        let idx = i % r;
        if (fm[idx]) {
            data.push(fulldata[i]);
        }

    }

    return {
        fields: fields,
        data: data
    };
}

module.loadStockIds = function loadStockIds(start, count, fields, callback) {
    let sids = StockIDs.getIDsByIndex(start, count);
    IO.httpGetStocksCompressedJson(sids, fields.join(), function(json) {
        //console.log("loadStockIds", sids.length, sids[0], sids[sids.length - 1])
        for (let sid in json.data) {
            cacheMap[sid] = json.data[sid];
        }

        if (callback) {
            callback(sids);
        }

    });


}