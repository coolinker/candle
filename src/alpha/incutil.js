'use strict';

module.exports = class IncUtil {
    constructor() { }

    static build(start, end, data) {
        for (let i = start; i <= end; i++) {
            IncUtil.buildSingle(i, data);
        }
        return data;
    }


    static buildSingle(idx, data) {
        let preprice = data[idx-1].close;
        let price = data[idx].close;
        data.inc = (price-preprice)/preprice;
    }

}