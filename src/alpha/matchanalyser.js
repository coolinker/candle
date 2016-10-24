'use strict';
let matchrules = {
    "dn.amount_ave_21/dn.amount": [1.5],
    "dn.netsum_r0_below_60/dn.amount_ave_21": [0, 0],
    "dn.netsummax_r0_5": [0, 0],
    "dn.turnover_ave_8/dn.turnover_ave_21": [1],
    "dn.netsum_r0_below/dn.amount_ave_21": [0.02, 0.04]
}
module.exports = class MatchAnalyser {
    constructor() { }

    getValueRange(val, ranges) {
        for (let i = ranges.length - 1; i >= 0; i--) {
            if (val >= ranges[i]) return i + 1;
        }
        return 0;
    }

    composeMatchFunction(d, n, reArr, offset) {
        let dn = d[n];
        reArr[offset+0] = this.getValueRange(dn.amount_ave_21/dn.amount, [1.5]);
        reArr[offset+1] = this.getValueRange(dn.netsum_r0_below_60/dn.amount_ave_21, [0,0]);

    }

    // return !(obj.amount_ave_8<0.5*obj.amount)//128 0.800 9476/22311
    // && !(obj.netsum_r0_below>0.0*obj.amount_ave_21)//16 0.797 9881/23374
    // && !(obj.netsum_r0_below_60>0.0*obj.amount_ave_21)//7 0.784 12057/26675
    // && obj.turnover_ave_8>obj.turnover_ave_21//1 0.765 16762/34443
    // && obj.amount_ave_21<1.5*obj.amount//0 0.732 36933/64017
    // && obj.netsummax_r0_5===0.0*obj.amount_ave_21//0 0.690 72197/107154



}