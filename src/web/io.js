'use strict';
// import fetch from 'whatwg-fetch';
import Zip from '../alpha/zip';
import NetSumUtil from '../alpha/netsumutil';
import WorkerProxy from './workerproxy';
import StockIDs from './stockids';

class IO {
    constructor() {}
    static sidSuggest(v, callback) {
        let url = 'http://suggest3.sinajs.cn/suggest/type=&key=' + v.toLowerCase() + '&name=suggestdata_' + (new Date().getTime())
        fetch(IO.baseUrl, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: '{"url":"' + url + '", "http": "GET", "action":"thirdPartyAjaxAPI"}'
        }).then(function(res) {
            return res.text();
        }).then(function(text) {
            let result = text.split('"')[1];
            if (result === '') {
                callback([]);
                return;
            }
            let secs = result.split(';');

            let stocks = [];
            for (let i = 0; i < secs.length; i++) {
                let arr = secs[i].split(',')
                stocks.push({
                    sid: arr[3],
                    name: arr[4]
                });

            }
            //console.log("sidSuggest =>", stocks);
            callback(stocks);
        });
    }

    static cacheGetStockJson(sid) {
        return this.cacheMap[sid]
    }

    static setDataWorkers(workers) {
        IO.dataWorkerProxies = [];
        workers.forEach(function(w, idx) {
            IO.dataWorkerProxies.push(new WorkerProxy(w));
        });
    }

    static workersScanByIndex(patternStr, callback) {
        IO.dataWorkerProxies.forEach(function(workerProxy, idx) {
            let params = [IO.workerStarts[idx], patternStr];
            workerProxy.callMethod("scanByIndex", params, function(re) {
                if (re.index % 100 === 0)
                    console.log(idx, re.index, re.finished)
                callback(re);

            });
        });
    }

    static workersStopScanByIndex(callback) {
        IO.dataWorkerProxies.forEach(function(workerProxy, idx) {
            workerProxy.callMethod("stopScanByIndex", [], function(re) {
                callback(re);
            });
        });
    }

    static workerGetStockJson(sid, callback) {
        let params = [sid, ['date', 'open', 'close', 'high', 'low', 'amount', 'netamount', 'r0_net', 'changeratio', 'turnover']];
        let worker = IO.getWorkerBySid(sid);
        worker.callMethod("getStockData", params, function(re) {
            if (re) {
                let dcp = Zip.decompressStockJson(re);
                callback(dcp);
            } else {
                IO.httpGetStockJson(sid, function(json) {
                    callback(json);
                })
            }

        });
    }

    static getWorkerBySid(sid) {
        let idx = StockIDs.idIndexMap[sid];
        let i = 1
        for (; i < IO.workerStarts.length; i++) {
            if (IO.workerStarts[i] > idx) return IO.dataWorkerProxies[i - 1];
        }
        return IO.dataWorkerProxies[i - 1];
    }

    static loadStocksPerPage(callback) {
        let starts = IO.workerStarts = StockIDs.divideToGroups(IO.dataWorkerProxies.length);
        for (let i = 0; i < IO.dataWorkerProxies.length; i++) {
            let start = starts[i];
            let end = i + 1 === starts.length ? null : (starts[i + 1] - 1);
            IO.dataWorkerProxies[i].callMethod("loadStocksPerPage", [start, 100, end], function(result) {
                callback(result);
            })
        }
    }

    static httpGetStockIdsJson(filter, callback) {
        fetch(IO.baseUrl, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: '{"filter":"' + filter + '", "action":"stockIds"}'
        }).then(function(res) {
            return res.json();
        }).then(function(json) {
            console.log("httpGetStockIdsJson =>", json.length);
            callback(json);
        });
    }

    static httpGetStocksCompressedJson(sids, fields, callback) {
        //console.log("--------------httpGetStocksCompressedJson", sids[0], sids.length)
        fetch(IO.baseUrl, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: '{"sids":"' + sids + '", "action":"stocksCompressed", "fields":"' + fields + '"}'
        }).then(function(res) {
            return res.json();
        }).then(function(json) {
            callback(json);
        });
    }


    static httpGetStockJson(sid, callback) {
        console.log("--------------httpGetStockJson", sid)
        fetch(IO.baseUrl, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: '{"sid":"' + sid + '", "action":"stock"}'
        }).then(function(res) {
            return res.json();
        }).then(function(json) {
            IO.cacheMap[sid] = json;
            callback(json);
        });
    }
    static httpGetStockMoneyFlowJson(sid, callback) {
        console.log("--------------httpGetStockMoneyFlowJson", sid)
        fetch(IO.baseUrl, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: '{"sid":"' + sid + '", "action":"stockMoneyFlow"}'
        }).then(function(res) {
            return res.json();
        }).then(function(json) {
            console.log("httpGetStockMoneyFlowJson =>", sid, json.length);
            IO.mergeStockJson(sid, json);
            //IO.cacheMap[sid] = json;
            callback(IO.cacheMap[sid]);
        });
    }

    static mergeStockJson(sid, json) {
        let arr = IO.cacheMap[sid];
        let len = arr.length;
        let jlen = json.length;
        for (let i = 1; i < json.length; i++) {
            if (json[jlen - i].date === arr[len - i].date) {
                Object.assign(arr[len - i], json[jlen - i]);
            } else {
                console.error("date is different", i, sid, json[jlen - i].date, arr[len - i].date);
            }
        }
    }

}

IO.baseUrl = self.location.origin + '/api';
IO.cacheMap = {};
IO.workerStarts = [0];

export default IO