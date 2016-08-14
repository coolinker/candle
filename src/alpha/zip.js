'use strict';

module.exports = class Zip {
    constructor() {

    }

    static decompressStockJson(cdata, fields) {
        let stockFields = cdata.fields;
        if (!fields) fields = stockFields;
        let flen = stockFields.length;
        let fm = {};
        for (let i = 0; i < fields.length; i++) {
            let f = fields[i];
            for (let j = 0; j < flen; j++) {
                if (stockFields[j] === f) fm[j] = true;
            }
        }

        let data = cdata.data;
        let len = data.length;
        let lastObj = {},
            obj = {};
        let jsonData = [];
        for (let i = 0; i < len; i++) {
            let idx = i % flen;
            if (!fm[idx]) continue;
            if (idx === 0 && i > 0) {
                jsonData.push(obj);
                obj = {};
            }
            let field = stockFields[idx];
            let v = data[i];
            obj[field] = Zip.decompressFieldValue(field, v, lastObj, jsonData.length);

        }
        jsonData.reverse();
        return jsonData;
    }

    static compressStockJson(fields, jsonArr, mfArr) {
        if (!jsonArr) {
            console.log("readStockCompressedJsonSync sid=", sid)
            return null;
        }

        let jlen = jsonArr.length;
        let mlen = mfArr.length;
        let len = Math.max(jlen, mlen);
        let fullArr = [];
        let lastObj = {
            lastdate: 0,
            lastclose: 0,
            lastopen: 0,
            lasthigh: 0,
            lastlow: 0,
            lastamout: 0
        };
        for (let i = 1; i < len; i++) {
            let json = jsonArr[jlen - i];
            let mf = mlen < i ? null : mfArr[mlen - i];
            if (mf) {
                if (json.date !== mf.date) {
                    if (mf.date !== "03/01/2010") {
                        // readStockFullJsonSync date mismatch! SH600568 11/20/2015 11/23/2015
                        // readStockFullJsonSync date mismatch! SH600656 04/09/2015 03/31/2016
                        // readStockFullJsonSync date mismatch! SH600832 04/09/2015 04/29/2015
                        // readStockFullJsonSync date mismatch! SH601299 04/09/2015 05/06/2015
                        // readStockFullJsonSync date mismatch! SZ000033 04/09/2015 04/29/2015
                        console.error("compressedStockJson date mismatch!", json.date, mf.date);
                        return null;
                    }
                    delete mf.date;
                }

            }

            Object.assign(json, mf)
            let flen = fields.length;
            for (let j = 0; j < flen; j++) {
                let clen = fullArr.length;
                let v = Zip.compressFieldValue(fields[j], json, lastObj, i);
                fullArr.push(v);
            }

        }


        return {
            fields: fields,
            data: fullArr
        };
    }

    static decompressFieldValue(field, v, last, idx) {
        if (v === undefined) return null;
        if (field === 'date') {
            let ll = last.lastdate;
            let llv = v;
            if (!last.lastdate) {
                last.lastdate = v;
            } else {
                v = last.lastdate - v;
                last.lastdate = v;
            }
            v = '' + v;
            let y, m, d;
            if (v.length === 5) {
                y = '200' + v.substr(0, 1);
                m = v.substr(1, 2);
                d = v.substr(3, 2);
                v = m + "/" + d + "/" + y;
            } else if (v.length === 6) {
                y = v.substr(0, 2);
                if (Number(y) < 50) y = "20" + y;
                m = v.substr(2, 2);
                d = v.substr(4, 2);
                v = m + "/" + d + "/" + y;
            }
            // if (ll > 150128 && ll < 150400 || ll > 100128 && ll < 100400)
            //     console.log(idx, m, d, y, ll, llv, v)
        } else if (field === 'amount' || field === 'netamount' || field === 'r0_net') {
            v = v * 10000;
        } else if (field === "open" || field === "close" || field === "low" || field === "high") {
            let lf = 'last' + field;
            let lv = last[lf];
            if (lv) {
                v = v + lv;
            }
            last[lf] = v;
            v = v / 100;
        } else if (field === 'changeratio') {
            v = v / 10000;
        } else if (field === 'turnover') {
            v = v / 100;
        }

        return v;
    }

    static compressFieldValue(field, obj, last, idx) {
        let v = obj[field];
        if (v === undefined) return null;
        if (field === 'date') {
            let mdy = v.split("/");
            mdy[2] = mdy[2].substr(2, 2);
            v = Number(mdy[2] + mdy[0] + mdy[1]);
            let ld = last.lastdate;
            last.lastdate = v;
            // if ((mdy[2] === '10' || mdy[2] === '15') && (mdy[0] === '02' || mdy[0] === '03')) {
            //     console.log(idx, v, ld, v - ld)
            // }
            v = Math.abs(v - ld);

        } else if (field === 'amount' || field === 'netamount' || field === 'r0_net') {
            v = Math.round(v / 10000);
        } else if (field === "open" || field === "close" || field === "low" || field === "high") {
            let lf = 'last' + field;
            let lv = last[lf];
            last[lf] = v;
            v = v - lv;
            v = Math.round(v * 100);
        } else if (field === 'changeratio') {
            v = Math.round(v * 10000);
        } else if (field === 'turnover') {
            v = Math.round(v * 100);
        }

        return v;
    }


}