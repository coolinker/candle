'use strict';
let tools = require('./toolfunctions');
module.exports = class MatchFunctionUtil {
    constructor() { }

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

    static scan(data, functionStr, matchInDay) {
        let matchFun = MatchFunctionUtil.composeFunction(functionStr);
        let cases = 0,
            bull = 0,
            bear = 0;
        if (matchFun) {
            for (let i = 80; i < data.length-20; i++) {
                if (matchFun(data, i)) {
                    let d = data[i];
                    //matchInDay[d.date] = true;

                    data[i].match = {
                        fun: matchFun,
                        result: 0
                    };
                    cases++;
                    let re = data[i].bullbear;
                    if (re > 0) {
                        bull++;
                        matchInDay[d.date] = 1;
                    } else if (re < 0) {
                        bear++;
                        matchInDay[d.date] = -1;
                    } else {
                        matchInDay[d.date] = 0;
                    }

                    data[i].match.result = re;
                } else {
                    delete data[i].match;
                }
            }
        }
        return {
            cases: cases,
            bull: bull,
            bear: bear
        };
    }


    static testBullBear(data, idx) {
        
        let price = data[idx].close,
            almp = tools.priceCRA(data, idx, 5);
        for (let i = idx + 1; i < data.length; i++) {
            let d = data[i];
            if (d.ex) {
                price = price * d.open / data[i - 1].close;
            }
            if ((d.low - price) / price < -3 * almp) return (d.low - price) / price;
            if ((d.high - price) / price > 3 * almp) return (d.high - price) / price;
        }
        return 0;
    }


}