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
const logger = new Logger( {moduleName: 'relay-management', color: 'white'} )
const util = require('util');
const apicommon = require('../apicommon.js');

module.exports = {
    doAPI_patchRelay: function(relayID, pairingcode, logreqCB) {
        var self = this;
        self._executedRequests = [];
        var obj = {
            "coordinates": {
                "latitude": 0,
                "longitude": 0
            },
            "siteID": null,
            "accountID": null
        }
        return new Promise(function(resolve, reject) {
            self._authedRequest(null, {
                uri: self._toApiUriWithAccount("/relays/" + relayID),
                json: true,
                method: 'patch',
                body: obj
            }, function(error, resp, body) {
                if (logreqCB && typeof logreqCB == 'function') {
                    logreqCB(self._executedRequests);
                }
                if (error) {
                    resp = {};
                    resp.statusMessage = error;
                    resp.statusCode = 500;
                    reject(resp);
                    //reject(error)
                    // console.log("Error on /api/requests: ", err);
                    // process.exit(1);
                } else {

                    if (resp && resp.statusCode && resp.statusCode == 200) {
                        self.logdbg("/api/relays OK (200):");
                        resolve("Relay sucessfully removed from account");
                    } else {
                        reject(resp);
                        //reject("Invalid response: " + resp.statusCode + " --> " + resp.statusMessage);
                    }
                }
            });
        });
    },
    doAPI_putRelay: function(relayID, pairingcode, logreqCB) {
        var self = this;
        self._executedRequests = [];
        var param = [];
        if (pairingcode) {
            param.push(["pairingCode", pairingcode]);
        }
        //console.log(pairingcode);
        return new Promise(function(resolve, reject) {
            var url = self._toApiUri("/relays/" + relayID, param)
            self._authedRequest(null, {
                uri: url,
                json: true,
                method: 'put'
            }, function(error, resp, body) {
                if (logreqCB && typeof logreqCB == 'function') {
                    logreqCB(self._executedRequests);
                }
                if (error) {
                    var resp = {};
                    resp.statusMessage = error;
                    resp.statusCode = 500;
                    reject(resp);
                } else {

                    if (resp && resp.statusCode && resp.statusCode == 200) {
                        self.logdbg("/api/relays OK (200):");
                        //console.log(resp.body);
                        resolve("The relay is imported and is now available to pair with accounts in this cloud");
                    } else {
                        //reject("Invalid response: " + resp.statusCode + " --> " + resp.statusMessage);
                        reject(resp);
                    }
                }
            });
        });
    },
    doAPI_getRelaystatus: function(relayID, logreqCB) {
        var self = this;
        self._executedRequests = [];

        //console.log(pairingcode);
        return new Promise(function(resolve, reject) {
            var url = self._toApiUriWithAccount("/relays/" + relayID)
            self._authedRequest(null, {
                uri: url,
                json: true,
                method: 'get'
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
                        self.logdbg("/api/relays OK (200):");
                        //console.log(resp.body);
                        resolve(resp.body);
                    } else {
                        reject("Invalid response: " + resp.statusCode + " --> " + resp.statusMessage);
                        //reject(resp);
                    }
                }
            });
        });
    },
    doAPI_getRelays: function(online, siteid, accountid, pairingcode, logreqCB) {
        var self = this;
        if(typeof online === 'function') {
            logreqCB = online;
        }
        self._executedRequests = [];
        // cb is function(err,result){}
        var totalResults = [];
        var pAccountId = undefined;
        var params = [];
        var firstParam = true;
        if (siteid && siteid != 'any') {
            params.push(['siteID', siteid])
        }
        // we sift through this ourselves
        if (accountid && accountid != 'any') {
            pAccountId = accountid;
            if (pAccountId == 'null') {
                pAccountId = null;
            }
        }
        if (pairingcode) {
            params.push(['pairingCode', pairingcode]);
        }
        if (online != undefined) {
            if (online == 'online') {
                params.push(['online', 'true'])
            } else if (online == 'offline') {
                params.push(['online', 'false'])
            }
        }

        var getNextRelays = function(uri, cb) {
            // if(lastsite) {
            //  uri += "?lastSite="+lastsite
            // }
            self.logdbg("   [GET] " + uri)
            var met = self._metricIn("/relays");
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
                    if (resp && resp.statusCode && resp.statusCode == 200) {
                        self._metricOut(met);
                        self.logdbg("/api/relays OK (200): ", body);
                        if (body && body._embedded && body._embedded.relays && body._embedded.relays.length > 0) {
                            var incoming = body._embedded.relays
                            if (pAccountId != undefined) {
                                for (var n = 0; n < incoming.length; n++) {
                                    var addit = incoming[n];
                                    if (addit.accountID != pAccountId) {
                                        addit = null;
                                    }
                                    // just add more checks here, if we have more params to sift
                                    // through later
                                    if (addit) {
                                        totalResults.push(incoming[n]);
                                    }
                                }
                            } else {
                                totalResults = totalResults.concat(body._embedded.relays);
                            }
                        }
                        if (!apicommon.atEndOfPageable(body)) {
                            self.logdbg("NEXT>>>>>>>>>>>>>>>>", body._links)
                            setImmediate(function(link, cb) {
                                getNextRelays(self._addParams(link, params), cb)
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
            getNextRelays(self._toApiUriWithAccount("/relays", params), function(err, result) {
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

    },
    doAPI_patchRelays : function(relayid, configDef, pairingCodeQuery) {
        var self = this;
        return new Promise(function(resolve, reject) {
            if (typeof configDef == 'object' &&
                typeof relayid == 'string') {

                var uri = "/relays/" + relayid;
                if (pairingCodeQuery) {
                    uri += "?pairingCode=" + pairingCodeQuery;
                }
                self.logdbg(uri)

                self._authedRequest(uri, {
                    json: true,
                    method: 'patch',
                    body: configDef
                }, function(error, resp, body) {
                    if (error) {
                        reject(error)
                        // console.log("Error on /api/requests: ", err);
                        // process.exit(1);
                    } else {
                        if (resp && resp.statusCode && resp.statusCode == 200) {
                            self.logdbg(uri + " Successs (200): ", resp.statusText);
                            resolve(body);
                        } else {
                            reject("Invalid response: " + resp.statusCode + " --> " + resp.statusMessage);
                        }
                    }
                });
            } else {
                reject("Invalid params")
            }
        });
    },
    doAPI_getPelionDevices: function(eid, logreqCB) {
        var self = this;
        self._executedRequests = [];
        return new Promise(function(resolve, reject) {
            var _uri = self._toMbedApiUri("/v3/devices");
            self._authedRequest(null, {
                uri: _uri,
                json: true,
                method: 'get'
            }, function(error, resp, body) {
                if (logreqCB && typeof logreqCB == 'function') {
                    logreqCB(self._executedRequests);
                }
                if (error) {
                    resp = {};
                    resp.statusMessage = error;
                    resp.statusCode = 500;
                    reject(resp);
                    //reject(error)
                    // console.log("Error on /api/requests: ", err);
                    // process.exit(1);
                } else {

                    if (resp && resp.statusCode && resp.statusCode == 200) {
                        resolve(body);
                    } else {
                        reject(resp);
                        //reject("Invalid response: " + resp.statusCode + " --> " + resp.statusMessage);
                    }
                }
            });
        });
    },
    doAPI_getPelionEdgeGateways: function(eid, logreqCB) {
        var self = this;
        self._executedRequests = [];
        return new Promise(function(resolve, reject) {
            var _uri = self._toMbedApiUri("/v3/devices");
            self._authedRequest(null, {
                uri: _uri,
                json: true,
                method: 'get',
                qs: {
                    "order": "DESC",
                    "limit": 50,
                    "include": "total_count",
                    "filter": "lifecycle_status__eq=enabled&state__eq=registered&endpoint_type__eq=MBED_GW&vendor_id__eq=42fa7b481a6543aa890f8c704daade54"
                }
            }, function(error, resp, body) {
                if (logreqCB && typeof logreqCB == 'function') {
                    logreqCB(self._executedRequests);
                }
                if (error) {
                    resp = {};
                    resp.statusMessage = error;
                    resp.statusCode = 500;
                    reject(resp);
                    //reject(error)
                    // console.log("Error on /api/requests: ", err);
                    // process.exit(1);
                } else {

                    if (resp && resp.statusCode && resp.statusCode == 200) {
                        resolve(body);
                    } else {
                        reject(resp);
                        //reject("Invalid response: " + resp.statusCode + " --> " + resp.statusMessage);
                    }
                }
            });
        });
    },
    doAPI_getEnrollmentID: function(eid, logreqCB) {
        var self = this;
        self._executedRequests = [];
        return new Promise(function(resolve, reject) {
            var _uri = self._toMbedApiUri("/v3/device-enrollments");
            self._authedRequest(null, {
                uri: _uri,
                json: true,
                method: 'get'
            }, function(error, resp, body) {
                if (logreqCB && typeof logreqCB == 'function') {
                    logreqCB(self._executedRequests);
                }
                if (error) {
                    resp = {};
                    resp.statusMessage = error;
                    resp.statusCode = 500;
                    reject(resp);
                    //reject(error)
                    // console.log("Error on /api/requests: ", err);
                    // process.exit(1);
                } else {

                    if (resp && resp.statusCode && resp.statusCode == 200) {
                        resolve(body);
                    } else {
                        reject(resp);
                        //reject("Invalid response: " + resp.statusCode + " --> " + resp.statusMessage);
                    }
                }
            });
        });
    },
    doAPI_uploadEnrollmentID: function(eid, logreqCB) {
        var self = this;
        self._executedRequests = [];
        return new Promise(function(resolve, reject) {
            var _uri = self._toMbedApiUri("/v3/device-enrollments");
            self._authedRequest(null, {
                uri: _uri,
                json: true,
                method: 'post',
                body:{
                    "enrollment_identity": eid
                }
            }, function(error, resp, body) {
                if (logreqCB && typeof logreqCB == 'function') {
                    logreqCB(self._executedRequests);
                }
                if (error) {
                    resp = {};
                    resp.statusMessage = error;
                    resp.statusCode = 500;
                    reject(resp);
                    //reject(error)
                    // console.log("Error on /api/requests: ", err);
                    // process.exit(1);
                } else {

                    if (resp && resp.statusCode && resp.statusCode == 201) {
                        resolve(body);
                    } else {
                        reject(resp);
                        //reject("Invalid response: " + resp.statusCode + " --> " + resp.statusMessage);
                    }
                }
            });
        });
    }
}