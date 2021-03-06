module.exports = {

    priceCR: function (data, n) {
        let base = n === 0 ? data[n.open] : data[n - 1].close;
        return (data[n].close - base) / base;
    },

    diffR: function (val0, val1) {
        return (val1 - val0) / val0;
    },

    priceCRA: function (data, n, period) {
        if (n < period) return null;
        let sum = 0;
        for (let i = n; i > n - period; i--) {
            sum += (data[i].high - data[i].low) / data[i].open;
        }
        return sum / period;
    },

    aboveS: function (data, n, field, period) {
        if (!period) return 0;
        let price = data[n].close;
        let sum = 0;
        for (let i = n; i >= 0 && i > n - period; i--) {
            if (data[i].ex) {
                let pc = data[i - 1].close;
                let o = data[i].open;
                price = price * pc / o;
            }
            if ((data[i].high + data[i].low) / 2 < price) continue;
            // console.log(data[i].date, data[i][field])
            sum += data[i][field];
        }
        return sum;
    },

    bellowS: function (data, n, field, period) {
        if (!period) return 0;
        let price = data[n].close;
        let sum = 0;
        for (let i = n; i >= 0 && i > n - period; i--) {
            if (data[i].ex) {
                let pc = data[i - 1].close;
                let o = data[i].open;
                price = price * pc / o;
            }
            if ((data[i].high + data[i].low) / 2 >= price) continue;
            sum += data[i][field];
        }

        return sum;
    },

    lowerItems(data, start, end, field, v) {
        let arr = [];
        for (let i = end; i >= start; i--) {
            if (data[i][field] < v) arr.push(i);
            if (data[i].ex) {
                v = v * data[i - 1].close/data[i].open;
            }            
        }
        return arr.reverse();
    },
    
    higherItems(data, start, end, field, v) {
        let arr = [];
        for (let i = end; i >= start; i--) {
            if (data[i][field] > v) arr.push(i);
            if (data[i].ex) {
                v = v * data[i - 1].close/data[i].open;
            }            
        }
        return arr.reverse();
    },

    sum: function (data, n, field, period) {
        if (!period) return 0;
        let sum = 0;
        for (let i = n; i >= 0 && i > n - period; i--) {
            sum += data[i][field];
        }
        return sum;
    },

    lowPI: function (data, start, end, field) {
        let low = Number.MAX_SAFE_INTEGER;
        let lowidx = -1;
        for (let i = start; i <= end; i++) {
            if (data[i].ex && i > start) {
                low = low * data[i].open / data[i - 1].close;
            }
            let v = data[i][field];
            if (v < low) {
                low = v;
                lowidx = i;
            }
        }
        return lowidx;
    },

    highPI: function (data, start, end, field) {
        let high = Number.MIN_SAFE_INTEGER;
        let highidx = -1;
        for (let i = start; i <= end; i++) {
            if (data[i].ex && i > start) {
                high = high * data[i].open / data[i - 1].close;
            }
            let v = data[i][field];
            if (v > high) {
                high = v;
                highidx = i;
            }
        }
        return highidx;
    },

    lowVI: function (data, start, end, field) {
        let low = Number.MAX_SAFE_INTEGER;
        let lowidx = -1;
        for (let i = start; i <= end; i++) {
            let v = data[i][field];
            if (v < low) {
                low = v;
                lowidx = i;
            }
        }
        return lowidx;
    },

    highVI: function (data, start, end, field) {
        let high = Number.MIN_SAFE_INTEGER;
        let highidx = -1;
        for (let i = start; i <= end; i++) {
            let v = data[i][field];
            if (v > high) {
                high = v;
                highidx = i;
            }
        }
        return highidx;
    },

    maxS: function (data, n, field, period) {
        if (!period) return 0;
        let sum = 0;
        let maxsum = Number.MIN_SAFE_INTEGER;
        for (let i = n; i >= 0 && i > n - period; i--) {
            sum += data[i][field];
            if (sum > maxsum) {
                maxsum = sum;
            }
        }
        return maxsum;
    },

    maxSI: function (data, n, field, period) {
        if (!period) return 0;
        let sum = 0;
        let maxsum = Number.MIN_SAFE_INTEGER;
        let maxidx = -1;
        for (let i = n; i >= 0 && i > n - period; i--) {
            sum += data[i][field];
            if (sum > maxsum) {
                maxidx = i;
                maxsum = sum;
            }
        }
        return maxidx;
    }
    // wBottom: function () {
    //     let right_lowidx = lowPI(d, n - 8, n, "low");
    //     let cra = 0.06;//priceCRA(d, right_lowidx, 8);
    //     if (diffR(d[right_lowidx].low, d[right_lowidx].ave_close_8) < 1 * cra) return false;

    //     let mid_highidx = highPI(d, right_lowidx - 8, right_lowidx, "high");
    //     if (diffR(d[right_lowidx].low, d[mid_highidx].high) < 2 * cra) return false;

    //     let left_lowidx = lowPI(d, mid_highidx - 20, mid_highidx, "low");
    //     if (diffR(d[left_lowidx].low, d[left_lowidx].ave_close_8) < 1.5 * cra) return false;

    //     if (d[left_lowidx].ave_close_8 > d[left_lowidx].ave_close_13) return false;

    //     if (diffR(d[left_lowidx].low, d[right_lowidx].low) > -0.0) return false;
    //     if (diffR(d[left_lowidx].ave_amount_55, d[right_lowidx].ave_amount_55) > -0) return false;

    //     return true
    // },

    // nearDrop: function (data, n, period, maxdiff) {
    //     for (let i = 0; i < period; i++) {
    //         if (0.8 * data[n].amount < data[n - 1].ave_amount_8) continue;

    //         let open = data[n - i].open;
    //         let close = data[n - i].close;
    //         let diff = (close - open) / open;
    //         if (diff > maxdiff) continue;
    //         let low = data[n - i].low;
    //         let lowdiff = (low - close) / open;
    //         if (lowdiff < maxdiff / 3) return true;
    //     }
    //     return false;

    // },

};
