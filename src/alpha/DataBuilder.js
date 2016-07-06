'use strict';

module.exports = class DataBuilder {
    constructor() {
        this.dataSourceRoot = "../../datasource";
        let DataSourceIO = require('./DataSourceIO');
        this.dataSouceIO = new DataSourceIO();
    }

    buildJson(){
        let ids = this.dataSouceIO.allStockIDArray;
        for (let i=0; i<ids.length; i++) {
            this.buildStockJson(ids[i]);
            // let jsondata = this.dataSouceIO.readBaseSync(ids[i]);
            // this.dataSouceIO.writeJsonSync(ids[i], jsondata);
        }
    }

    buildStockJson(sid){
        let jsondata = this.dataSouceIO.readBaseSync(sid);
        this.dataSouceIO.writeJsonSync(sid, jsondata);
    }
}
