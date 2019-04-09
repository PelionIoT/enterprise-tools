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

const DCS = require('./../api.js');
const program = require('commander');
var fs = require("fs");
const version = "1.0.0";

program
    .version(version)
    .usage('[options] command {args...}')
    .option('-c, --cloud [IP or DNS]', 'Cloud (DCS) Cluster')
    .option('-a, --account [accountid]', 'account ID')
    .option('-h, --help[type]','help for each command')
    .option('-u, --user [userid]', 'user name')
    .option('-p, --password [password]', 'password')
    .parse(process.argv);

//login and setup DCS environment
if(!program.cloud || !program.user || !program.password || !program.account) {
    program.help();
    process.exit(1);
}

let setupDCS = function(token) {
    // Set access token for dcs-tools
    DCS.setAccessObject(token, 
        program.cloud,
        program.account
    );
};

let getResourceGroupImages = function(logreqCB) {
    var self = this;
    self._executedRequests = [];
    return new Promise(function(resolve, reject) {
        var _uri = DCS._toCUIwithAccount("/images/ResourceGroupImages");
        DCS._authedRequest(null, {
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
                console.error('Failed: ', resp);
                reject(resp);
            } else {

                if (resp && resp.statusCode && resp.statusCode == 200) {
                    console.log(body);
                    resolve(body);
                } else {
                    console.error('Failed: ', resp);
                    reject(resp);
                }
            }
        });
    });
};

let deleteResourceGroupImage = function(imageID, logreqCB) {
    var self = this;
    self._executedRequests = [];
    return new Promise(function(resolve, reject) {
        var _uri = DCS._toCUIwithAccount("/images/" + imageID);
        DCS._authedRequest(null, {
            uri: _uri,
            json: true,
            method: 'delete',
            headers: {
                secret: "63e7c71687c1228388612522269c7cdf"
            }
        }, function(error, resp, body) {
            if (logreqCB && typeof logreqCB == 'function') {
                logreqCB(self._executedRequests);
            }
            if (error) {
                resp = {};
                resp.statusMessage = error;
                resp.statusCode = 500;
                console.error('Failed: ', resp);
                reject(resp);
            } else {

                if (resp && resp.statusCode && resp.statusCode == 200) {
                    console.log(body);
                    resolve(body);
                } else {
                    console.error('Failed: ', resp);
                    reject(resp);
                }
            }
        });
    });
};

let uploadResourceGroupImage = function(filepath, logreqCB) {
    var self = this;
    self._executedRequests = [];
    return new Promise(function(resolve, reject) {
        var _uri = DCS._toCUIwithAccount("/images/ResourceGroupImages");
        /*
            var fs = require("fs");
            var request = require("request");

            var options = { method: 'PUT',
              url: 'https://devcloud.wigwag.io/cloud-ui-server/accounts/d55fa29dbad3418883374168ba4791fd/helper/imageBucket/ResourceGroupImages',
              headers: 
               { 'Postman-Token': 'ba296e8c-abd4-6b88-9e2c-653579048fc8',
                 'Cache-Control': 'no-cache',
                 cloudurl: 'https://devcloud.wigwag.io',
                 Authorization: 'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VySUQiOiJiODAyODkyOWRmNmE0YjRhYWEzYjM3MWM4ZWY2NGYwMyIsImFjY291bnRzIjpbImQ1NWZhMjlkYmFkMzQxODg4MzM3NDE2OGJhNDc5MWZkIl0sImFzc29jaWF0aW9uSUQiOiJlOWUwM2RhYWU5NjA0YWFjYWE3Y2E3NTA2NDljYzE2MCIsImlhdCI6MTUyMjgyNjc0NH0.LAM1oz4zj23mTTK-Mt8xWou7qwQ64_GQxW74xQFQ1Bw',
                 'content-type': 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW' },
              formData: 
               { image: 
                  { value: 'fs.createReadStream("/home/yashgoyal/externaldrive/Location-app-images/Seating-Area-C-Store.png")',
                    options: 
                     { filename: '/home/yashgoyal/externaldrive/Location-app-images/Seating-Area-C-Store.png',
                       contentType: null } } } };

            request(options, function (error, response, body) {
              if (error) throw new Error(error);

              console.log(body);
            });
         */
        DCS._authedRequest(null, {
            uri: _uri,
            json: true,
            method: 'put',
            formData: {
                image: {
                    value: 'fs.createReadStream('+filepath+')',
                    options: {
                        filename: filepath,
                        contentType: null
                    }
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
                console.error('Failed: ', resp);
                reject(resp);
            } else {

                if (resp && resp.statusCode && resp.statusCode == 200) {
                    console.log(body);
                    resolve(body);
                } else {
                    console.error('Failed: ', resp);
                    reject(resp);
                }
            }
        });
    });
};

let doLoginAndGo = function() {
    process.stdout.write("Logging...");
    let interval = setInterval(function() {
        process.stdout.write('.');
    }, 500);
    DCS.getAuthWithPass(program.user, program.password).then(function(result) {
        console.log("Logged in successfully!");
        clearInterval(interval);
        setupDCS(result);
        console.log('Deleting image...');
        deleteResourceGroupImage("5af1193b9f05f10100f7b74c").then(function(allImages) {
            // uploadResourceGroupImage('/home/yashgoyal/externaldrive/Location-app-images/Seating-Area-C-Store.png');
        });
    }, function(err) {
        console.error('Login failed ', err);
        exit(1);
    }).catch(function(err) {
        console.error('Login caught exception ', err);
        exit(1);
    });
};

setupDCS();
doLoginAndGo();