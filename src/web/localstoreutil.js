'use strict';
class LocalStoreUtil {
    constructor() {}
    static setCookie(cname, cvalue, exdays) {
        var d = new Date();
        if (!exdays) exdays = 1000;
        d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
        var expires = "expires=" + d.toUTCString();
        document.cookie = cname + "=" + cvalue + "; " + expires;
    }
    static getCookie(cname) {
        var name = cname + "=";
        var ca = document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) == 0) {
                return c.substring(name.length, c.length);
            }
        }
        return "";
    }

    static addToStore(key, obj, max) {
        let newkey = key+'_'+(new Date().getTime());
        if (localStorage.getItem(newkey)) {
            console.error("ERROR key existed:", newkey);
            return;
        }
        let objstr = JSON.stringify(obj);
        let keyArr = localStorage.getItem(key);
        if (keyArr) {
            keyArr = JSON.parse(keyArr);
            let last = localStorage.getItem(keyArr[keyArr.length-1]);
            if (objstr === last) return;
        } else keyArr = [];
        if (!max) max = 30;
        if (keyArr.length>=max) {
            let removeKey = keyArr.shift();
            localStorage.removeItem(removeKey);
        }

        localStorage.setItem(newkey, objstr);
        keyArr.push(newkey);

        localStorage.setItem(key, JSON.stringify(keyArr));
        
    }

    
    static getLastOfKey(key){
        let keyArr = localStorage.getItem(key);
        if (keyArr) keyArr = JSON.parse(keyArr);
        else return null;

        let obj = localStorage.getItem(keyArr[keyArr.length-1]);

        return JSON.parse(obj);
    }

    static getByKeyIndex(key, idx){
        let keyArr = localStorage.getItem(key);
        if (keyArr) keyArr = JSON.parse(keyArr);
        else return null;

        let obj = localStorage.getItem(keyArr[idx]);

        return JSON.parse(obj);
    }
    
    static getByKey(key){
        let keyArr = localStorage.getItem(key);
        if (keyArr) keyArr = JSON.parse(keyArr);
        else return null;
        let objs = [];
        for (let i = 0; i<keyArr.length; i++) {
            let obj = localStorage.getItem(keyArr[i]);
            if (obj) objs.push(JSON.parse(obj));
            else console.error("getByKey obj doesn't existed", keyArr[i]);
        }
        
        return objs;
    }
}


export default LocalStoreUtil