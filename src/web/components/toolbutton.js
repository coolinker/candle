'use strict';

import React from "react";

class ToolButton extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            value: this.props.value
        };
    }


    updateState(v) {
        let me = this;
        this.setState({
            value: v
        }, function() {
            

        });

    }

    render() {

        return <div style={{ position: 'absolute', color: '#f44336', top: '5px', left: '330px', cursor: 'pointer','fontSize':'small', 'fontWeight':'bold' }} ref={(ref) => this.evalueBtn = ref}
                    onClick={this.doEvalueate}>{props.text}
                    <div style={{ position: 'absolute', color: '#c0c0c0', top:'0px', left: '25px', 'fontSize': 'smaller', 'fontWeight':'normal'}} ref={(ref) => this.evalueMenuBtn = ref}>v</div>
                    <div style={{ position: 'absolute', color: '#c0c0c0', zIndex: 100, width:'300px', 'fontWeight':'normal'}} ref={(ref) => this.evalueList = ref}>This is evalue list</div>
                </div>
    }

    

}


export default ToolButton;
