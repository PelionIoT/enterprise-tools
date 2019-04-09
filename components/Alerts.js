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

const Logger = require('./../utils/logger');
const logger = new Logger( {moduleName: 'alerts', color: 'white'} )            
const util = require('util');
const common = require("../apicommon");

module.exports = {
    doAPI_getAlert: function(siteID, limit, order, beforetime,logreqCB) {
        var self = this;
        self._executedRequests = [];
        var params = [];
        if (limit) {
            limit = Number(limit);
            params.push(["limit", limit]);
        } else {
            limit = 50;
            params.push(["limit", limit]);
        }

        if (order) {
            params.push(["sortOrder", order]);
        } else {
            order = "desc";
            params.push(["sortOrder", order]);
        }

        if (beforetime) {
            params.push(["beforeTime", beforetime]);
        } else {
            beforetime = new Date().toISOString();
            params.push(["before", beforetime]);
        }

        return new Promise(function(resolve, reject) {
            if (!siteID) {
                reject("Enter SiteID");
            }
            params.unshift(["siteID", siteID]);
            var url = self._toApiUriWithAccount("/alerts", params);
            self._authedRequest(null, {
                uri: url,
                json: true,
                method: 'get'
            }, function(error, resp, body) {
                if (logreqCB && typeof logreqCB == 'function') {
                    logreqCB(self._executedRequests);
                }
                if (error) {
                    resp = {}
                    resp.statusMessage = error;
                    resp.statusCode = 500;
                    reject(resp);
                } else {
                    //console.log(url);
                    if (resp && resp.statusCode && resp.statusCode == 200) {
                        self.logdbg("/api/alerts OK (200): ", body);
                        resolve(body._embedded);
                    } else {
                        //reject(resp);
                        reject("Invalid response: " + resp.statusCode + " --> " + resp.statusMessage);
                    }
                }
            });
        });
    },

    doAPI_getanAlert: function(relayID, serial, logreqCB) {
        var self = this;
        self._executedRequests = [];
        return new Promise(function(resolve, reject) {
            /*if(!siteID){
              reject("Enter SiteID");  
            }
            */
            serial = Number(serial);
            var url = self._toApiUriWithAccount("/alerts/" + relayID + "/" + serial);
            self._authedRequest(null, {
                uri: url,
                json: true,
                method: 'get'
            }, function(error, resp, body) {
                if (logreqCB && typeof logreqCB == 'function') {
                    logreqCB(self._executedRequests);
                }
                if (error) {
                    resp = {}
                    resp.statusMessage = error;
                    resp.statusCode = 500;
                    reject(resp);
                } else {
                    if (resp && resp.statusCode && resp.statusCode == 200) {
                        self.logdbg("/api/alerts/{relayID}/{serial} OK (200): ", body);
                        resolve(body);
                    } else {
                        //reject(resp);
                        reject("Invalid response: " + resp.statusCode + " --> " + resp.statusMessage);
                    }
                }
            });
        });
    },
    doAPI_dismissAlert: function(relayID, serial, logreqCB) {
        var self = this;
        self._executedRequests = [];
        return new Promise(function(resolve, reject) {
            var body = [{
                "op": "replace",
                "path": "/dismissed",
                "value": true
            }]
            serial = Number(serial);
            var url = self._toApiUriWithAccount("/alerts/" + relayID + "/" + serial);
            self._authedRequest(null, {
                uri: url,
                json: true,
                method: 'patch',
                body: body
            }, function(error, resp, body) {
                if (logreqCB && typeof logreqCB == 'function') {
                    logreqCB(self._executedRequests);
                }
                if (error) {
                    resp = {}
                    resp.statusMessage = error;
                    resp.statusCode = 500;
                    reject(resp);
                } else {
                    if (resp && resp.statusCode && resp.statusCode == 200) {
                        self.logdbg("/api/alerts/{relayID}/{serial} OK (200): ", body);
                        resolve("Alert is dismissed");
                    } else {
                        //reject(resp);
                        reject("Invalid response: " + resp.statusCode + " --> " + resp.statusMessage);
                    }
                }
            });
        });
    }
}