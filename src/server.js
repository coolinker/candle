'use strict';

let http = require("http"),
    url = require("url"),
    path = require("path"),
    fs = require('fs'),
    zlib = require('zlib'),
    port = process.argv[3] || 80,
    serverIp = process.argv[2] || "localhost";

let cacheMap = {};

let server = http.createServer(function(req, res) {
    let uri = url.parse(req.url).pathname;
    if (uri === "/api" && handleApiRequest(req, res)) {
        return;
    } else {
        let cpus = req.url.match('[?&]cpus=([^&]+)');
        if (uri === '/') uri = '/index.html';
        if (uri === '/index.html' && cpus === null) {
            res.writeHead(302, {
                'Location': '/index.html?cpus=4'
            });
            res.end();
        } else {
            uri = "../build" + uri;
            res.writeHead(200, {
                'Content-Type': 'text/html;charset=UTF-8'
            });
            if (fs.existsSync(uri)) {
                console.log(uri)
                let content = fs.readFileSync(uri);
                res.end(content);
            } else {
                console.log("file doesn't exists", uri);
                res.end("");
            }
        }

    }

}).listen(parseInt(port, 10));

console.log("Static file server running at\n  => http://" + serverIp + ":" + port + "/\nCTRL + C to shutdown");

function handleApiRequest(request, response) {
    //let query = url.parse(request.url, true).query;
    //let action = query.action;
    //if (!apiDispatcher[action]) return false;
    if (request.method == 'GET') {
        // apiDispatcher[action](query, function(output) {
        //         outputResponse(response, output);
        //     });
        console.log("There is no Get  API.")
        return false;
    } else if (request.method == 'POST') {
        let jsonString = '';
        request.on('data', function(data) {
            jsonString += data;
        });

        request.on('end', function() {
            let postJson = JSON.parse(jsonString);
            let action = postJson.action;
            if (!apiDispatcher[action]) return false;
            let startTime = new Date();
            apiDispatcher[action](postJson, function(output, gzip, cacheKey) {
                let endTime = new Date();
                console.log("Action", action, "takes", endTime - startTime, "ms");
                if (gzip) {
                    outputZipResponse(response, output, cacheKey);
                } else {
                    response.writeHead(200, {
                        "Content-Type": "application/json",
                        "Access-Control-Allow-Origin": "http://" + serverIp
                    });
                    if (output.error) output = JSON.stringify(output);
                    response.end(output);
                }

            });
        });
    }

    return true;
}

function outputZipResponse(response, output, cacheKey) {

    let headers = {
        "Content-Type": "application/json",
        "Content-Encoding": "gzip",
        "Access-Control-Allow-Origin": "http://" + serverIp
    }

    let needZip = true;
    if (cacheKey && cacheMap[cacheKey]) {
        needZip = false;
        output = cacheMap[cacheKey];
    }

    response.writeHead(200, headers);
    let startTime = new Date();

    if (needZip) {
        zlib.gzip(output, function(error, result) { // The callback will give you the 
            //response.write(result);
            if (cacheKey) cacheMap[cacheKey] = result;
            let endTime = new Date();
            console.log("gzip takes", endTime - startTime, "ms");
            response.end(result); // result, so just send it.
        });
    } else {
        response.end(output);
    }



}

function errorMessage(msg) {
    return {
        "error": msg
    };
}

let DataSourceIO = require("./alpha/datadourceio");
let dataSourceIO = new DataSourceIO('../data');
let apiDispatcher = {
    stockIds: function(params, outputCallback) {
        let filter = params.filter;
        let ids = dataSourceIO.getAllStockIds(filter);
        let str = JSON.stringify(ids);
        outputCallback(str);
    },


    stockCompressed: function(params, outputCallback) {
        let sid = params.sid;
        let fields = params.fields.split(',');
        let content = dataSourceIO.readStockFullJsonSync(sid.toUpperCase(), fields);
        if (content) {
            let str = JSON.stringify(content);
            outputCallback(str, true);
        } else {
            outputCallback(errorMessage("Can not find stockFull:" + sid));
        }

    },

    stocksCompressed: function(params, outputCallback) {
        let sids = params.sids.split(',');
        let fields = params.fields.split(',');
        let obj = {
            fields: params.fields,
            data: {}
        };
        for (let i = 0; i < sids.length; i++) {
            let sid = sids[i];
            let content = dataSourceIO.readStockCompressedJsonSync(sid.toUpperCase(), fields);
            if (content) {
                obj.data[sid] = content.data;
            } else {
                obj.data[sid] = [];
                console.log("Can not find stockFull:" + sid);
            }
        }

        let str = JSON.stringify(obj);
        outputCallback(str, true, params.fields + params.sids);
    },

    stock: function(params, outputCallback) {
        let sid = params.sid;
        let content = dataSourceIO.readJsonSync(sid.toUpperCase());
        if (content) {
            let str = JSON.stringify(content);
            outputCallback(str, true);
        } else {
            outputCallback(errorMessage("Can not find stock:" + sid));
        }

    },

    stockMoneyFlow: function(params, outputCallback) {
        let sid = params.sid;
        let content = dataSourceIO.readMoneyFlowSync(sid.toUpperCase());
        if (content) {
            let str = JSON.stringify(content);
            outputCallback(str, true);
        } else {
            outputCallback(errorMessage("Can not find money flow:" + sid));
        }

    },

    thirdPartyAjaxAPI: function(params, outputCallback) {
        let url = params.url;
        let mtd = params.http;
        dataSourceIO.thirdPartyAjaxAPI(url, mtd, function(output) {
            outputCallback(output);
        });
    }

}