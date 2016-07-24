'use strict';
import fetch from "node-fetch";

class IO {
    constructor() {
    }

    // exports.cacheGetStockJson = cacheGetStockJson;
    static cacheGetStockJson(sid) {
        return this.cacheMap[sid]
    }

    // exports.httpGetStockJson = httpGetStockJson;
    static httpGetStockJson(sid, callback) {
        fetch(IO.baseUrl, { method: 'POST', body: '{"sid":"' + sid + '", "action":"stock"}' })
            .then(function(res) {
                return res.json();
            }).then(function(json) {
                console.log("httpGetStockJson =>", sid, json.length);
                IO.cacheMap[sid] = json;
                callback(json);
            });
    }

}

IO.baseUrl = 'http://localhost/api';
IO.cacheMap = {};

export default IO
