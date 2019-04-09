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
const logger = new Logger( {moduleName: 'role-management', color: 'white'} )
module.exports={
    doAPI_createRoles : function(obj, logreqCB) {
        var self = this;
        self._executedRequests = [];
        return new Promise(function(resolve, reject) {
            self._authedRequest("/roles", {
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
                        self.logdbg("/api/roles OK (201): ", body);
                        resolve(body);
                    } else {
                        reject(resp);
                        //reject("Invalid response: " + resp.statusCode + " --> " + resp.statusMessage);
                    }
                }
            });
        });
    },

    doAPI_getRoles : function(userid,accountID,name,logreqCB) {
        var self = this;
        self._executedRequests = [];
        var uri;
        if(userid){
            uri = self._toApiUriWithAccount("/roles?userID="+userid);
            if(accountID){
                uri = uri+"&accountID="+accountID;
                if(name){
                   uri = uri+"&name="+name;
                }
            }else if(name){
                uri = uri+"&name="+name;
            }
        }
        else if(!userid&&accountID){
            uri = self._toApiUriWithAccount("/roles?accountID="+accountID);
            if(name){
                uri = uri+"&name="+name;
            }

        }
        else{
            uri = self._toApiUri("/roles?name="+name);
        }
        //console.log(uri);
        
        return new Promise(function(resolve, reject) {
            self._authedRequest(null, {
                uri:uri,
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
                        self.logdbg("/api/roles OK (200): ", body);
                        resolve(body);
                    } else {
                        reject(resp);
                        //reject("Invalid response: " + resp.statusCode + " --> " + resp.statusMessage);
                    }
                }
            });
        });
    },

    doAPI_getaRole : function(roleID,logreqCB) {
        var self = this;
        self._executedRequests = [];
        return new Promise(function(resolve, reject) {
            var uri = self._toApiUriWithAccount("/roles/"+roleID);
            self._authedRequest(null, {
                uri:uri,
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
                        self.logdbg("/api/roles OK (200): ", body);
                        resolve(body);
                    } else {
                        reject(resp)
                        //reject("Invalid response: " + resp.statusCode + " --> " + resp.statusMessage);
                    }
                }
            });
        });
    },

    doAPI_deleteaRole : function(roleID,logreqCB) {
        var self = this;
        self._executedRequests = [];
        return new Promise(function(resolve, reject) {
            var uri = self._toApiUriWithAccount("/roles/"+roleID);
            self._authedRequest(null, {
                uri:uri,
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

                    if (resp && resp.statusCode && resp.statusCode == 200) {
                        self.logdbg("/api/roles OK (200): ", body);
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