'use strict';

import React from "react";
import FormInput from "./forminput";

class DateInput extends FormInput {
    constructor(props) {
        super(props);
        //this.state = { value: this.formatIn(this.props.value)};
    }
    
    formatStateValue(date) {
         if (date.match("^\\d{2}\/\\d{2}\/\\d{4}")) return date;
         if (date.match("^\\d{4}-\\d{2}-\\d{2}")) {
            let arr = date.split("-");
            return arr[1]+"\/"+arr[2]+"\/"+arr[0];
        }
    }

    formatValue(date) {
        if (!date) return;
        if (date.match("^\\d{4}-\\d{2}-\\d{2}")) return date;
        if (date.match("^\\d{2}\/\\d{2}\/\\d{4}")) {
            let arr = date.split("\/");
            return arr[2]+"-"+arr[0]+"-"+arr[1];
        }
    }

    handleChange(event) {
        let v = event.target.value;
        let fv =  this.formatStateValue(v); 
        this.updateState(fv, true);
    }


}

DateInput.propTypes = { type: React.PropTypes.string, width: React.PropTypes.number };
DateInput.defaultProps = { type: "date", width: 130 };

export default DateInput;
