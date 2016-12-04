'use strict';
// import fetch from 'whatwg-fetch';
import Zip from '../alpha/zip';
import MatchAnalyser from '../alpha/matchanalyser';
import NetSumUtil from '../alpha/netsumutil';
import WorkerProxy from './workerproxy';
import StockIDs from './stockids';
import IO from './io';
import LocalStoreUtil from './localstoreutil';
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

    static addFootprint(filters, history) {
        let print = false;
        let printobj;
        for (let i = 0; i < filters.length; i++) {
            if (filters[i]) {
                let key = i + "_" + filters[i].join("_");
                printobj = history[key];
                if (!printobj) {
                    history = history[key] = {};
                    print = true;
                } else {
                    history = printobj;
                }
            }

        }

        //if (print) console.log("footprint***add",print, hh, JSON.stringify(filters))
        return print;
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
                            MatchAnalyser.filterValidRanges(idxatt, secs, WorkerGroup.increaseRate(rate), WorkerGroup.casesMinNumber, obj);
                            //console.log("-------------------", JSON.stringify(obj));
                        }

                        let arr2d = MatchAnalyser.rangesObjToArr2D(obj);
                        let filter0 = arr2d[0];

                        let filter0obj = obj[filter0[0]][filter0[1].join('_')];
                        let nextrate = filter0obj['1'] / (filter0obj['-1'] + filter0obj['0'] + filter0obj['1']);
                        let filters = [];
                        filters[filter0[0]] = filter0[1];
                        let footprint = {};
                        let bullfilters = [];
                        WorkerGroup.callCounter = 0;
                        WorkerGroup.workersAnalyseBullConditions(filters, [arr2d], footprint, function (cbfilters, cbcandidatefilters, isbull) {
                            if (isbull) bullfilters.push(MatchAnalyser.cloneFilters(cbfilters));
                            // console.log("roll candidate filters:", JSON.stringify(cbfilters), "*********", cbcandidatefilters.length, JSON.stringify(cbcandidatefilters));
                            let candidateFiltersNext;
                            do {
                                candidateFiltersNext = cbcandidatefilters[cbcandidatefilters.length - 1];
                                let prefilter = candidateFiltersNext.shift();
                                if (candidateFiltersNext._replacement) {
                                    cbfilters[prefilter[0]] = candidateFiltersNext._replacement;
                                    delete candidateFiltersNext._replacement;
                                } else {
                                    delete cbfilters[prefilter[0]];
                                }

                                
                                if(candidateFiltersNext.length === 0 && cbcandidatefilters.pop()) {
                                    if (cbcandidatefilters.length === 0){
                                        let alphaObj = MatchAnalyser.outputFilters(bullfilters, patternStr, WorkerGroup.casesMinNumber);
                                        console.log("call counter:", WorkerGroup.callCounter, bullfilters.length, alphaObj)
                                        LocalStoreUtil.addToStore("alphaObj", alphaObj);
                                        IO.httpSaveBullFilters(alphaObj, function(re){
                                            console.log("-----------------finished:", re);
                                        })
                                        return;
                                    } 
                                } else {
                                    let nxtfilter = candidateFiltersNext[0];
                                    cbfilters[nxtfilter[0]] = nxtfilter[1];
                                }

                            } while (!WorkerGroup.addFootprint(cbfilters, footprint));

                            // console.log("cbcandidatefilters length", cbcandidatefilters.length, JSON.stringify(cbfilters))



                        });

                        callback(matchSum);


                    }
                });
            });


        });

    }

    static workersAnalyseBullConditions(filters, candidateFilters, footprint, doStepBack) {
        WorkerGroup.callCounter++;
        if (candidateFilters.length === 0) return;
        // if (!WorkerGroup.addFootprint(filters, footprint)) {
        //     callback(filters, candidateFilters);
        //     WorkerGroup.workersAnalyseBullConditions(filters, candidateFilters, footprint, callback);
        //     return;
        // }
        let candidateFiltersNext = candidateFilters[candidateFilters.length - 1];
        
        // debugger;
        let nxtfilter = candidateFiltersNext[0];
        let bbobj = nxtfilter[1]._counters;

        let rate = bbobj['1'] / (bbobj['-1'] + bbobj['0'] + bbobj['1']);

        if (rate >= 0.8) {
            //debugger;
            console.log("bull------------", rate, JSON.stringify(filters), bbobj['1'], filters);
            doStepBack(filters, candidateFilters, true);
            WorkerGroup.workersAnalyseBullConditions(filters, candidateFilters, footprint, doStepBack);
            return;
        }

        let finishedCount = 0;
        let sectionBBSum = {};
        // console.log("\n-->>", rate, JSON.stringify(filters), '*********', candidateFilters.length, JSON.stringify(candidateFilters));
 
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
                    let nextrate = WorkerGroup.increaseRate(rate);
                    for (let idxatt in sectionBBSum) {
                        let secs = sectionBBSum[idxatt];
                        MatchAnalyser.filterValidRanges(idxatt, secs, nextrate, WorkerGroup.casesMinNumber, validranges);
                    }

                    let candidateFiltersNext = MatchAnalyser.rangesObjToArr2D(validranges);
                    if (candidateFiltersNext.length === 0) {
                        //debugger;
                        console.log("<<-- bear*******no further filters", rate,nextrate, JSON.stringify(filters), '\n');
                        //callback(filters, rate);
                        doStepBack(filters, candidateFilters);
                        WorkerGroup.workersAnalyseBullConditions(filters, candidateFilters, footprint, doStepBack);
                        return;
                    }

                    let nextfilter = candidateFiltersNext[0];
                    let nextfilterobj = validranges[nextfilter[0]][nextfilter[1].join('_')];
                    nextrate = nextfilterobj['1'] / (nextfilterobj['-1'] + nextfilterobj['0'] + nextfilterobj['1']);
                    //let nextfilters = filters;//MatchAnalyser.cloneFilters(filters);
                    if (filters[nextfilter[0]]) {
                        candidateFiltersNext._replacement = filters[nextfilter[0]];
                    }

                    filters[nextfilter[0]] = nextfilter[1];
                    candidateFilters.push(candidateFiltersNext);
                    if (!WorkerGroup.addFootprint(filters, footprint)) {
                        doStepBack(filters, candidateFilters);
                    } 
                    
                    WorkerGroup.workersAnalyseBullConditions(filters, candidateFilters, footprint, doStepBack);
                }
            });


        });

    }

    static increaseRate(rate){
        if (rate<0.6) rate += 0.03;
        else if (rate<0.7) rate += 0.02;
        else if (rate<0.79) rate += 0.02;
        else rate += 0.01;
        return rate;
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
WorkerGroup.casesMinNumber = 13000;
WorkerGroup.callCounter = 0;
export default WorkerGroup;