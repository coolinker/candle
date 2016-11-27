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
        let preprice = idx>1?data[idx-1].close:data[idx].open;
        let price = data[idx].close;
        data[idx].inc = (price-preprice)/preprice;
    }

}