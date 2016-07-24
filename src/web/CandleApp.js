'use strict';
import React from "react";

import IO  from "./io";

let PainterCore = require('../chart/PainterCore');
let painterCore = new PainterCore();


let CandlePainter = require('../chart/CandlePainter');
let candlePainter = new CandlePainter(painterCore);
let VolumePainter = require('../chart/VolumePainter');
let volPainter = new VolumePainter(painterCore);

let PointerPainter = require('../chart/PointerPainter');
let pointerPainter = new PointerPainter(painterCore);

pointerPainter.mouseMoveHandler = function(e){
    if (!painterCore.arrayData) return;
    
    let x = e.x;
    let y = e.y;
    let candleCanvasX = parseInt(candlePainter.canvas.style.left, 10);
    let dataindex = painterCore.getDataIndexByX(x-candleCanvasX);
    let data = painterCore.getDataByIndex(dataindex);
    if (!data) return;
    let valuetoy = {};
    let candlePainterTop = 0//parseInt(candlePainter.canvas.style.top);
    valuetoy.open = candlePainterTop + candlePainter.getPriceY(data.open);
    valuetoy.close = candlePainterTop + candlePainter.getPriceY(data.close);
    valuetoy.high = candlePainterTop + candlePainter.getPriceY(data.high);
    valuetoy.low = candlePainterTop + candlePainter.getPriceY(data.low) ;
    valuetoy.date = candlePainterTop + candlePainter.canvas.height-5;

    let top = parseInt(volPainter.canvas.style.top) - parseInt(candlePainter.canvas.style.top);
    valuetoy.volume = top + Math.max(volPainter.getVolumeY(data.volume), 10) ;
    valuetoy.volumeStart = top;
    // console.log("-----------", valuetoy)
    pointerPainter.updatePointer(x, dataindex, valuetoy);
}

import ChartCanvas from './ChartCanvas';
import FormInput from './forms/FormInput';
import DateInput from './forms/DateInput';
import TradingDate from './TradingDate';

class CandleApp extends React.Component {
    constructor(props) {
        super(props);
        this.state = { windowWidth: window.innerWidth, windowHeight: window.innerHeight };
        this.handleSidChanged = this.handleSidChanged.bind(this);        
    }

    render() {
        
        let divstyle = {
            width: "100%",
            height: "100%",
            overflow: "hidden"
        };
        let toolbarStyle = {
             position: 'absolute',
            top: '0px',
            width: '100%',
            padding: '5px'
        };

        let toolbarHeight = 50;
        let candleChartHeight = this.state.windowHeight - 180 - toolbarHeight;
        let candleChartY = toolbarHeight;
        let volChartY = candleChartY + candleChartHeight;
        let volChartHeight = 180;
        let pointerCanvasY = candleChartY;
        let ponterCanvasHeight = candleChartHeight + volChartHeight;

        let sidwidth = 70;
        let sidinputleft = (this.state.windowWidth - sidwidth)/2;
        return <div style = { divstyle }>
                <div ref = "toolbar"  height = {toolbarHeight} style = {toolbarStyle}>
                <span style = {{color: '#f0f0f0', 'paddingRight':'5px', 'paddingLeft':'5px'}}>Code:</span>
                <span style = {{color: '#f0f0f0', 'paddingRight':'5px', 'paddingLeft':'5px'}}>&lt;</span>
                <FormInput ref="sidInput"  width={70} regex={"^(S|s)$|^(SH|sh)$|^(SZ|sz)$|^(SH|SZ|sh|sz)\\d{1,6}$"} validRegex={"^(sh|sz|SH|SZ)\\d{6}$"} value="SH999999"
                    handleInputCompleted={this.handleSidChanged}/>
                <span style = {{color: '#f0f0f0', 'paddingRight':'5px', 'paddingLeft':'5px'}}>&gt;</span>
                <span style = {{color: '#f0f0f0', 'paddingRight':'5px', 'paddingLeft':'10px'}}>Date:</span>
                <DateInput ref="dateInput" value={'07/04/2016'} handleInputCompleted={this.handleDateChanged}/>
             </div>
            <ChartCanvas ref = "candleChart" width = "2000" height = { candleChartHeight } y={candleChartY}> </ChartCanvas> 
            <ChartCanvas ref = "volChart" width = "2000" height = { volChartHeight } y={volChartY}> </ChartCanvas>
            <ChartCanvas ref = "pointerCanvas" width = {this.state.windowWidth} height={ponterCanvasHeight} y = {pointerCanvasY}> </ChartCanvas> 
        </div>
    }

    componentDidMount (){
        let domCanvas = this.refs.candleChart.getDomCanvas();
        candlePainter.setCanvas(domCanvas);

        let volCanvas = this.refs.volChart.getDomCanvas();
        volPainter.setCanvas(volCanvas);

        let pointerDomCanvas = this.refs.pointerCanvas.getDomCanvas();
        pointerPainter.setCanvas(pointerDomCanvas);

        let me = this;
        window.addEventListener('resize', function(e){
            me.setState({windowHeight: window.innerHeight, windowWidth: window.innerWidth});
            //me.doOnRange(true);
            me.doOnResize(e);
        });        

        document.addEventListener('keydown', function(e){
            if (e.keyCode === 37) {
                painterCore.moveDrawPort(3, me.state.windowWidth);
            } else if (e.keyCode === 39) {
                painterCore.moveDrawPort(-3, me.state.windowWidth);
            }  else if (e.keyCode === 38) {
                painterCore.updateUnitWidth(1);
            } else if (e.keyCode === 40) {
                painterCore.updateUnitWidth(-1);
            }
            console.log("keyCode", e.keyCode)
        });        

        document.addEventListener('keyup', function(e){
        });

        painterCore.on("range", function(){
            me.updateCanvasPosition(painterCore.drawRangeStart * painterCore.unitWidth);    
            let date = painterCore.getDateOfCurrentRange();
            console.log("on range:", painterCore.drawRangeStart, date)
             me.refs.dateInput.updateState(date, false);
        });

        
        let sid = this.refs.sidInput.state.value;
        let date = this.refs.dateInput.state.value;
        this.loadDataBySid(sid, date);

    }

    loadDataBySid(sid, date) {
        IO.httpGetStockJson(sid, function(json) {
            painterCore.loadData(json);
            //painterCore.setDrawRange(json.length-200, json.length-1);
            painterCore.updateDrawPort(date, window.innerWidth);
        });
    }

    handleSidChanged(sid) {
        let date = this.refs.dateInput.state.value;
        console.log("-----", sid)
        this.loadDataBySid(sid, date)
    }

    handleDateChanged(date) {
        console.log("-----", date)
        painterCore.updateDrawPort(date, window.innerWidth);
    }

    updateCanvasPosition(x) {
        //var core = this.props.painterCore;
        console.log("updateCanvasPosition", painterCore.drawRangeStart, painterCore.unitWidth, x)
        this.refs.candleChart.updateX(x);
        this.refs.volChart.updateX(x);
    }

    doOnResize(){
        // console.log("doOnResize", e)
        let date = painterCore.getDateOfCurrentRange();
        painterCore.updateDrawPort(date, this.state.windowWidth);
    }
}

export default  CandleApp;
