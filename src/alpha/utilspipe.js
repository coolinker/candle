'use strict';
let EXDateUtil = require('./exdateutil');
let MovingAverageUtil = require('./movingaverageutil');
let NetSumUtil = require('./netsumutil');
module.exports = class UtilsPipe {
    constructor() {

    }

    static build(start, end, data) {

        for (let i = start; i <= end; i++) {
            NetSumUtil.buildSingle(i, 250, data);
            EXDateUtil.buildSingle(i, data);
            MovingAverageUtil.buildSingle(i, 8, data, 'close');
            MovingAverageUtil.buildSingle(i, 13, data, 'close');
            MovingAverageUtil.buildSingle(i, 21, data, 'close');
            MovingAverageUtil.buildSingle(i, 55, data, 'close');
            MovingAverageUtil.buildSingle(i, 8, data, 'amount');
            MovingAverageUtil.buildSingle(i, 13, data, 'amount');
            MovingAverageUtil.buildSingle(i, 21, data, 'amount');
            MovingAverageUtil.buildSingle(i, 55, data, 'amount');
            // if (data[i].date === '07/21/2016') console.log("-------------------", data[i])
        }

        return data;
    }

}