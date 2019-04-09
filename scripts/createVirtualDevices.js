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
const version = "1.0.0";

program
    .version(version)
    .usage('[options] command {args...}')
    .option('-c, --cloud [IP or DNS]', 'Cloud (DCS) Cluster')
    .option('-s, --site [siteid]', 'site ID')
    .option('-a, --account [accountid]', 'account ID')
    .option('-h, --help[type]','help for each command')
    .option('-u, --user [userid]', 'user name')
    .option('-p, --password [password]', 'password')
    .parse(process.argv);

//login and setup DCS environment
if(!program.cloud || !program.user || !program.password || !program.account || !program.site) {
    program.help();
    process.exit(1);
}

let setupDCS = function(token) {
    // Set access token for dcs-tools
    DCS.setAccessObject(token, 
        program.cloud,
        program.account
    );
    DCS.program.site = program.site;
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
        createVirtualDevices()
    }, function(err) {
        console.error('Login failed ', err);
        exit(1);
    }).catch(function(err) {
        console.error('Login caught exception ', err);
        exit(1);
    });
};

let createVirtualDevices = function() {
    return new Promise(function(resolve, reject) {
        console.log('Deleting all previous virtual devices...')
        DCS.executeCommand(program.site,"id=\"VirtualDeviceDriver\"", "deleteAll", null).then(function(delResp) {
            DCS.executeCommand(program.site, "id=\"VirtualDeviceDriver\"", "listTemplates").then(function(resp) {
                if(resp) {
                    let templates = resp;

                    var startDevices = async () => {
                        try {
                            for(var i = 0; i < templates.length; i++) {
                                console.log('Creating virtual device of type ' + templates[i]);
                                await DCS.executeCommand(program.site, "id=\"VirtualDeviceDriver\"", "create", templates[i]).then(function(rsp) {
                                    console.log(rsp);
                                });
                            } 
                        }catch(err) {
                            reject(err);
                        } finally {
                            resolve();
                        }
                    }
                    startDevices();
                } else {
                    return reject('Failed to list virtual device template list');
                }
            }, function(err) {
                console.log('Failed to create virtual devices ' + err);
                return reject(err);
            });
        }, function(err) {
            console.log('Failed to delete virtual devices ' + err);
            return reject(err);
        })
    });
}

setupDCS();
doLoginAndGo();

