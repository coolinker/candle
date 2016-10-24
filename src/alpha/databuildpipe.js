'use strict';
let EXDateUtil = require('./exdateutil');
let MovingAverageUtil = require('./movingaverageutil');
let NetSumUtil = require('./netsumutil');
let BullBearUtil = require('./bullbearutil');
module.exports = class DataBuildPipe {
    constructor() {

    }

    static build(start, end, data) {

        for (let i = start; i <= end; i++) {
            BullBearUtil.buildSingle(i, data)
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

            MovingAverageUtil.buildSingle(i, 8, data, 'turnover');
            MovingAverageUtil.buildSingle(i, 13, data, 'turnover');
            MovingAverageUtil.buildSingle(i, 21, data, 'turnover');
            // if (data[i].date === '07/21/2016') console.log("-------------------", data[i])
        }

        return data;
    }

}