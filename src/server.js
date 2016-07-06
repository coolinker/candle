'use strict';

let http = require("http"),
    url = require("url"),
    path = require("path"),
    fs = require('fs'),
    port = process.argv[3] || 80,
    serverIp = process.argv[2] || "localhost";

let server = http.createServer(function(req, res) {
    let uri = url.parse(req.url).pathname;
    if (uri === "/api" && handleApiRequest(req, res)) {
        return;
    } else {
        if (uri ==='/') uri = '/index.html';
        uri = "../build" + uri;
        console.log(uri)
        let content = fs.readFileSync(uri);
        res.writeHead(200, {'Content-Type': 'text/html;charset=UTF-8'});
        res.end(content);
    }

}).listen(parseInt(port, 10));

console.log("Static file server running at\n  => http://" + serverIp + ":" + port + "/\nCTRL + C to shutdown");

function handleApiRequest(request, response) {
    let query = url.parse(request.url, true).query;
    let action = query.action;
    if (!apiDispatcher[action]) return false;
    if (request.method == 'GET') {
        apiDispatcher[action](query, function(output) {
                outputResponse(response, output);
            });
    } else if (request.method == 'POST') {
        let jsonString = '';
        request.on('data', function(data) {
            jsonString += data;
        });

        request.on('end', function() {
            let postJson = JSON.parse(jsonString);
            apiDispatcher[action](postJson, function(output) {
                outputResponse(response, output);
            });
        });
    }

    return true;
}

function outputResponse(response, output) {
    response.writeHead(200, {
        "Content-Type": "application/x-javascript; charset=utf-8",
        // 'Content-Length': output.length
        "Access-Control-Allow-Origin": "http://" + serverIp
    });
    response.write(output);
    response.end();
}

let DataSourceIO = require("./alpha/DataSourceIO");
let dataSourceIO = new DataSourceIO('../data');
let apiDispatcher = {
    stock: function(params, outputCallback) {
        let sid = params.sid;
        let str = JSON.stringify(dataSourceIO.readJsonSync(sid.toUpperCase()));
        outputCallback(str);
    }

}
