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

const Logger = require('./utils/logger');
const logger = new Logger( {moduleName: 'api', color: 'bgBlue'} );
const request = require('request');
const chalk = require('chalk');
const jwt = require('jsonwebtoken');
const util = require('util');
const os = require('os');
const path = require('path');
const fs = require('fs');
const readlineSync = require('readline-sync');
const jsonminify = require('jsonminify');
const WebSocket = require('ws');
const publicIp = require('public-ip');
const iplocation = require('iplocation');

var __metric_n = 0;
var _metrics = {};

var exec = require('child_process').execFile;

var metricIn = function(tag, aux) {
    var id = undefined;
    var handle = {
        then: null,
        tag: tag,
        n: __metric_n
    }
    __metric_n++;
    if (this.program.metrics) {
        if (aux) console.log(aux);
        handle.then = (new Date).getTime();
        id = tag + "" + handle.n;
        _metrics[id] = handle;
    }
    return id;
}

var metricOut = function(id, aux) {
    if (this.program.metrics) {
        if (!id) {
            console.error("Bad metric handle.")
            return;
        }
        var now = (new Date).getTime();
        var handle = _metrics[id];
        if (handle) {
            if (!aux) aux = "";
            console.log("PERF>>", handle.tag, "in", now - handle.then, "ms", aux);
            delete _metrics[id];
        } else {
            console.log("PERF>> MISMATCH on", id);
        }
    }
}

var logdbg = function() {
    if (this.program && (this.program.debug || this._enableDebug)) {
        if (arguments[0]) arguments[0] = "dbg (API)>> " + arguments[0];
        console.log(chalk.dim(util.format.apply(util, arguments)));
    }
}

var loginfo = function() {
    if (this.program && (this.program.loginfo)) {
        console.log(util.format.apply(util, arguments));
    }
}

var logerr = function() {
    if (arguments[0]) arguments[0] = "ERR (API)>> " + arguments[0];
    console.error(chalk.bold(util.format.apply(util, arguments)));
}


var initAPI = function(config, logfuncs) {

    if(!this) {
        throw "DCS initAPI has no instance!"
    }

    this.program = config;
    
    if (typeof config != 'object') {
        throw "API Not setup correctly"
    }
    if (typeof logfuncs == 'object') {
        if (typeof logfuncs.logdbg == 'function') {
            this.logdbg = logfuncs.logdbg
        }
        if (typeof logfuncs.logerr == 'function') {
            this.logerr = logfuncs.logerr
        }
        if (typeof logfuncs.loginfo == 'function') {
            this.loginfo = logfuncs.loginfo
        }
    } 
}

var getAuthWithPass = function(username, password, withAccountId, s) {
    var self = s || this;
    return new Promise(function(resolve,reject){
        self._loginWithPass(username, password, withAccountId).then(function(result) {
            self.logdbg('API: program:', self.program)
            self.logdbg("API: OK---", result);
            if(result && result.accounts) {
                var res = result.accounts;
                console.log("Can't find a solitary account. This user is in accounts:");
                console.log("Use anyone account to Enter");
                console.log("------------------------------------------------------------------------");
                console.log("S.No.| ID\t\t\t\t| Alias\t | Name\t ")
                console.log("------------------------------------------------------------------------");
                for (var n = 0; n < res.length; n++) {
                    var i = n;
                    if (n < 10) {
                        i = '0' + n;
                    }
                    console.log(i + "   |", res[n].id, "|", res[n].alias, "|", res[n].display_name)
                }
                console.log("------------------------------------------------------------------------");
                while (!self.program.account || self.program.account === null) {
                    var accountid = readlineSync.question('Enter the Account from the above list which has Authorization ? ')
                    self.program.useAccountsSubpath  = true;
                    self.program.account = accountid;
                }
                resolve(getAuthWithPass(username, password, self.program.account, self));
            } else {
                self.access = result;
                if(result.user_id) self.access.userID = result.user_id;
                self.access.access_token = result.token || result.access_token;
                self.program.user = username;
                resolve(result);
            }
        }, function(err) {
            console.error("Failed (getAuthWithPass): ", err)
            reject(err)
        });
        //     // console.log(result);
        //     self.access = result;
        //     if(result.user_id) self.access.userID = result.user_id;
        //     self.access.access_token = result.token || result.access_token;
        //     self.program.user = username;
        //     resolve(result);
        //     //console.log("do Login and GO working"+JSON.stringify(access));
        //     // saveToken(program.user, access).then(function() {
        //     //     self.logdbg("Finished config file write.");
        //     // }, function(err) {
        //     //     self.logerr("Error writing config file", err);
        //     // })
        //     // doCLICommand.apply({}, argz)
        // }, function(err) {
        //     logger.error("Failed (getAuthWithPass): ", err)
        //     reject(err)
        // });         
    });
}

var loginWithPass = function(username, password, withAccountId, logreqCB) {
    var self = this;
    self._executedRequests = [];
    var ipaddress = null;
    var latitude = null;
    var longitude = null;
    var a =  new Promise(function(resolve,reject) {
        try {
            publicIp.v4().then(ip => {
                ipaddress = ip
                //=> '46.5.21.123'
                iplocation(ipaddress, function(err, result) {
                  if(result) {
                    latitude = result.latitude;
                    longitude = result.longitude;
                    resolve();   
                  }
                  else if(err) {
                    resolve();
                    } else {
                        resolve();
                    }
                }, function(err) {
                    resolve();
                });    
                
            }, function(err) {
                resolve();
            });  
        } catch(err) {
            resolve();
        }
    })
    return a.then(function(resolve,reject){
        return new Promise(function(resolve, reject) {
            var uri, body, metric;
            if(self.program.cloud.indexOf('mbed') > -1) {
                uri = self.program.cloud + "/auth/login";
                body = {
                    username: username,
                    password: password
                };
                if(withAccountId) {
                    body.account = withAccountId;
                }
                metric = self._metricIn("POST /auth/login")
            } else {
                if(self.program.cloud.indexOf('home') > 0) {
                    uri = self.program.cloud + "/api/oauth/access_token";
                    body = {
                        grant_type: 'password',
                        username: username,
                        password: password
                    };
                } else {
                    
                    uri = self.program.cloud + "/cloud-ui-server/v2/oauth/login";
                    body = {
                        grant_type: 'password',
                        username: username,
                        password: password,
                        info : {
                            latitude: latitude,
                            longitude: longitude,
                            ipaddress: ipaddress,
                            appVersion: 'ETV'
                        }
                    };
                }
                // Only use account subpath, get access_token without account
                if (!!withAccountId) {
                    body.account_id = self.program.account
                }
                metric = self._metricIn("POST /oauth/access_token")
            }
            self.logdbg("   [POST] " + uri, body);
            var opts = {
                json: true,
                uri: uri,
                method: 'post',
                body: body
            };
            function requestCB(err, resp, body) {
                if (logreqCB && typeof logreqCB == 'function') {
                    logreqCB(self._executedRequests);
                }
                if (err) {
                    self.logerr("Error logging in: ", err);
                    reject("Error logging in: " +err);
                } else {
                    self._metricOut(metric);
                    if (resp && resp.statusCode && resp.statusCode == 200) {
                        self.logdbg("Login OK (200): ", body);
                        resolve(body);
                    } else {
                        reject("Invalid response: " + resp.statusCode + " --> " + resp.statusMessage);
                    }
                }
            }
            function reqCB(err, resp, body) {
                var  pkg = {};
                pkg.request = opts;
                pkg.response = {
                    err: err,
                    statusCode: resp ? resp.statusCode : null,
                    statusMessage: resp ? resp.statusMessage : 'No response message',
                    body: body
                };
                if(self._executedRequests && self._executedRequests.length > 300) {
                    logger.error('_executedRequests is not being cleared, this should not happen!');
                    self._executedRequests = [];
                }
                self._executedRequests.push(pkg);
                if(self.program.cloud.indexOf('mbed') > 0 && !err && resp.statusCode == 200 && body && body.token) {
                    FirmwareManagement.init(self.program.cloud, body.token);
                }
                requestCB(err, resp, body);
            }
            request(opts, reqCB);
        });
    });
};


var access;

// params should be an array of arrays, with inner arrays
// being a simple array with two elements
var toApiUri = function(s, params, account) {
    var self = this;
    var ret = this.program.cloud;
    if(self.program.cloud.indexOf('mbed') > -1) ret += "/wigwag";
    if (account) {
        ret += "/api/accounts/" + account + s;
    } else {
        ret += "/api" + s;
    }

    if (params && typeof params == "object" && params.length > 0) {
        ret += "?";
        for (var n = 0; n < params.length; n++) {
            if (params[n].length && params[n].length < 2) {
                logger.error("bad parameter passed into self._toApiUri()");
            } else {
                if (n > 0) ret += "&";
                ret += encodeURIComponent(params[n][0]) + "=" + encodeURIComponent(params[n][1]);
            }
        }
    }
    return ret;
};

var toMbedApiUri = function(s, params, account) {
    var self = this;
    var ret = this.program.cloud + s;

    if (params && typeof params == "object" && params.length > 0) {
        ret += "?";
        for (var n = 0; n < params.length; n++) {
            if (params[n].length && params[n].length < 2) {
                logger.error("bad parameter passed into self._toApiUri()");
            } else {
                if (n > 0) ret += "&";
                ret += encodeURIComponent(params[n][0]) + "=" + encodeURIComponent(params[n][1]);
            }
        }
    }
    return ret;
};

// same as above, but will prefix in a "/accounts/{accountID}"
// automatically if program.useAccountsSubpath is set
// See: https://wigwag.atlassian.net/browse/CLD-352
var toApiUriWithAccount = function(s, params) {
    var self = this;
    var ret = this.program.cloud;
    if(self.program.cloud.indexOf('mbed') > -1) ret += "/wigwag";
    ret += "/api";
    if(this.program.useAccountsSubpath && this.program.account) {
        ret += "/accounts/"+this.program.account;
    }
    ret += s;

    if (params && typeof params == "object" && params.length > 0) {
        ret += "?";
        for (var n = 0; n < params.length; n++) {
            if (params[n].length && params[n].length < 2) {
                logger.error("bad parameter passed into self._toApiUri()");
            } else {
                if (n > 0) ret += "&";
                ret += encodeURIComponent(params[n][0]) + "=" + encodeURIComponent(params[n][1]);
            }
        }
    }
    return ret;
}

// same as above, but will prefix in a "/accounts/{accountID}"
// automatically if program.useAccountsSubpath is set
// See: https://wigwag.atlassian.net/browse/CLD-352
var toCUIwithAccount = function(s, params) {
    var ret = this.program.cloud;
    if(this.program.cloud.indexOf('mbed') > -1) ret += "/wigwag";
    ret += "/cloud-ui-server/v2";
    if(this.program.useAccountsSubpath && this.program.account) {
        ret += "/accounts/"+this.program.account;
    }
    ret += s;

    if (params && typeof params == "object" && params.length > 0) {
        ret += "?";
        for (var n = 0; n < params.length; n++) {
            if (params[n].length && params[n].length < 2) {
                logger.error("bad parameter passed into self._toApiUri()");
            } else {
                if (n > 0) ret += "&";
                ret += encodeURIComponent(params[n][0]) + "=" + encodeURIComponent(params[n][1]);
            }
        }
    }
    return ret;
};
var toCUIwithoutAccount = function(s, params) {
    var ret = this.program.cloud;
    if(this.program.cloud.indexOf('mbed') > -1) ret += "/wigwag";
    ret += "/cloud-ui-server/v2";
    ret += s;

    if (params && typeof params == "object" && params.length > 0) {
        ret += "?";
        for (var n = 0; n < params.length; n++) {
            if (params[n].length && params[n].length < 2) {
                logger.error("bad parameter passed into self._toApiUri()");
            } else {
                if (n > 0) ret += "&";
                ret += encodeURIComponent(params[n][0]) + "=" + encodeURIComponent(params[n][1]);
            }
        }
    }
    return ret;
};


var addParams = function(s, params) {
    var ret = s;
    if (params && typeof params == "object" && params.length > 0) {
        for (var n = 0; n < params.length; n++) {
            if (params[n].length && params[n].length < 2) {
                this.logerr("bad parameter passed into self._toApiUri()");
            } else {
                ret += "&";
                ret += encodeURIComponent(params[n][0]) + "=" + encodeURIComponent(params[n][1]);
            }
        }
    }
    return ret;
}

var _mergeIn = function(targ, obj) {
    var keyz = Object.keys(obj);
    if (typeof targ != 'object') targ = {};
    for (var n = 0; n < keyz.length; n++) {
        targ[keyz[n]] = obj[keyz[n]]
    }
    return targ

}


var useInternalAPI = function(overrideurl) {
    this._authedRequest = this._internal_authedRequest
    var program = {
        insecure: true,
        cloud: overrideurl,
        useAccountsSubpath: true
    }
    // by default, internal containers talk to DCS with http://api:8080
    if (!program.cloud) {
        program.cloud = "http://api:8080"
    }
    this.initAPI(program)
    this.logdbg("API SETUP!!!!")
}

// called by user of the API, to set a 'reference request' so that
// the API can aborb an internal header, which can be used if the 
// DCS API calls are in the 'userInternalAPI' mode
var refRequest = function(req, account){
    this._refRequest = req;
    this.program.account = account;
}

var internal_authedRequest = function(apiPath, options, requestCB) {
    var self = this;
    var opts = {
        uri: self.program.cloud 
    };
    if(self.program.cloud.indexOf('mbed') > -1) opts.uri += "/wigwag";
    opts.uri += "/api" + apiPath;
    if (!self._refRequest) {
        throw "Need reference request if using internal API";
    }

    var headers = {};
    if(this.headers) {
        headers = this.headers
    }
    headers['x-wigwag-identity'] = self._refRequest.headers['x-wigwag-identity']
    opts = _mergeIn(opts, options)
    opts.headers = _mergeIn(opts.headers, headers)
    this.logdbg("OPTS: --------------> ", JSON.stringify(opts, null, 4))
    return request(opts, requestCB);
};


var authedRequest = function(apiPath, options, requestCB) {
    var self = this;
    var uri = self.program.cloud;
    if(self.program.cloud.indexOf('mbed') > -1) uri += "/wigwag";
    uri += "/api";
    if(self.program.useAccountsSubpath && self.program.account) {
        uri += "/accounts/"+self.program.account;
    }
    var opts = {
        uri: uri + apiPath
    };

    var headers;
    if(!this.headers) {
        headers = {
            'Authorization': (self.access.access_token.indexOf('Bearer') > -1) ? self.access.access_token : ('Bearer ' + self.access.access_token)
        };
    } else {
        headers = self.headers;
    }
    opts = _mergeIn(opts, options);
    
    if((opts.uri.indexOf('mbed') > -1) && (opts.uri.indexOf('/wigwag/api') == -1) && opts.uri.indexOf('/api/') > -1)  {
        opts.uri = opts.uri.slice(0, opts.uri.indexOf('/api/')) + '/wigwag' + opts.uri.slice(opts.uri.indexOf('/api/'));
    }

    if(self.program.cloud.indexOf('mbed') > -1 ) {
        headers["Content-Type"] = "application/json";
    } else {
        headers.accept = "application/hal+json";
    }

    opts.headers = _mergeIn(opts.headers, headers);
    self.logdbg("OPTS: --------------> ", JSON.stringify(opts, null, 4));

    function reqCB(err, resp, body) {
        var  pkg = {};
        pkg.request = opts;
        pkg.response = {
            err: err,
            statusCode: resp ? resp.statusCode : null,
            statusMessage: resp ? resp.statusMessage : 'No response message',
            body: body,
            response: resp
        };
        if(self._executedRequests && self._executedRequests.length > 300) {
            logger.error('_executedRequests is not being cleared, this should not happen!');
            self._executedRequests = [];
        }
        self._executedRequests.push(pkg);
        requestCB(err, resp, body);
    }

    return request(opts, reqCB);
};

var pollForResponses = false;

var outstandingRequests = {};

var _pollerInterval = 500; // in ms
const REQUEST_CLEAR_TIMEOUT = 60 * 5 * 1000; // 5 minutes

var addReqestToPoller = function(body) {
    outstandingRequests[body.id] = {
        created: (new Date).getTime(), // used for us to clear it out later
        body: body, // the acutal response
        response: null // save response here, don't ask again after we have it
    };
}

//var _pollerRunning = false;
var requestResponsePoller = function() {
    var self = this;
    //  self.logdbg("requestResponsePoller()")
    var doPoll = function() {
        //      self.logdbg("requestResponsePoller.doPoll()")
        var then = (new Date).getTime() - REQUEST_CLEAR_TIMEOUT;
        var keyz = Object.keys(outstandingRequests);
        for (var n = 0; n < keyz.length; n++) {
            if (keyz[n].created < then) {
                self.logdbg("Request", keyz[n], "is stale. Deleting from table.");
                delete outstandingRequests[keyz[n]];
            } else {
                if (!outstandingRequests[keyz[n]].response) {
                    (function(id) {
                        doAPI_getRequestResponse(id).then(function(resp) {
                            if (resp) {
                                outstandingRequests[id].response = resp;
                                console.log("[Request Poller] >> Response [" + id + "]:", resp);
                            }
                        }, function(err) {
                            self.logdbg("Failed (getResponse):", err);
                        }).catch(function(err) {
                            self.logdbg("Failed (getResponse):", err);
                        });
                    })(keyz[n]);
                }
            }
        }

    }

    if (pollForResponses) {
        self._pollerRunning = true;
        doPoll();
        setTimeout(function() {
            self.requestResponsePoller();
        }, self._pollerInterval);
    }
}

var startRequestResponsePoller = function() {
    this.logdbg("startRequestResponsePoller");
    this.pollForResponses = true;
    if (!this._pollerRunning) {
        requestResponsePoller();
    }
}

var stopRequestResponsePoller = function() {
    this.pollForResponses = false;
    this._pollerRunning = false;
}

var showRequestsPending = function() {
    var keyz = Object.keys(this.outstandingRequests);
    console.log("id ----------------------------- | status ----------------- |")
    for (var n = 0; n < keyz.length; n++) {
        if (this.outstandingRequests[keyz[n]].response) {
            console.log(keyz[n], "|", "responsed")
        } else {
            console.log(keyz[n], "|", "pending")
        }

    }
}

var atEndOfPageable = function(body) {
    if (typeof body == 'object' && body._links && body._links.next && body._links.next.href) {
        if (body._links.self && body._links.self.href) {
            if (body._links.self.href == body._links.next.href) {
                return true;
            }
        } else {
            // invalid - so don't call again
            return true;
        }
        return false;
    }
    // invalid - so don't call again
    return true;
}

var doAPI_getUsersAccounts = function(userid) {
    var self = this;
    // cb is function(err,result){}
    var totalResults = [];

    var getNextAccounts = function(uri, cb) {
        // if(lastsite) {
        //  uri += "?lastSite="+lastsite
        // }
        self.logdbg("   [GET] " + uri)
        var met = self._metricIn("GET " + uri)
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
                    self.logdbg(uri + " OK (200): ", body);
                    if (body && body._embedded && body._embedded.accounts && body._embedded.accounts.length > 0) {
                        totalResults = totalResults.concat(body._embedded.accounts);
                    }
                    if (!atEndOfPageable(body)) {
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
        if (!userid) {
            reject("Need userid")
            return;
        }
        var uri = self.program.cloud + "/api/users/" + userid + "/accounts";
        getNextAccounts(uri, function(err, result) {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        })

    })

}

//  params: {'offline'|'online'|'all'} {site-id|'any'} {account-id|'any'} {pairingcode}


/**
 * get the users in a particular account
 * @param  {[type]} id THe Account ID
 * @return {[type]}    [description]
 */
var getAccountInfoAsRoot = function(id) {
    var self = this;
    var totalResults = [];

    return new Promise(function(resolve, reject) {



        self._authedRequest('/accounts/' + id + '/users', {
            json: true,
            method: 'get'
        }, function(error, resp, body) {
            if (error) {
                reject(error)
                // console.log("Error on /api/requests: ", err);
                // process.exit(1);
            } else {
                if (resp && resp.statusCode && resp.statusCode == 200) {
                    self.logdbg("/api/accounts/ID/users OK (200): ", body);
                    if (body && body._embedded && body._embedded.accounts && body._embedded.accounts.length > 0) {
                        totalResults = totalResults.concat(body._embedded.accounts);
                    }
                    //if (!atEndOfPageable(body)) {
                      //  self.logdbg("NEXT>>>>>>>>>>>>>>>>", body._links)
                       // setImmediate(function(link, cb) {
                         //   getNextAccounts(link, cb)
                       // }, self._toApiUri(body._links.next.href), cb);
                   // } else {
                        resolve(totalResults)
                        // setImmediate(function(body){
                        // cb(undefined,totalResults);
                        // },body);
                    //}
                } else {
                    reject("Invalid response: " + resp.statusCode + " --> " + resp.statusMessage);
                }
            }

        })


    });
}


// global users by email
//var gUsersByEmail = {};

// uses GET /users
// byEmail option will hopefully have better capability if
// https://wigwag.atlassian.net/browse/CLD-383 is addressed
/*var doAPI_getUsers = function() {
    var self = this;
    function _getAllUsers(uri, cb) {
        self._metricIn("GET /users")
        self._authedRequest(null, {
            uri: uri,
            json: true,
            method: 'get'
        }, function(error, resp, body) {
            if (error) {
                reject(error)
                // console.log("Error on /api/requests: ", err);
                // process.exit(1);
            } else {
                self._metricOut("GET /users")
                if (resp && resp.statusCode && resp.statusCode == 200) {
                    self.logdbg("/api/users OK (200): ", body);
                    if (body && body._embedded && body._embedded.users) {

                        // turn the data into a map, so it's actually usable
                        for (var n = 0; n < body._embedded.users.length; n++) {
                            if (body._embedded.users[n].email && body._embedded.users[n].id) {
                                self.gUsersByEmail[body._embedded.users[n].email] = body._embedded.users[n];
                            } else {
                                self.logerr("Malformed user from API [" + n + "]:", body._embedded.users[n])
                            }
                        }
                    }
                    if (!atEndOfPageable(body)) {
                        self.logdbg("NEXT>>>>>>>>>>>>>>>>", body._links)
                        setImmediate(function(link, cb) {
                            _getAllUsers(link, cb);
                        }, self._toApiUri(body._links.next.href), cb);
                    } else {
                        setImmediate(function(p) {
                            cb(null, p);
                        }, self.gUsersByEmail);
                    }
                } else {
                    cb("Invalid response: " + resp.statusCode + " --> " + resp.statusMessage);
                }
            }
        });
    }

    return new Promise(function(resolve, reject) {
        _getAllUsers(self._toApiUri("/users"), function(err, result) {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        })

    });
}*/

var doGetUserByEmail = function(email) {
    var self = this;
    return new Promise(function(resolve, reject) {
        var keyz = Object.keys(self.gUsersByEmail);
        if (keyz.length < 1) {
            self.getUsers().then(function() {
                resolve(self.gUsersByEmail[email]);
            }).catch(function(err) {
                reject(err);
            })
        } else {
            resolve(self.gUsersByEmail[email]);
        }
    });
}

// uses GET /users
/*var getUsersForAccount = function(accountid) {


}*/


/**
 *
 * @param  {string} path         Path on the file system the dcs-tools sute is running, to the image
 * @param  {object} image_params An object of the form
 * {
 *   imageType: "devicejs",         // currently, only 'devicejs' is accepted
 *   imageName: "some-name",        // alpha-numerics and underscore
 *   imageVersion: "some-version"  // of the form, N.N.N e.g. 1.0.0
 * }
 * @return {[type]}              [description]
 */
var doAPI_putImage = function(imgpath, image_params) {
    var self = this;
    return new Promise(function(resolve, reject) {
        if (typeof image_params == 'object' &&
            image_params.imageType &&
            image_params.imageName &&
            image_params.imageVersion) {

            var upload_name = image_params.imageType + "-" + image_params.imageName + "-" + image_params.imageVersion + ".img"
            self.logdbg("/images/" + upload_name + " <--- local:" + imgpath)

            var fname = path.basename(imgpath);

            var formdata = {
                imageFile: {
                    value: fs.createReadStream(imgpath),
                    options: {
                        filename: fname,
                        contentType: 'application/zip'
                    }
                }
            };

            self._authedRequest("/images/" + upload_name, {
                json: true,
                method: 'put',
                formData: formdata
            }, function(error, resp, body) {
                if (error) {
                    reject(error)
                    // console.log("Error on /api/requests: ", err);
                    // process.exit(1);
                } else {
                    if (resp && resp.statusCode && resp.statusCode == 200) {
                        self.logdbg("/images/" + upload_name + " OK (200): ", resp.headers);
                        resolve(resp.headers.location);
                    } else {
                        reject("Invalid response: " + resp.statusCode + " --> " + resp.statusMessage);
                    }
                }
            });
        } else {
            reject("Invalid params")
        }

    });

}

var doAPI_getImage = function(imagename, outputpath) {
    var self = this; 
    return new Promise(function(resolve, reject) {
        var outfname = path.join(outputpath, imagename);
        self._authedRequest("/images/" + imagename, {
            method: 'get'
        }, function(error, resp, body) {
            if (error) {
                reject(error)
                // console.log("Error on /api/requests: ", err);
                // process.exit(1);
            } else {
                if (resp && resp.statusCode && resp.statusCode == 200) {
                    self.logdbg("/images/" + imagename + " OK (200): ", resp.headers);
                    resolve(outfname);
                } else {
                    reject("Invalid response: " + resp.statusCode + " --> " + resp.statusMessage);
                }
            }
        }).pipe(fs.createWriteStream(outfname));
    });
}


var doAPI_putApp = function(appname, apptype) {
    var self = this;
    return new Promise(function(resolve, reject) {
        if (typeof appname == 'string') {
            if (!apptype) apptype = 'devicejs'

            var uri = "/apps/" + appname
            self.logdbg(uri)
            var body = {
                name: appname,
                type: apptype
            }
            self._authedRequest(uri, {
                json: true,
                method: 'put',
                body: body
            }, function(error, resp, body) {
                if (error) {
                    reject(error)
                    // console.log("Error on /api/requests: ", err);
                    // process.exit(1);
                } else {
                    if (resp && resp.statusCode && resp.statusCode == 200) {
                        self.logdbg(uri + " OK (200): ", resp.statusText);
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
}


var doAPI_getApps = function() {
    var self = this;
    // cb is function(err,result){}
    var totalResults = [];
    var uri = self.program.cloud + "/api/apps";
    var getNext = function(uri, cb) {
        // if(lastsite) {
        //  uri += "?lastSite="+lastsite
        // }
        self.logdbg("   [GET] " + uri)
        var met = self._metricIn("GET /apps")
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
                    self.logdbg("/api/apps OK (200): ", body);
                    if (body && body._embedded && body._embedded.apps && body._embedded.apps.length > 0) {
                        totalResults = totalResults.concat(body._embedded.apps);
                    }
                    if (!atEndOfPageable(body)) {
                        self.logdbg("NEXT>>>>>>>>>>>>>>>>", body._links)
                        setImmediate(function(link, cb) {
                            getNext(link, cb)
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

        getNext(uri, function(err, result) {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        })

    })

}


/**
 * [doAPI_putPublishApp description]
 * @param  {string} appname     [description]
 * @param  {string} version     [description]
 * @param  {object} imageDef    [description]
 * @param  {string} description optional
 * @param  {string} apptype     defaults to 'devicejs'
 * @return {Promise}             [description]
 */
var doAPI_putPublishApp = function(appname, version, imageDef, description, apptype) {
    var self = this;
    return new Promise(function(resolve, reject) {
        if (typeof appname == 'string' &&
            typeof version == 'string' &&
            typeof imageDef == 'object') {

            if (typeof apptype != 'string') apptype = 'devicejs'

            var uri = "/apps/" + appname + '/versions/' + version
            self.logdbg(uri)
            var body = {
                name: appname,
                type: apptype,
                version: version,
                image: imageDef
            }
            if (description) body.description = description;

            self._authedRequest(uri, {
                json: true,
                method: 'put',
                body: body
            }, function(error, resp, body) {
                if (error) {
                    reject(error)
                    // console.log("Error on /api/requests: ", err);
                    // process.exit(1);
                } else {
                    if (resp && resp.statusCode && resp.statusCode == 200) {
                        self.logdbg(uri + " OK (200): ", resp.statusText);
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
}


var doAPI_postRelayConfiguration = function(configDef) {
    var self = this;
    return new Promise(function(resolve, reject) {
        if (typeof configDef == 'object') {

            var uri = "/relayconfigurations";
            self.logdbg(uri)

            self._authedRequest(uri, {
                json: true,
                method: 'post',
                body: configDef
            }, function(error, resp, body) {
                if (error) {
                    reject(error)
                    // console.log("Error on /api/requests: ", err);
                    // process.exit(1);
                } else {
                    if (resp && resp.statusCode && resp.statusCode == 201) {
                        self.logdbg(uri + " Created (201): ", resp.statusText);
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
}

var doAPI_getRelayConfigurations = function(limit) {
    var self = this;
    // cb is function(err,result){}
    var totalResults = [];
    var uri = self.program.cloud + "/api/relayconfigurations";
    var getNext = function(uri, cb) {
        self.logdbg("   [GET] " + uri)
        var met = self._metricIn("GET /relayconfigurations")
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
                    self.logdbg("/api/relayconfigurations OK (200): ", body);
                    if (body && body._embedded && body._embedded.relayConfigurations && body._embedded.relayConfigurations.length > 0) {
                        totalResults = totalResults.concat(body._embedded.relayConfigurations);
                    }
                    if (!atEndOfPageable(body)) {
                        self.logdbg("NEXT>>>>>>>>>>>>>>>>", body._links)
                        setImmediate(function(link, cb) {
                            getNext(link, cb)
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
        if (limit) {
            uri += "?limit=" + limit;
        }
        getNext(uri, function(err, result) {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        })

    })

}


var doAPI_postRelayTasks = function(name, opDef, relays) {
    var self = this;
    return new Promise(function(resolve, reject) {
        if (typeof opDef == 'object' &&
            typeof name == 'string' &&
            typeof relays == 'object') { // relays is an array of strings

            var body = {
                name: name,
                op: opDef,
                relays: relays
            };

            var uri = "/relaytasks";
            self.logdbg(uri)
            self.logdbg("body=", util.inspect(body))

            self._authedRequest(uri, {
                json: true,
                method: 'post',
                body: body
            }, function(error, resp, body) {
                if (error) {
                    reject(error)
                    // console.log("Error on /api/requests: ", err);
                    // process.exit(1);
                } else {
                    if (resp && resp.statusCode && resp.statusCode == 202) {
                        self.logdbg(uri + " Submitted (202): ", resp.statusText);
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
}


var doAPI_getRelayTask = function(taskid) {
    var self = this;
    return new Promise(function(resolve, reject) {

        var uri = '/relaytasks'
        if (taskid) {
            uri += '/' + taskid;
        }

        self._authedRequest(uri, {
            json: true,
            method: 'get'
        }, function(error, resp, body) {

            if (error) {
                reject(error)
                // console.log("Error on /api/requests: ", err);
                // process.exit(1);
            } else {
                if (resp && resp.statusCode && resp.statusCode == 200) {
                    self.logdbg("/api/apps OK (200): ", body);
                    resolve(body)
                    // if(body && body._embedded && body._embedded.apps && body._embedded.apps.length > 0) {
                    //  totalResults = totalResults.concat(body._embedded.apps);
                    // }
                    // if(!atEndOfPageable(body)) {
                    //  self.logdbg("NEXT>>>>>>>>>>>>>>>>",body._links)
                    //  setImmediate(function(link,cb){
                    //      getNext(link,cb)
                    //  },self._toApiUri(body._links.next.href),cb);
                    // } else {
                    //  setImmediate(function(body){
                    //      cb(undefined,totalResults);
                    //  },body);
                    // }
                    //                  resolve(body);
                } else {
                    reject("Invalid response: " + resp.statusCode + " --> " + resp.statusMessage);
                    //                  reject("Invalid response: " + resp.statusCode + " --> " + resp.statusMessage);
                }
            }

        })
    });
}

var createFwManifest = function(manifestName, payloadUri, firmware, cert, key, description) {
    var self = this;
    return new Promise(function(resolve,reject) {
        fs.writeFileSync(manifestName+'.json', JSON.stringify({
           "encryptionMode" : "none-ecc-secp256r1-sha256",
            "vendorId" : "42fa7b481a6543aa890f8c704daade54",
            "classId" : "c56f3a62b52b4ef695a0db7a6e3b5b21",
            "payloadUri" : payloadUri,
            "payloadFile": firmware,
            "certificates": [
                { "file" : cert }
            ]
        }, null, 4));

        var cmd = ["create", "-i", manifestName+".json", "-o", "manifests/"+manifestName+".bin", "-k", key, "-p", firmware]
        var child = exec("manifest-tool/bin/manifest-tool", cmd,(error,stdout,stderr)=>{
            if(error) {
                reject("Error creating manifest - " + error)
            } else if (stderr) {
                reject("stderror creating manifests - " + stderr)
            } else {
                if (stdout) console.log(stdout)
                resolve("manifests/"+manifestName+".bin")
            }
        })
    })
}


var API = function() {
    this.program = {}
    this.access = null
    this._enableDebug = false;
    this.logdbg = logdbg
    this.logerr = logerr
    this.loginfo = loginfo
    this._pollerRunning = false;
    this._pollerInterval = 500; // in ms
    this.pollForResponses = false;
    this.outstandingRequests = {};
    this.gUsersByEmail = {};
    this.gSchedules = {};
    this._metricIn = metricIn
    this._metricOut = metricOut
    this._executedRequests = [];
}

var setAccessObject = function(access, cloudUrl, accountID, headers) {
    // logger.info('Using access ' + JSON.stringify(access);
    this.access = access;
    this.program.cloud = cloudUrl;
    this.program.useAccountsSubpath = true;
    this.program.account = accountID;
    this.headers = headers;
    if(cloudUrl.indexOf('mbed') > 0) {
        FirmwareManagement.init(cloudUrl, access.access_token);
    }
}

var enableDebug = function(flag) {
    this.program.debug = true;
    this._enableDebug = !!flag;
    logger.info("debug is enabled.")
}

var SiteResourceManagement = require('./components/SiteResourceManagement')
var SiteManagement = require('./components/SiteManagement')
var SiteGroups = require('./components/SiteGroups')
var Schedules = require('./components/Schedules')
var RoleManagement = require( './components/RoleManagement')
var Request = require('./components/Request')
var History = require('./components/History')
var SiteDatabase = require('./components/SiteDatabase')
var RelayManagement = require('./components/RelayManagement')
var Alerts = require('./components/Alerts');
var AccountManagement = require('./components/AccountManagement');
var UserManagement = require('./components/UserManagement');
var Loginout = require('./components/Login');
var DeviceLogs = require('./components/deviceLogs')
const FirmwareManagement = require('./components/FirmwareManagement')

API.prototype = {
    initAPI: initAPI,
    Login: Loginout.login,
    getLogin: Loginout.getlogin,
    Logout: Loginout.logout,
    saveLogout: Loginout.savelogout,
    _loginWithPass: loginWithPass,
    setAccessObject: setAccessObject,
    enableDebug: enableDebug,
    _requestResponsePoller: requestResponsePoller,
    getAuthWithPass: getAuthWithPass,
    useInternalAPI: useInternalAPI,
    refRequest: refRequest,
    _internal_authedRequest: internal_authedRequest,
    _toApiUri: toApiUri,
    _toMbedApiUri: toMbedApiUri,
    _toApiUriWithAccount: toApiUriWithAccount,
    _toCUIwithAccount: toCUIwithAccount,
    _toCUIwithoutAccount: toCUIwithoutAccount,
    _addParams: addParams,
    _authedRequest: authedRequest,
    startRequestResponsePoller: startRequestResponsePoller,
    stopRequestResponsePoller: stopRequestResponsePoller,
    showRequestsPending: showRequestsPending,
    getRequestResponse: Request.doAPI_getRequestResponse,
    postRequest: Request.doAPI_postRequest,
    getRequestStatus: Request.doAPI_getrequeststatus,
    cmdDiagnostics: Request.doAPI_diagnostics,
    getDiagnosticsCUIS: SiteManagement.doAPI_diagnostics,
    getAllResourceStates: Request.doAPI_getAllResourceStates,
    executeCommand: Request.doAPI_executeCommand,
    postSite: SiteManagement.doAPI_postSite,
    deleteSite: SiteManagement.doAPI_deleteSite,
    getSiteresourcetypes: SiteManagement.doAPI_getSiteresourcetypes,
    getSiteinterfaces: SiteManagement.doAPI_getSiteinterfaces,
    getDeviceInterfaces: SiteResourceManagement.doAPI_getDeviceInterfaces,
    updateSite: SiteManagement.doAPI_updateSite,
    getSites: SiteManagement.doAPI_getSites,
    getSiteMap: SiteManagement.doAPI_getSiteMap,
    inviteUser: UserManagement.doAPI_inviteUser,
    getaSite: SiteManagement.getaSite,
    getResources: SiteResourceManagement.doAPI_getResources,
    getDevices: SiteResourceManagement.doAPI_getDevices,
    deleteResources: SiteResourceManagement.doAPI_deleteResources,
    getResourceState: SiteResourceManagement.doAPI_getResourceState,
    getDeviceData: SiteResourceManagement.doAPI_getDeviceData,
    updateResourceState: SiteResourceManagement.doAPI_updateResourceState,
    updateResourceStateCUIS :SiteResourceManagement.doAPI_updateResourceStateCUIS,
    createGroup: SiteResourceManagement.doAPI_creategroup,
    updateGroup: SiteResourceManagement.doAPI_updategroup,
    deleteGroup: SiteResourceManagement.doAPI_deletegroup,
    getGroup: SiteResourceManagement.doAPI_getgroup,
    getGroupWithImage: SiteResourceManagement.doAPI_getgroupwithimage,
    getHistory: History.doAPI_getHistory,
    getAccounts: AccountManagement.doAPI_getAccounts,
    getUsersAccounts: doAPI_getUsersAccounts,
    getRelays: RelayManagement.doAPI_getRelays,
    getRelay: RelayManagement.doAPI_getRelaystatus,
    getAccountInfoAsRoot: getAccountInfoAsRoot,
    getUsers: UserManagement.doAPI_getUsers,
    getUserByEmail: doGetUserByEmail,
    getUserinfo:UserManagement.doAPI_getUserinfo,
    //getUsersForAccount: getUsersForAccount,
    postUserAccessRule: UserManagement.postUserAccessRule,
    getUserAccessRule: UserManagement.getUserAccessRule,
    getaAccessRule: UserManagement.getaUserAccessRule,
    deleteUserAccessRule: UserManagement.deleteUserAccessRule,
    putImage: doAPI_putImage,
    getImage: doAPI_getImage,
    putApp: doAPI_putApp,
    getApps: doAPI_getApps,
    putPublishApp: doAPI_putPublishApp,
    postRelayConfiguration: doAPI_postRelayConfiguration,
    getRelayConfigurations: doAPI_getRelayConfigurations,
    postRelayTasks: doAPI_postRelayTasks,
    getRelayTask: doAPI_getRelayTask,
    uploadEnrollmentID: RelayManagement.doAPI_uploadEnrollmentID,
    getEnrollmentID: RelayManagement.doAPI_getEnrollmentID,
    getPelionDevices: RelayManagement.doAPI_getPelionDevices,
    getPelionEdgeGateways: RelayManagement.doAPI_getPelionEdgeGateways,
    patchRelays: RelayManagement.doAPI_patchRelays,
    postSchedule: Schedules.doAPI_postSchedule,
    getSchedules: Schedules.doAPI_getSchedules,
    getASchedule: Schedules.doAPI_getaSchedule,
    putSchedule: Schedules.doAPI_putSchedule,
    deleteSchedule: Schedules.doAPI_deleteSchedule,
    createRoles: RoleManagement.doAPI_createRoles,
    getRoles: RoleManagement.doAPI_getRoles,
    getaRole: RoleManagement.doAPI_getaRole,
    deleteaRole: RoleManagement.doAPI_deleteaRole,
    createSiteGroup: SiteGroups.doAPI_createSitegroup,
    getSiteGroup: SiteGroups.doAPI_getSitegroup,
    deleteSiteGroup: SiteGroups.doAPI_deleteSitegroup,
    getDatabase: SiteDatabase.doAPI_getdatabase,
    getBuckets: SiteDatabase.doAPI_getbucketlinks,
    getKeysdata: SiteDatabase.doAPI_readkeys,
    updateKeys: SiteDatabase.doAPI_patchkeys,
    removeRelayFromAccount: RelayManagement.doAPI_patchRelay,
    importRelay: RelayManagement.doAPI_putRelay,
    getAlerts: Alerts.doAPI_getAlert,
    getAnAlert:Alerts.doAPI_getanAlert,
    dismissAlert: Alerts.doAPI_dismissAlert,
    renameAccount: AccountManagement.doAPI_putAccountname,
    getDeviceLogs: DeviceLogs.doAPI_deviceLogs,
    listFirmwareImages: FirmwareManagement.listFwImages,
    addFirmwareImage: FirmwareManagement.addFwImage,
    listFirmwareManifests: FirmwareManagement.listFwManifests,
    createFirmwareManifest: createFwManifest,
    addFirmwareManifest: FirmwareManagement.addFwManifest,
    addCampaign: FirmwareManagement.addCampaign,
    startCampaign: FirmwareManagement.startCampaign,
    getCampaign: FirmwareManagement.getCampaign,
    listCampaignDeviceStates:FirmwareManagement.listCampaignDevStates
}

module.exports = new API()