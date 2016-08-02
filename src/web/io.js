'use strict';
import 'whatwg-fetch';

class IO {
    constructor() {}

    // exports.cacheGetStockJson = cacheGetStockJson;
    static cacheGetStockJson(sid) {
        return this.cacheMap[sid]
    }
    
    static httpGetStockIdsJson(filter, callback) {
        fetch(IO.baseUrl, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: '{"filter":"' + filter + '", "action":"stockIds"}'
            }).then(function(res) {
                return res.json();
            }).then(function(json) {
                console.log("httpGetStockIdsJson =>", json.length);
                callback(json);
            });
    }

    static httpGetStockFullJson(sid, fields, callback) {
        console.log("--------------httpGetStockFullJson", sid)
        fetch(IO.baseUrl, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: '{"sid":"' + sid + '", "action":"stockFull", "fields":"'+fields+ '"}'
            }).then(function(res) {
                return res.json();
            }).then(function(json) {

                IO.cacheMap[sid] = json;
                callback(json);
            });
    }

    static httpGetStockJson(sid, callback) {
        console.log("--------------httpGetStockJson", sid)
        fetch(IO.baseUrl, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: '{"sid":"' + sid + '", "action":"stock"}'
            }).then(function(res) {
                return res.json();
            }).then(function(json) {
                IO.cacheMap[sid] = json;
                callback(json);
            });
    }
    static httpGetStockMoneyFlowJson(sid, callback) {
        console.log("--------------httpGetStockMoneyFlowJson", sid)
        fetch(IO.baseUrl, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: '{"sid":"' + sid + '", "action":"stockMoneyFlow"}'
            }).then(function(res) {
                return res.json();
            }).then(function(json) {
                console.log("httpGetStockMoneyFlowJson =>", sid, json.length);
                IO.mergeStockJson(sid, json);
                //IO.cacheMap[sid] = json;
                callback(IO.cacheMap[sid]);
            });
    }

    static mergeStockJson(sid, json){
        let  arr = IO.cacheMap[sid];
        let len = arr.length;
        let jlen = json.length;
        for (let i = 1; i < json.length; i++) {
            if (json[jlen-i].date === arr[len-i].date) {
                Object.assign(arr[len-i], json[jlen-i]);
            } else {
                console.error("date is different", i, sid, json[jlen-i].date, arr[len-i].date);
            }
        }
    }

}

IO.baseUrl = 'http://localhost/api';
IO.cacheMap = {};

export default IO
