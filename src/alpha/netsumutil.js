'use strict';

module.exports = class NetSumUtil {
    constructor() {

    }

    static build(start, end, period, data) {
        for (let i = start; i <= end; i++) {
            NetSumUtil.buildSingle(i, period, data);
        }

        return data;
    }

    static buildSingle(idx, period, data) {
        if (data[idx]['marketCap'] !== undefined || !data[idx]['turnover']) return;
        let obj = data[idx];
        let price = obj.close;

        let netsum_r0 = 0,
            netsummax_r0 = Number.MIN_SAFE_INTEGER,
            netsummin_r0 = Number.MAX_SAFE_INTEGER,
            netsummax_r0x = Number.MIN_SAFE_INTEGER,
            netsummin_r0x = Number.MAX_SAFE_INTEGER,
            netsum_r0x = 0,
            netsummax = Number.MIN_SAFE_INTEGER,
            netsummax_r0_netsum_r0x = Number.MIN_SAFE_INTEGER,
            netsummax_idx = -1,
            netsummax_idx_r0 = -1,
            netsum_r0_below = 0,
            netsum_r0_above = 0,
            netsum_r0x_below = 0,
            netsum_r0x_above = 0;

        for (let j = idx; j >= 0 && idx - j <= period; j--) {
            let klj = data[j];
            let r0x_net = klj.netamount - klj.r0_net;

            netsum_r0 += klj.r0_net;
            netsum_r0x += r0x_net;

            if (klj.close >= price) {
                netsum_r0_above += klj.r0_net;
                netsum_r0x_above += r0x_net;
            } else {
                netsum_r0_below += klj.r0_net;
                netsum_r0x_below += r0x_net;
            }

            if (netsum_r0 + netsum_r0x > netsummax) {
                netsummax = netsum_r0 + netsum_r0x;
                netsummax_idx = j;
            }

            if (netsum_r0 > netsummax_r0) {
                netsummax_r0 = netsum_r0;
                netsummax_idx_r0 = j;
                netsummax_r0_netsum_r0x = netsum_r0x;
            }

            if (netsum_r0 < netsummin_r0) {
                netsummin_r0 = netsum_r0;
            }

            if (netsum_r0x > netsummax_r0x) {
                netsummax_r0x = netsum_r0x;
            }

            if (netsum_r0x < netsummin_r0x) {
                netsummin_r0x = netsum_r0x;
            }

            if (idx - j + 1 === 5) {
                obj.netsum_r0_5 = netsum_r0;
                obj.netsum_r0x_5 = netsum_r0x;
                obj.netsummax_r0_5 = netsummax_r0;
                obj.netsummin_r0_5 = netsummin_r0;
                obj.netsummax_r0x_5 = netsummax_r0x;
                obj.netsummin_r0x_5 = netsummin_r0x;
                obj.netsum_r0_above_5 = netsum_r0_above;
                obj.netsum_r0x_above_5 = netsum_r0x_above;
                obj.netsum_r0_below_5 = netsum_r0_below;
                obj.netsum_r0x_below_5 = netsum_r0x_below;
            }

            if (idx - j + 1 === 8) {
                obj.netsum_r0_8 = netsum_r0;
                obj.netsum_r0x_8 = netsum_r0x;
                obj.netsummax_r0_8 = netsummax_r0;
                obj.netsummin_r0_8 = netsummin_r0;
                obj.netsummax_r0x_8 = netsummax_r0x;
                obj.netsummin_r0x_8 = netsummin_r0x;
                obj.netsum_r0_above_8 = netsum_r0_above;
                obj.netsum_r0x_above_8 = netsum_r0x_above;
                obj.netsum_r0_below_8 = netsum_r0_below;
                obj.netsum_r0x_below_8 = netsum_r0x_below;
            }

            if (idx - j + 1 === 21) {
                obj.netsum_r0_21 = netsum_r0;
                obj.netsum_r0x_21 = netsum_r0x;
                obj.netsummax_r0_21 = netsummax_r0;
                obj.netsummin_r0_21 = netsummin_r0;
                obj.netsummax_r0x_21 = netsummax_r0x;
                obj.netsummin_r0x_21 = netsummin_r0x;
                obj.netsum_r0_above_21 = netsum_r0_above;
                obj.netsum_r0x_above_21 = netsum_r0x_above;
                obj.netsum_r0_below_21 = netsum_r0_below;
                obj.netsum_r0x_below_21 = netsum_r0x_below;
            }

            if (idx - j + 1 === 55) {
                obj.netsum_r0_55 = netsum_r0;
                obj.netsum_r0x_55 = netsum_r0x;
                obj.netsummax_r0_55 = netsummax_r0;
                obj.netsummin_r0_55 = netsummin_r0;
                obj.netsummax_r0x_55 = netsummax_r0x;
                obj.netsummin_r0x_55 = netsummin_r0x;
                obj.netsum_r0_above_55 = netsum_r0_above;
                obj.netsum_r0x_above_55 = netsum_r0x_above;
                obj.netsum_r0_below_55 = netsum_r0_below;
                obj.netsum_r0x_below_55 = netsum_r0x_below;
            }
        }

        obj.marketCap = obj.close * (2 * obj.amount / (obj.high + obj.low)) / (obj.turnover / 10000)
        obj.netsummax_r0 = netsummax_r0;
        obj.netsummax = netsummax;
        obj.netsummax_duration = idx - netsummax_idx;

        obj.netsummax_r0_duration = idx - netsummax_idx_r0;
        obj.netsummax_r0_netsum_r0x = netsummax_r0_netsum_r0x;
        obj.netsum_r0_above = netsum_r0_above;
        obj.netsum_r0x_above = netsum_r0x_above;
        obj.netsum_r0_below = netsum_r0_below;
        obj.netsum_r0x_below = netsum_r0x_below;

    }
}