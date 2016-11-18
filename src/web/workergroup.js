'use strict';
// import fetch from 'whatwg-fetch';
import Zip from '../alpha/zip';
import MatchAnalyser from '../alpha/matchanalyser';
import NetSumUtil from '../alpha/netsumutil';
import WorkerProxy from './workerproxy';
import StockIDs from './stockids';
import IO from './io';

class WorkerGroup {
    constructor() { }
    static setDataWorkers(workers) {
        WorkerGroup.dataWorkerProxies = [];
        workers.forEach(function (w, idx) {
            WorkerGroup.dataWorkerProxies.push(new WorkerProxy(w));
        });
    }

    static workersStopScanByIndex(callback) {
        WorkerGroup.dataWorkerProxies.forEach(function (workerProxy, idx) {
            workerProxy.callMethod("stopScanByIndex", [], function (re) {
                callback(re);
            });
        });
    }


    static workersBuildAndAnalyse(patternStr, callback) {
        let finishedCount = 0;
        let matchSum = { bull: 0, bear: 0, cases: 0 };
        let sectionBBSum = {};
        WorkerGroup.dataWorkerProxies.forEach(function (workerProxy, idx) {
            workerProxy.callMethod("reset", [], function (re) {
                let params = [patternStr];
                workerProxy.callMethod("buildForAnalysis", params, function (re) {
                    if (re.finished) {
                        finishedCount++;
                        let m = re.matchSum;
                        matchSum.bull += m.bull;
                        matchSum.bear += m.bear;
                        matchSum.cases += m.cases;
                        let bbs = re.sectionBBSum;

                        for (let att in bbs) {
                            if (!sectionBBSum[att]) sectionBBSum[att] = {};
                            let subobj = bbs[att];
                            for (let satt in subobj) {
                                if (!sectionBBSum[att][satt]) sectionBBSum[att][satt] = { '-1': 0, '0': 0, '1': 0 };
                                sectionBBSum[att][satt]['-1'] += subobj[satt]['-1'];
                                sectionBBSum[att][satt]['0'] += subobj[satt]['0'];
                                sectionBBSum[att][satt]['1'] += subobj[satt]['1'];
                            }
                        }

                        console.log("buildForAnalysis finished", m, matchSum, JSON.stringify(sectionBBSum[0]))

                    }

                    if (finishedCount === WorkerGroup.dataWorkerProxies.length) {
                        let rate = matchSum.bull / matchSum.cases;
                        console.log("buildForAnalysis all finished", JSON.stringify(sectionBBSum))
                        let obj = {};
                        for (let idxatt in sectionBBSum) {
                            let secs = sectionBBSum[idxatt];

                            MatchAnalyser.filterValidRanges(idxatt, secs, rate + 0.01, 10000, obj);
                            console.log("-------------------", JSON.stringify(obj));
                        }

                        let arr2d = MatchAnalyser.rangesObjToArr2D(obj);
                        let filter0 = arr2d[0];

                        let filter0obj = obj[filter0[0]][filter0[1].join('_')];
                        let nextrate = filter0obj['1'] / (filter0obj['-1'] + filter0obj['0'] + filter0obj['1']);
                        let filters = [];
                        filters[filter0[0]] = filter0[1];
                        let minNumber = 10000;
                        WorkerGroup.workersAnalyseBullConditions(nextrate + 0.01, minNumber, filters, arr2d, function (resultfilters, resultrate) {
                            console.log("bull------------",resultrate, JSON.stringify(resultfilters));
                        
                        });

                        callback(matchSum);


                    }
                });
            });


        });

    }

    static workersAnalyseBullConditions(rate, minNumber, filters, candidateFilters, callback) {

        if (rate >= 0.8) {
            debugger;
            console.log("bull------------", rate, JSON.stringify(filters));
            callback(filters, rate);
            return;
        }

        let finishedCount = 0;
        let sectionBBSum = {};
        console.log("workersAnalyseBullConditions************************", rate, filters)
        WorkerGroup.dataWorkerProxies.forEach(function (workerProxy, idx) {
            let params = [filters];

            workerProxy.callMethod("generateSectionStatus", params, function (sectionStatus) {

                finishedCount++;

                for (let idx in sectionStatus) {
                    if (!sectionBBSum[idx]) sectionBBSum[idx] = {};
                    let subobj = sectionStatus[idx];
                    for (let sec in subobj) {
                        if (!sectionBBSum[idx][sec]) sectionBBSum[idx][sec] = { '-1': 0, '0': 0, '1': 0 };
                        sectionBBSum[idx][sec]['-1'] += subobj[sec]['-1'];
                        sectionBBSum[idx][sec]['0'] += subobj[sec]['0'];
                        sectionBBSum[idx][sec]['1'] += subobj[sec]['1'];
                    }
                }
                //console.log("workersAnalyseBullConditions--------------finishedCount", finishedCount, JSON.stringify(sectionBBSum));
                if (finishedCount === WorkerGroup.dataWorkerProxies.length) {
                    let validranges = {};
                    let nextrate = rate + 0.01;
                    for (let idxatt in sectionBBSum) {
                        let secs = sectionBBSum[idxatt];
                        MatchAnalyser.filterValidRanges(idxatt, secs, nextrate, minNumber, validranges);
                    }

                    let candidateFiltersNext = MatchAnalyser.rangesObjToArr2D(validranges);
                    if (candidateFiltersNext.length === 0) {
                        debugger;
                        console.log("bear*******no further filters");
                        callback(filters, rate);
                        return;
                    }

                    let nextfilter = candidateFiltersNext[0];
                    let nextfilterobj = validranges[nextfilter[0]][nextfilter[1].join('_')];
                    nextrate = nextfilterobj['1'] / (nextfilterobj['-1'] + nextfilterobj['0'] + nextfilterobj['1']);
                    let nextfilters = MatchAnalyser.cloneFilters(filters);
                    nextfilters[nextfilter[0]] = nextfilter[1];
                    WorkerGroup.workersAnalyseBullConditions(nextrate, minNumber, nextfilters, candidateFiltersNext, function(validfilters, rate){
                        let prefilter = candidateFilters.shift();
                        delete filters[prefilter[0]];
                        console.log("candidateFilters length", candidateFilters.length)
                        if (candidateFilters.length > 0) {
                            let nxtfilter = candidateFilters[0];
                            filters[nxtfilter[0]] = nxtfilter[1];
                            WorkerGroup.workersAnalyseBullConditions(nextrate, minNumber, filters, candidateFilters, callback);

                        } else {
                            debugger;
                            callback(filters, rate);
                        } 

                    });
                



                }
            });


        });

    }


    static workersScanByIndex(patternStr, callback) {
        WorkerGroup.dataWorkerProxies.forEach(function (workerProxy, idx) {
            workerProxy.callMethod("reset", [], function (re) {

                let params = [WorkerGroup.workerStarts[idx], patternStr];
                workerProxy.callMethod("scanByIndex", params, function (re) {
                    callback(re);

                });
            });


        });
    }

    static workerGetStockJson(sid, callback) {
        let fields = ['date', 'open', 'close', 'high', 'low', 'amount', 'netamount', 'r0_net', 'changeratio', 'turnover'];
        let params = [sid, fields];
        let worker = WorkerGroup.getWorkerBySid(sid);
        worker.callMethod("getStockData", params, function (re) {
            if (re) {
                let dcp = Zip.decompressStockJson(re);
                callback(dcp);
            } else {
                IO.httpGetStockCompressedJson(sid, fields, function (cmpr) {
                    //callback(json);
                    let dcp = Zip.decompressStockJson(cmpr);
                    callback(dcp);
                })
            }

        });
    }

    static getWorkerBySid(sid) {
        let idx = StockIDs.idIndexMap[sid];
        let i = 1
        for (; i < WorkerGroup.workerStarts.length; i++) {
            if (WorkerGroup.workerStarts[i] > idx) return WorkerGroup.dataWorkerProxies[i - 1];
        }
        return WorkerGroup.dataWorkerProxies[i - 1];
    }

    static loadStocksPerPage(callback) {
        let starts = WorkerGroup.workerStarts = StockIDs.divideToGroups(WorkerGroup.dataWorkerProxies.length);
        for (let i = 0; i < WorkerGroup.dataWorkerProxies.length; i++) {
            let start = starts[i];
            let end = i + 1 === starts.length ? null : (starts[i + 1] - 1);
            WorkerGroup.dataWorkerProxies[i].callMethod("loadStocksPerPage", [start, 100, end], function (result) {
                callback(result);
            })
        }
    }

}

WorkerGroup.workerStarts = [0];

export default WorkerGroup;