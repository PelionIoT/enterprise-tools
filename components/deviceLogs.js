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
const logger = new Logger( {moduleName: 'device-logs', color: 'white'} );
module.exports = {
	doAPI_deviceLogs: function(accountID, siteID, relayID, deviecID, event, beforeTime, afterTime, limit, sort, logreqCB) {
		var self = this;
        self._executedRequests = [];
        var param = [];
        if(accountID) {
        	param.push(["account", accountID]);
		}
		if(siteID) {
        	param.push(["site", siteID]);
		}
		if(relayID) {
        	param.push(["relay", relayID]);
		}
		if(beforeTime) {
        	param.push(["before", beforeTime]);
		}
		if(afterTime) {
        	param.push(["after", afterTime]);
		}
		if(deviecID) {
        	param.push(["device", deviecID]);
		}
		if(event) {
        	param.push(["event", event]);
		}
		if(limit) {
        	param.push(["limit", limit]);
		}
		if(sort) {
        	param.push(["sort", sort]);
		}
		var url = self._toApiUri("/device_logs", param);
		logger.info(url)
		return new Promise((resolve, reject) => {
			//var a = "is API is working"
			self._authedRequest(null, {
                uri: url,
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
                        //self.logdbg("/api/relays OK (200):");
                        resolve(body);
                    } else {
                        reject(resp);
                        //reject("Invalid response: " + resp.statusCode + " --> " + resp.statusMessage);
                    }
                }
            });
		})
	}
}