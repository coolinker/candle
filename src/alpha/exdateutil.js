'use strict';

module.exports = class EXDateUtil {
    constructor() {}

    static build(start, end, data) {
        for (let i = start; i <= end; i++) {
            EXDateUtil.buildSingle(i, data);
        }
        return data;
    }

    static buildSingle(idx, data) {
        let obj = data[idx];
        if (obj['ex'] !== undefined || obj['changeratio'] === undefined || idx === 0) return;
        let preclose = data[idx - 1].close;
        let close = obj.close;
        let inc = Math.round(10000 * obj.changeratio);
        let cinc = Math.round(10000 * (close - preclose) / preclose);
        obj.ex = Math.abs(cinc - inc) > 50;
        // if (obj.ex) console.log("-------------------------------ex", cinc, inc, obj.changeratio, (close - preclose) / preclose, data[idx])
    }

}