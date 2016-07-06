'use strict';

let fetch = require('node-fetch');
let baseUrl = 'http://localhost/api';
let cacheMap = {};

exports.cacheGetStockJson = cacheGetStockJson;
function cacheGetStockJson(sid) {
        return cacheMap[sid]
}

exports.httpGetStockJson = httpGetStockJson;
function httpGetStockJson(sid, callback) {
    fetch(baseUrl+"?action=stock", { method: 'POST', body: '{"sid":"'+sid+'"}' })
    .then(function(res) {
        return res.json();
    }).then(function(json) {
        console.log("httpGetStockJson =>", sid, json.length);
        cacheMap[sid] = json;
        callback(json);
    });
}
