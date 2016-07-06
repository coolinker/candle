'use strict';
let React = require('react');
// let sampleData = [{ open: 15.5, close: 16, high: 16.5, low: 15.2 }, { open: 15.8, close: 15, high: 16.8, low: 14.2 }, { open: 15.5, close: 16, high: 16.8, low: 15.2 }, { open: 10.5, close: 10, high: 10.8, low: 9.2 }];
let ChartCanvas = require('./ChartCanvas');

module.exports = React.createClass({
    // getInitialState: function() {
    //     return { width: 2000, height: 1000};
    // },
    render: function() {
        
        let divstyle = {
            width: "100%",
            height: "100%",
            overflow: "hidden"
        }
        
        let cheight = 300;
        return <div  style={divstyle}>
            <ChartCanvas ref="candleChart"  width="1000" height={cheight}></ChartCanvas>
            <ChartCanvas ref="volChart" width="1000" height={cheight}></ChartCanvas>
        </div>
    }
});
