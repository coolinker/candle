'use strict';
import IO from './io';
import StockIDs from './stockids';

let stockFields = ['date', 'open', 'close', 'high', 'low', 'amount', 'netamount', 'r0_net', 'changeratio'];
let cacheMap = {};

module.exports = function(self) {
    let me = this;
    self.addEventListener('message', function(ev) {
        console.log("--------------------------worker", ev.data)
        let mn = ev.data['methodName'];
        //console.log("worker on message", mn, module[mn]);
        let params = ev.data['params'];
        params.push(function(result) {
            self.postMessage({
                mkey: ev.data.mkey,
                result: result
            });
        })
        module[mn].apply(me, params)
            // IO.httpGetStockJson(sid, function(json) {
            //     self.postMessage();
            // });
    });

};

module.loadStocksDataPage = function loadStocksDataPage(start, count, callback) {
    let total = StockIDs.getTotalCount();
    let pageSize = count;
    count = Math.min(50, total - start);
    loadStocksData(start, count, stockFields, function() {
        if (start + count >= total) {
            callback(start + count);
        } else {
            loadStocksDataPage(start + count, count, callback);
        }
    })
}

module.getStockData = function getStockData(sid, fields, callback) {
    let fm = {};
    for (let i = 0; i < fields.length; i++) {
        let f = fields[i];
        for (let j = 0; j < stockFields.length; j++) {
            if (stockFields[j] === f) fm[j] = true;
        }
    }
    let fulldata = cacheMap[sid];
    let data = [];
    let r = stockFields.length;
    for (let i = 0; i < fulldata.length; i++) {
        let idx = i % r;
        if (fm[idx]) {
            data.push(fulldata[i]);
        }

    }

    callback({
        fields: fields,
        data: data
    });
}

module.loadStocksData = function loadStocksData(start, count, callback) {
    let sids = StockIDs.getIDsByIndex(start, count);
    IO.httpGetStocksCompressedJson(sids, stockFields.join(), function(json) {
        //console.log("loadStocksData", sids.length, sids[0], sids[sids.length - 1])
        for (let sid in json.data) {
            cacheMap[sid] = json.data[sid];
        }

        if (callback) {
            callback(sids);
        }

    });
}