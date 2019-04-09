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

var exports =module.exports={}
const chalk = require('chalk');
exports.helpCommands = chalk `
    Commands:
        
        {bold request} [selection] [command] [[arguments...]]
           * requires account ID
           * arguments should be wrapped as a stringified JSON array

        {bold postRequests} [selection][command] [type] [property] [argument] [value]
            Generic Request function

        {bold executeSiteResourceCommand} [deviceID] [command] [argument]
            Execute command on device controller

        {bold getDiagnostics}
            Relay description

        {bold createSite}
            Create a new site within your account

        {bold getSites}
        	List and iterate through sites within an account

        {bold getSiteresourcetypes}
            List resources types registered at a site

        {bold getSiteinterfaces}
            List interface types registered at a site

         {bold deleteSite} [siteID]
            Delete a site. This has the effect of deactivating a site while also deleting any historical data associated with this site in the cloud and unpairing any bound relays from the site

        {bold updateSite} [active(boolean)] [name]
            Update the state of a site. Either activate or deactivate the site. An active site's devices can be interacted with and manipulated. An active site also produces events that can be monitored and queried from the cloud.

        {bold getAccounts}
         	List and iterate through accounts by default limit = 10;
        
        {bold getAccountsExt}

        {bold getUsers}
        	List and iterate through users within an account. An administrator will be able to list all users

        {bold getUserinfo}
         	Returns information about a user with a specified ID

        {bold VirtualDeviceTemplateslist}
            List available virtual devices templates

        {bold VirtualDevicecreate} [Template]
            Create new device controller from available templates. It returns the resourceID on which new device controller is created

        {bold VirtualDeviceslist}
            List created virtual device controller's resourceIDs

        {bold VirtualDevicestop} [resourceID]
            To stop running device controller. It takes valid resourceID as argument

        {bold VirtualDevicedelete} [resourceID]
            To stop and forget a virtual device controller

        {bold VirtualDevicesdeleteAll}
            Deletes all the virtual device controllers

        {bold modbusListDevices}
            List all modbus devices

        {bold modbusGetDeviceMetadata}
            Get modbus devices metadata 

        {bold modbusStart}
            Push device definitions and start device controllers

        {bold bacnetListDevices}
            List all bacnet devices

        {bold bacnetGetAllDeviceStates}
            Get all bacnet device current state

        {bold bacnetSendWhoIs}
            Send whoIs service request on bacnet line

        {bold bacnetDeleteAll}
            Delete all bacnet device controllers

        {bold bacnetStartAll}
            Start device controllers on all discovered devices

        {bold bacnetGetHealth}
            Get health of bacnet module

        {bold bacnetGetRecipes}
            List all saved bacnet recipes

        {bold bacnetDeleteRecipes}
            Delete all saved bacnet recipes

        {bold bacnetSaveRecipe} [Provide recipe file path]
            Save new bacnet recipe

        {bold bacnetLogLevel} [Log level range 0-5]
            Change log level on bacnet

        {bold postSchedule}  [JSON string for schedule]
        	Create a new schedule with unique ID

        {bold getaSchedule}  [scheduleid]
            Get a Schedule of a particular scheduleid at a site

        {bold putSchedule}  [scheduleid][JSON string for schedule]
            Update a Schedule

        {bold deleteSchedule}  [scheduleid]
            Delete a Schedule at a site

        {bold getSchedules}
        	List all the schedules at a site

        {bold listSiteResources} [selection string specifying the set of resources]
            List resources contained within certain sites

        {bold forgetSiteResource} [selection string specifying resource]
            Forget a resource at a site

        {bold getSiteResourceState} [selection string specifying resource] [property|null]
            Get Resource State

        {bold updateSiteResourceState} [Resource ID] [state] [value] 
            Update Resource State

        {bold getRelays} \{QUERYSTRING|'offline'|'online'|'all'\} \{site-id|'any'\} \{account-id|'any'|'null'\} \{pairingcode\}
            List relays (gateways) for the account. Optionally show only online, 
            offline, or show a particular site, or by pairing code.
            * Listing all Relays will require DCS super-user privileges.

        {bold createRole} [name][accountID]
            Create a new role for this account

        {bold getRoles} [userID|null] [accountID|null][name|null]
            Get a List of User Roles Within An Account

        {bold getaRole} [roleID]
            Get a particular role

        {bold deleteaRole} [roleID]
            Delete a particular role

        {bold createGroup} [group]
            Create a group

        {bold updateGroup} [group][option][deviceID]
            Update a group i.e add/remove the device. You must specify either ‘add’ or ‘remove’ in the update body, not both

        {bold getGroup} [group]
            List group information including sub groups and resources bound to that group

        {bold deleteGroup} [group]
            Deletes a resource group if it exist. Child groups are recursively deleted

        {bold createUserAccessRule} [user email] [JSON string for rule]
           Creates an access rule for a specified user
           * requires using {bold -a [account ID]} to provide an Account to operate on

        {bold getHistory} [siteID] \{format\} \{[[option]=[value] ...]\}
           Get event history for a site. [siteID] is required if not provided as a switch on startup.
           \{format\} may be 'csv' or 'raw'

        {bold shell}
           Starts this CLI as a shell.

        {bold subscribeToEvents}
           Start a websocket connection between a server and client.

        QUERYSTRING
           A string with the format 'FIELD=VALUE' where VALUE is the search value to look for which equals the field named FIELD
    `


    exports.shellOnlyCommands = chalk `
        {bold set-accountid}
           Sets the active account for the shell to use.

        {bold set-siteid}
           Sets the site ID for the shell to use.

        {bold info}
            Print out login and config info.

        {bold debug} [on|off]
            Turn debug output on or off.

        {bold login} [email] [password]
            Logs in to the given cloud with the state email / password.

        In shell mode you may wrap string with the ' mark. Such as
            createUserAccessRule joe@domain.com '\{ "permissions" : ["account_admin"] \}'
    `

