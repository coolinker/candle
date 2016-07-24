'use strict';

// let sampleData = [{ open: 15.5, close: 16, high: 16.5, low: 15.2 }, { open: 15.8, close: 15, high: 16.8, low: 14.2 }, { open: 15.5, close: 16, high: 16.8, low: 15.2 }, { open: 10.5, close: 10, high: 10.8, low: 9.2 }];
import React from "react";

class ChartCanvas extends React.Component {
    constructor(props) {
        super(props);
    }
    // getInitialState: function() {
    //     return { width: 2000, height: 1000};
    // },
    render() {
        let cstyle = {
            position: 'absolute',
            top: this.props.y+'px'
        };
        return <canvas ref = "cvs" width={this.props.width} height={this.props.height} style={cstyle}> </canvas>;
    }
    
    getDomCanvas() {
        return this.refs.cvs;
    }

    updateX(x) {
        this.getDomCanvas().style.left = -x+'px';
    }

    componentDidUpdate (){
        //this.drawBorder();
    }
    
}

export default ChartCanvas;