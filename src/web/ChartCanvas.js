'use strict';

// let sampleData = [{ open: 15.5, close: 16, high: 16.5, low: 15.2 }, { open: 15.8, close: 15, high: 16.8, low: 14.2 }, { open: 15.5, close: 16, high: 16.8, low: 15.2 }, { open: 10.5, close: 10, high: 10.8, low: 9.2 }];

module.exports = React.createClass({
    // getInitialState: function() {
    //     return { width: 2000, height: 1000};
    // },
    render: function() {
        return <canvas ref = "cvs" width={this.props.width} height={this.props.height}> </canvas>;
    },
    getDomCanvas: function() {
        return this.refs.cvs;
    }
});
