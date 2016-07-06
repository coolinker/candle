'use strict';

module.exports = class DataSourceIO {
    constructor(root) {
        this.dataSourceRoot = root === undefined ? "../../data" : root;
        this.allStockIDArray = this.getAllStockIds();
    }

    getAllStockIds(match) {
        let fs = require("fs");
        let klinefiles = fs.readdirSync(this.dataSourceRoot + "/base/");
        let stockIds = [];
        let cnt = 0;
        klinefiles.forEach(function(fileName) {
            if (match === undefined || fileName.indexOf(match) >= 0) {
                let sid = fileName.substring(0, fileName.indexOf("."));
                stockIds.push(sid);
            }
        });
        console.log("stockIds", stockIds.length)
        return stockIds;
    }

    readBaseSync(stockId) {
        let kLineJson = [];
        let fs = require("fs");
        let content = fs.readFileSync(this.dataSourceRoot + "/base/" + stockId + ".TXT", "utf8");
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
                    //console.log("==",stockId, lineEle);
                    if (count < lines.length - 2) console.log(stockId, count, lines.length, lineEle);
                }
            }
        });

        return kLineJson;
    }

    writeJsonSync(stockId, jsonData) {
        let fs = require("fs");
        let data = JSON.stringify(jsonData);
        fs.writeFileSync(this.dataSourceRoot+ "/json/" + stockId + ".json", data);
    }

    readJsonSync(stockId) {
        let fs = require("fs");
        let content = fs.readFileSync(this.dataSourceRoot + "/json/" + stockId + ".json", "utf8");
        let kLineJson = JSON.parse(content);
        return kLineJson;
    }
}
