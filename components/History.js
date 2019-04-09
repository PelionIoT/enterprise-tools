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

/**
 * @param  {string} siteID the site ID as a string
 * @param {null|string|Function} format if 'csv' will be returned as a CSV string. If format is a Function of form function(data) where data is an array of object
 *          then function must return a string representing the data. If null the data will just be handed to the callback as an array of objects.
 * @param {Function} dataCB is a function of form function(data)  where data will be a string or an array of objects
 *          depending on format.<br>
 * @param  {string+} All other options passed in should be done as a string of format "option=value"
 * @return {Promise}
 */
const apicommon = require('../apicommon.js');
//const index = require('../index.js')
const util = require('util');
const Logger = require('./../utils/logger');
const logger = new Logger( {moduleName: 'history', color: 'white'} );
/*
options
{
    format: csv or null,
    pagenated: true or false,
    limit: number of records to be returned, max=100
    sortOrder: asc or desc,
    choice: 1 or 2 -- need to know what this is
    id: source or relayID
    downrange: timestamp
    uprange: timestamp
    maxPages: maximum number of pages to be retreived
}
 */
module.exports={ 
    doAPI_getHistory : function(dataCB,siteID,options,logreqCB /** options....*/ ) {
        var self = this;
        // self._executedRequests = [];
        var format = options.format;
        var pagenated = options.pagenated;
        var limit = options.limit
        var sortOrder = options.sortOrder;
        var choice = options.choice;
        var id = options.id;
        var downrange = options.downrange;
        var uprange = options.uprange;
        var maxPages = options.maxPages || 100;
        // cb is function(err,result){}
        var knownHistoryFields = 'timestamp accountID siteID relayID source category type data serial'
        /*console.log(typeof metricIn);
        console.log(typeof toApiUri);
        console.log(typeof authedRequest);*/
        self.logdbg("doAPI_getHistory", arguments)
        var argz = arguments;
        var params = [];
        var currentPage = 0;
        var dummy = {};
        var met = self._metricIn("GET /history")
        var total = 0;
        var getNextHistory = function(uri, cb) {
            self.logdbg("   [GET] " + uri)
            self._executedRequests = [];
            logger.info('Fetching page ' + currentPage + '... ');
            self._authedRequest(null, {
                json: true,
                uri: uri,
                method: 'get'
            }, function(error, resp, body) {
                if (error) {
                    cb(error)
                    // console.log("Error on /api/requests: ", err);
                    // process.exit(1);
                } else {
                    self._metricOut(met)
                    if (resp && resp.statusCode && resp.statusCode == 200) {
                        self.logdbg("/api/history OK (200): ", body);
                        if (body && body.events && body.events.length > 0) {
                            total += body.events.length;
                            if (format) {
                                var s = format(body.events);
                                dataCB(s);
                            } else {
                                dataCB(body.events)
                            }
                            //						totalResults = totalResults.concat(body._embedded.accounts);
                        }
                        if(pagenated===false && currentPage < maxPages) {
                            currentPage++;
                            if (!apicommon.atEndOfPageable(body)) {
                                self.logdbg("NEXT>>>>>>>>>>>>>>>>", body._links)
                                setImmediate(function(link, cb) {
                                    getNextHistory(link, cb)
                                }, self._toApiUri(body._links.next.href), cb);
                            }
                        } else {
                            setImmediate(function(body) {
                                cb(null, total);
                            }, body);
                        }
                        //					resolve(body);
                        // } else if (resp && resp.statusCode && resp.statusCode == 404) {
                        // 	// assume 404 means the end of the history
                        // 	setImmediate(function(body){
                        // 		cb(undefined);
                        // 	},body);
                    } else {
                        cb("Error response: " + resp.statusCode + " --> " + resp.statusMessage);
                        //					reject("Invalid response: " + resp.statusCode + " --> " + resp.statusMessage);
                    }
                }

            })
        }

        var CSVFormatter = function(data) {
            var s = "";
            var fieldnames = knownHistoryFields.split(' ');
            var d = null;
            for (var n = 0; n < data.length; n++) {
                for (var f = 0; f < fieldnames.length; f++) {
                    if (f > 0) s += ',';
                    d = data[n][fieldnames[f]]
                    if (d === undefined) {
                        s += "--";
                    } else if (typeof d == 'string') {
                        s += apicommon.cleanupCSVText(d);
                    } else if (typeof d == 'object') {
                        //					s += "'"
                        s += apicommon.cleanupCSVJson(JSON.stringify(d)) // breakLength:Infinity,  breakLength appears not work most of the time. Hmmm.
                        //					s += "'"
                    } else {
                        s += util.inspect(d);
                    }
                }
                s += '\n';
            }
            return s;
        }

        return new Promise(function(resolve, reject) {
            if (typeof format != 'function') {
                if (format == 'csv') {
                    format = CSVFormatter;
                } else {
                    format = null;
                }
            }
            if (!siteID) {
                reject("Need a siteID");
                return;
            }
            if (typeof dataCB != 'function') {
                reject("Need a data submission callback. None provided or not function.")
                return;
            }
            if(pagenated == null){
                pagenated = true;
            }
            if (argz.length > 3) {
                params = Array.prototype.slice.call(argz, 3);
            }
            params.unshift(["siteID", siteID]);
            
            if(choice === '1'){
                params.push(["source",id]);
                 if(uprange && downrange){
                    params.push(["afterTime", downrange]);
                    params.push(["beforeTime", uprange]);
                }else{
                    downrange = Number(downrange);
                    params.push(["maxAge",downrange]);
                }
            }
            else if(choice === '2'){
                params.push(["relayID",id]);
                downrange = Number(downrange);
                uprange = Number(uprange);
                params.push(["minSerial", downrange]);
                //params.push(["maxSerial", uprange]);
            }
            if(limit){
            limit = Number(limit);
            params.push(["limit",limit]);
            }
            if(sortOrder)
            params.push(["sortOrder", sortOrder]);
            var param = [];
            for(var i=0;i< params.length; i++){
                if(Array.isArray(params[i])){
                param.push(params[i]);    
                }
            }
            var uri = self._toApiUriWithAccount("/history", param);
            /*if (useAccountsSubpath) {
                uri = self._toApiUri("/history", param, accountid);
            }*/
            self.logdbg("uri:",uri);
            getNextHistory(uri, function(err, result) {
                if (logreqCB && typeof logreqCB == 'function') {
                    logreqCB(self._executedRequests);
                }
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            })
        })
    }
}