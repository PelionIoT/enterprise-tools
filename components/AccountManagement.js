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
const logger = new Logger( {moduleName: 'account-management', color: 'white'} )
const util = require('util');
const apicommon = require('../apicommon.js');


module.exports = {
    doAPI_putAccountname: function(accountID, name, logreqCB) {
        var self = this;
        self._executedRequests = [];
        return new Promise(function(resolve, reject) {
            var body = {
                "_links": {
                    "self": {
                        "href": "string"
                    }
                },
                "id": accountID,
                "name": name
            };
            var url = self._toApiUri("/accounts/" + accountID);
            self._authedRequest(null, {
                uri: url,
                json: true,
                method: 'put',
                body: body
            }, function(error, resp, body) {
                if (logreqCB && typeof logreqCB == 'function') {
                    logreqCB(self._executedRequests);
                }
                if (error) {
                    resp = {};
                    resp.statusMessage = error;
                    resp.statusCode = 500;
                    reject(resp);
                } else {
                    if (resp && resp.statusCode && resp.statusCode == 200) {
                        self.logdbg("/api//accounts/{accountID} OK (200): ", body);
                        resolve("Name of the account updated");
                    } else {
                        //reject(resp);
                        reject("Invalid response: " + resp.statusCode + " --> " + resp.statusMessage);
                    }
                }
            });
        });
    },
    doAPI_getAccounts : function(logreqCB) {
        var self = this;
        // cb is function(err,result){}
        var totalResults = [];
        var uri = this.program.cloud + "/api/accounts";
        var getNextAccounts = function(uri, cb) {
            // if(lastsite) {
            //  uri += "?lastSite="+lastsite
            // }
            self.logdbg("   [GET] " + uri)
            var met = self._metricIn("GET /accounts")
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
                        self.logdbg("/api/accounts OK (200): ", body);
                        if (body && body._embedded && body._embedded.accounts && body._embedded.accounts.length > 0) {
                            totalResults = totalResults.concat(body._embedded.accounts);
                        }
                        if (!apicommon.atEndOfPageable(body)) {
                            self.logdbg("NEXT>>>>>>>>>>>>>>>>", body._links)
                            setImmediate(function(link, cb) {
                                getNextAccounts(link, cb)
                            }, self._toApiUri(body._links.next.href), cb);
                        } else {
                            setImmediate(function(body) {
                                cb(undefined, totalResults);
                            }, body);
                        }
                        //                  resolve(body);
                    } else {
                        cb("Invalid response: " + resp.statusCode + " --> " + resp.statusMessage);
                        //                  reject("Invalid response: " + resp.statusCode + " --> " + resp.statusMessage);
                    }
                }

            })
        }
        return new Promise(function(resolve, reject) {
            getNextAccounts(uri, function(err, result) {
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
};