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
            // console.log("=====", mn, params)
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

module.scanByIndex = function scanByIndex(idx, patternStr, countInDay, callback) {
    let sid = StockIDs.getSidByIndex(idx);

    let cmpdata = module.getStockDataSync(sid, stockFields);
    let m = {
        bull: 0,
        bear: 0,
        cases: 0
    };
    if (cmpdata) {
        let decmpdata = Zip.decompressStockJson(cmpdata);
        UtilsPipe.build(0, decmpdata.length - 1, decmpdata);
        m = MatchFunctionUtil.scan(decmpdata, patternStr, countInDay);
    }

    let total = StockIDs.getTotalCount();
    let finished = idx === (total - 1);
    callback({
        count: idx,
        bull: m.bull,
        bear: m.bear,
        cases: m.cases,
        countInDay: countInDay,
        finished: finished
    }, finished);

    if (!finished) {
        setTimeout(function() {
            if (stopScanFlag) {
                stopScanFlag = false;
            } else {
                module.scanByIndex(++idx, patternStr, countInDay, callback);
            }

        }, 1);
    }
}


module.scanAll = function scanAll(patternStr, callback) {
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
        let finished = i === total;
        callback({
            count: i,
            bull: m.bull,
            bear: m.bear,
            cases: m.cases,
            countInDay: countInDay,
            finished: finished
        }, finished);
    }

}
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