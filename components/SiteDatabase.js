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
const logger = new Logger( {moduleName: 'site-database', color: 'white'} );
var chalk = require('chalk');
module.exports = {
    doAPI_getdatabase: function(siteid, logreqCB) {
        var self = this;
        self._executedRequests = [];
        logger.info('GET /database DEPRECATED API');
        var uri = self._toApiUriWithAccount("/sites/" + siteid + "/database");
        //var gSchedules = {};
        var met = self._metricIn("GET /sites/" + siteid + "/database")
        return new Promise(function(resolve, reject) {
            if (siteid == null) {
                logger.error("Enter siteid");
                //process.exit(1);
                reject(chalk.bold("siteid not found"));
            }
            //gSchedules = {};
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
                    // logger.info("Error on /api/requests: ", err);
                    // process.exit(1);
                } else {
                    self._metricOut(met);
                    if (resp && resp.statusCode && resp.statusCode == 200) {
                        self.logdbg("/api/sites" + siteid + "/database OK (200): ", body);
                        if (body) {
                            resolve(body);
                        }

                    } else {
                        reject(resp)
                        //reject("Invalid response: " + resp.statusCode + " --> " + resp.statusMessage);
                    }
                }
            });
        })
    },
    doAPI_getbucketlinks: function(siteid, bucket, logreqCB) {
        var self = this;
        self._executedRequests = [];
        logger.info('GET /database/bucket DEPRECATED API');
        var uri = self._toApiUriWithAccount("/sites/" + siteid + "/database/" + bucket);
        //var gSchedules = {};
        var met = self._metricIn("GET /sites/" + siteid + "/database/" + bucket)
        return new Promise(function(resolve, reject) {
            if (siteid == null) {
                logger.error("Enter siteid");
                //process.exit(1);
                reject(chalk.bold("siteid not found"));
            }
            //gSchedules = {};
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
                    // logger.info("Error on /api/requests: ", err);
                    // process.exit(1);
                } else {
                    self._metricOut(met);
                    if (resp && resp.statusCode && resp.statusCode == 200) {
                        self.logdbg("/api/sites" + siteid + "/database OK (200): ", body);
                        if (body) {
                            resolve(body);
                        }

                    } else {
                        reject(resp)
                        //reject("Invalid response: " + resp.statusCode + " --> " + resp.statusMessage);
                    }
                }
            });
        })
    },
    doAPI_readkeys: function(siteid, bucket, inputtype, value,logreqCB) {
        var self = this;
        self._executedRequests = [];
        var params = [
            [inputtype, value]
        ];
        logger.info('GET /database/bucket/keys DEPRECATED API');
        var uri = self._toApiUriWithAccount("/sites/" + siteid + "/database/" + bucket + "/keys", params);
        var met = self._metricIn("GET /sites/" + siteid + "/database/" + bucket + "/keys")
        return new Promise(function(resolve, reject) {
            if (siteid == null) {
                logger.error("Enter siteid");
                //process.exit(1);
                reject(chalk.bold("siteid not found"));
            }
            //gSchedules = {};
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
                } else {
                    self._metricOut(met);
                    if (resp && resp.statusCode && resp.statusCode == 200) {
                        self.logdbg("/api/sites" + siteid + "/database OK (200): ", body);
                        if (body) {
                            resolve(body);
                        }
                    } else {
                        reject(resp);
                    }
                }
            });
        })
    },
    doAPI_patchkeys: function(siteid, bucket, option, path, value1, context,logreqCB) {
        var self = this;
        self._executedRequests = [];
        logger.info('PATCH /database/bucket/keys DEPRECATED API');
        var uri = self._toApiUriWithAccount("/sites/" + siteid + "/database/" + bucket + "/keys");
        var met = self._metricIn("PATCH /sites/" + siteid + "/database/" + bucket + "/keys")
        return new Promise(function(resolve, reject) {
            if (siteid == null) {
                logger.error("Enter siteid");
                //process.exit(1);
                reject(chalk.bold("siteid not found"));
            }
            var temp = {
                "value": "",
                "context": ""
            }
            if (context) {
                temp.context = context;
            }
            if (value1) {
                temp.value = value1;
            }

            var op = {
                "op": option,
                "path": path,
                "value": temp
            }

            var obj = [op];
            logger.info(obj);
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
                    // logger.info("Error on /api/requests: ", err);
                    // process.exit(1);
                } else {
                    self._metricOut(met);
                    if (resp && resp.statusCode && resp.statusCode == 200) {
                        self.logdbg("/api/sites" + siteid + "/database OK (200): ");
                        resolve("Key updated");
                    } else {
                        reject(resp)
                        //reject("Invalid response: " + resp.statusCode + " --> " + resp.statusMessage);
                    }
                }
            });
        })
    }
}

