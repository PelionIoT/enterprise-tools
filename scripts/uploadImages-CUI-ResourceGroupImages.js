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
const os = require('os');
const path = require('path');
const version = "1.0.0";

program
    .version(version)
    .usage('[options] command {args...}')
    .option('-c, --cloud [IP or DNS]', 'Cloud (DCS) Cluster')
    .option('-a, --account [accountid]', 'account ID')
    .option('-h, --help[type]','help for each command')
    .option('-u, --user [userid]', 'user name')
    .option('-p, --password [password]', 'password')
    .option('-f, --filepath [filepath]', 'File path of the folder where ResourceGroupImages reside or ResourceGroupImage filepath')
    .option('-C, --conf [file] Use a specific config file')
    .parse(process.argv);

var _defaultAccessObjectPath = path.join(os.homedir(), '.dcs-tools');
if (os.platform() == 'windows') {
    _defaultAccessObjectPath = path.join(os.homedir(), 'dcs-tools.conf');
}

var accessObjectStorageFile = _defaultAccessObjectPath;
if (program.conf) {
    accessObjectStorageFile = program.conf;
}
var blankConfig = {
    tokens: {

    }
};

if(!program.filepath) {
    console.log('Please specify the filepath of the folder where ResourceGroupImages reside');
    console.log('Example- node uploadImages-CUI-ResourceGroupImages.js -c https://devcloud.wigwag.io -f /home/yashgoyal/externaldrive/Location-app-images/MustHaves/');
    program.help();
    process.exit(1);
} else {
    if(!fs.existsSync(program.filepath)) {
        console.error('Filepath do not exists!');
        process.exit(1);
    }
}

var config = blankConfig;

var getSavedConfig = function() {
    return new Promise(function(resolve) {
        fs.readFile(accessObjectStorageFile, {
            encoding: 'utf8'
        }, function(err, data) {
            if (err) {
                if (err.code != 'ENOENT') {
                    logerr("Error on readFile", err);
                } else {
                    logdbg("No config file. Will create new one.");
                }
                config = blankConfig;
                resolve(config);
            } else {
                try {
                    var d = JSON.parse(data);
                    if (typeof d == 'object')
                        config = d;
                    else {
                        logerr("Non-object was stored in", accessObjectStorageFile);
                        config = blankConfig;
                    }
                    resolve(config);
                } catch (e) {
                    logerr("Error parsing access storage file", accessObjectStorageFile, e);
                    config = blankConfig;
                    resolve(config);
                }
            }
        });
    });
};

var getValidToken = function(cloudUrl) {
    if (config.tokens && config.tokens[cloudUrl]) {
        // console.log(config.tokens[cloudUrl]);
        var username = program.user || Object.keys(config.tokens[cloudUrl])[0];
        if(config.tokens[cloudUrl][username] && config.tokens[cloudUrl][username].expiresOn && config.tokens[cloudUrl][username].access) {
            program.account = config.tokens[cloudUrl][username].access.account_id;
            var now = Math.floor((new Date()).getTime() / 1000);
            if ((now - 30) < config.tokens[cloudUrl][username].expiresOn) { // give ourselves at least 30 seconds
                return config.tokens[cloudUrl][username].access;
            }
        }
    }
    return null;
};

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
            method: 'post',
            // headers: {
            //     'Cache-Control': 'no-cache',
            //     'content-type': 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW',
            //     'Postman-Token': '2fd680e6-13ac-260f-74fd-f3459feaaa72'
            // },
            formData: {
                image: {
                    value: fs.createReadStream(filepath),
                    options: {
                        filename: filepath,
                        contentType: null
                    }
                }
            },
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
                    resolve(body);
                } else {
                    // console.error('Failed: ', resp);
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
    return new Promise(function(resolve, reject) {
        DCS.getAuthWithPass(program.user, program.password).then(function(result) {
            console.log("Logged in successfully!");
            clearInterval(interval);
            setupDCS(result);
            resolve();
        }, function(err) {
            console.error('Login failed ', err);
            exit(1);
        }).catch(function(err) {
            console.error('Login caught exception ', err);
            exit(1);
        });
    });
};

function uploadImages() {
    console.log('Uploading to ' + program.cloud + '...');
    fs.stat(program.filepath, function(err, stats) {
        if(err) {
            console.error('Failed to get stat ', err);
            process.exit(1);
        }
        if(stats.isFile()) {
            process.stdout.write('Uploading... ', program.filepath); 
            uploadResourceGroupImage(program.filepath).then(function() {
                console.log("Uploaded image successfully!");
            }, function(err) {
                console.log(err.statusMessage);
            });
        } else {
            //Upload all files inside the directory
            fs.readdir(program.filepath, function(err, files) {
                if(err) {
                    console.error('Failed to read directory ', err);
                    process.exit(1);
                }

                function uploadNext() {
                    // console.log(files);
                    var file = files.shift();
                    if(file) {
                        process.stdout.write('Uploading file ' + file + '...');
                        uploadResourceGroupImage(program.filepath + '/' + file).then(function(resp) {
                            process.stdout.write(resp + '\n');
                            uploadNext();
                        }, function(err) {
                            console.log(err);
                            process.stdout.write('Failed- ', err.statusMessage);
                            uploadNext();
                        });
                    } else {
                        console.log("Uploaded images successfully!");
                    }
                }
                uploadNext();
                // var p = [];
                // files.forEach(function(file) {
                //     console.log('Uploading... ' + file);
                //     p.push(uploadResourceGroupImage(program.filepath + '/' + file));
                // });
                // Promise.all(p).then(function() {
                // }, function(err) {
                //     console.error('Failed to upload images ', err);
                // });
            });
        }
    });
}

//login and setup DCS environment
if(!program.cloud || !program.user || !program.password || !program.account) {
    getSavedConfig().then(function() {
        access = getValidToken(program.cloud);
        if (access) {
            console.log("Using stored token in config file.");
            program.access = access;
            setupDCS(access);
            uploadImages();
        } else {
            console.log("No stored / valid token for user", program.user, "Need to login with password. \n( Config file:", accessObjectStorageFile, ")");
            program.help();
            process.exit(1);
        }
    });
} else {
    setupDCS();
    doLoginAndGo().then(function() {
        uploadImages();
    });
}
