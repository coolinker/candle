'use strict';
import IO from './io';
import StockIDs from './stockids';
import Zip from '../alpha/zip';
import MatchFunctionUtil from '../alpha/matchfunctionutil';
import UtilsPipe from "../alpha/utilspipe";

let stockFields = ['date', 'open', 'close', 'high', 'low', 'amount', 'netamount', 'r0_net', 'changeratio', 'turnover'];
let cacheMap = {};
let stopScanFlag = false;
module.exports = function(self) {
    let me = this;
    self.addEventListener('message', function(ev) {
        let mn = ev.data['methodName'];
        let params = ev.data['params'];
        // console.log("worker on message", mn, module[mn]);
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

module.stopScanByIndex = function stopScanByIndex(callback) {
    stopScanFlag = true;
    callback(stopScanFlag);
}

module.scanByIndex = function scanByIndex(idx, patternStr, callback) {
    let sid = StockIDs.getSidByIndex(idx);
    let matchOnDate = {};
    let cmpdata = module.getStockDataSync(sid, stockFields);
    let m = {
        bull: 0,
        bear: 0,
        cases: 0
    };
    if (cmpdata) {
        let decmpdata = Zip.decompressStockJson(cmpdata);
        UtilsPipe.build(0, decmpdata.length - 1, decmpdata);
        m = MatchFunctionUtil.scan(decmpdata, patternStr, matchOnDate);
    }

    let total = StockIDs.getTotalCount();
    let finished = idx === (total - 1);
    callback({
        sid: sid,
        index: idx,
        bull: m.bull,
        bear: m.bear,
        cases: m.cases,
        matchOnDate: matchOnDate,
        finished: finished
    }, finished);

    if (!finished) {
        setTimeout(function() {
            if (stopScanFlag) {
                stopScanFlag = false;
            } else {
                module.scanByIndex(++idx, patternStr, callback);
            }

        }, 0);
    }
}

module.loadStocksPerPage = function loadStocksPerPage(start, count, end, callback) {
        let total = end === null ? StockIDs.getTotalCount() : end;
        let pageSize = count;
        count = Math.min(count, total - start);
        //console.log("loadStocksDataPage", start, count)
        module.loadStockIds(start, count, stockFields, function(sids) {
            // console.log(start, count, total)
            if (start + count >= total) {
                callback(start + count);
                console.log('proxy load per page finished', count, start + count)
            } else {
                callback(start + count, false);
                module.loadStocksPerPage(start + count, count, end, callback);
            }
        })
    }
    // module.loadStocksDataPage = function loadStocksDataPage(start, count, callback) {
    //     let total = StockIDs.getTotalCount();
    //     let pageSize = count;
    //     count = Math.min(count, total - start);
    //     //console.log("loadStocksDataPage", start, count)
    //     module.loadStockIds(start, count, stockFields, function(sids) {

//         if (start + count >= total) {
//             callback(start + count);
//         } else {
//             callback(start + count, false);
//             module.loadStocksDataPage(start + count, count, callback);
//         }
//     })
// }

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

        for (let sid in json.data) {
            cacheMap[sid] = json.data[sid];
        }

        if (callback) {
            // console.log("loadStockIds", sids.length, sids[0], sids[sids.length - 1])
            callback(sids);
        }

    });


}