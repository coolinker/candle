'use strict';
import 'whatwg-fetch';

class WorkerProxy {
    constructor(worker) {
        let me = this;
        worker.addEventListener('message', function(ev) {
            //console.log("app on message", ev.data);
            me.doOnMessage(ev);
        });
        this.worker = worker;
        this.penddingCalls = {};
    }

    callMethod(methodName, params, callback) {
        let mkey = this.getMethodKey(methodName);
        this.penddingCalls[mkey] = callback;
        this.worker.postMessage({
            methodName: methodName,
            mkey: mkey,
            params: params
        });
    }

    doOnMessage(ev) {
        let mkey = ev.data.mkey;
        let cb = this.penddingCalls[mkey];
        if (ev.data.finished) {
            delete this.penddingCalls[mkey];
        }
        cb(ev.data.result);
    }

    getMethodKey(m) {
        let key = m + "_" + Math.round(Math.random() * 100);
        while (this.penddingCalls[key]) {
            key = m + "_" + Math.round(Math.random() * 100);
        }
        return key;
    }

}

export default WorkerProxy