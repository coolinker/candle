'use strict';
import React from 'react';
import IO from './io';

import work from 'webworkify';
import WorkerProxy from './workerproxy';

let w = work(require('./dataworker.js'));
IO.dataWorkerProxy = new WorkerProxy(w);


let PainterCore = require('../chart/paintercore');
let painterCore = new PainterCore();


let CandlePainter = require('../chart/candlepainter');
let candlePainter = new CandlePainter(painterCore);
let VolumePainter = require('../chart/volumepainter');
let volPainter = new VolumePainter(painterCore);

let PointerPainter = require('../chart/pointerpainter');
let pointerPainter = new PointerPainter(painterCore);
pointerPainter.mouseDblclickHandler = function(e) {
    let x = e.x;
    let y = e.y;
    let candleCanvasX = parseInt(candlePainter.canvas.style.left, 10);
    let dataindex = painterCore.getDataIndexByX(x - candleCanvasX);
    let data = painterCore.getDataByIndex(dataindex);

    console.log('mouseDblclickHandler', data)
}
pointerPainter.mouseMoveHandler = function(e) {
    if (!painterCore.arrayData) return;

    let x = e.x;
    let y = e.y;
    let candleCanvasX = parseInt(candlePainter.canvas.style.left, 10);
    let dataindex = painterCore.getDataIndexByX(x - candleCanvasX);
    let data = painterCore.getDataByIndex(dataindex);
    if (!data) return;
    let valuetoy = {};
    let candlePainterTop = 0 //parseInt(candlePainter.canvas.style.top);
    valuetoy.open = candlePainterTop + candlePainter.getPriceY(data.open);
    valuetoy.close = candlePainterTop + candlePainter.getPriceY(data.close);
    valuetoy.high = candlePainterTop + candlePainter.getPriceY(data.high);
    valuetoy.low = candlePainterTop + candlePainter.getPriceY(data.low);
    valuetoy.date = candlePainterTop + candlePainter.canvas.height - 5;

    let top = parseInt(volPainter.canvas.style.top) - parseInt(candlePainter.canvas.style.top);
    valuetoy.amount = top + Math.max(volPainter.getAmountY(data.amount), 10);
    valuetoy.amountStart = top;
    pointerPainter.updatePointer(x, dataindex, valuetoy);
}

import ChartCanvas from './chartcanvas';
import FormInput from './forms/forminput';
import DateInput from './forms/dateinput';
import TradingDate from './tradingdate';
import StockIDs from './stockids';

class CandleApp extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            windowWidth: window.innerWidth,
            windowHeight: window.innerHeight
        };
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
        let candleChartHeight = this.state.windowHeight - 250 - toolbarHeight;
        let candleChartY = toolbarHeight;
        let volChartY = candleChartY + candleChartHeight;
        let volChartHeight = 250;
        let pointerCanvasY = candleChartY;
        let ponterCanvasHeight = candleChartHeight + volChartHeight;

        let sidwidth = 70;
        let sidinputleft = (this.state.windowWidth - sidwidth) / 2;
        return <div style = { divstyle } >
            <div ref = "toolbar" height = { toolbarHeight } style = { toolbarStyle } >
                <FormInput ref = "sidInput" width = { 65 } regex = { "^(S|s)$|^(SH|sh)$|^(SZ|sz)$|^(SH|SZ|sh|sz)\\d{1,6}$" } validRegex = { "^(sh|sz|SH|SZ)\\d{6}$" } value = "SH600022" handleInputCompleted = { this.handleSidChanged }/>
                <DateInput ref = "dateInput" value = { '07/04/2016' } handleInputCompleted = { this.handleDateChanged }/> 
            </div > 
            <ChartCanvas ref = "candleChart" width = "2000" height = { candleChartHeight } y = { candleChartY } > </ChartCanvas>  
            <ChartCanvas ref = "volChart" width = "2000" height = { volChartHeight } y = { volChartY } > </ChartCanvas> 
            <ChartCanvas ref = "pointerCanvas" width = { this.state.windowWidth } height = { ponterCanvasHeight } y = { pointerCanvasY } > </ChartCanvas>  
        </div >
    }

    componentDidMount() {
        let domCanvas = this.refs.candleChart.getDomCanvas();
        candlePainter.setCanvas(domCanvas);

        let volCanvas = this.refs.volChart.getDomCanvas();
        volPainter.setCanvas(volCanvas);

        let pointerDomCanvas = this.refs.pointerCanvas.getDomCanvas();
        pointerPainter.setCanvas(pointerDomCanvas);

        let me = this;
        window.addEventListener('resize', function(e) {
            me.setState({
                windowHeight: window.innerHeight,
                windowWidth: window.innerWidth
            });
            //me.doOnRange(true);
            me.doOnResize(e);
        });

        document.addEventListener('keydown', function(e) {
            if (e.keyCode === 39) {
                painterCore.moveDrawPort(3, me.state.windowWidth);
            } else if (e.keyCode === 37) {
                painterCore.moveDrawPort(-3, me.state.windowWidth);
            } else if (e.keyCode === 38) {
                painterCore.updateUnitWidth(1);
            } else if (e.keyCode === 40) {
                painterCore.updateUnitWidth(-1);
            } else if (e.keyCode === 34) {
                let sid = me.refs.sidInput.state.value;
                let nsid = StockIDs.getNext(sid);
                if (nsid) me.refs.sidInput.updateState(nsid, true);
                console.log("nsid", nsid)

            } else if (e.keyCode === 33) {
                let sid = me.refs.sidInput.state.value;
                let psid = StockIDs.getPrevious(sid);
                if (psid) me.refs.sidInput.updateState(psid, true);
                console.log("psid", psid)

            }
            console.log("keyCode", e.keyCode)
        });

        document.addEventListener('keyup', function(e) {});

        painterCore.on("range", function() {
            me.updateCanvasPosition(painterCore.drawRangeStart * painterCore.unitWidth);
            let date = painterCore.getDateOfCurrentRange();
            // console.log("on range:", painterCore.drawRangeStart, date)
            me.refs.dateInput.updateState(date, false);

        });


        let sid = this.refs.sidInput.state.value;
        let date = this.refs.dateInput.state.value;
        this.loadDataBySid(sid, date);
        setTimeout(function() {
            IO.workerStartLoadStocks(0, 100, function(re) {
                console.log("----", re)
            })
        }, 3000);
    }

    loadDataBySid(sid, date) {
        let start = new Date();
        IO.workerGetStockJson(sid, function(json) {
            if (!json) return;
            console.log("workerGetStockJson time", new Date() - start, sid, json.length)
            painterCore.loadData(json);
            painterCore.updateDrawPort(date, window.innerWidth);
            // IO.httpGetStockMoneyFlowJson(sid, function(json) {
            //     painterCore.updateMoneyFlow(json);
            //     // IO.httpGetStockFullJson(sid, 'date,open,close,high,low,amount,netamount,r0_net', function(json) {
            //     //     console.log("get full")
            //     // });
            // })

        });

    }

    handleSidChanged(sid) {
        let date = this.refs.dateInput.state.value;
        clearTimeout(this.timeoutHandler);
        let me = this;
        this.timeoutHandler = setTimeout(function() {
            console.log("-----loadDataBySid", sid, date)
            me.loadDataBySid(sid, date)
        }, 500);

    }

    handleDateChanged(date) {
        console.log("handleDateChanged", date)
        painterCore.updateDrawPort(date, window.innerWidth);
    }

    updateCanvasPosition(x) {
        //var core = this.props.painterCore;
        //console.log("updateCanvasPosition", painterCore.drawRangeStart, painterCore.unitWidth, x)
        this.refs.candleChart.updateX(x);
        this.refs.volChart.updateX(x);
    }

    doOnResize() {
        // console.log("doOnResize", e)
        let date = painterCore.getDateOfCurrentRange();
        painterCore.updateDrawPort(date, this.state.windowWidth);
    }

}

export default CandleApp;