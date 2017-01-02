'use strict';

import React from "react";

class StocksBoard extends React.Component {

    constructor(props) {
        super(props);
        this.sortFuns = {
           r0aboverate: (function(dn0, dn1){
               dn0 = this.state.data[dn0.key];
               dn1 = this.state.data[dn1.key];
               let r0 = dn0.netsum_r0_above/dn0.marketCap;
               let r1 = dn1.netsum_r0_above/dn1.marketCap;
               if (r0<r1) return 1;
               if (r0>r1) return -1;
               return 0;
           }).bind(this),
           r0above: (function(dn0, dn1){
               dn0 = this.state.data[dn0.key];
               dn1 = this.state.data[dn1.key];
               let r0 = dn0.netsum_r0_above;
               let r1 = dn1.netsum_r0_above;
               if (r0<r1) return 1;
               if (r0>r1) return -1;
               return 0;
           }).bind(this)  
        }

        this.state = {
            data: props.data,
            sort: 'r0aboverate'
        };

    }


    render() {

        let parentStyle = {
            position: 'absolute',
            border: "1px solid",
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'whitesmoke',
            fontSize: 'small',
            padding: '5px',
            width: '500px',
            height: '300px',
            resize: 'both',
            overflow: 'auto'
        };

        for (let att in this.props.parentStyle) {
            parentStyle[att] = this.props.parentStyle[att];
        }

        let stocks = this.state.data;
        let items = [];

        for (let sid in stocks) {
            let dn = stocks[sid];

            items.push(
                <ul key={sid}>
                    <li><b>{sid}</b> {dn.date}</li>
                    <li><img src={"http://image.sinajs.cn/newchart/daily/n/"
                    +sid.toLowerCase()+".gif"} width="400" height="250" style={{backgroundColor:'whitesmoke'}}></img>
                        </li>
                    <li>marketCap: {Math.round(dn.marketCap/100000000)} netsummax_duration: {dn.netsummax_duration}</li>
                    <li>netsum_r0_above: {Math.round(dn.netsum_r0_above/10000)} ({Math.round(10000*dn.netsum_r0_above/dn.marketCap)/10000}) netsum_r0_below: {Math.round(dn.netsum_r0_below/10000)}</li>  
                    <li>netsum_r0x_above: {Math.round(dn.netsum_r0x_above/10000)} ({Math.round(10000*dn.netsum_r0x_above/dn.marketCap)/10000}) netsum_r0x_below: {Math.round(dn.netsum_r0x_below/10000)}</li>  

                </ul>
            )
        }

        if (items.length===0) return null;

        items.sort(this.sortFuns[this.state.sort]);
        return <div style={parentStyle} ref={(ref) => this.scrollparent = ref} >
            <span style={{position:'absolute', right: '30px', cursor: 'pointer'}}>{items.length}</span>
            <a onClick={this.doClose.bind(this)} style={{position:'absolute', right: '5px', cursor: 'pointer'}}>x</a>
            <a style={{position:'absolute', left: '5px', cursor: 'pointer'}}
                onClick={(e) => {
                    this.doSort('r0aboverate')
                } }>R0AR</a>
            <a style={{position:'absolute', left: '55px', cursor: 'pointer'}}
                onClick={(e) => {
                    this.doSort('r0above')
                } }>R0A</a>
            <div ref={(ref) => this.scrollable = ref} style={{position: 'absolute', top:'10px'}}>
                {items}
            </div>
        </div>
    }

    doClose(){
        this.setState({data:[]});
    }

    doSort(s){
        this.setState({sort: s});
    }
}


export default StocksBoard;
