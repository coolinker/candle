'use strict';

module.exports = class DataBuilder {
    constructor() {
        this.dataSourceRoot = "../../datasource";
        let DataSourceIO = require('./DataSourceIO');
        this.dataSourceIO = new DataSourceIO();
    }

    buildBaseToJson(){
        let ids = this.dataSourceIO.allStockIDArray;
        for (let i=0; i<ids.length; i++) {
            this.buildStockJson(ids[i]);
            // let jsondata = this.dataSourceIO.readBaseSync(ids[i]);
            // this.dataSourceIO.writeJsonSync(ids[i], jsondata);
        }
    }

    buildStockJson(sid){
        let jsondata = this.dataSourceIO.readBaseSync(sid);
        this.dataSourceIO.writeJsonSync(sid, jsondata);
    }

    updateJson(startDate, index) {
        if (index === undefined) index = 0;
        if (startDate === undefined) {
            startDate = new Date();
            startDate.setHours(0,0,0,0);
        }

        let ids = this.dataSourceIO.allStockIDArray;
        let len = ids.length;
        let me = this;
        this.updateStockJson(ids[index], startDate, function(updatedCount) {
            console.log("updateJson", index, ids[index], updatedCount);
            index = updatedCount===null ? index: (index+1);
            if (index < len) me.updateJson(startDate, index)
        })
    }

    updateStockJson(sid, startDate, callback) {
        let me = this;
        this.dataSourceIO.httpGetStockHistory(sid, function(items) {
            if (items===null) {
                callback(null);
                return;
            }

            if (items.length === 0) {
                callback(0);
                return;
            }

            let firstday = new Date(items[items.length-1].date);
            if (startDate < firstday) startDate = firstday;
            
            let jsondata = me.dataSourceIO.readJsonSync(sid);             
            let len = jsondata.length;

            for (let i = len-1; i>=0; i--) {
                let d = new Date(jsondata[i].date);
                if (startDate <= d) jsondata.pop();
            }
            len = jsondata.length;
            let lday = new Date(len>0 ? jsondata[len-1].date:0);
            for (let i=items.length-1; i>=0; i--) {
                let d = new Date(items[i].date);
                if (lday < d) jsondata.push(items[i]);
            }
            if (jsondata.length-len > 0) {
                me.dataSourceIO.writeJsonSync(sid, jsondata);    
            }
            
            callback(jsondata.length-len);
        });

    }


    updateMoneyFlow(index, startDate, callback) {
        console.log("index:", index, new Date())
        let ids = this.dataSourceIO.allStockIDArray;
        let count = 0;
        let step = 30;
        let end = Math.min(ids.length, index+step);
        let me = this;
        for(let i=index; i<end; i++) {
            count++;
            this.updateStockMoneyFlow(ids[i], startDate, function(sid, len) {
                count--;
                if (count === 0) {
                    if (i === ids.length-1) {
                        callback(i);
                    } else {
                        me.updateMoneyFlow(index+step, startDate, callback)    
                    }
                    
                }

            })
        }

    }

    updateStockMoneyFlow(sid, startDate, callback) {
        let me = this;
        this.dataSourceIO.httpGetStockMoneyFlowHistory(sid, function(items, error) {
            if (items === null) {
                console.log("----------------resend", sid)
                me.updateStockMoneyFlow(sid, startDate, callback);
                //callback(sid, null);
                return;
            }

            let mfarr = me.dataSourceIO.readMoneyFlowSync(sid);
            // let last = new Date(mfarr[mfarr.length-1].date);
            if (mfarr === null) mfarr = [];
            if (items.length === 0) {
                me.dataSourceIO.writeMoneyFlowSync(sid, mfarr);
                callback(sid, 0);
                return;
            }
            for (let i = mfarr.length-1; i>=0; i--) {
                let date = new Date(mfarr[i].date);
                if (date >= startDate) mfarr.pop();
                else break;
            }
            let  org_len = mfarr.length;
            items.reverse();
            let updateStart = new Date(items[0].date);
            if (startDate < updateStart) console.log("Warning! startDate < updateStart", sid, mfarr.length, items.length, startDate , updateStart) 

            for (let i = 0; i<items.length; i++) {
                let item = items[i];
                let d = new Date(item.date);
                if (d>=startDate) mfarr.push(item);
            }
            me.dataSourceIO.writeMoneyFlowSync(sid, mfarr);
            callback(sid, mfarr.length-org_len);
        });
    }

}
