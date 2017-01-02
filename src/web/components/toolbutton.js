'use strict';

import React from "react";

class ToolButton extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            info: props.info,
            enabled: props.enabled === 'true'
        };

    }


    render() {

        let btnStyle = {
            position: 'absolute',
            color: (this.state.enabled ? '#f44336' : '#808080'),
            cursor: 'pointer',
            fontSize: 'small',
            fontWeight: 'normal',
            textDecoration: 'underline'
        };
        for (let att in this.props.btnStyle) {
            btnStyle[att] = this.props.btnStyle[att];
        }


        return <div style={btnStyle} ref={(ref) => this.button = ref} onClick={this.state.enabled ? this.props.doAction : undefined}>{this.props.text}
            <div style={{ position: 'absolute', color: '#c0c0c0', top: '15px', 'fontSize': 'smaller', 'fontWeight': 'normal' }} ref={(ref) => this.info = ref}
                onClick={(e) => {
                    e.stopPropagation();
                    if (this.props.doInfoClick) this.props.doInfoClick();
                } }>{this.state.info}</div>
        </div>
    }


}


export default ToolButton;
