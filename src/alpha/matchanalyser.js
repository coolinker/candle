'use strict';

let conditions = [
    ["dn.ave_close_21/dn.close", [0.9, 1, 1.08,1.15]],
    ["dn.ave_close_8/dn.close", [1.03]],
    ["dn.ave_amount_21/dn.ave_amount_8", [1]],
    ["dn.ave_amount_21/dn.amount", [1.5]],
    ["dn.netsummin_r0_21", [0, 0]],
    ["dn.netsummax_r0_8", [0, 0]],
    ["dn.ave_turnover_8/dn.ave_turnover_21", [1]],
    ["dn.netsum_r0_below/dn.ave_amount_21", [0]],
    ["dn.netsum_r0_below/dn.ave_amount_21", [0.02, 0.04]],
    ["dn.marketCap", [2000000000, 3000000000, 5000000000, 10000000000]]

];

module.exports = class MatchAnalyser {
    constructor() {
        this.matchConditionsCount = conditions.length;
        this.matchConditions = this.composeMatchFunction(conditions);

    }

    C(arr, num) {
        var r = [];
        (function f(t, a, n) {
            if (n == 0) return r.push(t);
            for (var i = 0, l = a.length; i <= l - n; i++) {
                f(t.concat(a[i]), a.slice(i + 1), n - 1);
            }
        })([], arr, num);
        return r;
    }

    CArr(n, r) {
        var arr = [];
        for (var i = 0; i < n; i++) {
            arr.push(i);
        }
        return this.C(arr, r);
    }

    getValueRange(val, ranges, expression) {
        if (isNaN(val)) {
            //console.log(expression)
            return null;
        }
        for (let i = ranges.length - 1; i >= 0; i--) {
            if (val >= ranges[i]) return i + 1;
        }
        return 0;
    }

    composeMatchFunction(conditions) {
        // let dn = d[n];
        // reArr[offset + 0] = this.getValueRange(dn.amount_ave_21 / dn.amount, [1.5]);
        // reArr[offset + 1] = this.getValueRange(dn.netsum_r0_below_60 / dn.amount_ave_21, [0, 0]);

        let funstr = "let dn = d[n];";
        let i = 0
        for (; i < conditions.length; i++) {
            funstr += "arr[offset+" + i + "] = this.getValueRange(" + conditions[i][0] + ", [" + conditions[i][1] + "], '" + conditions[i][0] + "');\n";
        }

        funstr += "arr[offset+" + i + "] = dn.bullbear>=0?Math.ceil(dn.bullbear):Math.floor(dn.bullbear);"
        return new Function('d', 'n', 'arr', 'offset', funstr);

    }

    generateConditionCombinations(buflen, data, sectionBBSum, filterFun, callback) {
        let sublen = this.matchConditionsCount + 1;
        let byteArr = new Int8Array(buflen * sublen);
        let offset = 0;

        let len = data.length;
        for (let i = 0; i < len; i++) {
            let dn = data[i];
            if (!filterFun(dn)) continue;

            this.matchConditions(data, i, byteArr, offset);
            let bb = byteArr[offset + sublen - 1];
            for (let n = 0; n < sublen - 1; n++) {
                let idx = offset + n;
                let sec = byteArr[idx];
                
                if (!sectionBBSum[n]) sectionBBSum[n] = {};
                if (!sectionBBSum[n][sec]) sectionBBSum[n][sec] = {'-1':0, '0':0, '1':0};

                sectionBBSum[n][sec][bb]++;
            }
            offset += sublen;
        }

        return byteArr;

    }

    Arr2Dto1D(arr2d) {
        if (!(arr2d[0] instanceof Int8Array)) return arr2d;
        let len = 0;
        for (let i = 0; i < arr2d.length; i++) {
            len += arr2d[i].length;
        }

        let byteArr = new Int8Array(len);
        let c = 0;
        for (let i = 0; i < arr2d.length; i++) {
            let arr = arr2d[i];
            for (let j = 0; j < arr.length; j++) {
                byteArr[c++] = arr[j];
            }
        }
        return byteArr;

    }


    searchBullConditions(statusArr, bullRate, minNumer, reFilter) {
        statusArr = this.Arr2Dto1D(statusArr);
        console.log("\nsearchBullConditions", statusArr.length);
        let sublen = this.matchConditionsCount + 1;
        let slen = statusArr.length;
        let re = [];
        let remap = {};
        for (let idx = 0; idx < sublen - 1; idx++) {
            if (this.isConditionExisted(idx, reFilter)) continue;
            let subre = [];
            for (let offset = 0; offset < slen; offset += sublen) {
                if (!this.matchFilter(statusArr, offset, reFilter)) continue;
                let bb = statusArr[offset + sublen - 1];
                let sidx = offset + idx;
                let sec = statusArr[sidx];
                if (sec === null) continue;
                if (!subre[sec]) subre[sec] = { '1': 0, '0': 0, '-1': 0 };
                subre[sec][bb]++;
            }

            MatchAnalyser.filterValidRanges(idx, subre, bullRate, minNumer, remap);
            //if (validArr.length>0) re[idx] = validArr;

            console.log("searchBullConditions--------------", idx, JSON.stringify(remap))
        }

        return remap;
    }

    generateSectionStatus(statusArr, filter){
        statusArr = this.Arr2Dto1D(statusArr);
        //console.log("\generateSectionStatus", statusArr.length);
        let sublen = this.matchConditionsCount + 1;
        let slen = statusArr.length;
        let re = [];
        let remap = {};
        for (let idx = 0; idx < sublen - 1; idx++) {
            if (this.isConditionExisted(idx, filter)) continue;
            let subre = [];
            for (let offset = 0; offset < slen; offset += sublen) {
                if (!this.matchFilter(statusArr, offset, filter)) continue;
                let bb = statusArr[offset + sublen - 1];
                let sidx = offset + idx;
                let sec = statusArr[sidx];
                if (sec === null) continue;
                if (!subre[sec]) subre[sec] = { '1': 0, '0': 0, '-1': 0 };
                subre[sec][bb]++;
            }

            remap[idx] = subre;
            //console.log("generateSectionStatus--------------", idx, JSON.stringify(subre))
        }
        //console.log("generateSectionStatus--------------", JSON.stringify(remap))
        
        return remap;
    }
    
    static cloneFilters(filters){
        let str = JSON.stringify(filters);
        let arr = JSON.parse(str);
        for (let i=0;i<arr.length; i++) {
            if (arr[i] === null && filters[i] === undefined) arr[i] = undefined;
        }
        return arr;
    }

    static isSubSections(sec0, sec1, seperator){
        let arr0 = sec0.split(seperator);
        let arr1 = sec1.split(seperator);
        for (let i=0; i<arr0.length; i++) {
            if (arr1.indexOf(arr0[i])<0) return false;  
        }

        return true;

    }
    
    static rangesObjToArr2D(ranges){
        let att2d = [];
        for (let idx in ranges) {
            let idxobj = ranges[idx];
            for (let secs in idxobj) {
                att2d.push([idx, secs.split('_').map(Number),idxobj[secs]]);
            }
        }
        return att2d;
    }

    static filterValidRanges(idx, secBullBearMap, bullrate, minNumber, remap) {
        idx = Number(idx);
        let re = { '1': 0, '0': 0, '-1': 0 };
        let arr = [];
        for (let sec in secBullBearMap) {
            arr.push(sec);
        }
        arr.sort(function (v0, v1) {
            let bbo_0 = secBullBearMap[v0];
            let r_0 = bbo_0['1'] / (bbo_0['1'] + bbo_0['0'] + bbo_0['-1']);

            let bbo_1 = secBullBearMap[v1];
            let r_1 = bbo_1['1'] / (bbo_1['1'] + bbo_1['0'] + bbo_1['-1']);
            if (r_0 > r_1) return -1;
            if (r_0 === r_1) return 0;
            if (r_0 < r_1) return 1;


        })

        let validarr = [];
        let sumobj = { '1': 0, '0': 0, '-1': 0 };
        let rekey;
        for (let i = 0; i < arr.length; i++) {
            let sec = arr[i];

            let badflag = false;
            let bbo = secBullBearMap[sec];

            let sumr = (sumobj['1'] + bbo['1']) / (sumobj['1'] + sumobj['0'] + sumobj['-1'] + bbo['1'] + bbo['0'] + bbo['-1']);
            if (sumr >= bullrate) {
                if (rekey === undefined) rekey = '' + sec;
                else {
                    rekey += '_' + sec;
                }

                let bull = sumobj['1'] += bbo['1'];
                let pending = sumobj['0'] += bbo['0'];
                let bear = sumobj['-1'] += bbo['-1'];

                if (bull + pending + bear < minNumber) badflag = true;

                for (let att_idx in remap) {
                    if (badflag) break;

                    let idxmap = remap[att_idx];
                    for (let att_secs in idxmap) {
                        if (Number(att_idx) === idx && MatchAnalyser.isSubSections(att_secs, rekey, '_')) {
                            //console.log("filterValidRanges delete sub sections", att_idx, att_secs, rekey);
                            delete idxmap[att_secs];
                            continue;
                        }

                        let secsobj = idxmap[att_secs];
                        let b = secsobj['1'];
                        let r = b / (secsobj['1'] + secsobj['0'] + secsobj['-1']);
                        if (bull > b && sumr > r) {
                            //console.log("filterValidRanges delete", att_idx, att_secs, idxmap[att_secs])
                            delete idxmap[att_secs];

                        } else if (b > bull && r > sumr) {
                            badflag = true;
                            break;
                        }

                    }

                }

                if (!badflag) {
                    if (!remap[idx]) remap[idx] = {};
                    rekey = rekey.split('_').sort().join('_');
                    remap[idx][rekey] = {
                        '1': bull,
                        '0': pending,
                        '-1': bear
                    }

                    //console.log("filterValidRanges add", idx, rekey, sumr, bullrate, remap[idx][rekey])
                } else {
                    //console.log("badflag true", idx, rekey);
                }

            } else {
                //console.log("invalid sec", idx, sec, sumr);
            }
        }


    }

    /* 
        {
         0:{
             1:{'1':
                    '0':
                    '-1':
                }
            1_2:{'1':
                    '0':
                    '-1':
                }  
         }
    
        }
    */

    isConditionExisted(idx, filter) {
        return filter[idx] !== undefined && filter[idx].length === 1
    }

    matchFilter(statusArr, offset, filter) {

        for (let i = 0; i < filter.length; i++) {
            if (!filter[i]) continue;
            let subidx = i;
            let subvals = filter[i];
            let v = statusArr[offset + subidx];
            if (subvals.indexOf(v) < 0) return false;
        }

        return true;

    }

    // simplifyConditionCombinations(statusArr, conditionNumber) {
    //     let carr = this.CArr(this.matchConditionsCount, conditionNumber);
    //     let slen = statusArr.length;
    //     let sublen = this.matchConditionsCount + 1;
    //     let offset = 0;
    //     let statusObj = {};

    //     for (let i = 0; i < carr.length; i++) {
    //         let arr = carr[i];
    //         for (let j = 0; j < slen; j += offset) {
    //             let str_cc = "";
    //             for (let n = 0; n < arr.length; n++) {
    //                 str_cc += n;
    //                 str_cc += statusArr[j + arr[n]];
    //             }
    //             if (!statusObj[str_cc]) {
    //                 statusObj[str_cc] = { '0': 0, '1': 0, '-1': 0 };
    //             }
    //             let bb = statusArr[j + offset - 1];
    //             statusObj[str_cc][bb]++;

    //         }

    //     }

    //     return statusObj;
    // }



}