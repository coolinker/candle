'use strict';
import React from 'react';
import IO from './io';
import work from 'webworkify';
import WorkerGroup from './workergroup';

let cpus = window.location.search.match('[?&]cpus=([^&]+)');
if (cpus && cpus.length) cpus = cpus[1];
else cpus = 4;

cpus = Number(cpus);
if (isNaN(cpus)) cpus = 4;
let pworks = [];
for (let i = 0; i < cpus; i++) {
    let w = work(require('./dataworker.js'));
    pworks.push(w);
}

WorkerGroup.setDataWorkers(pworks);

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
pointerPainter.mouseDblclickHandler = function (e) {
    let x = e.x;
    let y = e.y;
    let candleCanvasX = parseInt(candlePainter.canvas.style.left, 10);
    let dataindex = painterCore.getDataIndexByX(x - candleCanvasX);

    let data = painterCore.getDataByIndex(dataindex);

    console.log("mouseDblclickHandler", data)
}

pointerPainter.selectionHandler = function (x, y, endx, endy) {
    let candleCanvasX = parseInt(candlePainter.canvas.style.left, 10);
    let startindex = painterCore.getDataIndexByX(x - candleCanvasX);
    let endindex = painterCore.getDataIndexByX(endx - candleCanvasX);
    if (startindex > endindex) {
        let temp = startindex;
        startindex = endindex;
        endindex = temp;
    }

    painterCore.zoom(startindex, endindex);
}

pointerPainter.mouseMoveHandler = function (e) {
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
    pointerPainter.updatePointer(e.layerX, e.layerY, dataindex, valuetoy);
}

import ChartCanvas from './chartcanvas';
import FormInput from './components/forms/forminput';
import DateInput from './components/forms/dateinput';
import ToolButton from './components/toolbutton';
import StocksBoard from './components/stocksboard';
import TradingDate from './tradingdate';
import StockIDs from './stockids';
import LocalStoreUtil from './localstoreutil';

class CandleApp extends React.Component {
    constructor(props) {
        super(props);
        this.handleSidChanged = this.handleSidChanged.bind(this);
        this.handleSidInputChagned = this.handleSidInputChagned.bind(this);
        this.toggleMatchTextArea = this.toggleMatchTextArea.bind(this);
        this.handleMatchTextAreaChange = this.handleMatchTextAreaChange.bind(this);
        this.handleMatchTextAreaKeyUp = this.handleMatchTextAreaKeyUp.bind(this);
        this.scanAllDoAction = this.scanAllDoAction.bind(this);
        this.analyseDoAction = this.analyseDoAction.bind(this);
        this.candidateDoAction = this.candidateDoAction.bind(this);
        this.candidateDoInfoClick = this.candidateDoInfoClick.bind(this);
        this.doDblClickPointerCanvas = this.doDblClickPointerCanvas.bind(this);
        //let matchStr = LocalStoreUtil.getCookie('scanExp');
        let matchStr = LocalStoreUtil.getLastOfKey('scanExp');
        if (!matchStr) {
            matchStr = 'function() { \n' + '    let right_lowidx = lowPI(d,n-8, n, "low");\n' + '    if(diffR(d[right_lowidx].low, d[right_lowidx].ave_close_8) < 1*priceCRA(d, right_lowidx, 8)) return false;\n\n' + '    let mid_highidx = highPI(d, right_lowidx-8, right_lowidx, "high");\n' + '    if (diffR(d[right_lowidx].low, d[mid_highidx].high) < 2* priceCRA(d, right_lowidx, 8)) return false;\n\n' + '    let left_lowidx = lowPI(d,mid_highidx -20, mid_highidx , "low");\n' + '    if(diffR(d[left_lowidx].low, d[left_lowidx].ave_close_8) < 1.5*priceCRA(d, right_lowidx, 8)) return false;\n\n' + '    if (d[left_lowidx].ave_close_8 > d[left_lowidx].ave_close_13) return false;\n\n' + '    return true\n' + '} ()'

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
            overflow: "hidden",
            color: 'rgba(220, 220, 220, 0.6)'
        };
        let toolbarStyle = {
            position: 'absolute',
            top: '0px',
            width: '100%',
            padding: '5px',
            zIndex: 100,
        };

        let toolbarHeight = 40;

        let candleChartHeight = Math.floor((this.state.windowHeight - toolbarHeight) * 2 / 3);
        let candleChartY = toolbarHeight;
        let volChartY = candleChartY + candleChartHeight;
        let volChartHeight = Math.floor((this.state.windowHeight - toolbarHeight) / 3);;
        let pointerCanvasY = candleChartY;
        let ponterCanvasHeight = candleChartHeight + volChartHeight;

        let sidwidth = 70;
        let sidinputleft = (this.state.windowWidth - sidwidth) / 2;
        return <div style={divstyle} >
            <div ref="toolbar" height={toolbarHeight} style={toolbarStyle}>
                <FormInput ref="sidInput" style={{ color: '#c0c0c0', position: 'absolute', top: '40px', width: '75px', borderStyle: 'groove', borderColor: 'rgba(220, 220, 220, 0.6)', backgroundColor: 'black' }}
                    validRegex={"^(sh|sz|SH|SZ)\\d{6}$"} value="SH000001"
                    handleInputChanged={this.handleSidInputChagned} onKeyDownHandler={function (e) { e.nativeEvent.stopImmediatePropagation() } } />
                <div style={{ position: 'absolute', top: '65px', zIndex: 1000, 'fontSize': 'small', backgroundColor: 'black' }} ref={(ref) => this.suggest = ref} />
                <DateInput ref="dateInput" value={'07/04/2016'} style={{ color: '#c0c0c0', position: 'absolute', top: '40px', left: '75px', width: '130px', borderStyle: 'groove', borderColor: 'rgba(220, 220, 220, 0.6)', backgroundColor: 'black' }}
                    handleInputCompleted={this.handleDateChanged} onKeyDownHandler={function (e) { e.nativeEvent.stopImmediatePropagation() } } />
                <div style={{ position: 'absolute', top: '5px', right: '10px', 'fontSize': 'small' }} ref={(ref) => this.info = ref}>Loading...</div>

                <ToolButton ref={(ref) => this.candidateBtn = ref} btnStyle={{ top: '5px', left: '10px' }} text="CND" enabled="false" doAction={this.candidateDoAction}
                    doInfoClick={this.candidateDoInfoClick}></ToolButton>

                <ToolButton ref={(ref) => this.scanAllBtn = ref} btnStyle={{ top: '5px', left: '110px' }} text="SCN" enabled="false" doAction={this.scanAllDoAction}
                    doInfoClick={this.scanAllDoInfoClick}></ToolButton>

                <ToolButton ref={(ref) => this.analyseBtn = ref} btnStyle={{ top: '5px', left: '210px' }} text="ANLS" enabled="false" doAction={this.analyseDoAction}></ToolButton>

                <div style={{ position: 'absolute', right: '10px', top: '25px', cursor: 'pointer', 'fontSize': 'small' }} ref={(ref) => this.scanInfo = ref} onClick={this.toggleMatchTextArea}>0/0/0/0(run:Ctrl+↵)</div>
                <textarea value={this.state.matchStr} style={{ position: 'absolute', right: '20px', color: 'whitesmoke', top: '40px', zIndex: 1000, width: '500px', height: '500px', background: 'rgba(0, 0, 0, 0.8)', 'fontSize': '12px', 'fontFamily': '微软雅黑' }}
                    ref={(ref) => this.matchTextArea = ref} onChange={this.handleMatchTextAreaChange} onKeyUp={this.handleMatchTextAreaKeyUp} onKeyDown={function (e) { e.nativeEvent.stopImmediatePropagation(); } }></textarea>
                <StocksBoard ref={(ref) => this.stocksBoard = ref} parentStyle={{ zIndex: 1001, top: toolbarHeight+'px', height: (this.state.windowHeight - toolbarHeight)+'px' }}></StocksBoard>
            </div >
            <ChartCanvas ref={(ref) => this.alphaChart = ref} width="2000" height={candleChartHeight} y={candleChartY}> </ChartCanvas>
            <ChartCanvas ref="candleChart" width="2000" height={candleChartHeight} y={candleChartY} > </ChartCanvas>
            <ChartCanvas ref="volChart" width="2000" height={volChartHeight} y={volChartY} > </ChartCanvas>
            <ChartCanvas ref="pointerCanvas" width={this.state.windowWidth} height={ponterCanvasHeight} y={pointerCanvasY} doDblClick={this.doDblClickPointerCanvas}> </ChartCanvas>

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
        window.addEventListener('resize', function (e) {
            me.setState({
                windowHeight: window.innerHeight,
                windowWidth: window.innerWidth
            });
            //me.doOnRange(true);
            me.doOnResize(e);
        });

        document.addEventListener('keydown', function (e) {
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

        painterCore.on("range", function () {
            let date = painterCore.getMiddleDateOfRange();
            // console.log("on range:", painterCore.drawRangeStart, date)
            me.refs.dateInput.updateState(date, false);

        });

        let sid = this.refs.sidInput.state.value;
        let date = this.refs.dateInput.state.value;
        let matchStr = this.matchTextArea.value;

        //this.loadDataBySid(sid, date);
        this.handleSidInputChagned();

        setTimeout(function () {
            let count = 0;
            WorkerGroup.loadStocksPerPage(function (re) {
                count += re.count;
            });
            let total = StockIDs.getTotalCount();
            let timer = 0;
            let spinner = ['/', '—', '\\', '|'];
            let interval = setInterval(function () {
                timer++;
                let per = Math.round(100 * (count / total));
                me.info.innerHTML = count + '(' + per + '%)'; //+ spinner[timer % 4];
                if (count === total) {
                    clearInterval(interval);
                    me.info.innerHTML = count + '(' + per + '%)';
                    me.handlePageLoadFinished();
                }
            }, 100);

        }, 5000)

    }

    doDblClickPointerCanvas(e) {
        let x = e.clientX;
        let y = e.clinetY;
        let candleCanvasX = parseInt(candlePainter.canvas.style.left, 10);
        let dataindex = painterCore.getDataIndexByX(x - candleCanvasX);

        let data = painterCore.getDataByIndex(dataindex);
        let matchCases = data.matchCases;
        let me = this;
        if (matchCases) {
            let cases = matchCases.bull.concat(matchCases.bear.concat(matchCases.pending));
            let date = data.date;
            WorkerGroup.getStockDataOnDate(cases, date, function (d) {
                me.stocksBoard.setState({ data: d });
            })
        }

    }

    analyseDoAction() {
        let matchStr = this.matchTextArea.value;
        WorkerGroup.workersBuildAndAnalyse(matchStr, function (re) {
            console.log("workersBuildAndAnalyse", re)
        });
    }

    scanAllDoInfoClick() {
        WorkerGroup.workersStopScanByIndex(function (re) {
            console.log("workerStopScanAll", re)
        });
    }

    scanAllDoAction() {

        let me = this;
        let count = 0,
            bull = 0,
            bear = 0,
            cases = 0;
        let matchStr = this.matchTextArea.value;
        painterCore.clearMatchCases();

        WorkerGroup.workersScanByIndex(matchStr, { startFrom: 80, endOffset: 20 }, function (cnts) { // && data[n].ave_close_8 > data[n-2].ave_close_8 && data[n].ave_close_8 > data[n-3].ave_close_8
            count++; //= cnts.index;
            bull += cnts.bull;
            bear += cnts.bear;
            cases += cnts.cases;
            painterCore.addMatchCases(cnts.sid, cnts.matchOnDate)
            let per = bull + bear > 0 ? Math.round(1000 * bull / cases) / 10 : 0;
            me.scanAllBtn.setState({ info: per + '%/' + cases + '/' + count })
        })
        LocalStoreUtil.addToStore('scanExp', matchStr, 100);
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
            this.scanInfo.innerHTML = pct + '/' + bull + '/' + bear + '/' + cases + '(run:Ctrl+↵)';
        }

    }

    handleMatchTextAreaChange(e) {
        this.setState({
            matchStr: e.target.value
        });

    }

    toggleMatchTextArea() {
        let display = this.matchTextArea.style.display;
        this.matchTextArea.style.display = display === 'none' ? 'block' : 'none';
    }

    loadDataBySid(sid, date) {
        let start = new Date();
        WorkerGroup.workerGetStockJson(sid, function (json) {
            if (!json) return;
            console.log("workerGetStockJson time", new Date() - start, sid, json.length)
            painterCore.loadData(json);
            painterCore.updateDrawPort(date, window.innerWidth);


        });

    }

    candidateDoInfoClick() {
        WorkerGroup.workersStopScanByIndex(function (re) {
            console.log("workerStopScanAll", re)
        });
    }

    candidateDoAction() {
        let me = this;
        let count = 0,
            bull = 0,
            bear = 0,
            cases = 0;
        painterCore.clearMatchCases();
        IO.httpReadBullFilters(function (filters) {
            WorkerGroup.workersScanByIndex(filters, { startOffset: 60, endOffset: 0 }, function (cnts) { // && data[n].ave_close_8 > data[n-2].ave_close_8 && data[n].ave_close_8 > data[n-3].ave_close_8
                count++; //= cnts.index;
                bull += cnts.bull;
                bear += cnts.bear;
                cases += cnts.cases;
                painterCore.addMatchCases(cnts.sid, cnts.matchOnDate)
                let per = bull + bear > 0 ? Math.round(1000 * bull / cases) / 10 : 0;
                me.candidateBtn.setState({ info: per + '%/' + cases + '/' + count })

                if (cnts.finished && count === StockIDs.getTotalCount()) {

                    console.log("-------------------------bull/bear/cases:", bull, bear, cases)
                }
            })

        });
    }


    handlePageLoadFinished() {
        console.log("page load finished")
        this.candidateBtn.setState({ enabled: true });
        this.scanAllBtn.setState({ enabled: true })
        this.analyseBtn.setState({ enabled: true })
    }


    handleSidInputChagned(value) {
        if (this.timeoutHandleSidInputChagned) {
            clearTimeout(this.timeoutHandleSidInputChagned);
        }

        let me = this;
        this.timeoutHandleSidInputChagned = setTimeout(function () {
            let sidin = me.refs.sidInput.state.value;
            if (sidin === '') return;

            IO.sidSuggest(sidin, function (arr) {
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
        this.timeoutHandler = setTimeout(function () {
            me.loadDataBySid(sid, date)
        }, 500);

    }

    handleDateChanged(date) {
        console.log("handleDateChanged", date)
        painterCore.updateDrawPort(date, window.innerWidth);
    }

    doOnResize() {
        // console.log("doOnResize", e)
        let date = painterCore.getMiddleDateOfRange();
        painterCore.updateDrawPort(date, this.state.windowWidth);
    }

}

export default CandleApp;