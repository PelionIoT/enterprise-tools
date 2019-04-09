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
const logger = new Logger( {moduleName: 'user-management', color: 'white'} );
const util = require('util');
const common = require("../apicommon");
const chalk = require('chalk');
module.exports = {
// global users by email
//var gUsersByEmail = {};

// uses GET /users
// byEmail option will hopefully have better capability if
// https://wigwag.atlassian.net/browse/CLD-383 is addressed
    doAPI_getUsers : function() {
        var self = this;
        var mbed = false;
        function _getAllUsers(uri, cb) {
            self._metricIn("GET /users")
            self._authedRequest(null, {
                uri: uri,
                json: true,
                method: 'get'
            }, function(error, resp, body) {
                if (error) {
                    cb(error)
                    // reject(error)
                    // console.log("Error on /api/requests: ", err);
                    // process.exit(1);
                } else {
                    self._metricOut("GET /users")
                    if (resp && resp.statusCode && resp.statusCode == 200) {
                        // console.log(body._embedded.users);
                        if(!mbed) {
                            self.logdbg("/api/users OK (200): ", body);
                            if (body && body._embedded && body._embedded.users) {

                                // turn the data into a map, so it's actually usable
                                for (var n = 0; n < body._embedded.users.length; n++) {
                                    if (body._embedded.users[n].email && body._embedded.users[n].id) {
                                        self.gUsersByEmail[body._embedded.users[n].email] = body._embedded.users[n];
                                    } else {
                                        logger.error("Malformed user from API [" + n + "]:", body._embedded.users[n])
                                    }
                                }
                            }
                            if (!common.atEndOfPageable(body)) {
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
                            body.data.forEach(function(element) {
                                self.gUsersByEmail[element.email] = {
                                    email: element.email,
                                    id: element.email,
                                    name: element.full_name,
                                    status: element.status,
                                    roles: []
                                };
                            });
                            cb(null, self.gUsersByEmail);
                        }
                    } else {
                        cb("Invalid response: " + resp.statusCode + " --> " + resp.statusMessage);
                    }
                }
            });
        }
        return new Promise(function(resolve, reject) {
            var uri = self._toApiUri("/users");
            if(uri.indexOf('mbed') > -1) {
                mbed = true;
                uri = self.program.cloud + "/v3/users?order=DESC&limit=1000&include=total_count&status__eq=INVITED,ACTIVE,INACTIVE,RESET";
            }
            _getAllUsers(uri, function(err, result) {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    },
    doAPI_getUserinfo : function(userid) {
        var self = this;
        function _getUserinfo(uri, cb) {
            if (userid === undefined) {
                cb(chalk.bold("Enter userid to get information of the given userid "));
            }
            self._metricIn("GET /users/" + userid);

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
                    self._metricOut("GET /users/" + userid)
                    if (resp && resp.statusCode && resp.statusCode == 200) {
                        self.logdbg("/api/users" + userid + " OK (200): ", body);
                        if (body) {
                            if (body.email && body.id === userid) {
                                self.gUsersByEmail[body.email] = body;
                            } else {
                                logger.error("Malformed user from API");
                            }
                        }
                        setImmediate(function(p) {
                            cb(null, p);
                        }, self.gUsersByEmail);

                    } else {
                        cb("Invalid response: " + resp.statusCode + " --> " + resp.statusMessage);
                    }
                }
            });
        }
        return new Promise(function(resolve, reject) {
            _getUserinfo(self._toApiUri("/users/" + userid), function(err, result) {
                if (err) {
                    reject(err);
                } else {

                    resolve(result);
                }
            })

        });
    },
    // uses: /users/{userID}/accessrules
    postUserAccessRule: function(userid, obj, logreqCB) {
        var self = this;
        self._executedRequests = [];
        return new Promise(function(resolve, reject) {
            self._authedRequest("/users/" + userid + "/accessrules", {
                json: true,
                method: 'post',
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
                } else {
                    if (resp && resp.statusCode && resp.statusCode == 201) {
                        self.logdbg("/api/users/" + userid + "/accessrules OK (201): ", body);
                        resolve(body);
                    } else {
                        reject(resp);
                        //reject("Invalid response: " + resp.statusCode + " --> " + resp.statusMessage);
                    }
                }
            });
        });
    },

    getUserAccessRule: function(userid, name, logreqCB) {
        var self = this;
        self._executedRequests = [];
        var param = [];
        param.push(["name", name]);
        var uri;
        /*if(name){
            uri = self._toApiUriWithAccount("/users/"+userid+"/accessrules",param);
        }else{
            uri = self._toApiUriWithAccount("/users/"+userid+"/accessrules "); 
        }*/
        if (name) {
            uri = self._toApiUri("/users/" + userid + "/accessrules", param);
        } else {
            uri = self._toApiUri("/users/" + userid + "/accessrules ");
        }
        return new Promise(function(resolve, reject) {
            self._authedRequest(null, {
                uri: uri,
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
                        self.logdbg("/api/users/" + userid + "/accessrules OK (200): ", body);
                        resolve(body);
                    } else {
                        reject(resp);
                        //reject("Invalid response: " + resp.statusCode + " --> " + resp.statusMessage);
                    }
                }
            });
        });
    },

    getaUserAccessRule: function(userid, ruleid, logreqCB) {
        var self = this;
        self._executedRequests = [];
        var uri = self._toApiUri("/users/" + userid + "/accessrules/" + ruleid);
        return new Promise(function(resolve, reject) {
            self._authedRequest(null, {
                uri: uri,
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
                        self.logdbg("/api/users/" + userid + "/accessrules OK (200): ", body);
                        resolve(body);
                    } else {
                        reject(resp);
                        //reject("Invalid response: " + resp.statusCode + " --> " + resp.statusMessage);
                    }
                }
            });
        });
    },

    deleteUserAccessRule: function(userid, ruleid, logreqCB) {
        var self = this;
        self._executedRequests = [];
        var uri = self._toApiUri("/users/" + userid + "/accessrules/" + ruleid);
        return new Promise(function(resolve, reject) {
            self._authedRequest(null, {
                uri: uri,
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
                } else {
                    if (resp && resp.statusCode && resp.statusCode == 200) {
                        self.logdbg("/api/users/" + userid + "/accessrules/" + ruleid + " OK (200): ", body);
                        resolve(body);
                    } else {
                        reject(resp);
                        //reject("Invalid response: " + resp.statusCode + " --> " + resp.statusMessage);
                    }
                }
            });
        });
    },

    doAPI_inviteUser: function(userID, to, from, logreqCB) {
        var self = this;
        self._executedRequests = [];
        return new Promise(function(resolve, reject) {
            var _uri = self._toCUIwithAccount("/user/" + userID + '/invite');
            self._authedRequest(null, {
                uri: _uri,
                json: true,
                method: 'post',
                body: {
                    invite: {
                        to: to,
                        from: from
                    }
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
    }
};