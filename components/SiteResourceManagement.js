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
const logger = new Logger( {moduleName: 'site-resource-management', color: 'white'} );
const apicommon = require('../apicommon.js');
const util = require('util');
module.exports = {
    doAPI_getResources: function(siteid, sel, logreqCB) {
        var self = this;
        self._executedRequests = [];
        // cb is function(err,result){}
        var totalResults = [];
        var params = [
            ["selection", sel]
        ];
        var _uri = self._toApiUriWithAccount("/sites/" + siteid + "/resources", params);
        var getNextResources = function(uri, cb) {
            // if(lastsite) {
            //  uri += "?lastSite="+lastsite
            // }
            self.logdbg("   [GET] " + _uri)
            var met = self._metricIn("GET /sites/" + siteid + "/resources")
            self._authedRequest(null, {
                json: true,
                uri: _uri,
                method: 'get'
            }, function(error, resp, body) {
                if (error) {
                    resp = {};
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

                        if (typeof body == 'object') {
                            if (body.resources && body.resources.length > 0) {
                                totalResults = totalResults.concat(body.resources)
                            }
                            if (body._links && body._links.next) {
                                if (apicommon.atEndOfPageable(body)) {
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
                                setImmediate(function() {
                                    cb(undefined, totalResults);
                                });
                            }
                        } else {
                            // self.logdbg("/api/sites",resp)
                            setImmediate(function() {
                                cb(undefined, totalResults);
                            });
                        }
                        //                  resolve(body);
                    } else {
                        cb(resp)
                        //                  self.logdbg("/api/sites",resp)
                        //cb(util.format("Invalid response ", _uri, ": " + resp.statusCode + " --> " + resp.statusMessage));
                        //                  reject("Invalid response: " + resp.statusCode + " --> " + resp.statusMessage);
                    }
                }

            })
        }
        return new Promise(function(resolve, reject) {
            if (!siteid || !sel) {
                reject("No site id or selection provided.")
                return;
            }
            getNextResources(_uri, function(err, result) {
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

    doAPI_getDeviceInterfaces: function(siteid, id, logreqCB) {
        var self = this;
        self._executedRequests = [];
        return new Promise(function(resolve, reject) {
            var _uri = self._toCUIwithAccount("/sites/" + siteid + '/interfaces', [["resourceID", id]]);
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

    doAPI_deleteResources: function(siteid, sel,logreqCB) {
        var self = this;
        self._executedRequests = [];
        // cb is function(err,result){}
        var totalResults = [];
        var params = [
            ["selection", sel]
        ];
        var _uri = self._toApiUriWithAccount("/sites/" + siteid + "/resources", params);
        var _deleteResources = function(uri, cb) {
            // if(lastsite) {
            //  uri += "?lastSite="+lastsite
            // }
            self.logdbg("   [DELETE] " + _uri)
            var met = self._metricIn("DELETE /sites/" + siteid + "/resources")
            self._authedRequest(null, {
                json: true,
                uri: _uri,
                method: 'delete'
            }, function(error, resp, body) {
                if (error) {
                    resp = {};
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
                        // self.logdbg("/api/sites",resp)
                        setImmediate(function() {
                            cb(undefined, totalResults);
                        });

                        //                  resolve(body);
                    } else {
                        cb(resp)
                        //                  self.logdbg("/api/sites",resp)
                        //cb(util.format("Invalid response ", _uri, ": " + resp.statusCode + " --> " + resp.statusMessage));
                        //                  reject("Invalid response: " + resp.statusCode + " --> " + resp.statusMessage);
                    }
                }

            })
        }
        return new Promise(function(resolve, reject) {
            if (!siteid || !sel) {
                reject("No site id or selection provided.")
                return;
            }
            _deleteResources(_uri, function(err, result) {
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
    doAPI_getDeviceData: function(siteID, readonly, logreqCB) {
        var self = this;
        self._executedRequests = [];
        return new Promise(function(resolve, reject) {
            var uri = self._toCUIwithAccount("/sites/" + siteID + "/devices/data" + (readonly ? ("?readonly=" + readonly) : ""));
            self.logdbg("uri:", uri);
            self._authedRequest(null, {
                uri: uri,
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
                } else {

                    if (resp && resp.statusCode && resp.statusCode == 200) {
                        self.logdbg("/devices/data OK (200): ", body);
                        resolve(body);
                    } else {
                        reject(resp)
                        //reject("Invalid response: " + resp.statusCode + " --> " + resp.statusMessage);
                    }
                }
            });
        });
    },
    doAPI_getDevices: function(siteID, logreqCB) {
        var self = this;
        self._executedRequests = [];
        return new Promise(function(resolve, reject) {
            var uri = self._toCUIwithAccount("/sites/" + siteID + "/devices");
            self.logdbg("uri:", uri);
            self._authedRequest(null, {
                uri: uri,
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
                } else {

                    if (resp && resp.statusCode && resp.statusCode == 200) {
                        self.logdbg("/devices/data OK (200): ", body);
                        resolve(body);
                    } else {
                        reject(resp)
                        //reject("Invalid response: " + resp.statusCode + " --> " + resp.statusMessage);
                    }
                }
            });
        });
    },
    doAPI_getResourceState: function(siteid, sel, property, nocache, logreqCB) {
        var self = this;
        self._executedRequests = [];
        // cb is function(err,result){}
        //var totalResults = [];
        var params = [
            ["selection", sel]
        ];
        if (property) {
            params.push(["property", property]);
        }
        nocache = (nocache == 'true');
        params.push(["nocache", nocache]);

        var _uri = self._toApiUriWithAccount("/sites/" + siteid + "/resources/state", params);
        var getResourceState = function(uri, cb) {
            // if(lastsite) {
            //  uri += "?lastSite="+lastsite
            // }
            self.logdbg("   [GET] " + _uri)
            var met = self._metricIn("GET /sites/" + siteid + "/resources/state")
            self._authedRequest(null, {
                json: true,
                uri: _uri,
                method: 'get'
            }, function(error, resp, body) {
                if (error) {
                    resp = {};
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
                        // self.logdbg("/api/sites",resp)
                        setImmediate(function() {
                            cb(undefined, body);
                        });

                        //                  resolve(body);
                    } else {
                        cb(resp);
                        //                  self.logdbg("/api/sites",resp)
                        //cb(util.format("Invalid response ", _uri, ": " + resp.statusCode + " --> " + resp.statusMessage));
                        //                  reject("Invalid response: " + resp.statusCode + " --> " + resp.statusMessage);
                    }
                }

            })
        }
        return new Promise(function(resolve, reject) {
            if (!siteid || !sel) {
                if (logreqCB && typeof logreqCB == 'function') {
                    logreqCB(self._executedRequests);
                }
                reject("No site id or selection provided.")
                return;
            }
            getResourceState(_uri, function(err, result) {
                if (logreqCB && typeof logreqCB == 'function') {
                    logreqCB(self._executedRequests);
                }
                if (err) {
                    reject(err);
                } else {
                    //console.log(Object.keys(result.state).length);
                    if (Object.keys(result.state).length > 0 ){
                        resolve(result);
                    } else {
                        result.statusMessage = JSON.stringify(result.errors);
                        result.statusCode = 500;
                        reject(result);
                    }
                }
            })

        })

    },
    doAPI_updateResourceStateCUIS: function(siteid, device, state, value, ID, logreqCB) {
        var self = this;
        self._executedRequests = [];
        // cb is function(err,result){}
        var _uri = self._toCUIwithAccount("/sites/" + siteid +"/resources/state");
        var updateResourceState = function(uri, cb) {
            var obj = {
                [device]: {
                    [state]: value
                }
            }
            self.logdbg("   [PATCH] " + uri)
            var met = self._metricIn("PATCH /sites/" + siteid + "/resources/state")
            var complete_req = {
                json: true,
                uri: _uri,
                method: 'patch',
                body: obj,
                headers: {
                    "username": ID || "00000000000000000000000000000000",
                    "userID": self.access.userID || "tools.arm.com"
                }
            };
            self.logdbg(complete_req);
            self._authedRequest(null, complete_req, function(error, resp, body) {
                if (error) {
                    resp = {};
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
                        setImmediate(function() {
                            cb(undefined, body);
                        });
                    } else {
                        cb(resp)
                        //cb(util.format("Invalid response ", _uri, ": " + resp.statusCode + " --> " + resp.statusMessage));
                        //                  reject("Invalid response: " + resp.statusCode + " --> " + resp.statusMessage);
                    }
                }
            })
        }
        return new Promise(function(resolve, reject) {
            if (!siteid) {
                reject("Run set-siteid")
                return;
            }
            updateResourceState(_uri, function(err, result) {
                if (logreqCB && typeof logreqCB == 'function') {
                    logreqCB(self._executedRequests);
                }
                if (err) {
                    reject(err);
                } else {
                    resolve(result || 200);
                }
            })
        })
    },
    doAPI_updateResourceState: function(siteid, obj, logreqCB) {
        var self = this;
        self._executedRequests = [];
        // cb is function(err,result){}
        var _uri = self._toApiUriWithAccount("/sites/" + siteid + "/resources/state");
        var updateResourceState = function(uri, cb) {
            /*var obj = {
                [device]: {
                    [state]: value
                }
            }*/
            //console.log(obj);
            self.logdbg("   [PATCH] " + uri)
            var met = self._metricIn("PATCH /sites/" + siteid + "/resources/state")
            self._authedRequest(null, {
                json: true,
                uri: _uri,
                method: 'patch',
                body: obj
            }, function(error, resp, body) {
                if (error) {
                    resp = {};
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
                        setImmediate(function() {
                            cb(undefined, body);
                        });
                    } else {
                        cb(resp)
                        //cb(util.format("Invalid response ", _uri, ": " + resp.statusCode + " --> " + resp.statusMessage));
                        //                  reject("Invalid response: " + resp.statusCode + " --> " + resp.statusMessage);
                    }
                }
            })
        }
        return new Promise(function(resolve, reject) {
            if (!siteid) {
                if (logreqCB && typeof logreqCB == 'function') {
                    logreqCB(self._executedRequests);
                }
                reject("Run set-siteid")
                return;
            }
            updateResourceState(_uri, function(err, result) {
                if (logreqCB && typeof logreqCB == 'function') {
                    logreqCB(self._executedRequests);
                }
                if (err) {
                    reject(err);
                } else {
                    resolve(result || 200);
                }
            })
        })
    },
    doAPI_creategroup: function(siteID, location, logreqCB) {
        var self = this;
        self._executedRequests = [];
        var obj = [];
        return new Promise(function(resolve, reject) {
            var uri = self._toApiUriWithAccount("/sites/" + siteID + "/groups/" + location);
            self.logdbg("uri:", uri);
            self._authedRequest(null, {
                uri: uri,
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
                } else {

                    if (resp && resp.statusCode && resp.statusCode == 200) {
                        self.logdbg("/api/sites OK (200): ", body);
                        resolve("Group created successfully");
                    } else {
                        reject(resp)
                        //reject("Invalid response: " + resp.statusCode + " --> " + resp.statusMessage);
                    }
                }
            });
        });
    },
    doAPI_updategroup: function(siteID, location, option, resource, logreqCB) {
        var self = this;
        self._executedRequests = [];
        var resources = resource.split(',');
        //console.log(resources);
        var obj = []
        resources.forEach(function(element) {
            obj.push({
                "op": option,
                "path": "/resources",
                "value": element
            })
        })
        return new Promise(function(resolve, reject) {
            var uri = self._toApiUriWithAccount("/sites/" + siteID + "/groups/" + location);
            self.logdbg("uri:", uri);
            self._authedRequest(null, {
                uri: uri,
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
                } else {

                    if (resp && resp.statusCode && resp.statusCode == 200) {
                        self.logdbg("/api/sites OK (200): ", body);
                        resolve("Group " + location + " updated successfully");
                    } else {
                        reject(resp)
                        //reject("Invalid response: " + resp.statusCode + " --> " + resp.statusMessage);
                    }
                }
            });
        });
    },
    doAPI_deletegroup: function(siteID, location, logreqCB) {
        var self = this;
        self._executedRequests = [];
        var obj = [];
        return new Promise(function(resolve, reject) {
            var uri = self._toApiUriWithAccount("/sites/" + siteID + "/groups/" + location);
            self.logdbg("uri:", uri);
            self._authedRequest(null, {
                uri: uri,
                json: true,
                method: 'delete',
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
                } else {

                    if (resp && resp.statusCode && resp.statusCode == 200) {
                        self.logdbg("/api/sites OK (200): ", body);
                        resolve("Group deleted successfully");
                    } else {
                        reject(resp)
                        //reject("Invalid response: " + resp.statusCode + " --> " + resp.statusMessage);
                    }
                }
            });
        });
    },
    doAPI_getgroup: function(siteID, location, logreqCB) {
        var self = this;
        self._executedRequests = [];
        return new Promise(function(resolve, reject) {
            var uri;
            if(location)
                uri = self._toApiUriWithAccount("/sites/" + siteID + "/groups/" + location);
            else 
                uri = self._toApiUriWithAccount("/sites/" + siteID + "/groups/");
            self.logdbg("uri:", uri);
            self._authedRequest(null, {
                uri: uri,
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
                } else {

                    if (resp && resp.statusCode && resp.statusCode == 200) {
                        self.logdbg("/api/sites OK (200): ", body);
                        resolve(body);
                    } else {
                        reject(resp)
                        //reject("Invalid response: " + resp.statusCode + " --> " + resp.statusMessage);
                    }
                }
            });
        });
    },

    doAPI_getgroupwithimage: function(siteID, location, logreqCB) {
        var self = this;
        self._executedRequests = [];
        return new Promise(function(resolve, reject) {
            var uri;
            if(location)
                uri = self._toCUIwithAccount("/sites/" + siteID + "/groups/" + location);
            else 
                uri = self._toCUIwithAccount("/sites/" + siteID + "/groups/");
            self.logdbg("uri:", uri);
            self._authedRequest(null, {
                uri: uri,
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
                } else {

                    if (resp && resp.statusCode && resp.statusCode == 200) {
                        self.logdbg("/api/sites OK (200): ", body);
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