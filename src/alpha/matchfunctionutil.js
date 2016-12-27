'use strict';
let tools = require('./toolfunctions');
module.exports = class MatchFunctionUtil {
    constructor() { }

    static convertToOrFunctions(objs) {
        let funs = {};
        for (let att in objs) {
            let filters = JSON.parse(objs[att].filters);
            for (let i=0; i< filters.length; i++) {
                funs[objs[att].name+"_"+i] = MatchFunctionUtil.convertToFunction(objs[att], i);
            }
            
        }
        return funs;
    }

    static convertToFunction(obj, filterIdx) {
        let conditions = JSON.parse(obj.conditions);
        let filters = JSON.parse(obj.filters)[filterIdx];
        let conditionStrs = [];
        for (let num in filters) {
            let condition = conditions[num][0];
            let conditionsecs = conditions[num][1];

            let secs = filters[num].secs;
            let secstart, secend;
            let substr = "";
            for (let i = 0; i < secs.length; i++) {
                if (!secstart) {
                    secstart = secs[i];
                    if (secstart > 0) {
                        if (substr) substr += '||';
                        substr += condition + ">=" + conditionsecs[secstart - 1];
                        //conditionStrs.push(condition + ">=" + conditionsecs[secstart - 1]);
                    }
                }
                if (i + 1 < secs.length && secs[i + 1] === secs[i] + 1) continue;
                if (i + 1 === secs.length && secs[i] < conditionsecs.length) {
                    //conditionStrs.push(condition + "<" + conditionsecs[secs[i]]);
                    if (substr) substr += '&&';
                    substr += condition + "<" + conditionsecs[secs[i]];
                } else if (secs[i + 1] > secs[i] + 1) {
                    secstart = undefined;
                    if (substr) substr += '&&';
                    //conditionStrs.push(condition + "<" + conditionsecs[secs[i]]);
                    substr += condition + "<" + conditionsecs[secs[i]];
                }

            }
            if (substr.indexOf('||') > 0) substr = '('+ substr +')';
            conditionStrs.push(substr);    
        }
        
        conditionStrs.push(obj.baseFilter);
        return MatchFunctionUtil.composeFunction(conditionStrs.join("&&"));

    }

    static composeFunction(returnStr) {
        try {
            let funs = 'let dn = d[n];\n';
            for (let att in tools) {
                funs += 'let ' + att + ' = ' + tools[att].toString() + '\n';
            }
            funs += 'if (!dn) debugger;'

            let matchFun = new Function('d', 'n', 'sid', funs + '\nreturn ' + returnStr);
            return matchFun;
        } catch (e) {
            console.log("e", e);
            return null;
        }
    }

    static scan(data, functionStr, matchInDay, options) {
        let matchFuns = (functionStr instanceof Object) ? MatchFunctionUtil.convertToOrFunctions(functionStr) : MatchFunctionUtil.composeFunction(functionStr);
        let cases = 0,
            bull = 0,
            bear = 0;
        if (matchFuns) {
            let i = options.startOffset===undefined? (options.startFrom === undefined ? 0 : options.startFrom): (data.length-options.startOffset);
            let len = data.length - (options.endOffset===undefined ? 0 : options.endOffset)
            for (; i>0 && i < len; i++) {
                if (MatchFunctionUtil.runMatch(matchFuns, data, i, options.sid)) {
                    let d = data[i];
                    //matchInDay[d.date] = true;

                    cases++;
                    let re = d.bullbear;
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

    static runMatch(functions, data, i, sid) {
        
        if (typeof functions == 'function') {
            let fun = functions;
            if (fun(data, i, sid)) {
                data[i].match = {
                    fun: fun,
                    result: 0
                };
                return true;
            }
        } else if (functions instanceof Object) {
            for (let fn in functions) {
                if (functions[fn](data, i, sid)) {
                    data[i].match = {
                        fun: fn,
                        result: 0
                    };
                    return true;
                }
            }
        }
        return false;
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