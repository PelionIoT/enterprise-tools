'use strict';

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

const request = require('request');
const publicIp = require('public-ip');
const iplocation = require('iplocation');
const Logger = require('./../utils/logger');
const logger = new Logger( {moduleName: 'login', color: 'white'} );

function login(requestBody,hostname) {
  var self = this;
  var obj = requestBody;
  var uri = self._toApiUri("/oauth/login");
  return new Promise(function(resolve, reject) {
      self._authedRequest(null, {
          uri: uri,
          json: true,
          method: 'post',
          body: obj
      }, function(error, resp, body) {
          /*if (logreqCB && typeof logreqCB == 'function') {
              logreqCB(self._executedRequests);
          }*/
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
                  self.logdbg("Successfully Logged in: ", body);
                  resolve(body);
              } else {
                  reject(resp)
                  //reject("Invalid response: " + resp.statusCode + " --> " + resp.statusMessage);
              }
          }
      });
  });
}

function logout (hostname) {
  var self = this;
  var uri = self._toApiUri("/oauth/login");
  return new Promise(function(resolve, reject) {
      self._authedRequest(null, {
          uri: uri,
          json: true,
          method: 'delete'
      }, function(error, resp, body) {
          /*if (logreqCB && typeof logreqCB == 'function') {
              logreqCB(self._executedRequests);
          }*/
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
                  self.logdbg("Successfully Logged out: ", body);
                  resolve(body);
              } else {
                  reject(resp)
                  //reject("Invalid response: " + resp.statusCode + " --> " + resp.statusMessage);
              }
          }
      });
  });
}

function getlogin (hostname,userID) {
  var self = this;
  var uri = hostname + "/cloud-ui-server/v2/login?userID="+userID;
  return new Promise(function(resolve, reject) {
      self._authedRequest(null, {
          uri: uri,
          json: true,
          method: 'get'
      }, function(error, resp, body) {
          /*if (logreqCB && typeof logreqCB == 'function') {
              logreqCB(self._executedRequests);
          }*/
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
                  self.logdbg("Successfully Logged out: ", body);
                  resolve(body);
              } else {
                  reject(resp)
                  //reject("Invalid response: " + resp.statusCode + " --> " + resp.statusMessage);
              }
          }
      });
  });
}

function savelogout (userID,hostname) {
  var self = this;
  var latitude = null;
  var longitude = null;
  var ipaddress;
  var obj ={};
  obj.userID = userID;
  var uri = hostname + "/cloud-ui-server/v2/oauth/login";
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
  return a.then(function(resolve,reject) {
    return new Promise(function(resolve, reject) {
        obj.info = {
          latitude: latitude,
          longitude: longitude,
          appVersion: 'ETV'
        };
        self._authedRequest(null, {
            uri: uri,
            json: true,
            method: 'delete',
            body: obj
        }, function(error, resp, body) {
            /*if (logreqCB && typeof logreqCB == 'function') {
                logreqCB(self._executedRequests);
            }*/
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
                    self.logdbg("Successfully Logged out: ", body);

                    resolve(body);
                } else {
                    logger.error(resp);
                    reject(resp)
                    //reject("Invalid response: " + resp.statusCode + " --> " + resp.statusMessage);
                }
            }
        });
    }); 
  })
}

module.exports = {
    login,
    logout,
    getlogin,
    savelogout
};

