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
const logger = new Logger( {moduleName: 'site-management', color: 'white'} );
const util = require('util');
const common = require("../apicommon");
module.exports = {
    doAPI_postSite: function(logreqCB) {
        var self = this;
        self._executedRequests = [];
        return new Promise(function(resolve, reject) {
            self._authedRequest(null, {
                uri: self._toApiUriWithAccount("/sites"),
                json: true,
                method: 'post'
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
                        self.logdbg("/api/sites OK (201): ", body);
                        resolve(body);
                    } else {
                        reject(resp)
                        //reject("Invalid response: " + resp.statusCode + " --> " + resp.statusMessage);
                    }
                }
            });
        });
    },
    doAPI_deleteSite: function(siteID, logreqCB) {
        var self = this;
        self._executedRequests = [];
        return new Promise(function(resolve, reject) {
            self._authedRequest(null, {
                uri: self._toApiUriWithAccount("/sites/" + siteID),
                json: true,
                method: 'delete'
            }, function(error, resp, body) {
                if (logreqCB && typeof logreqCB == 'function') {
                    logreqCB(self._executedRequests);
                }
                if (error) {
                    resp = {}
                    resp.statusMessage = error;
                    resp.statusCode = 500;
                    reject(resp);
                    //reject(error)
                    // console.log("Error on /api/requests: ", err);
                    // process.exit(1);
                } else {

                    if (resp && resp.statusCode && resp.statusCode == 200) {
                        self.logdbg("/api/sites/{siteID} OK (200): ", body);
                        resolve(body);
                    } else {
                        reject(resp)
                        //reject("Invalid response: " + resp.statusCode + " --> " + resp.statusMessage);
                    }
                }
            });
        });
    },
    doAPI_getSiteresourcetypes: function(siteID, logreqCB) {
        var self = this;
        self._executedRequests = [];
        return new Promise(function(resolve, reject) {
            self._authedRequest(null, {
                uri: self._toApiUriWithAccount("/sites/" + siteID + "/resourcetypes"),
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
                    //reject(error)
                    // console.log("Error on /api/requests: ", err);
                    // process.exit(1);
                } else {

                    if (resp && resp.statusCode && resp.statusCode == 200) {
                        self.logdbg("/api/sites/{siteID}/resourcetypes OK (200): ", body);
                        resolve(body.resourcetypes);
                    } else {
                        reject(resp)
                        //reject("Invalid response: " + resp.statusCode + " --> " + resp.statusMessage);
                    }
                }
            });
        });
    },
    doAPI_getSiteinterfaces: function(siteID, logreqCB) {
        var self = this;
        self._executedRequests = [];
        return new Promise(function(resolve, reject) {
            var _uri = self._toApiUriWithAccount("/sites/" + siteID + "/interfaces")
            self._authedRequest(null, {
                uri: _uri,
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
                    //reject(error)
                    // console.log("Error on /api/requests: ", err);
                    // process.exit(1);
                } else {

                    if (resp && resp.statusCode && resp.statusCode == 200) {
                        self.logdbg("/api/sites/" + siteID + "/interfaces OK (200): ", body);
                        resolve(body);
                    } else {
                        reject(resp)
                        //reject("Invalid response: " + resp.statusCode + " --> " + resp.statusMessage);
                    }
                }
            });
        });
    },
    doAPI_getSiteMap: function(logreqCB) {
        var self = this;
        self._executedRequests = [];
        return new Promise(function(resolve, reject) {
            var _uri = self._toCUIwithAccount("/sitemap")
            self._authedRequest(null, {
                uri: _uri,
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
                    //reject(error)
                    // console.log("Error on /api/requests: ", err);
                    // process.exit(1);
                } else {

                    if (resp && resp.statusCode && resp.statusCode == 200) {
                        self.logdbg("/cloud-ui-server/sitemap OK (200): ", body);
                        resolve(body);
                    } else {
                        reject(resp)
                        //reject("Invalid response: " + resp.statusCode + " --> " + resp.statusMessage);
                    }
                }
            });
        });
    },
    doAPI_updateSite: function(siteID, cmd, name, logreqCB) {
        var self = this;
        self._executedRequests = [];
        return new Promise(function(resolve, reject) {
            if (!name) {
                name = siteID;
            }
            var cmd1 = cmd == "true" ? true : false;
            var obj = {
                "active": cmd1,
                "name": name
            };
            //console.log(obj);
            var _uri = self._toApiUriWithAccount("/sites/" + siteID);
            self._authedRequest(null, {
                uri: _uri,
                json: true,
                method: 'patch',
                body: obj
            }, function(error, resp, body) {
                if (logreqCB && typeof logreqCB == 'function') {
                    logreqCB(self._executedRequests);
                }
                if (error) {
                    resp = {}
                    resp.statusMessage = error;
                    resp.statusCode = 500;
                    reject(resp);
                    //reject(error)
                    // console.log("Error on /api/requests: ", err);
                    // process.exit(1);
                } else {

                    if (resp && resp.statusCode && resp.statusCode == 200) {
                        self.logdbg("/api/sites/" + siteID + "/ OK (200): ", body);
                        resolve("Site is Updated");
                    } else {
                        reject(resp)
                        //reject("Invalid response: " + resp.statusCode + " --> " + resp.statusMessage);
                    }
                }
            });
        });
    },
    doAPI_getSites: function(logreqCB) {
        var self = this;
        self._executedRequests = [];
        // cb is function(err,result){}
        var totalResults = {};
        var _uri = self._toApiUriWithAccount("/sites");
        var getNextSites = function(uri, cb) {
            // if(lastsite) {
            //  uri += "?lastSite="+lastsite
            // }
            self.logdbg("   [GET] " + uri)
            var met = self._metricIn("GET /sites")
            self._authedRequest(null, {
                json: true,
                uri: uri,
                method: 'get'
            }, function(error, resp, body) {
                if (error) {
                    resp = {}
                    resp.statusMessage = error;
                    resp.statusCode = 500;
                    cb(resp);
                    //cb(error)
                    // console.log("Error on /api/requests: ", err);
                    // process.exit(1);
                } else {
                    self._metricOut(met)
                    if (resp && resp.statusCode && resp.statusCode == 200) {
                        self.logdbg("/api/sites OK (200): ", body);
                        if (typeof body == 'object' && body._links && body._links.next) {

                            for (var n = 0; n < body._embedded.sites.length; n++) {
                                totalResults[body._embedded.sites[n].id] = body._embedded.sites[n];

                            }
                            if (common.atEndOfPageable(body)) {
                                setImmediate(function(body) {
                                    cb(undefined, totalResults);
                                }, body);
                            } else {
                                setImmediate(function(link, cb) {
                                    self.logdbg("   next /sites...")
                                    getNextSites(link, cb)
                                }, self._toApiUri(body._links.next.href), cb);
                            }
                        } else {
                            // self.logdbg("/api/sites",resp)
                            setImmediate(function(body) {
                                cb(undefined, totalResults);
                            }, body);
                        }
                        //                  resolve(body);
                    } else {
                        self.logdbg("/api/sites",resp)
                        cb(resp)
                        //                  self.logdbg("/api/sites",resp)
                        // cb(util.format("Invalid response ", _uri, ": " + resp.statusCode + " --> " + resp.statusMessage));
                        //                  reject("Invalid response: " + resp.statusCode + " --> " + resp.statusMessage);
                    }
                }
            })
        }
        return new Promise(function(resolve, reject) {

            getNextSites(_uri, function(err, result) {
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
    getaSite: function(siteID, logreqCB) {
        var self = this;
        self._executedRequests = [];
        return new Promise(function(resolve, reject) {
            self._authedRequest(null, {
                uri: self._toApiUriWithAccount("/sites/" + siteID),
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
                    //reject(error)
                    // console.log("Error on /api/requests: ", err);
                    // process.exit(1);
                } else {

                    if (resp && resp.statusCode && resp.statusCode == 200) {
                        self.logdbg("/api/sites/{siteID} OK (200): ", body);
                        resolve(body);
                    } else {
                        reject(resp)
                        //reject("Invalid response: " + resp.statusCode + " --> " + resp.statusMessage);
                    }
                }
            });
        });
    },
    doAPI_diagnostics: function(siteID, logreqCB) {
        var self = this;
        self._executedRequests = [];
        return new Promise(function(resolve, reject) {
            self._authedRequest(null, {
                uri: self._toCUIwithAccount("/sites/" + siteID + '/diagnostics'),
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
                    //reject(error)
                    // console.log("Error on /api/requests: ", err);
                    // process.exit(1);
                } else {

                    if (resp && resp.statusCode && resp.statusCode == 200) {
                        self.logdbg("/api/sites/{siteID} OK (200): ", body);
                        resolve(body);
                    } else {
                        reject(resp)
                        //reject("Invalid response: " + resp.statusCode + " --> " + resp.statusMessage);
                    }
                }
            });
        });
    }
}
