'use strict';

module.exports = class BullBearUtil {
    constructor() { }

    static build(start, end, data) {
        for (let i = start; i <= end; i++) {
            BullBearUtil.buildSingle(i, data);
        }
        return data;
    }

    static priceCRA(data, n, period) {
        if (n < period) return null;
        let sum = 0;
        for (let i = n; i > n - period; i--) {
            sum += (data[i].high - data[i].low) / data[i].open;
        }
        return sum / period;
    }

    static buildSingle(idx, data) {
        
        let obj = data[idx];
        obj.bullbear = 0;
        let price = data[idx].close,
            almp = BullBearUtil.priceCRA(data, idx, 5);
        for (let i = idx + 1; i < data.length; i++) {
            let d = data[i];
            if (d.ex) {
                price = price * d.open / data[i - 1].close;
            }

            if ((d.low - price) / price < -3 * almp) {
                obj.bullbear = (d.low - price) / price;
                return;
            } else if ((d.high - price) / price > 3 * almp) {
                obj.bullbear = (d.high - price) / price;
                return;
            }
        }

    }

}