'use strict';

module.exports = class DataBuilder {
    constructor() {
        this.dataSourceRoot = "../../datasource";
        let DataSourceIO = require('./datasourceio');
        this.dataSourceIO = new DataSourceIO();
        this.tradingDays = this.dataSourceIO.readJsonSync('SH999999');
    }

    buildBaseToJson() {
        let ids = this.dataSourceIO.allStockIDArray;
        for (let i = 0; i < ids.length; i++) {
            this.buildStockJson(ids[i]);
            // let jsondata = this.dataSourceIO.readBaseSync(ids[i]);
            // this.dataSourceIO.writeJsonSync(ids[i], jsondata);
        }
    }

    buildStockJson(sid) {
        let jsondata = this.dataSourceIO.readBaseSync(sid);
        this.dataSourceIO.writeJsonSync(sid, jsondata);
    }

    updateJson(startDate, index, callback) {
        if (index === undefined) index = 0;
        if (startDate === undefined) {
            startDate = new Date();
            startDate.setHours(0, 0, 0, 0);
        }

        let ids = this.dataSourceIO.allStockIDArray;
        let len = ids.length;
        let me = this;
        this.updateStockJson(ids[index], startDate, function(updatedCount) {
            if (!updatedCount) console.log("updateJson", index, ids[index], updatedCount);
            index = updatedCount === null ? index : (index + 1);
            if (index < len) me.updateJson(startDate, index, callback)
            else callback(index, updatedCount);
        })
    }

    updateStockJson(sid, startDate, callback) {
        let me = this;
        this.dataSourceIO.httpGetStockHistory(sid, function(items) {
            if (items === null) {
                callback(null);
                return;
            }

            if (items.length === 0) {
                callback(0);
                return;
            }

            let firstday = new Date(items[items.length - 1].date);
            if (startDate < firstday) startDate = firstday;

            let jsondata = me.dataSourceIO.readJsonSync(sid);
            let len = jsondata.length;

            for (let i = len - 1; i >= 0; i--) {
                let d = new Date(jsondata[i].date);
                if (startDate <= d) jsondata.pop();
                else break;
            }
            len = jsondata.length;
            let lday = new Date(len > 0 ? jsondata[len - 1].date : 0);
            for (let i = items.length - 1; i >= 0; i--) {
                let d = new Date(items[i].date);
                if (lday < d) jsondata.push(items[i]);
            }
            if (jsondata.length - len > 0) {
                me.dataSourceIO.writeJsonSync(sid, jsondata);
            }

            callback(jsondata.length - len);
        });

    }


    updateMoneyFlow(index, startDate, callback) {
        console.log("index:", index, new Date())
        let ids = this.dataSourceIO.allStockIDArray;
        let count = 0;
        let step = 30;
        let end = Math.min(ids.length, index + step);
        let me = this;
        for (let i = index; i < end; i++) {
            count++;
            this.updateStockMoneyFlow(ids[i], startDate, function(sid, len) {
                count--;
                if (count === 0) {
                    if (end === ids.length) {
                        callback(end);
                    } else {
                        me.updateMoneyFlow(index + step, startDate, callback)
                    }

                }

            })
        }

    }

    updateMarketMoneyFlow(startDate) {
        this.tradingDays = this.dataSourceIO.readJsonSync('SH999999');
        let ids = this.dataSourceIO.allStockIDArray;
        let dateMapSZ = {};
        let dateMapSH = {};

        for (let i = 0; i < ids.length; i++) {
            let sid = ids[i];
            if (sid === "SH999999" || sid === "SZ399001") continue;

            let mfarr = this.dataSourceIO.readMoneyFlowSync(sid);
            let isSH = sid.indexOf("SH") === 0;

            let dateMap = isSH ? dateMapSH : dateMapSZ;
            for (let j = mfarr.length - 1; j >= 0; j--) {
                let mf = mfarr[j];
                let date = new Date(mf.date);
                if (date < startDate) {
                    break;
                }
                let dt = mf.date;
                if (dateMap[dt] === undefined) {
                    dateMap[dt] = {
                        date: dt,
                        netamount: 0,
                        r0_net: 0
                    };
                }
                dateMap[dt].netamount += mf.netamount;
                dateMap[dt].r0_net += mf.r0_net;

            }
            if (i % 100 === 0) console.log(i);
        }

        let shmfarr = this.dataSourceIO.readMoneyFlowSync("SH999999");
        let szmfarr = this.dataSourceIO.readMoneyFlowSync("SZ399001");
        let shstart = 0,
            szstart = 0;
        for (let i = 0; i < this.tradingDays.length; i++) {
            let dt = this.tradingDays[i].date;
            let date = new Date(dt);
            if (shmfarr[0].date === dt) {
                shstart = i;
            }
            if (szmfarr[0].date === dt) {
                szstart = i;
            }

            if (date < startDate) continue;
            if (shstart + shmfarr.length > i) {
                shmfarr[i - shstart] = dateMapSH[dt];
            } else {
                shmfarr.push(dateMapSH[dt]);
            }

            if (szstart + szmfarr.length > i) szmfarr[i - szstart] = dateMapSZ[dt];
            else szmfarr.push(dateMapSZ[dt]);
        }

        this.dataSourceIO.writeMoneyFlowSync('SH999999', shmfarr);
        this.dataSourceIO.writeMoneyFlowSync('SZ399001', szmfarr);
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
            for (let i = mfarr.length - 1; i >= 0; i--) {
                let date = new Date(mfarr[i].date);
                if (date >= startDate) mfarr.pop();
                else break;
            }
            let org_len = mfarr.length;
            items.reverse();
            let updateStart = new Date(items[0].date);
            if (startDate < updateStart) console.log("Warning! startDate < updateStart", sid, mfarr.length, items.length, startDate, updateStart)

            for (let i = 0; i < items.length; i++) {
                let item = items[i];
                if (item.turnover === 0) continue;

                let d = new Date(item.date);
                if (d >= startDate) mfarr.push(item);
            }
            me.dataSourceIO.writeMoneyFlowSync(sid, mfarr);
            callback(sid, mfarr.length - org_len);
        });
    }

}