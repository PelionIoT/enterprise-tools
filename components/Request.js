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
const logger = new Logger( {moduleName: 'request', color: 'white'} )
const util = require('util');
const chalk = require('chalk');
var counter = 0;
module.exports = {
    doAPI_postRequest: function(sel, cmd, _type, prop, args, value, useAccountsSubpath, accountid, siteid, logreqCB) {
        var self = this;
        self._executedRequests = [];
        var uri = self._toApiUriWithAccount("/requests");

        return new Promise(function(resolve, reject) {
            /*if (args) {
                try {
                    var arr = JSON.parse(args);
                } catch (e) {
                    reject("args is not a JSON Array");
                    return;
                }
                if (!Array.isArray(arr)) {
                    reject("args is JSON but not Array");
                    return;
                }
            }*/
            var op = {};
            if (sel) op.selection = sel;
            if (cmd) op.command = cmd;
            if (typeof args == 'string' && args && args.length > 0) {
                op.arguments = args;
                if (!Array.isArray(op.arguments)) {
                    op.arguments = [op.arguments];
                }
            } else if (typeof args == 'number') {
                op.arguments = [args];
            } else if (args && typeof args == 'object') {
                if (Array.isArray(args)) {
                    op.arguments = args;
                } else {
                    op.arguments = [args];
                }
            } else op.arguments = [];
            if (prop) op.property = prop;
            if (_type) op.type = _type;

            var body = {
                sites: [siteid],
                ops: [op]

            };
            //console.log(body);
            self.logdbg("   [POST] " + uri, body)
            var met = self._metricIn("POST /requests", util.inspect(sel, cmd))
            self._authedRequest(null, {
                uri: uri,
                json: true,
                method: 'post',
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
                    // self.logerr("Error on /api/requests: ", err);
                    // process.exit(1);
                } else {
                    self._metricOut(met, util.inspect(sel, cmd))
                    if (resp && resp.statusCode && resp.statusCode == 202) {
                        self.logdbg("/api/requests ACCEPTED (202): ", body);
                        //addReqestToPoller(body);
                        //console.log(body);
                        resolve(body);
                    } else {
                        reject(resp);
                        //reject("Invalid response: " + resp.statusCode + " --> " + resp.statusMessage);
                    }
                }

            })
        })
    },    

    doAPI_getAllResourceStates: function(siteid, logreqCB) {
        var self = this;
        self._executedRequests = [];
        //console.log(arg)
        uri = self._toApiUriWithAccount("/requests")
        //console.log(uri)
        // if(arg instanceof Array) {
        //     arguments = arg;
        // } else {
        //     arguments = [arg];
        // }
        var obj = {
            "sites": [siteid],
            "ops": [{
                "type": "call",
                "selection": "id=\"DevStateManager\"",
                "command": "data",
                "arguments": [
                    null
                ]
            }]
        };
        return new Promise(function(resolve, reject) {
            self._authedRequest(null, {
                uri: self._toApiUriWithAccount("/requests"),
                json: true,
                method: 'post',
                body: obj
            }, function(error, resp, body) {
                if (error) {
                    if (logreqCB && typeof logreqCB == 'function') {
                        logreqCB(self._executedRequests);
                    }
                    resp = {};
                    resp.statusMessage = error;
                    resp.statusCode = 500;
                    reject(error);
                } else {

                    if (resp && resp.statusCode && resp.statusCode == 202) {
                        self.logdbg("/api/requests OK (202): ", body);
                        // console.log("OK.");
                        self.getRequestStatus(body.id).then(function(resp1) {
                            if (resp1.state === "complete") {
                                self.getRequestResponse(resp1.id).then(function(resp1) {
                                    if (logreqCB && typeof logreqCB == 'function') {
                                        logreqCB(self._executedRequests);
                                    }
                                    resolve(resp1);
                                    // console.log("OK.");
                                    // console.log("Results:", JSON.stringify(resp1, null, 4));
                                }, function(err) {
                                    if (logreqCB && typeof logreqCB == 'function') {
                                        logreqCB(self._executedRequests);
                                    }
                                    // console.log("Failed: getRequestStatus ", err);
                                    reject(err);
                                });
                            }
                        }, function(err) {
                            if (logreqCB && typeof logreqCB == 'function') {
                                logreqCB(self._executedRequests);
                            }
                            // console.log("Failed: doAPI_getrequeststatus ", err);
                            reject(err);
                        });
                        // resolve(body);
                    } else {
                        if (logreqCB && typeof logreqCB == 'function') {
                            logreqCB(self._executedRequests);
                        }
                        reject(resp);
                        //reject("Invalid response: " + resp.statusCode + " --> " + resp.statusMessage);
                    }
                }
            });
        });
    },

    doAPI_diagnostics: function(siteid, arg, logreqCB) {
        var self = this;
        self._executedRequests = [];
        if (!arg) arg = null;
        //console.log(arg)
        uri = self._toApiUriWithAccount("/requests")
        //console.log(uri)
        // if(arg instanceof Array) {
        //     arguments = arg;
        // } else {
        //     arguments = [arg];
        // }
        var obj = {
            "sites": [siteid],
            "ops": [{
                "type": "call",
                "selection": "id=\"RelayStats\"",
                "command": "diagnostics",
                "arguments": [arg]
            }]
        };
        return new Promise(function(resolve, reject) {
            self._authedRequest(null, {
                uri: self._toApiUriWithAccount("/requests"),
                json: true,
                method: 'post',
                body: obj
            }, function(error, resp, body) {
                if (error) {
                    if (logreqCB && typeof logreqCB == 'function') {
                        logreqCB(self._executedRequests);
                    }
                    resp = {};
                    resp.statusMessage = error;
                    resp.statusCode = 500;
                    reject(error);
                } else {

                    if (resp && resp.statusCode && resp.statusCode == 202) {
                        self.logdbg("/api/requests OK (202): ", body);
                        // console.log("OK.");
                        self.getRequestStatus(body.id).then(function(resp1) {
                            if (resp1.state === "complete") {
                                self.getRequestResponse(resp1.id).then(function(resp1) {
                                    if (logreqCB && typeof logreqCB == 'function') {
                                        logreqCB(self._executedRequests);
                                    }
                                    resolve(resp1);
                                    // console.log("OK.");
                                    // console.log("Results:", JSON.stringify(resp1, null, 4));
                                }, function(err) {
                                    if (logreqCB && typeof logreqCB == 'function') {
                                        logreqCB(self._executedRequests);
                                    }
                                    // console.log("Failed: getRequestStatus ", err);
                                    reject(err);
                                });
                            }
                        }, function(err) {
                            if (logreqCB && typeof logreqCB == 'function') {
                                logreqCB(self._executedRequests);
                            }
                            // console.log("Failed: doAPI_getrequeststatus ", err);
                            reject(err);
                        });
                        // resolve(body);
                    } else {
                        if (logreqCB && typeof logreqCB == 'function') {
                            logreqCB(self._executedRequests);
                        }
                        reject(resp);
                        //reject("Invalid response: " + resp.statusCode + " --> " + resp.statusMessage);
                    }
                }
            });
        });
    },

    doAPI_executeCommand: function(siteid, selection, command, arg, logreqCB) {
        var self = this;
        self._executedRequests = [];
        if (!arg) arg = [ null ];
        //console.log(arg)
        uri = self._toApiUriWithAccount("/requests")
        //console.log(uri)
        if(arg instanceof Array) {
            // arg = arg;
        } else {
            arg = [arg];
        }
        var obj = {
            "sites": [siteid],
            "ops": [{
                "type": "call",
                "selection": selection,
                "command": command,
                "arguments": arg
            }]
        };
        return new Promise(function(resolve, reject) {
            self._authedRequest(null, {
                uri: self._toApiUriWithAccount("/requests"),
                json: true,
                method: 'post',
                body: obj
            }, function(error, resp, body) {
                if (error) {
                    if (logreqCB && typeof logreqCB == 'function') {
                        logreqCB(self._executedRequests);
                    }
                    resp = {};
                    resp.statusMessage = error;
                    resp.statusCode = 500;
                    reject(error);
                } else {

                    if (resp && resp.statusCode && resp.statusCode == 202) {
                        self.logdbg("/api/requests OK (202): ", body);
                        // console.log("OK.");
                        self.getRequestStatus(body.id).then(function(resp1) {
                            if (resp1.state === "complete") {
                                self.getRequestResponse(resp1.id).then(function(resp1) {
                                    if (logreqCB && typeof logreqCB == 'function') {
                                        logreqCB(self._executedRequests);
                                    }
                                    // console.log(resp1);
                                    resolve(resp1);
                                    // console.log("OK.");
                                    // console.log("Results:", JSON.stringify(resp1, null, 4));
                                }, function(err) {
                                    if (logreqCB && typeof logreqCB == 'function') {
                                        logreqCB(self._executedRequests);
                                    }
                                    // console.log("Failed: getRequestStatus ", err);
                                    reject(err);
                                });
                            }
                        }, function(err) {
                            if (logreqCB && typeof logreqCB == 'function') {
                                logreqCB(self._executedRequests);
                            }
                            // console.log("Failed: doAPI_getrequeststatus ", err);
                            reject(err);
                        });
                        // resolve(body);
                    } else {
                        if (logreqCB && typeof logreqCB == 'function') {
                            logreqCB(self._executedRequests);
                        }
                        reject(resp);
                        //reject("Invalid response: " + resp.statusCode + " --> " + resp.statusMessage);
                    }
                }
            });
        });
    },

    doAPI_getrequeststatus: function(requestid) {
        var self = this;
        return new Promise(function(resolve, reject) {
            self._authedRequest(null, {
                uri: self._toApiUriWithAccount("/requests/" + requestid),
                json: true,
                method: 'get'
            }, function(error, resp, body) {
                if (error) {
                    resp = {};
                    resp.statusMessage = error;
                    resp.statusCode = 500;
                    reject(resp)
                    //reject (error)
                } else {
                    if (resp && resp.statusCode && resp.statusCode == 200) {
                        self.logdbg("/api/requests" + requestid + "OK (200): ", body);
                        // console.log(body.state);
                        self.loginfo(body.state);
                        if (body.state === 'complete') {
                            counter = 0;
                            resolve(body);
                        } else if (body.state === 'error') {
                            counter = 0;
                            resp.statusMessage = 'Request threw error. Check request parameters, body and verify if siteID exist';
                            reject(resp);
                        } else if (counter >= 250) {
                            counter = 0;
                            resp.statusMessage = 'Request did not complete';
                            reject(resp);
                        } else {
                            counter++;
                            resolve(self.getRequestStatus(requestid));

                        }
                    } else {
                        resp.statusMessage = 'Unknown error';
                        reject(resp);
                        //reject("Invalid response:" + resp.statusCode + " --> " + resp.statusMessage);
                    }
                }
            });

        });
    },

    doAPI_getRequestResponse: function(requestid) { /**/
        var self = this;
        var uri = self._toApiUri("GET/requests/" + requestid + "/response?limit=10");

        function _getResponse(uri, cb) {
            var met = self._metricIn("GET/requests/" + requestid + "/response?limit=10") //have assumed limit =10 as default;
            if (requestid == null) {
                //process.exit(1);
                cb(chalk.bold("requestid not found"));
            }
            gListTemplates = {};
            self._authedRequest(null, {
                uri: uri,
                json: true,
                method: 'get'
            }, function(error, resp, body) {
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
                        self.logdbg("/api/requests/" + requestid + "/response?limit=10 OK (200): ", JSON.stringify(body, null, 4));
                        // console.log(JSON.stringify(body, null, 4));
                        if (body && body._embedded && body._embedded.responses) {
                            // console.log(body._embedded.responses[0]);
                            // console.log(body._embedded.responses[0].response);
                            // console.log(body._embedded.responses[0].response[0]);
                            if (body._embedded.responses[0]["response"].length === 0) {
                                gListTemplates = "No response!";
                                cb(gListTemplates);
                            } else {
                                if(body._embedded.responses[0].response[0].timeout) {
                                    cb("Request timed out!");
                                } else if (body._embedded.responses[0].response[0].error) {
                                    gListTemplates = "Error! Response body- " + body._embedded.responses[0].response[0].body;
                                    cb(gListTemplates);
                                } else {
                                    gListTemplates = body._embedded.responses[0].response[0].body || "Success. No timeout. No error!";
                                    cb(null, gListTemplates);
                                }
                            }
                        } else {
                            cb(resp);
                            //cb("Invalid response: " + resp.statusCode + " --> " + resp.statusMessage);
                        }
                    }
                }
            });
        }
        return new Promise(function(resolve, reject) {
            _getResponse(self._toApiUriWithAccount("/requests/" + requestid + "/response?limit=10"), function(err, result) {
                if (err) {
                    reject(err);
                } else {

                    resolve(result);
                }
            });

        });

    }


}


