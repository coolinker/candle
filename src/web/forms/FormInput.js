'use strict';

// let sampleData = [{ open: 15.5, close: 16, high: 16.5, low: 15.2 }, { open: 15.8, close: 15, high: 16.8, low: 14.2 }, { open: 15.5, close: 16, high: 16.8, low: 15.2 }, { open: 10.5, close: 10, high: 10.8, low: 9.2 }];
import React from "react";

class FormInput extends React.Component {
    constructor(props) {
        super(props);
        this.handleChange = this.handleChange.bind(this);
        this.state = {
            value: this.props.value
        };
    }

    handleChange(event) {
        let v = event.target.value;
        let regex = this.props.regex;
        // console.log(v, v.length, v.match(regex), this.refs.ele.selectionStart)
        let cursorPosition = this.refs.ele.selectionStart;
        if (v !== '' && !v.match(regex)) {
            v = v.substr(0, cursorPosition - 1) + v.substr(cursorPosition);
        }
        this.updateState(this.formatStateValue(v), true);
    }

    updateState(v, needHandleInputComplete) {
        let me = this;
        this.setState({
            value: v
        }, function() {
            if (needHandleInputComplete && me.props.handleInputCompleted) {
                if (!me.props.validRegex || v.match(me.props.validRegex)) {
                    me.props.handleInputCompleted(me.state.value);
                }
            }
            if (me.props.handleInputChanged) {
                me.props.handleInputChanged(me.state.value);

            }

        });

    }

    formatStateValue(v) {
        return v;
    }

    formatValue(v) {
        return v;
    }

    render() {
        let style = {
            color: '#f0f0f0',
            width: this.props.width + 'px',
            'borderStyle': 'groove',
            'borderColor': '#424242',
            'backgroundColor': 'transparent',
        };
        return <input ref="ele" type = { this.props.type }
        value = { this.formatValue(this.state.value) }
        onChange = { this.handleChange }
        style = { style }
        />

    }

}

FormInput.propTypes = {
    type: React.PropTypes.string,
    value: React.PropTypes.string
};
FormInput.defaultProps = {
    type: "text",
    value: ""
};

export default FormInput;