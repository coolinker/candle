'use strict';

module.exports = class MatchFunctionUtil {
    constructor() {}

    static composeFunction(returnStr) {
        try {
            let matchFun = new Function('data', 'n', 'return ' + returnStr);
            return matchFun;
        } catch (e) {
            console.log("e", e);
            return null;
        }
    }

    static scan(data, functionStr) {
        let matchFun = MatchFunctionUtil.composeFunction(functionStr);
        let cases = 0,
            match = 0;
        for (let i = 0; i < data.length; i++) {
            if (matchFun(data, i)) {
                data[i].match = {
                    fun: matchFun,
                    result: 0
                };
                cases++;
                let re = MatchFunctionUtil.isBullCase(data, i);
                if (re === 1) {
                    match++;
                }

                data[i].match.result = re;
            } else {
                delete data[i].match;
            }
        }

        return {
            cases: cases,
            match: match
        };
    }

    static isBullCase(data, idx) {
        //let re = Math.round(100 * Math.random()) % 2 === 0;
        let inc = 0.1,
            dec = -0.05,
            price = data[idx].close;

        for (let i = idx + 1; i < data.length; i++) {
            let d = data[i];
            if ((d.low - price) / price < dec) return -1;
            if ((d.high - price) / price > inc) return 1;
        }
        return 0;
    }
}