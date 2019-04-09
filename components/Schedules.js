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
const logger = new Logger( {moduleName: 'schedules', color: 'white'} )
const chalk = require('chalk');
module.exports = {
    //Scheduler APIs
    doAPI_postSchedule: function(siteid, obj, logreqCB) {
        var self = this;
        self._executedRequests = [];
        var uri = self._toApiUriWithAccount("/sites/" + siteid + "/schedules");
        return new Promise(function(resolve, reject) {
            self._authedRequest(null, {
                uri: uri,
                json: true,
                method: 'post',
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

                    if (resp && resp.statusCode && resp.statusCode == 201) {
                        self.logdbg("/api/sites/" + siteid + "/schedules OK (201): ", body);
                        resolve(body);
                    } else {
                        reject(resp)
                        //reject("Invalid response: " + resp.statusCode + " --> " + resp.statusMessage);
                    }
                }
            });
        });
    },

    doAPI_getSchedules: function(siteid, logreqCB) {
        var self = this;
        self._executedRequests = [];
        var uri = self._toApiUriWithAccount("GET/sites/" + siteid + "/schedules");
        var gSchedules = {};

        function _getAllSchedules(uri, cb) {
            var met = self._metricIn("GET /sites/" + siteid + "/schedules")
            if (siteid == null) {
                logger.error("Enter siteid");
                //process.exit(1);
                cb(chalk.bold("siteid not found"));
            }
            gSchedules = {};
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
                    self._metricOut(met);
                    if (resp && resp.statusCode && resp.statusCode == 200) {
                        self.logdbg("/api/sites" + siteid + "/schedules OK (200): ", body);
                        if (body && body._embedded && body._embedded.schedules) {

                            // turn the data into a map, so it's actually usable
                            for (var n = 0; n < body._embedded.schedules.length; n++) {
                                if (body._embedded.schedules[n].activated && body._embedded.schedules[n].id) {
                                    gSchedules[body._embedded.schedules[n].id] = body._embedded.schedules[n];
                                } else {
                                    logger.error("Malformed schedule from API [" + n + "]:", body._embedded.schedules[n])
                                }
                            }
                        }

                        setImmediate(function(p) {
                            cb(null, p);
                        }, gSchedules);

                    } else {
                        cb(resp)
                        //cb("Invalid response: " + resp.statusCode + " --> " + resp.statusMessage);
                    }
                }
            });
        }

        return new Promise(function(resolve, reject) {
            _getAllSchedules(self._toApiUriWithAccount("/sites/" + siteid + "/schedules"), function(err, result) {
                if (logreqCB && typeof logreqCB == 'function') {
                    logreqCB(self._executedRequests);
                }
                if (err) {
                    reject(err);
                } else {

                    resolve(result);
                }
            })

        });

    },
    doAPI_getaSchedule: function(siteid, scheduleid, logreqCB) {
        var gaSchedule = {};
        var self = this;
        self._executedRequests = [];
        var uri = self._toApiUriWithAccount("GET/sites/" + siteid + "/schedules/" + scheduleid);

        function _getaSchedule(uri, cb) {
            var met = self._metricIn("GET /sites/" + siteid + "/schedules/" + scheduleid);

            if (siteid == null) {
                logger.error("Enter siteid");
                //process.exit(1);
                cb(chalk.bold("siteid not found"));

            }
            if (scheduleid == null || scheduleid == siteid) {
                logger.error("Enter scheduleid");
                //process.exit(1);
                cb(chalk.bold("scheduleid not found"));

            }
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
                    self._metricOut(met);

                    if (resp && resp.statusCode && resp.statusCode == 200) {
                        console.log(resp);
                        self.logdbg("/api/sites" + siteid + "/schedules/" + scheduleid + "OK (200): ", body);
                        if (body && body.span && body.activated === true) {
                            if (Object.keys(body.action.states).length === 0) {
                                gaSchedule = body;
                            } else {
                                /*Object.keys(body.action.states).forEach(function(element) {
                                    var dummySch = {}
                                    dummySch.name = body.name;
                                    dummySch.dates = body.span.dates;
                                    dummySch.cron = body.span.cron;
                                    dummySch.duration = body.span.duration;
                                    dummySch.priority = body.priority;
                                    dummySch.action = body.action.states[element];
                                    gaSchedule[element] = dummySch;
                                });*/
                                gaSchedule = body; 
                            }
                        }
                        setImmediate(function(p) {
                            cb(null, p);
                        }, gaSchedule);

                    } else {
                        cb(resp)
                        //cb("Invalid response: " + resp.statusCode + " --> " + resp.statusMessage);
                    }
                }
            });
        }

        return new Promise(function(resolve, reject) {
            _getaSchedule(self._toApiUriWithAccount("/sites/" + siteid + "/schedules/" + scheduleid), function(err, result) {
                if (logreqCB && typeof logreqCB == 'function') {
                    logreqCB(self._executedRequests);
                }
                if (err) {
                    reject(err);
                } else {

                    resolve(result);
                }
            })

        });

    },

    doAPI_putSchedule: function(siteid, scheduleid, obj, logreqCB) {
        var self = this;
        self._executedRequests = [];
        return new Promise(function(resolve, reject) {
            self._authedRequest("/sites/" + siteid + "/schedules/" + scheduleid, {
                json: true,
                method: 'put',
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
                        self.logdbg("/api/sites/" + siteid + "/schedules/" + scheduleid + " OK (200): ", body);
                        resolve(body);
                    } else {
                        reject(resp)
                        //reject("Invalid response: " + resp.statusCode + " --> " + resp.statusMessage);
                    }
                }
            });
        });
    },

    doAPI_deleteSchedule: function(siteid, scheduleid,logreqCB) {
        var self = this;
        self._executedRequests = [];
        var daSchedule = {};
        var uri = self._toApiUriWithAccount("DELETE/sites/" + siteid + "/schedules/" + scheduleid);
        function _deleteSchedule(uri, cb) {
            var met = self._metricIn("DELETE/sites/" + siteid + "/schedules/" + scheduleid);
            if (siteid == null) {
                logger.error("Enter siteid");
                //process.exit(1);
                cb(chalk.bold("siteid not found"));
            }
            if (scheduleid == null) {
                logger.error("Enter scheduleid");
                //process.exit(1);
                cb(chalk.bold("scheduleid not found"));
            }
            self._authedRequest(null, {
                uri: uri,
                json: true,
                method: 'delete'
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
                    self._metricOut(met);

                    if (resp && resp.statusCode && resp.statusCode == 200) {
                        self.logdbg("/api/sites" + siteid + "/schedules/" + scheduleid + "OK (200): ", body);
                        setImmediate(function(p) {
                            cb(null, p);
                        }, daSchedule);

                    } else {
                        reject(resp)
                        //scb("Invalid response: " + resp.statusCode + " --> " + resp.statusMessage);
                    }
                }
            });
        }
        return new Promise(function(resolve, reject) {
            _deleteSchedule(self._toApiUriWithAccount("/sites/" + siteid + "/schedules/" + scheduleid), function(err, result) {
                if (logreqCB && typeof logreqCB == 'function') {
                    logreqCB(self._executedRequests);
                }
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            })

        });

    }
}