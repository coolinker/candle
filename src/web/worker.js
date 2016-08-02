'use strict';
import IO from "./io";

module.exports = function (self) {
    self.addEventListener('message',function (ev){
        // var startNum = parseInt(ev.data); // ev.data=4 from main.js

        // setInterval(function () {
        //     var r = startNum / Math.random() - 1;
        //     self.postMessage([ startNum, r]);
        // }, 2000);
        let sid = ev.data;
        IO.httpGetStockJson(sid, function(json) {
            painterCore.loadData(json);
            //painterCore.setDrawRange(json.length-200, json.length-1);
            painterCore.updateDrawPort(date, window.innerWidth);

            IO.httpGetStockMoneyFlowJson(sid, function(json) {
                painterCore.updateMoneyFlow(json);
            })

        });
    });
};