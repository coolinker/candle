'use strict';
let DataBuilder = require('./DataBuilder');
let dataBuilder = new DataBuilder();
let dateStr = '08/23/2016';
// dataBuilder.updateStockJson("SZ399001", new Date("06/24/2016"), function(len) {
//     console.log("00000", len)
// });
//dataBuilder.buildStockJson("SH600000");

// dataBuilder.updateStockMoneyFlow("SH600000", new Date('06/24/2016'), function(sid, len) {
//     console.log("updateStockMoneyFlow sid", sid, len)
// });


// dataBuilder.updateJson(new Date(dateStr), 0, function(idx, count) {
// console.log("finished updateJson => updateMoneyFlow", idx, count)
dataBuilder.updateMoneyFlow(2850, new Date(dateStr), function(end) {
    console.log("updateMoneyFlow => updateMarketMoneyFlow", end);
    dataBuilder.updateMarketMoneyFlow(new Date(dateStr));
});
// });