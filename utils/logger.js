'use strict';

/*
 * Copyright (c) 2018, Arm Limited and affiliates.
 * SPDX-License-Identifier: Apache-2.0
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const colors = require('colors');


let getDateTime = () => {
    let date = new Date();

    // let hour = date.getHours();
    // hour = (hour < 10 ? "0" : "") + hour;

    // let min  = date.getMinutes();
    // min = (min < 10 ? "0" : "") + min;

    // let sec  = date.getSeconds();
    // sec = (sec < 10 ? "0" : "") + sec;

    // let year = date.getFullYear();

    // let month = date.getMonth() + 1;
    // month = (month < 10 ? "0" : "") + month;

    // let day  = date.getDate();
    // day = (day < 10 ? "0" : "") + day;

    return date.toISOString();
};

let logger = console;
if(typeof dev$ !== 'undefined') {
	logger = log;
}

class Logger {
    constructor(options) {
        this._moduleName = 'unknown';
        if(typeof options.moduleName != 'undefined')
            this._moduleName = options.moduleName;

        this.color = colors.white;
        if(typeof options.color != 'undefined') {
            this.color = colors[options.color];
        }
    }

    error(str) {
    	if(typeof global.etoolsLogLevel != 'undefined' && global.etoolsLogLevel >= 0) {
    		if(typeof logger.error != 'undefined')
    			logger.error(this.color('[' + getDateTime() + '] [ERROR] [dcs-sdk' + ' ' + this._moduleName + '] ' +  str));
    		else 
    			console.error(colors.red('[' + getDateTime() + '] [ERROR] [dcs-sdk' + ' ' + this._moduleName + '] ' +  str));
                console.trace(colors.red('[' + getDateTime() + '] [ERROR] [dcs-sdk' + ' ' + this._moduleName + '] ' +  str));
    	}
    }

    warn(str) {
    	if(typeof global.etoolsLogLevel != 'undefined' && global.etoolsLogLevel >= 1) {
    		if(typeof logger.warn != 'undefined')
    			logger.warn(this.color('[' + getDateTime() + '] [WARN] [dcs-sdk' + ' ' + this._moduleName + '] ' +  str));
    		else
    			console.warn(colors.yellow('[' + getDateTime() + '] [WARN] [dcs-sdk' + ' ' + this._moduleName + '] ' +  str));
    	}
    }

    info(str) {
    	if(typeof global.etoolsLogLevel != 'undefined' && global.etoolsLogLevel >= 2) {
    		if(typeof logger.info != 'undefined')
    			logger.info(this.color('[' + getDateTime() + '] [INFO] [dcs-sdk' + ' ' + this._moduleName + '] ' +  str));
    		else
    			console.log(this.color('[' + getDateTime() + '] [INFO] [dcs-sdk' + ' ' + this._moduleName + '] ' +  str));
    	}
    }

    debug(str) {
    	if(typeof global.etoolsLogLevel != 'undefined' && global.etoolsLogLevel >= 3) {
    		if(typeof logger.info != 'undefined')
    			logger.info(this.color('[' + getDateTime() + '] [DEBUG] [dcs-sdk' + ' ' + this._moduleName + '] ' +  str));
    		else
    			console.log(this.color('[' + getDateTime() + '] [DEBUG] [dcs-sdk' + ' ' + this._moduleName + '] ' +  str));
    	}
    }

    trace(str) {
    	if(typeof global.etoolsLogLevel != 'undefined' && global.etoolsLogLevel >= 4) {
    		if(typeof logger.info != 'undefined')
    			logger.info(this.color('[' + getDateTime() + '] [TRACE] [dcs-sdk' + ' ' + this._moduleName + '] ' +  str));
    		else
    			console.trace(this.color('[' + getDateTime() + '] [TRACE] [dcs-sdk' + ' ' + this._moduleName + '] ' +  str));
    	}
    }
}

module.exports = Logger;