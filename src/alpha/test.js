'use strict';
let DataBuilder = require('./DataBuilder');
let dataBuilder = new DataBuilder();
dataBuilder.updateStockJson("SZ399001", new Date("06/24/2016"), function(len) {
    console.log("00000", len)
});
//dataBuilder.buildStockJson("SH600000");
//dataBuilder.updateJson(new Date('06/24/2016'), 0);

// dataBuilder.updateStockMoneyFlow("SH600000", new Date('06/24/2016'), function(sid, len){
//     console.log("updateStockMoneyFlow sid", sid, len)
// });
// dataBuilder.updateMoneyFlow(0, new Date('06/24/2016'), function(sid, len){
//     console.log("sid", sid, len)
// });