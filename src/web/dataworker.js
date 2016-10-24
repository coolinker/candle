'use strict';
import IO from './io';
import StockIDs from './stockids';
import Zip from '../alpha/zip';
import MatchFunctionUtil from '../alpha/matchfunctionutil';
import DataBuildPipe from "../alpha/databuildpipe";

let stockFields = ['date', 'open', 'close', 'high', 'low', 'amount', 'netamount', 'r0_net', 'changeratio', 'turnover'];
let cacheCompressedMap = {};
let cacheDecompressedMap = {};
let stopScanFlag = false;
module.exports = function (self) {
    let me = this;
    self.addEventListener('message', function (ev) {
        let mn = ev.data['methodName'];
        let params = ev.data['params'];
        // console.log("worker on message", mn, module[mn]);
        params.push(function (result, finished) {
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

module.reset = function reset(callback) {
    stopScanFlag = false;
    callback(stopScanFlag);
}
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

        let decmpdata;
        if (!cacheDecompressedMap[sid]) {
            decmpdata = Zip.decompressStockJson(cmpdata);
            DataBuildPipe.build(0, decmpdata.length - 1, decmpdata);
            cacheDecompressedMap[sid] = decmpdata;
        } else {
            decmpdata = cacheDecompressedMap[sid];
        }

        m = MatchFunctionUtil.scan(decmpdata, patternStr, matchOnDate);
    }

    //let total = StockIDs.getTotalCount();
    let nextsid = StockIDs.getNext(sid);
    let finished = cacheCompressedMap[nextsid] === undefined;
    if (finished) console.log(sid, nextsid, idx)
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
        setTimeout(function () {
            if (stopScanFlag) {
                //stopScanFlag = false;
            } else {
                module.scanByIndex(++idx, patternStr, callback);
            }

        }, 0);
    } else {

    }
}

module.loadStocksPerPage = function loadStocksPerPage(start, count, end, callback) {
    let total = end === null ? StockIDs.getTotalCount() - 1 : end;
    let pageSize = count;
    count = Math.min(count, total - start + 1);
    //console.log("loadStocksDataPage", start, count)
    module.loadStockBatch(start, count, stockFields, function (sids) {
        // console.log(start, count, total)
        if (start + count >= total) {
            callback({
                start: start,
                count: count
            });

            console.log('proxy load per page finished', count, start + count)
        } else {
            callback({
                start: start,
                count: count
            }, false);
            module.loadStocksPerPage(start + count, count, end, callback);
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

    let fulldata = cacheCompressedMap[sid];
    if (!fulldata || fulldata.length === 0) {
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

module.loadStockBatch = function loadStockBatch(start, count, fields, callback) {
    let sids = StockIDs.getIDsByIndex(start, count);

    IO.httpGetStocksCompressedJson(sids, fields.join(), function (json) {

        for (let sid in json.data) {
            cacheCompressedMap[sid] = json.data[sid];
        }

        if (callback) {
            // console.log("loadStockBatch", sids.length, sids[0], sids[sids.length - 1])
            callback(sids);
        }

    });


}


module.buildAnalysisData = function buildAnalysisData(callback) {
    for (let sid in cacheCompressedMap) {
        callback(sid, false);
        if (cacheDecompressedMap[sid]) continue;
        let data = Zip.decompressStockJson(cacheCompressedMap[sid])
        DataBuildPipe.build(0, data.length - 1, data);
        cacheDecompressedMap[sid] = data;
    }

    callback("finished", true);

}

module.scanMatchStatus = function scanMatchStatus(callback) {
    for (let sid in cacheDecompressedMap) {
        let data = cacheDecompressedMap[sid];
        let status = MatchAnalyser.getMatchStatus(data);
        callback({
            sid: sid,
            status: status
        }, false);
    }


}