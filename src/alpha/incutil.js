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
        let preprice;     
        if (idx>1) {
            preprice = data[idx-1].close;
            if (data[idx].ex) {
                preprice = data[idx].open;
            }
        } else {
            preprice = data[idx].open;
        }
        

        let price = data[idx].close;
        data[idx].inc = Math.abs((price-preprice)/preprice);
    }

}