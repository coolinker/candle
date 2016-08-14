'use strict';

module.exports = class MovingAverageUtil {
    constructor() {

    }

    static buildFields(fields, period, start, end, data) {
        start = Math.max(start, period - 1);
        let sums = [];
        for (let i = start; i > start - period; i--) {
            fields.map(function(v, idx, arr) {
                if (sums[idx] === undefined) sums[idx] = data[i][v];
                else sums[idx] += data[i][v];
            })
        }

        let aves = [];
        sums.map(function(v, idx, arr) {
            aves[idx] = v / period;
            let field = fields[idx];
            data[start]["ave_" + field + "_" + period] = MovingAverageUtil.formatFloat(aves[idx]);
        })

        for (let i = start + 1; i <= end; i++) {
            aves.map(function(v, idx, arr) {
                let field = fields[idx];
                let ave = aves[idx];
                aves[idx] = ave + (data[i][field] - data[i - period][field]) / period;
                data[i]["ave_" + field + "_" + period] = MovingAverageUtil.formatFloat(aves[idx]);
            })
        }
    }

    static build(field, period, start, end, data) {
        start = Math.max(start, period - 1);
        let sum = 0;
        for (let i = start; i > start - period; i--) {
            sum += data[i][field];
        }
        let ave = sum / period;
        data[start]["ave_" + field + "_" + period] = MovingAverageUtil.formatFloat(ave);
        for (let i = start + 1; i <= end; i++) {
            ave = ave + (data[i][field] - data[i - period][field]) / period;
            data[i]["ave_" + field + "_" + period] = MovingAverageUtil.formatFloat(ave);
        }

        return data;
    }

    static formatFloat(f) {
        return f //Math.round(f * 100) / 100;
    }

    static buildSingle(idx, period, data, field) {
        let fieldAveName = 'ave_' + field + '_' + period;
        if (idx < period - 1 || data[idx][fieldAveName]) return;

        let preobj = data[idx - 1];
        let prevalue = preobj[fieldAveName];
        if (!isNaN(prevalue)) {
            let v = MovingAverageUtil.formatFloat((prevalue * period - data[idx - period][field] + data[idx][field]) / period);
            data[idx][fieldAveName] = v;
        } else {
            let sum = 0;
            for (let i = 0; i < period; i++) {
                sum += data[idx - i][field];
            }
            let v = MovingAverageUtil.formatFloat((sum / period));
            data[idx][fieldAveName] = v;
        }

    }
}