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
                        let minNumber = 10000;
                        console.log("buildForAnalysis all finished", JSON.stringify(sectionBBSum))
                        let obj = {};
                        for (let idxatt in sectionBBSum) {
                            let secs = sectionBBSum[idxatt];

                            MatchAnalyser.filterValidRanges(idxatt, secs, rate + 0.02, minNumber, obj);
                            console.log("-------------------", JSON.stringify(obj));
                        }

                        let arr2d = MatchAnalyser.rangesObjToArr2D(obj);
                        let filter0 = arr2d[0];

                        let filter0obj = obj[filter0[0]][filter0[1].join('_')];
                        let nextrate = filter0obj['1'] / (filter0obj['-1'] + filter0obj['0'] + filter0obj['1']);
                        let filters = [];
                        filters[filter0[0]] = filter0[1];

                        WorkerGroup.workersAnalyseBullConditions(minNumber, filters, [arr2d], function (cbfilters, cbcandidatefilters) {
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


                            } while (candidateFiltersNext.length === 0 && cbcandidatefilters.pop() && cbcandidatefilters.length > 0);


                            if (candidateFiltersNext && candidateFiltersNext.length > 0) {
                                let nxtfilter = candidateFiltersNext[0];
                                cbfilters[nxtfilter[0]] = nxtfilter[1];
                            }

                            // console.log("cbcandidatefilters length", cbcandidatefilters.length, JSON.stringify(cbfilters))



                        });

                        callback(matchSum);


                    }
                });
            });


        });

    }

    static workersAnalyseBullConditions(minNumber, filters, candidateFilters, callback) {
        if (candidateFilters.length === 0) return;

        let candidateFiltersNext = candidateFilters[candidateFilters.length - 1];
        let nxtfilter = candidateFiltersNext[0];
        if (!nxtfilter) debugger;
        let bbobj = nxtfilter[2];

        let rate = bbobj['1'] / (bbobj['-1'] + bbobj['0'] + bbobj['1']);

        if (rate >= 0.8) {
            //debugger;
            console.log("bull------------", rate, JSON.stringify(filters));
            callback(filters, candidateFilters);
            WorkerGroup.workersAnalyseBullConditions(minNumber, filters, candidateFilters, callback);
            return;
        }

        let finishedCount = 0;
        let sectionBBSum = {};
        // console.log("\n-->>", rate, JSON.stringify(filters), '*********', candidateFilters.length, JSON.stringify(candidateFilters));
        //console.trace();
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
                    let nextrate = rate + 0.02;
                    for (let idxatt in sectionBBSum) {
                        let secs = sectionBBSum[idxatt];
                        MatchAnalyser.filterValidRanges(idxatt, secs, nextrate, minNumber, validranges);
                    }

                    let candidateFiltersNext = MatchAnalyser.rangesObjToArr2D(validranges);
                    if (candidateFiltersNext.length === 0) {
                        //debugger;
                        console.log("<<-- bear*******no further filters", rate, JSON.stringify(filters), '\n');
                        //callback(filters, rate);
                        callback(filters, candidateFilters);
                        WorkerGroup.workersAnalyseBullConditions(minNumber, filters, candidateFilters, callback);
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
                    WorkerGroup.workersAnalyseBullConditions(minNumber, filters, candidateFilters, /*function (cbfilters, cbcandidatefilters) {
                        let candidateFiltersNext = cbcandidatefilters[cbcandidatefilters.length - 1];
                        let prefilter = candidateFiltersNext.shift();
                        if (candidateFiltersNext._replacement) {
                            cbfilters[prefilter[0]] = candidateFiltersNext._replacement;
                            delete candidateFiltersNext._replacement;
                        } else {
                            delete cbfilters[prefilter[0]];
                        }
                        console.log("cbcandidatefilters length", cbcandidatefilters.length, JSON.stringify(cbfilters))
                        if (candidateFiltersNext.length > 0) {
                            let nxtfilter = candidateFiltersNext[0];
                            cbfilters[nxtfilter[0]] = nxtfilter[1];
                            let bbobj = nxtfilter[2];
                            let nxtrate = bbobj['1'] / (bbobj['-1'] + bbobj['0'] + bbobj['1']);
                            WorkerGroup.workersAnalyseBullConditions(nxtrate, minNumber, cbfilters, cbcandidatefilters, callback);

                        } else {
                            //debugger;
                            cbcandidatefilters.pop();
                            let candidateFiltersNext = cbcandidatefilters[cbcandidatefilters.length - 1];
                            let nxtfilter = candidateFiltersNext[0];
                            cbfilters[nxtfilter[0]] = nxtfilter[1];
                            let bbobj = nxtfilter[2];
                            let nxtrate = bbobj['1'] / (bbobj['-1'] + bbobj['0'] + bbobj['1']);
                            console.log("<<--", nxtrate, JSON.stringify(cbfilters), '\n')
                            // callback(cbfilters, cbcandidatefilters);
                            WorkerGroup.workersAnalyseBullConditions(nxtrate, minNumber, cbfilters, cbcandidatefilters, callback);
                        }

                    }*/callback);




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