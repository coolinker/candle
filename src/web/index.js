'use strict';

let ReactDOM = require('react-dom');
let React = require('react');
let io = require('./io');

let PainterCore = require('../chart/PainterCore');
let painterCore = new PainterCore();

io.httpGetStockJson('sh600006', function(json) {
    painterCore.loadData(json);
    painterCore.setDrawRange(json.length-200, json.length-1);
});

let CandlePainter = require('../chart/CandlePainter');
let candlePainter = new CandlePainter(painterCore);
let volPainter = new CandlePainter(painterCore);

let CandleApp = require('./CandleApp');

let candleApp = ReactDOM.render( 
    < CandleApp/>,
    document.getElementById('app')
);

let domCanvas = candleApp.refs.candleChart.getDomCanvas();
candlePainter.setCanvas(domCanvas);

let volCanvas = candleApp.refs.volChart.getDomCanvas();
volPainter.setCanvas(volCanvas);