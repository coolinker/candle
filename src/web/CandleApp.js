'use strict';
import React from 'react';
import IO from './io';

import work from 'webworkify';


let w0 = work(require('./dataworker.js'));
let w1 = work(require('./dataworker.js'));
let w2 = work(require('./dataworker.js'));
// IO.dataWorkerProxy = new WorkerProxy(w);
IO.setDataWorkers([w0, w1, w2]);
let loadStockStarts = [0, 800, 1800];

let PainterCore = require('../chart/paintercore');
let painterCore = new PainterCore();


let CandlePainter = require('../chart/candlepainter');
let candlePainter = new CandlePainter(painterCore);
let AlphaPainter = require('../chart/alphapainter');
let alphaPainter = new AlphaPainter(painterCore);

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
    console.log("mouseDblclickHandler", data)
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
    valuetoy.open = candlePainter.getPriceY(data.open);
    valuetoy.close = candlePainter.getPriceY(data.close);
    valuetoy.high = candlePainter.getPriceY(data.high);
    valuetoy.low = candlePainter.getPriceY(data.low);
    valuetoy.date = candlePainter.canvas.height - 5;

    let top = parseInt(volPainter.canvas.style.top) - parseInt(candlePainter.canvas.style.top);
    valuetoy.amount = top + Math.max(volPainter.getAmountY(data.amount), 10);
    valuetoy.amountStart = top;
    pointerPainter.updatePointer(x, y - parseInt(candlePainter.canvas.style.top), dataindex, valuetoy);
}

import ChartCanvas from './chartcanvas';
import FormInput from './forms/forminput';
import DateInput from './forms/dateinput';
import TradingDate from './tradingdate';
import StockIDs from './stockids';
import LocalStoreUtil from './localstoreutil';

class CandleApp extends React.Component {
    constructor(props) {
        super(props);
        this.handleSidChanged = this.handleSidChanged.bind(this);
        this.handleSidInputChagned = this.handleSidInputChagned.bind(this);
        this.handleMatchTextAreaChange = this.handleMatchTextAreaChange.bind(this);
        this.handleMatchTextAreaKeyUp = this.handleMatchTextAreaKeyUp.bind(this);
        this.scanAllBtnClick = this.scanAllBtnClick.bind(this);

        let matchStr = LocalStoreUtil.getCookie('scanExp');
        if (!matchStr) {
            matchStr = 'function(m1, m2, p1, p2) { \nvar rightBottomIdx = lowPI(d, n - m2, n, "low");' + '\nvar midTopIdx = highPI(d, rightBottomIdx - m2, rightBottomIdx, "high");' + '\nvar leftBottomIdx = lowPI(d, midTopIdx - m2, midTopIdx, "low");' + '\nvar leftTopIdx = highPI(d, leftBottomIdx - m1, leftBottomIdx, "high");' + '\nreturn diffR(d[n].close, d[midTopIdx].high) > p1' + '\n&& diffR(d[leftTopIdx].high, d[midTopIdx].high) > p2' + '\n} (25,10, -1.25,0.18)'
        }

        this.state = {
            windowWidth: window.innerWidth,
            windowHeight: window.innerHeight,
            matchStr: unescape(matchStr)
        };
        //         Math.max(diffR(dn.close, dn.ave_close_8),diffR(dn.close, dn.ave_close_13)) > 0.5*priceCRA(d,n,8)
        // && dn.turnover<100
        // && dn.ave_close_13 < d[n-1].ave_close_13
        // && aboveS(d,n,'r0_net', dn.netsummax_r0_duration) > bellowS(d,n,'r0_net', dn.netsummax_r0_duration)*1


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
                <FormInput ref = "sidInput" style={{color: '#c0c0c0', width: '65px', borderStyle: 'groove', borderColor: '#424242', backgroundColor: 'transparent',}} 
                    validRegex = {"^(sh|sz|SH|SZ)\\d{6}$"} value = "SH999999"
                    handleInputChanged = {this.handleSidInputChagned} onKeyDownHandler ={function(e){e.nativeEvent.stopImmediatePropagation()}}/>
                <div style = {{position: 'absolute', top: '30px', color: '#c0c0c0', zIndex: 100}} ref={(ref) => this.suggest = ref}/>
                <DateInput ref = "dateInput" value = { '07/04/2016' } style={{color: '#c0c0c0', width: '130px', borderStyle: 'groove', borderColor: '#424242', backgroundColor: 'transparent',}} 
                    handleInputCompleted = { this.handleDateChanged } onKeyDownHandler ={function(e){e.nativeEvent.stopImmediatePropagation()}}/> 
                <div style = {{position: 'absolute', right: '20px',  color: '#f0f0f0', top:'10px'}} ref={(ref) => this.info = ref}>Loading...</div>
                <div style = {{position: 'absolute', right: '40px',  color: '#f0f0f0', top:'30px'}} ref={(ref) => this.scanAllInfo = ref}>0/0/0</div>
                <div style = {{position: 'absolute', right: '20px',  color: '#f44336', top:'30px'}} onClick={this.scanAllBtnClick} ref={(ref) => this.scanAllBtn = ref}>►</div>
                <div style = {{position: 'absolute', right: '420px',  color: '#f0f0f0', top:'30px'}} ref={(ref) => this.scanInfo = ref}>0/0/0(Ctrl+Enter)</div>
                <textarea value={this.state.matchStr} style = {{position: 'absolute', right: '20px',  color: 'rgba(230, 230, 230, 1)', borderColor: 'rgba(230, 230, 230, 0.1)', top:'50px', zIndex: 100, width: '500px', height: '100px', background: 'transparent', 'fontSize': '10px'}} 
                    ref={(ref) => this.matchTexArea = ref} onChange={this.handleMatchTextAreaChange} onKeyUp={this.handleMatchTextAreaKeyUp} onKeyDown ={function(e){e.nativeEvent.stopImmediatePropagation();}}></textarea>
            </div > 
            <ChartCanvas ref={(ref) => this.alphaChart = ref} width = "2000" height = { candleChartHeight } y = { candleChartY } > </ChartCanvas>  
            <ChartCanvas ref = "candleChart" width = "2000" height = { candleChartHeight } y = { candleChartY } > </ChartCanvas>  
            <ChartCanvas ref = "volChart" width = "2000" height = { volChartHeight } y = { volChartY } > </ChartCanvas> 
            <ChartCanvas ref = "pointerCanvas" width = { this.state.windowWidth } height = { ponterCanvasHeight } y = { pointerCanvasY } > </ChartCanvas>  
        </div >
    }

    componentDidMount() {
        let candleCanvas = this.refs.candleChart; //.getDomCanvas();
        candlePainter.setCanvas(candleCanvas);

        let alphaCanvas = this.alphaChart; //.getDomCanvas();
        alphaPainter.setCanvas(alphaCanvas);

        let volCanvas = this.refs.volChart; //.getDomCanvas();
        volPainter.setCanvas(volCanvas);

        let pointerDomCanvas = this.refs.pointerCanvas; //.getDomCanvas();
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
            // console.log(e.ctrlKey, e.keyCode)
            if (e.ctrlKey) {
                if (e.keyCode === 37) {
                    painterCore.moveToPattern(-1, me.state.windowWidth);
                } else if (e.keyCode === 39) {
                    painterCore.moveToPattern(1, me.state.windowWidth);
                }

            } else if (e.keyCode === 39) {
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
            //console.log("keyCode", e.keyCode)
        });

        //document.addEventListener('keyup', function(e) {});

        painterCore.on("range", function() {
            let date = painterCore.getDateOfCurrentRange();
            // console.log("on range:", painterCore.drawRangeStart, date)
            me.refs.dateInput.updateState(date, false);

        });

        let sid = this.refs.sidInput.state.value;
        let date = this.refs.dateInput.state.value;
        let matchStr = this.matchTexArea.value;

        this.loadDataBySid(sid, date);
        setTimeout(function() {
            IO.loadStocksPerPage(loadStockStarts, function(re) {
                me.info.innerHTML = re;
            });
        }, 3000)

    }

    scanAllBtnClick() {
        let start = this.scanAllBtn.innerHTML === '►';
        if (!start) {
            this.scanAllBtn.innerHTML = '►';
            IO.workerStopScanByIndex(function(re) {
                console.log("workerStopScanAll", re)
            });
            return;
        }

        this.scanAllBtn.innerHTML = '□'; // '❚❚';
        let me = this;
        let count = 0,
            bull = 0,
            bear = 0,
            cases = 0;
        let matchStr = this.matchTexArea.value;
        painterCore.clearMatchCases();
        IO.workersScanByIndex(matchStr, function(cnts) { // && data[n].ave_close_8 > data[n-2].ave_close_8 && data[n].ave_close_8 > data[n-3].ave_close_8
            count = cnts.index;
            bull += cnts.bull;
            bear += cnts.bear;
            cases += cnts.cases;
            painterCore.addMatchCases(cnts.sid, cnts.matchOnDate)
            let per = bull + bear > 0 ? Math.round(100 * bull / (bull + bear)) : 0;
            me.scanAllInfo.innerHTML = per + '%/' + cases + '/' + count;
            if (cnts.finished) {
                me.scanAllBtn.innerHTML = '►';
            }
        })
    }

    handleMatchTextAreaKeyUp(e) {
        if (e.keyCode === 13 && e.ctrlKey) {
            // console.log("handleMatchTextAreaKeyUp", this.state.matchStr)
            let result = painterCore.scanData(this.state.matchStr);
            let bull = result.bull;
            let bear = result.bear;
            let cases = result.cases;
            let pct = bull / (bull + bear);
            pct = isNaN(pct) ? 0 : Math.round(pct * 100) / 100;
            this.scanInfo.innerHTML = pct + '/' + bull + '/' + bear + '/' + cases + '(Ctrl+Enter)'
        }

    }
    handleMatchTextAreaChange(e) {
        this.setState({
            matchStr: e.target.value
        });
        LocalStoreUtil.setCookie('scanExp', escape(e.target.value));
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

    handleSidInputChagned(value) {
        if (this.timeoutHandleSidInputChagned) {
            clearTimeout(this.timeoutHandleSidInputChagned);
        }

        let me = this;
        this.timeoutHandleSidInputChagned = setTimeout(function() {
            let sidin = me.refs.sidInput.state.value;
            if (sidin === '') return;

            IO.sidSuggest(sidin, function(arr) {
                //console.log(arr)
                let list = "",
                    count = 0,
                    ssid;
                for (let i = 0; i < arr.length; i++) {
                    let sid = arr[i].sid.toUpperCase();
                    sid = StockIDs.validSid(sid);
                    if (sid) {
                        list += sid + ' ' + arr[i].name + '<br/>';
                        count++;
                        ssid = sid;
                    }
                }

                console.log("count", count, ssid)
                if (count === 1) me.handleSidChanged(ssid);
                me.suggest.innerHTML = list;
            })

        }, 500);
    }

    handleSidChanged(sid) {
        let date = this.refs.dateInput.state.value;
        clearTimeout(this.timeoutHandler);
        let me = this;
        this.timeoutHandler = setTimeout(function() {
            me.loadDataBySid(sid, date)
        }, 500);

    }

    handleDateChanged(date) {
        console.log("handleDateChanged", date)
        painterCore.updateDrawPort(date, window.innerWidth);
    }

    doOnResize() {
        // console.log("doOnResize", e)
        let date = painterCore.getDateOfCurrentRange();
        painterCore.updateDrawPort(date, this.state.windowWidth);
    }

}

export default CandleApp;