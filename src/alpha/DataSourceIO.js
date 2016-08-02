'use strict';
let fetch = require('node-fetch');
let fs = require('fs');
let TradingDate = require('./tradingdate')


module.exports = class DataSourceIO {
    constructor(root) {
        this.dataSourceRoot = root === undefined ? "../data" : root;
        this.allStockIDArray = this.getAllStockIds();
        this.historyPageParams = ""; //"year=2016&jidu=2";
        let json = this.readJsonSync("SH999999");
        json.reverse();
        TradingDate.load(json);
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
        let content = fs.readFileSync(this.dataSourceRoot + "/base/" + sid + ".TXT", "utf8");
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
        fetch("http://vip.stock.finance.sina.com.cn/quotes_service/api/json_v2.php/MoneyFlow.ssl_qsfx_zjlrqs?page=1&num=" + num + "&sort=opendate&asc=0&daima=" + sid.toLowerCase(), { method: 'GET', timeout: 5000 })
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
        fetch('http://vip.stock.finance.sina.com.cn/corp/go.php/vMS_MarketHistory/stockid/' + code + '.phtml' + (this.historyPageParams ? ("?" + this.historyPageParams) : ""), { method: 'GET', timeout: 1000 })
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
                //console.log('request failed', error)
                callback(null);
            });

    }

    writeJsonSync(sid, jsonData) {
        let data = JSON.stringify(jsonData);
        fs.writeFileSync(this.dataSourceRoot + "/json/" + sid + ".json", data);
    }

    readStockFullJsonSync(sid, fields) {
        let jsonArr = this.readJsonSync(sid);
        let mfArr = this.readMoneyFlowSync(sid);
        let jlen = jsonArr.length;
        let mlen = mfArr.length;
        let len = Math.max(jlen, mlen);
        let fullArr = [];
        for (let i = 1; i < len; i++) {
            let json = jsonArr[jlen - i];
            let mf = mlen < i ? null : mfArr[mlen - i];
            if (mf) {
                if (json.date !== mf.date) {
                    if (mf.date !== "03/01/2010") {
                        console.error("readStockFullJsonSync date mismatch!", sid, json.date, mf.date);
                        return null;
                    }

                }
            }
            Object.assign(json, mf)
            for (let j=0; j<fields.length; j++) {
                let v = this.getCompressedFieldValue(fields[j], json);
                fullArr.push(v);
            }
            

            // fields.map(function(field, idx, arr) {
            //     let v = json[field];
            //     v = v !== undefined ? v : (mf ? mf[field] : '');
            //     if (field === 'date') {
            //         let mdy = v.split("/");
            //         mdy[2] = mdy[2].substr(2, 2);
            //         v = Number(mdy.join(""));
            //     } else if (field === 'amount') {
            //         v = Math.round(v / 10000)
            //     } else {
            //         v = v % 1 === 0 ? v : Math.round(v * 100);
            //     }

            //     fullArr.push(v);
            // })

        }
        return { fields: fields, data: fullArr };
    }

    getCompressedFieldValue(field, obj) {
        let v = obj[field];
        let open = obj['open'];
        if (field === 'date') {
            //let idx = TradingDate.getIndex(v);
            let mdy = v.split("/");
            mdy[2] = mdy[2].substr(2, 2);
            v = Number(mdy.join(""));
            //v = idx;
        } else if (field === 'amount') {
            v = Math.round(v / 10000)
        } else if (field === "low") {
            v = Math.round((open-obj['low'])*100);
        } else if (field === "high") {
            v = Math.round((obj['high']-open)*100);
        }  else if (field === "close") {
            v = Math.round((obj['close']-open)*100);
        } else {
            v = Math.round(v * 100);
        }

        return v;
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


}
