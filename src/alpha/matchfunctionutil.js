'use strict';
let tools = {
    priceCR: function(data, n) {
        let base = n === 0 ? data[n.open] : data[n - 1].close;
        return (data[n].close - base) / base;
    },

    diffR: function(val0, val1) {
        return (val1 - val0) / val0;
    },

    priceCRA: function(data, n, period) {
        if (n < period) return null;
        let sum = 0;
        for (let i = n; i > n - period; i--) {
            sum += (data[i].high - data[i].low) / data[i].open;
        }
        return sum / period;
    },

    aboveS: function(data, n, field, period) {
        if (!period) return 0;
        let price = data[n].close;
        let sum = 0;
        for (let i = n; i >= 0 && i > n - period; i--) {
            if ((data[i].high + data[i].low) / 2 < price) continue;
            // console.log(data[i].date, data[i][field])
            sum += data[i][field];
        }

        return sum;
    },

    bellowS: function(data, n, field, period) {
        if (!period) return 0;
        let price = data[n].close;
        let sum = 0;
        for (let i = n; i >= 0 && i > n - period; i--) {
            if ((data[i].high + data[i].low) / 2 >= price) continue;
            sum += data[i][field];
        }
        return sum;
    },

    sum: function(data, n, field, period) {
        if (!period) return 0;
        let sum = 0;
        for (let i = n; i >= 0 && i > n - period; i--) {
            sum += data[i][field];
        }
        return sum;
    }


};

module.exports = class MatchFunctionUtil {
    constructor() {}

    static composeFunction(returnStr) {
        try {
            let funs = 'let dn = d[n];\n';
            for (let att in tools) {
                funs += 'let ' + att + ' = ' + tools[att].toString() + '\n';
            }

            // if (returnStr.indexOf("priceCR") >= 0) {
            //     funs += 'let priceCR = ' + MatchFunctionUtil.priceCR.toString() + '\n';
            // }
            // if (returnStr.indexOf("diffR") >= 0) {
            //     funs += 'let diffR = ' + MatchFunctionUtil.diffR.toString() + '\n';
            // }
            // if (returnStr.indexOf("priceCRA") >= 0) {
            //     funs += 'let priceCRA = ' + MatchFunctionUtil.priceCRA.toString() + '\n';
            // }
            let matchFun = new Function('d', 'n', funs + '\nreturn ' + returnStr);
            return matchFun;
        } catch (e) {
            console.log("e", e);
            return null;
        }
    }

    static scan(data, functionStr, countInDay) {
        let matchFun = MatchFunctionUtil.composeFunction(functionStr);
        let cases = 0,
            bull = 0,
            bear = 0;
        for (let i = 0; i < data.length; i++) {
            if (matchFun(data, i)) {
                let d = data[i];
                if (!countInDay[d.date]) {
                    countInDay[d.date] = 0;
                }
                countInDay[d.date] += 1;

                data[i].match = {
                    fun: matchFun,
                    result: 0
                };
                cases++;
                let re = MatchFunctionUtil.testBullBear(data, i);
                if (re > 0) {
                    bull++;
                } else if (re < 0) {
                    bear++;
                }

                data[i].match.result = re;
            } else {
                delete data[i].match;
            }
        }

        return {
            cases: cases,
            bull: bull,
            bear: bear
        };
    }

    // static isBullBear(data, idx) {
    //     //let re = Math.round(100 * Math.random()) % 2 === 0;
    //     let inc = 0.1,
    //         dec = -0.05,
    //         price = data[idx].close;

    //     for (let i = idx + 1; i < data.length; i++) {
    //         let d = data[i];
    //         if ((d.low - price) / price < dec) return -1;
    //         if ((d.high - price) / price > inc) return 1;
    //     }
    //     return 0;
    // }

    static testBullBear(data, idx) {
        //let re = Math.round(100 * Math.random()) % 2 === 0;
        let inc = 0.1,
            dec = -0.05,
            price = data[idx].close,
            almp = tools.priceCRA(data, idx, 10);
        for (let i = idx + 1; i < data.length; i++) {
            let d = data[i];
            if ((d.low - price) / price < -3 * almp) return (d.low - price) / price;
            if ((d.high - price) / price > 3 * almp) return (d.high - price) / price;
        }
        return 0;
    }
}