'use strict';
let fetch = require('node-fetch');
let fs = require('fs');
let Zip = require('./zip');

module.exports = class DataSourceIO {
    constructor(root) {
        this.dataSourceRoot = root === undefined ? "../../data" : root;
        this.allStockIDArray = this.getAllStockIds();
        this.historyPageParams = ""; // "year=2016&jidu=3"; //"";
        this.stockCompressedCache = {};
        this.stockCompressedCacheFields = ['date', 'open', 'close', 'high', 'low', 'amount', 'netamount', 'r0_net', 'changeratio', 'turnover'];
        //this.loadToCache(this.stockCompressedCacheFields);
    }

    loadToCache(fields) {
        let len = this.allStockIDArray.length;
        for (let i = 0; i < len; i++) {
            if (i % 100 === 0) console.log(i, new Date());
            let sid = this.allStockIDArray[i];
            this.readStockCompressedJsonSync(sid, fields);
        }

    }

    getAllStockIds(match) {
        let klinefiles = fs.readdirSync(this.dataSourceRoot + "/base/");
        let stockIds = [];
        let cnt = 0;
        klinefiles.forEach(function(fileName) {
            if (match === undefined || fileName.indexOf(match) >= 0) {
                let sid = fileName.substring(0, fileName.indexOf("."));
                stockIds.push(sid);
            }
        });
        console.log("getAllStockIds stockIds", stockIds.length)
        return stockIds;
    }

    readBaseSync(sid) {
        let kLineJson = [];
        let fs = require("fs");
        let content = fs.readFileSync(this.dataSourceRoot + "/base/" + sid + ".txt", "utf8");
        let lines = content.split("\r\n");
        let count = 0;
        let lastNode;
        lines.forEach(function(line) {
            let lineEle = line.split(",");

            if (lineEle.length === 7) {
                count++;
                let vol = parseFloat(lineEle[5]);
                if (vol < 0) {
                    vol = 2 * 2147483648 + vol;
                }

                if (vol > 0) {
                    let obj = {
                        date: lineEle[0],
                        open: parseFloat(lineEle[1]),
                        high: parseFloat(lineEle[2]),
                        low: parseFloat(lineEle[3]),
                        close: parseFloat(lineEle[4]),
                        volume: vol,
                        amount: parseFloat(lineEle[6])
                    };

                    kLineJson.push(obj);
                } else {
                    //console.log("==",sid, lineEle);
                    if (count < lines.length - 2) console.log(sid, count, lines.length, lineEle);
                }
            }
        });

        return kLineJson;
    }

    httpGetStockMoneyFlowHistory(sid, callback) {
        let num = 30;
        fetch("http://vip.stock.finance.sina.com.cn/quotes_service/api/json_v2.php/MoneyFlow.ssl_qsfx_zjlrqs?page=1&num=" + num + "&sort=opendate&asc=0&daima=" + sid.toLowerCase(), {
                method: 'GET',
                timeout: 5000
            })
            .then(function(res) {
                if (!res.ok || res.status != 200) {
                    console.error("httpGetStockHistory error loading", sid, res.ok, res.status, res);
                }
                return res.text();
            }).then(function(body) {

                // console.log("body===", body);
                body = body.replace(/opendate/g, "date");
                body = body.replace(/\},\{/g, "}-{");
                body = body.replace(/,/g, ",\"");
                body = body.replace(/:/g, "\":");
                body = body.replace(/\{/g, "{\"");
                body = body.replace(/\}-\{/g, "},{");
                let json = JSON.parse(body);
                if (json === null) json = [];
                for (let i = 0; i < json.length; i++) {
                    let obj = json[i];
                    for (let att in obj) {
                        if (att === "date") {
                            obj.date = obj.date.substr(5, 2) + '/' + obj.date.substr(8, 2) + '/' + obj.date.substr(0, 4);
                        } else {
                            obj[att] = Number(obj[att]);
                        }
                    }
                }
                callback(json);
            }).catch(function(error) {
                console.log('request failed', error.message)
                callback(null, error);
            });
    }

    httpGetStockHistory(sid, callback) {
        let code = sid.substr(2);

        if (sid === "SH999999") code = '000001/type/S';
        else if (sid === "SZ399001") code = '399001/type/S';
        //http://vip.stock.finance.sina.com.cn/corp/go.php/vMS_MarketHistory/stockid/000001/type/S.phtml
        fetch('http://vip.stock.finance.sina.com.cn/corp/go.php/vMS_MarketHistory/stockid/' + code + '.phtml' + (this.historyPageParams ? ("?" + this.historyPageParams) : ""), {
                method: 'GET',
                timeout: 1000
            })
            .then(function(res) {
                if (!res.ok || res.status != 200) {
                    console.log("httpGetStockHistory error loading", sid, res.ok, res.status, res);
                }
                return res.text();
            }).then(function(body) {
                let regstr = "<a target='_blank' href='http://vip.stock.finance.sina.com.cn/quotes_service/view/vMS_tradehistory.php\\?symbol=\\S{2}\\d{6}&date=\\d{4}-\\d{2}-\\d{2}'>\\s*([^\\s]+)\\s+</a>\\s*</div></td>\\s*<td[^\\d]*([^<]*)</div></td>\\s+<td[^\\d]*([^<]*)</div></td>\\s+<td[^\\d]*([^<]*)</div></td>\\s+<td[^\\d]*([^<]*)</div></td>\\s+<td[^\\d]*([^<]*)</div></td>\\s+<td[^\\d]*([^<]*)</div></td>";
                let reg = new RegExp(regstr, "g");
                let items = body.match(reg);
                let jsonArr = [];

                if (!items) console.log("httpGetStockHistory no data", sid)

                for (let i = 0; items && i < items.length; i++) {
                    let item = items[i];
                    let subs = item.match(regstr, "g");
                    let dt = subs[1].split('-');
                    let json = {
                        date: dt[1] + '/' + dt[2] + '/' + dt[0],
                        open: Number(subs[2]),
                        high: Number(subs[3]),
                        close: Number(subs[4]),
                        low: Number(subs[5]),
                        volume: (sid === 'SH999999' || sid === 'SZ399001') ? Math.round(Number(subs[6]) / 100) : Number(subs[6]),
                        amount: Number(subs[7])
                    };
                    // console.log(json)

                    jsonArr.push(json);
                }

                callback(jsonArr);
            }).catch(function(error) {
                console.log('request failed', error)
                callback(null);
            });

    }

    writeJsonSync(sid, jsonData) {
        let data = JSON.stringify(jsonData);
        fs.writeFileSync(this.dataSourceRoot + "/json/" + sid + ".json", data);
    }

    readStockCompressedJsonSync(sid, fields) {
        let cache = this.getFromCache(sid, fields);
        if (cache) return cache;

        let jsonArr = this.readJsonSync(sid);
        if (!jsonArr) {
            console.log("readStockCompressedJsonSync sid=", sid)
            return null;
        }
        let mfArr = this.readMoneyFlowSync(sid);
        let zipobj = Zip.compressStockJson(fields, jsonArr, mfArr);
        if (!zipobj) console.log("readStockCompressedJsonSync is null error", sid)
        else this.putToCache(sid, fields, zipobj);
        return zipobj
    }

    putToCache(sid, fields, zipobj) {
        let key = sid + "_" + fields.join();
        this.stockCompressedCache[key] = zipobj;
    }

    getFromCache(sid, fields) {
        let key = sid + "_" + fields.join();
        return this.stockCompressedCache[key];
    }

    readJsonSync(sid) {
        let path = this.dataSourceRoot + "/json/" + sid + ".json";
        if (fs.existsSync(path)) {
            let content = fs.readFileSync(path, "utf8");
            let kLineJson = JSON.parse(content);
            return kLineJson;
        } else {
            return null;
        }
    }


    readMoneyFlowSync(sid) {
        let path = this.dataSourceRoot + "/moneyflow/" + sid + ".json";
        if (fs.existsSync(path)) {
            let content = fs.readFileSync(path, "utf8");
            let json = JSON.parse(content);

            return json;
        }
        return null;
    }

    writeMoneyFlowSync(sid, jsonData) {
        let data = JSON.stringify(jsonData);
        fs.writeFileSync(this.dataSourceRoot + "/moneyflow/" + sid + ".json", data);
    }

    thirdPartyAjaxAPI(url, getpost, callback) {
        //console.log("thirdPartyAjaxAPI", url, getpost)
        fetch(url, {
            method: getpost,
            timeout: 1000
        }).then(function(res) {
            if (!res.ok || res.status != 200) {
                console.log("httpGetStockHistory error loading", sid, res.ok, res.status, res);
            }
            return res.text();
        }).then(function(body) {
            callback(body);
        }).catch(function(error) {
            console.log('request failed', error)
            callback(null);
        });
    }

}