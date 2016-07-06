'use strict';
let Canvas = require('canvas')
  , canvas = new Canvas(500, 500)
  , ctx = canvas.getContext('2d')
  , fs = require('fs');

let sampleData = [{open: 15.5, close: 16, high:16.5, low:15.2}, {open: 15.5, close: 16, high:16.8, low:14.2}, {open: 15.5, close: 16, high:16.8, low:15.2}, {open: 10.5, close: 10, high:10.8, low:9.2}];

let CandlePainter = require("./CandlePainter.js");
let PainterCore = require("./PainterCore.js");

let painterCore = new PainterCore();
let ccc = new CandlePainter(canvas, painterCore);

painterCore.loadArrayData(sampleData);
painterCore.setDrawRange(0, 3);

let out = fs.createWriteStream('candel.png')
  , stream = canvas.createPNGStream();

stream.on('data', function(chunk){
  out.write(chunk);
});