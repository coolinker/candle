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
        if (data[idx]['marketCap'] !== undefined || data[idx]['netamount'] === undefined) return;

        let netsum_r0 = 0,
            netsummax_r0 = -100000000000,
            netsum_r0x = 0,
            netsummax = -100000000000,
            netsummax_r0_netsum_r0x = -100000000000,
            netsummax_idx = -1,
            netsummax_idx_r0 = -1;
        for (let j = idx; j >= 0 && idx - j <= period; j--) {
            let klj = data[j];
            let r0x_net = klj.netamount - klj.r0_net;

            netsum_r0 += klj.r0_net;
            netsum_r0x += r0x_net;

            if (netsum_r0 + netsum_r0x > netsummax) {
                netsummax = netsum_r0 + netsum_r0x;
                netsummax_idx = j;
            }

            if (netsum_r0 > netsummax_r0) {
                netsummax_r0 = netsum_r0;
                netsummax_idx_r0 = j;
                netsummax_r0_netsum_r0x = netsum_r0x;
            }
        }

        let obj = data[idx];
        obj.marketCap = obj.close * (2 * obj.amount / (obj.high + obj.low)) / (obj.turnover / 10000)
        obj.netsummax_r0 = netsummax_r0;
        obj.netsummax = netsummax;
        obj.netsummax_duration = idx - netsummax_idx;

        obj.netsummax_r0_duration = idx - netsummax_idx_r0;
        obj.netsummax_r0_netsum_r0x = netsummax_r0_netsum_r0x;
    }
}