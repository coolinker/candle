'use strict';

import React from "react";
import FormInput from "./FormInput";

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

        // trimMatchDate(str, regex){
        //     let matchDateValues = function(dateStr){
        //         var arr = str.split("/");
        //         console.log("==", arr, arr[0] && arr[0].length===4 && !(Number(arr[0]) < 2020 && Number(arr[0]) > 1900))
        //         if (arr[0] && arr[0].length===4 && !(Number(arr[0]) < 2020 && Number(arr[0]) > 1900)) {
        //             return false;
        //         }
        //         if (arr[1] && arr[1].length===2 && !(Number(arr[1]) < 13 && Number(arr[1]) > 0)) {
        //             return false;
        //         }
        //         if (arr[2] && arr[2].length===2 && !(Number(arr[2]) < 32 && Number(arr[2]) > 0)) {
        //             return false;
        //         }

    //         return true;
    //     }

    //     while(str.length>0 && (!str.match(regex) || !matchDateValues(str))) {
    //          str = str.substr(0, str.length - 1);
    //     }

    //     return str;
    // }    

}

DateInput.propTypes = { type: React.PropTypes.string, width: React.PropTypes.number };
DateInput.defaultProps = { type: "date", width: 130 };

export default DateInput;
