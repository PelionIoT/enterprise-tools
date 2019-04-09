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
const logger = new Logger( {moduleName: 'site-groups', color: 'white'} );
module.exports = {
    doAPI_createSitegroup: function(location, option, resource,logreqCB) {
        var self = this;
        self._executedRequests = [];
        var obj = [{
            "op": option,
            "path": "/sites",
            "value": resource
        }]
        return new Promise(function(resolve, reject) {
            var uri = self._toApiUriWithAccount("/sitegroups/" + location);
            self.logdbg("uri:", uri);
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
                } else {

                    if (resp && resp.statusCode && resp.statusCode == 200) {
                        self.logdbg("/api/sites OK (200): ", body);
                        resolve(resource + " to Group (" + location + ") is " + option + " successfully ");
                    } else {
                        reject("Invalid response: " + resp.statusCode + " --> " + resp.statusMessage);
                    }
                }
            });
        });
    },

    doAPI_getSitegroup: function(inputGroup,logreqCB) {
        var self = this;
        self._executedRequests = [];
        var siteGroups = {};

        function getSiteGroup(sg) {
            return new Promise(function(resolve, reject) {
                if (sg && sg.indexOf('accounts') > -1) {
                    //Using account subpath, _toApiUriWithAccount will already prefix account subpath so strip that part from sg
                    sg = sg.slice(sg.indexOf('/sitegroups'));
                }
                var siteGroupHref = (sg && sg.indexOf('sitegroups') > -1) ? sg : ("/sitegroups" + (!!sg ? ('/' + sg) : '/'));
                var uri = self._toApiUriWithAccount(siteGroupHref);
                // console.log('Using uri ', uri);
                self.logdbg("uri:", uri);
                self._authedRequest(null, {
                    uri: uri,
                    method: 'get'
                }, function(error, resp, body) {
                    if (logreqCB && typeof logreqCB == 'function') {
                    logreqCB(self._executedRequests);
                    }
                    if (error) {
                        reject(error);
                    } else {

                        if (resp && resp.statusCode && resp.statusCode == 200) {
                            self.logdbg("/api/sitegroups OK (200): ", body);
                            resolve(JSON.parse(body));
                        } else {
                            reject("Invalid response: " + resp.statusCode + " --> " + resp.statusMessage);
                        }
                    }
                });
            });
        }

        var promiseLeft = 0;

        return new Promise(function(resolve, reject) {
            function getNext(grp) {
                getSiteGroup(grp).then(function(response) {
                    self.logdbg('\n\nGot response ', JSON.stringify(response, null, 4));
                    promiseLeft--;
                    //{"id":"","accountID":"63035e31910b438ab49909c46f60aa3d","_links":{"self":{"href":"/sitegroups/"},"sites":[],"children":[{"href":"/sitegroups/parentGroup","name":"parentGroup"}]}}
                    //{"id":"parentGroup","accountID":"63035e31910b438ab49909c46f60aa3d","_links":{"self":{"href":"/sitegroups/parentGroup"},"sites":[{"href":"/sites/b75e8caa191f454789658f4830dba9f4"},{"href":"/sites/1ba29445d5bd4a1597164a87871acedf"}],"children":[{"href":"/sitegroups/parentGroup/childGroup1","name":"childGroup1"}]}}
                    // if(response.id) {
                    //     if(typeof siteGroups[response.id] === 'undefined') {
                    //         siteGroups[response.id] = {sites: [], children: {}};
                    //     }
                    //     siteGroups[response.id].sites = sites;
                    // }
                    try {
                        var temp = siteGroups;
                        if (response._links.self.href) {
                            var href = response._links.self.href;
                            if (href && href.indexOf('accounts') > -1) {
                                //Using account subpath, _toApiUriWithAccount will already prefix account subpath so strip that part from sg
                                href = href.slice(href.indexOf('/sitegroups'));
                            }

                            href = href.slice('/sitegroups'.length + 1) + '/';
                            // console.log('siteGroups ', temp);
                            // console.log('href ', href);
                            var found = false;
                            while (href) {
                                var sitegrp = decodeURIComponent(href.slice(0, href.indexOf('/')));
                                // console.log('group ', sitegrp);
                                if (!!sitegrp) {
                                    if (typeof temp[sitegrp] === 'undefined') {
                                        temp[sitegrp] = {
                                            sites: []
                                        };
                                    }
                                    found = true;
                                    temp = temp[sitegrp];
                                }
                                href = href.slice(href.indexOf('/') + 1);
                                // console.log('href ', href);
                            }
                            if (found) {
                                response._links.sites.forEach(function(site) {
                                    temp.sites.push(site.href.slice(site.href.lastIndexOf('/') + 1));
                                });
                            }
                        }
                        if (response._links.children.length > 0) {
                            response._links.children.forEach(function(childGroup) {
                                promiseLeft++;
                                temp[childGroup.name] = {
                                    sites: []
                                };
                                // console.log("Calling next on ", childGroup.href);
                                getNext(childGroup.href);
                            });
                        }
                        // console.log('siteGroups ', JSON.stringify(siteGroups, null, 4));
                        if (promiseLeft <= 0) {
                            if (logreqCB && typeof logreqCB == 'function') {
                                logreqCB(self._executedRequests);
                            }
                            resolve(siteGroups);
                        }
                    } catch (e) {
                        // console.error(e);
                        if (logreqCB && typeof logreqCB == 'function') {
                            logreqCB(self._executedRequests);
                        }
                        reject(e);
                    }
                }, function(err) {
                    // console.error(err);
                    if (logreqCB && typeof logreqCB == 'function') {
                        logreqCB(self._executedRequests);
                    }
                    reject(err);
                });
            }

            promiseLeft = 1;
            getNext(inputGroup);
        });
    },

    doAPI_deleteSitegroup: function(location,logreqCB) {
        var self = this;
        self._executedRequests = [];
        return new Promise(function(resolve, reject) {
            var uri = self._toApiUriWithAccount("/sitegroups/" + location);
            self.logdbg("uri:", uri);
            self._authedRequest(null, {
                uri: uri,
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
                } else {

                    if (resp && resp.statusCode && resp.statusCode == 200) {
                        self.logdbg("/api/sitegroups OK (200): ", body);
                        resolve(" Group " + location + " is deleted ");
                    } else {
                        reject("Invalid response: " + resp.statusCode + " --> " + resp.statusMessage);
                    }
                }
            });
        });
    }
}