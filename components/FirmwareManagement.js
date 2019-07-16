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
const logger = new Logger( {moduleName: 'firmware-update', color: 'white'} )

const mbedCloudSDK = require('mbed-cloud-sdk');

var UpdateApi = null;

module.exports = {
	init: function(cloud,apiKey) {
		UpdateApi = new mbedCloudSDK.UpdateApi({
            host: cloud,
            apiKey: apiKey
        });
	},
    listFwImages: function() {
        return new Promise(function(resolve, reject) {
            UpdateApi.listFirmwareImages().then(images => {
                logger.debug("listFirmwareImages response: "+JSON.stringify(images,null,4));
                resolve(images);
            }, error => {
            	logger.debug("listFirmwareImages failed - ", error);
                reject(error)
            })
        });
    },
    addFwImage: function(fwName, dataFile, description) {
        return new Promise(function(resolve, reject) {
            UpdateApi.addFirmwareImage({
                name: fwName,
                dataFile: dataFile,
                description: description
            }).then(result => {
            	logger.debug("addFirmwareImage response: "+JSON.stringify(result));
                resolve(result);
            }, error => {
            	logger.debug("addFirmwareImage failed - ", error);
                reject(error);
            })
        });
    },
    listFwManifests: function() {
        return new Promise(function(resolve, reject) {
            UpdateApi.listFirmwareManifests().then(manifests => {
            	logger.debug("listFirmwareManifests response: "+JSON.stringify(manifests,null,4));
                resolve(manifests);
            }, error => {
            	logger.debug("addFirmwareImage failed - ", error);
                reject(error);
            })
        });
    },
    addFwManifest: function(manifestName, dataFile, description) {
        var self = this;
        return new Promise(function(resolve, reject) {
            UpdateApi.addFirmwareManifest({
                name: manifestName,
                description: description,
                dataFile: dataFile
            }).then(result => {
            	logger.debug("addFirmwareManifest response: "+JSON.stringify(result));
                resolve(result);
            }, error => {
            	logger.debug("addFirmwareManifest failed - ", error);
                reject(error);
            })
        });
    },
    addCampaign: function(campaignName, deviceFilter, manifestId, description) {
        var self = this;
        return new Promise(function(resolve, reject) {
            UpdateApi.addCampaign({
                name: campaignName,
                description: description,
                deviceFilter: deviceFilter,
                manifestId: manifestId
            }).then(campaign => {
            	logger.debug("addCampaign response: "+JSON.stringify(campaign,null,4));
                resolve(campaign);
            }, error => {
                logger.debug("addCampaign failed - "+error);
                reject(error)
            })
        });
    },
    startCampaign: function(campaign_id) {
        var self = this;
        return new Promise(function(resolve, reject) {
            UpdateApi.startCampaign(campaign_id).then(result => {
            	logger.debug("startCampaign response: "+JSON.stringify(result,null,4));
                resolve(result);
            }, error => {
            	logger.debug("startCampaign failed - ", error);
                reject(error)
            })
        });
    },
    getCampaign: function(campaign_id) {
        var self = this;
        return new Promise(function(resolve, reject) {
            UpdateApi.getCampaign(campaign_id).then(result => {
            	logger.debug("getCampaign response: "+JSON.stringify(result, null, 4))
                resolve(result);
            }, error => {
            	logger.debug("getCampaign failed - ", error);
                reject(error)
            })
        });
    },
    listCampaignDevStates: function(campaign_id) {
        var self = this;
        return new Promise(function(resolve, reject) {
            UpdateApi.listCampaignDeviceStates(campaign_id).then(result => {
            	logger.debug("listCampaignDeviceStates response: "+JSON.stringify(result, null, 4))
                resolve(result);
            }, error => {
            	logger.debug("listCampaignDeviceStates failed - ", error);
                reject(error)
            })
        });
    }
}