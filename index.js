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

const program = require('commander');
const request = require('request');
const chalk = require('chalk');
const jwt = require('jsonwebtoken');
const util = require('util');
const os = require('os');
const path = require('path');
const fs = require('fs');
const repl = require('repl');
const readlineSync = require('readline-sync');
const jsonminify = require('jsonminify');
const WebSocket = require('ws');
var helpCommand = require('./helpCommand.json');
const url = require('url');
const wget = require('node-wget');
const Logger = require('./utils/logger');
const bonjour = require('bonjour')();
const logger = new Logger( {moduleName: 'main', color: 'bgBlue'} );
global.etoolsLogLevel = 2;
const json2md = require("json2md")
// logger.info("enterprise-tools started successfully...");
//var jsonContent = JSON.parse(helpTest);

var lineReader = require('line-reader');

// The API object. It will be initialized below, by either a login,
// or via an existing access token
var DCS = require('./api.js');
const readline = require('readline');

// mbed-cloud-sdk to perform upgrades
const mbedCloudSDK = require('mbed-cloud-sdk');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
});
// true if we are in interactive mode
var inShell = false;
var version = "1.1.4";
var inputflag = false; //This flag is used to disable default in switch case while using readline
var shellflag = false; //flag to make sure the command gets terminated in shell
//console.log(jsonContent)
//console.log("User Name:", helpCommand.VirtualDevicecreate.Description);

var ws = null;
var logdbg = function() {
    if (program.debug) {
        if (arguments[0]) arguments[0] = "dbg>> " + arguments[0];
        console.log(chalk.dim(util.format.apply(util, arguments)));
    }
}

var logerr = function() {
    if (arguments[0]) arguments[0] = "ERR>> " + arguments[0];
    console.error(chalk.red(util.format.apply(util, arguments)));
}

var loginfo = function() {
    if (this.program && (this.program.loginfo)) {
        console.log(util.format.apply(util, arguments));
    }
}



// console.log = function() {
//     process.stdout.write(arguments[0]);
//     // if (arguments[0] && (arguments[0].toLowerCase().indexOf('fail') > -1 || arguments[0].toLowerCase().indexOf('err') > -1)) {
//     //     logerr(arguments);
//     // } else {
//     //     console.log(arguments);
//     // }
// };

// console.error = function() {
//     if (arguments[0]) arguments[0] = "ERR>> " + arguments[0];
//     console.error(chalk.red(util.format.apply(util, arguments)));
// };

var exitWithError = function() {
    if (arguments[0]) arguments[0] = "" + arguments[0];
    console.error(chalk.bold(util.format.apply(util, arguments)));
    if (!inShell) {
        process.exit(1);
    } else {
        return Promise.resolve();
    }
}

program
    .version(version)
    .usage('[options] command {args...}')
    .option('-c, --cloud [IP or DNS]', 'Cloud (DCS) Cluster')
    .option('-s, --site [siteid]', 'site ID')
    .option('-a, --account [accountid]', 'account ID')
    .option('-k, --access_key [access_key]', 'Access Key')
    .option('-h, --help[type]','help for each command')
    .option('-D, --depth [num]','depth')
    .option('-u, --user [userid]', 'user name')
    .option('-p, --password [password]', 'password')
    .option('-d, --debug Turns on debug output')
    .option('-M, --metrics Turns on output showing performance of API calls.')
    .option('-A, --admin Use tool as super-admin for cloud')
    .option('-S, --show List all possible commands')
    .option('-i, --inputtype [inputtype]','Enter key/prefix')
    .option('-v, --valueinputtype [value]')
    .option('-b, --bucket [value]','Enter shared/cloud/lww')
    .option('-R, --relayid [relayid]','Relay ID')
    .option('-P, --pairingcode [pairingcode]','pairingcode')
    .option('-N, --sitename [sitename]','sitename')
    .option('-h, --help','help for each command')
    .option("-m, --muted Don't ask questions. Use defaults only.")
    .option('-C, --conf [file] Use a specific config file')
    .option('-T, --timeout [timeout] Defaults to auto-exit on 5 minutes of no activity.')
    .option(', --insecure  Developer only: disable TLS cert validation (allow selfI-signed)')
    .parse(process.argv);

var printVersion = function() {
    console.log("DCS Enterprise CLI. v." + version + "  (c) 2017 WigWag Inc.");
};
var helpCommands = chalk `
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

    {bold modbusLogLevel}
        Change modbus log level

    {bold modbusGetAllDeviceStates}
        Get all modbus devices states

    {bold modbusConfiguration}
        Get modbus setup configuration

    {bold bacnetListDevices}
        List all bacnet devices

    {bold bacnetGetAllDeviceStates}
        Get all bacnet device current state

    {bold bacnetSendWhoIs}
        Send whoIs service request on bacnet line

    {bold bacnetWhoHas}
        Send whoHas service request

    {bold bacnetReadProperty}
        Read property value of bacnet point

    {bold bacnetWriteProperty}
        Write to any property of bacnet point

    {bold bacnetRelinquishAll}
        Relinquish bacnet point

    {bold bacnetSetPriority}
        Set bacnet write property priority level

    {bold bacnetRelinquishDefault}
        Get relinquish default value of bacnet points

    {bold bacnetPriorityArray}
        Get priority array of bacnet point

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

    {bold getAllResourceStates}
        Get all the resources best known states

    {bold getSiteResourceState} [selection string specifying resource]
        Get Resource State

    {bold updateSiteResourceState} [Resource ID] [state] [value]
        Update Resource State

    {bold getRelays} \{QUERYSTRING|'offline'|'online'|'all'\} \{site-id|'any'\} \{account-id|'any'|'null'\} \{pairingcode\}
        List relays (gateways) for the account. Optionally show only online,
        offline, or show a particular site, or by pairing code.
        * Listing all Relays will require DCS super-user privileges.

    {bold createUserAccessRule} [user email] [JSON string for rule]
       Creates an access rule for a specified user
       * requires using {bold -a [account ID]} to provide an Account to operate on

    {bold getSitedatabase}
        Get Database Links

    {bold getSitebuckets} [bucket type 'cloud','shared'or'lww']
        Get Bucket Links

    {bold bindRelayToExistingSite} -R [relayid] -P [pairingcode] -N \{sitename\} -s \{emptysiteID\}
    Run to move a relay into an existing site which don't have relay bind

    {bold bindRelayToSite} -R [relayid] -P [pairingcode] -N \{sitename\}
    Run to move a relay into a new site

    {bold shell}
       Starts this CLI as a shell.

    {bold subscribeToEvents}
       Start a websocket connection between a server and client.

    {bold listFirmwareImages}
       List all uploaded gateway firmwares.

    {bold addFirmwareImage}
       Upload a gateway firmware.

    {bold listFirmwareManifests}
       Start an update campain to upgrade the gateway firmware.

    {bold startUpdateCampaign}
       Start an update campain to upgrade the gateway firmware.

    {bold getCampaign}
       Start an update campain to upgrade the gateway firmware.

    {bold listCampaignDeviceStates}
       Start an update campain to upgrade the gateway firmware.

    QUERYSTRING
       A string with the format 'FIELD=VALUE' where VALUE is the search value to look for which equals the field named FIELD
`


var shellOnlyCommands = chalk `
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

var nodeVersion = process.version
var requireVersion = parseInt(nodeVersion.slice(1,3))
if(requireVersion < 8) {
    console.log(chalk.red("This program only works on Node.js 8.x or above"))
    process.exit(0)
}

program.loginfo = true;

if (program.show) {
    printVersion();
    console.log(helpCommands);
    process.exit(0);
}

if(program.insecure) {
    console.log("WARNING: SSL/TLS cert validation disabled.")
    process.env.NODE_TLS_REJECT_UNAUTHORIZED="0";
}

if (!program.cloud || program.cloud.len < 1) {
    console.log("Need a cloud server: -c [CLOUD SERVER]");
    process.exit(1);
}


if (typeof program.depth != 'undefined') {
    program.depth = parseInt(program.depth)
    if (isNaN(program.depth)) {
        console.log("-d [num]   num must be a number")
        process.exit(1);
    }
} else {
    program.depth = 2;
}

var _defaultAccessObjectPath = path.join(os.homedir(), '.dcs-tools');
if (os.platform() == 'windows') {
    _defaultAccessObjectPath = path.join(os.homedir(), 'dcs-tools.conf');
}

var accessObjectStorageFile = _defaultAccessObjectPath;
if (program.conf) {
    accessObjectStorageFile = program.conf;
}

var useAccountsSubpath = false; // see https://wigwag.atlassian.net/browse/CLD-352 - this is true when we use this

if (program.admin) {
    program.useAccountsSubpath = true;
    useAccountsSubpath = true;
}

if(program.account) {
    program.useAccountsSubpath = true;
}

var jsonParse = function(json) {
    return new Promise(function(resolve, reject) {
        var result = null;
        try {
            result = JSON.parse(json);
        } catch (e) {
            reject(e);
            return;
        }
        resolve(result);
    });
}

var addParams = function(s, params) {
    var ret = s;
    if (params && typeof params == "object" && params.length > 0) {
        for (var n = 0; n < params.length; n++) {
            if (params[n].length && params[n].length < 2) {
                logerr("bad parameter passed into toApiUri()");
            } else {
                ret += "&";
                ret += encodeURIComponent(params[n][0]) + "=" + encodeURIComponent(params[n][1]);
            }
        }
    }
    return ret;
};

var allSites = {};


/////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////// End APIs
/////////////////////////////////////////////////////////////////////////////////////////////////


if (!program.args || !program.args[0]) {
    console.log("No command given.")
    process.exit(1)
}
var allCommands = 'help info debug metrics login set-accountid set-access-key createmdfile '
+'set-siteid set-siteid-as-accountid show-responses poller-status createSiteGroup getSiteGroup getAllSiteGroups deleteSiteGroup '
+'subscribeToEvents led playtone findGateway locateGateway locate '
+'createRole getRoles getaRole createGroup deleteaRole updateGroup getGroup deleteGroup '
+'modbusListResourcesInCloud modbusStart modbusGetDeviceMetadata modbusListDevices modbusDeleteAll modbusLogLevel modbusGetAllDeviceStates modbusConfiguration programImod6 '
+'startTunnel getLoginHistory '
+'postRequests getDeviceLogs '
+'getHistory getRelays getRelay moveRelayToAccount moveRelayToSite importRelay importRelays moveRelayToAnotherSite uploadEnrollmentID '
+'nocache listSiteResources listDevices getControlableResourceStates forgetSiteResource getSiteResourceState updateSiteResourceState getResponse createSite getSites getSiteInfo siteName updateSite renameSite deleteSite siteMap '
+'getSiteinterfaces getSiteresourcetypes getDeviceInterfaces '
+'getAccounts getAccountsExt renameAccount '
+'postSchedule getSchedules getaSchedule putSchedule deleteSchedule deleteSchedulesAll '
+'getUsers getUserinfo '
+'executeSiteResourceCommand getDiagnostics '
+'VirtualDeviceTemplateslist VirtualDeviceCreate VirtualDeviceList VirtualDeviceStop VirtualDeviceDelete VirtualDeviceDeleteAll VirtualDeviceStopPeriodicEvents VirtualDeviceGeneratePeriodicEvents VirtualDeviceLogLevel VirtualDeviceUpdate VirtualDeviceProgress '
+'createUserAccessRule getUserAccessRules getaUserAccessRule deleteUserAccessRule inviteUser '
+'putImage getImage createApp publishApp listApps '
+'bacnetListResourcesInCloud bacnetListDevices bacnetGetAllDeviceStates bacnetSendWhoIs bacnetDeleteAll bacnetWhoHas bacnetReadProperty bacnetWriteProperty bacnetRelinquishAll bacnetSetPriority bacnetRelinquishDefault bacnetPriorityArray bacnetStartAll bacnetStartPortal bacnetGetHealth bacnetGetRecipes bacnetLogLevel bacnetDeleteRecipes bacnetSaveRecipe bacnetActivityLog bacnetApplyRecipe '
+'getAllResourceStates getNumberOfDevicesPerProtocol '
+'6lowpanStartPairing 6lowpanListResourcesInCloud 6lowpanRemoveDevice '
+'zwaveStartPairing zwaveRemoveDevice zwaveListResourcesInCloud '
+'renameDevice getAllDeviceNames '
+'getSitedatabase getSitebuckets getKeysdata updateKeys updateSiteResourceName '
+'zigbeeListResourcesInCloud zigbeeGetPanId zigbeeDeleteAll zigbeeGetChannel zigbeeNetworkTopology zigbeeStatus zigbeeGetAddress zigbeeNodes zigbeePingDevices zigbeeLogLevel zigbeeStartPairing '
+'enoceanStartPairing enoceanRemoveDevice enoceanLogLevel enoceanConfig enoceanGetBase enoceanGetVersion enoceanListResourcesInCloud '
+'removeRelayFromAccount  '
+'devStateManagerLogLevel updateDevStateManagerForDevice '
+'bindRelayToSite bindRelayToExistingSite '
+'getAlerts getAnAlert dismissAlert getCameraIP '
+'bleStartScan bleStopScan getBleScanResults getBleConnectedDevice bleConnect bleDisconnect '
+'listFirmwareImages addFirmwareImage '
+'listFirmwareManifests '
+'startUpdateCampaign getCampaign listCampaignDeviceStates ';


var myCompleter = function(line, callback) {
    //  console.log("COMPLETERCOMPLETERCOMPLETER")
    var completions = allCommands;
    completions = completions.split(' ');
    const hits = completions.filter((c) => c.startsWith(line));
    // show all completions if none found
    callback(null, [hits.length ? hits : completions, line]);
    //console.log(hits)

}
var unknownCommandHelp = function(command) {
    //  console.log("COMPLETERCOMPLETERCOMPLETER")
    var completions = allCommands.split(' ');
    const hits = completions.filter((c) => c.toLowerCase().includes(command));
    if(hits.length < 1 && command && command.length > 0) {
        console.log('Unknown command: ', command, "(did not match with any command)")
    }else{
        hits.forEach(function(helpWithCompleter) {
            if(helpCommand[helpWithCompleter]) {
                console.log(chalk.blue.bold(helpWithCompleter) ,
                        '\n\t',chalk.bold('Usage:'),
                        '\n\t\t',helpCommand[helpWithCompleter].Usage,
                        '\n\t',chalk.bold('Description:'),
                        '\n\t\t',helpCommand[helpWithCompleter].Description)
            } else {
                console.log(chalk.blue.bold(helpWithCompleter) ,
                        '\n\t',chalk.bold('Usage:'),
                        '\n\t\t','',
                        '\n\t',chalk.bold('Description:'),
                        '\n\t\t','')

            }
    })
}
}


var myEval = function(cmd, context, filename, callback) {
    //  console.log(arguments);
    //  var argz = cmd.split(/\s+/);
    var argz = parseShellArgs(cmd);
    logdbg("arguments:", argz);
    if (typeof argz == "string") {
        console.log("Error:", argz);
        callback();
    } else {
        doCLICommand.apply({}, argz).then(function() {
            if(program.command_wise_debug) {
                program.debug = false;
            }
            callback();
        });
    }
}

var parseShellArgs = function(s) {
    const tick = "'";
    var inTick = false;
    var ret = [];
    var isWS = /[ \f\n\r\t\v\u00A0\u2028\u2029]/;
    var n = 0;
    var len = s.length;
    var markStart = 0;
    var markEnd = 0;
    var c = null;
    var inWord = false;
    while (n < len) {
        c = s.charAt(n);
        if (!inTick && !inWord && c == tick && len != n) {
            markStart = n + 1;
            inTick = true;
            n++;
            continue;
        }
        if (!inTick) {
            if (isWS.test(c)) {
                if (inWord) {
                    markEnd = n;
                    ret.push(s.substring(markStart, markEnd));
                    inWord = false;
                }
            } else {
                if (!inWord) {
                    inWord = true;
                    markStart = n;
                }
            }
        } else {
            if (c == tick) {
                markEnd = n;
                ret.push(s.substring(markStart, markEnd));
                inWord = false;
                inTick = false;
            }
        }
        n++;
    }
    if (inTick) {
        ret = "Invalid input.";
    } else {
        for (var n = 0; n < ret.length; n++) {
            if (ret[n].length < 1) {
                ret[n] = null;
            }
            if (ret[n] == 'null') {
                ret[n] = null;
            }
            if (ret[n] == '-') {
                ret[n] = null;
            }
        }
    }
    return ret;
}

//////////////////////
/// TOKEN STORAGE
/////////////////////

/**
 * Storage format:
 * {
 *   'email@domain.com' : {
 *     // access comes direct from /oauth API call
 *     access: {
 *         { access_token: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VySUQiOiJhYmI2MmNiNjAzOGQ0YjhlOGZiZmZlMmY5NDA4OWNmZSIsImFjY291bnRzIjpbXSwiYXNzb2NpYXRpb25JRCI6ImZmNjUxNGQyNmQzNDRlN2Q4NjY2NjZmODE3YmY5ZjBmIiwiaWF0IjoxNTAyOTM0MDc3fQ.Bepuz0yiHtiRmjk1u0NC_y1lVxa1iGUuVN_lEiHnOw0',
             token_type: 'bearer',
             expires_in: 3600 }
 *     },
 *     expiresOn: 18171711919  // Unix seconds since Epock of expiration of token
 *   }
 *...  [other accounts]
 *}
 */

var blankConfig = {
    tokens: {

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
        })
    });
}

var saveConfig = function() {
    return new Promise(function(resolve, reject) {
        var s = JSON.stringify(config, null, '  ');
        logdbg("writing to config file:", accessObjectStorageFile);
        fs.writeFile(accessObjectStorageFile, s, {
            encoding: 'utf8',
            mode: 0o600
        }, function(err) {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        })
    });
}

var getValidToken = function(username, cloudUrl) {
    if (config.tokens && config.tokens[cloudUrl] && config.tokens[cloudUrl][username] && config.tokens[cloudUrl][username].expiresOn && config.tokens[cloudUrl][username].access) {
        var now = Math.floor((new Date).getTime() / 1000);
        if ((now - 30) < config.tokens[cloudUrl][username].expiresOn) { // give ourselves at least 30 seconds
            return config.tokens[cloudUrl][username].access;
        }
    }
    return null;
}

var saveToken = function(username, cloud, access, accountid) {
    var now = Math.floor((new Date).getTime() / 1000);
    if (!config) config = blankConfig;
    if (!config.tokens) config.tokens = {};
    if (!config.tokens[cloud]) config.tokens[cloud] = {};
    config.tokens[cloud][username] = {
        access: access,
        expiresOn: now + access.expires_in
    }
    if(accountid) {
        config.tokens[cloud][username].access.account_id = accountid;
    }
    return saveConfig();
}

var cmdHistory = function (rpl, file) {
    var fd = fs.openSync(file, 'a'), reval = rpl.eval;
    try {
        var stat = fs.statSync(file);
        rpl.rli.history = fs.readFileSync(file, 'utf-8').split('\n').reverse();
        rpl.rli.history.shift();
        rpl.rli.historyIndex = -1; // will be incremented before pop
    } catch (e) {
        console.log("Error: ", e)
    }

    var wstream = fs.createWriteStream(file, {
        fd: fd
    });
    wstream.on('error', function(err) {
        throw err;
    });

    rpl.rli.addListener('line', function(code) {
        if (code && code !== '.history'/* && inputflag == false && code !== 'yes' && code !== 'no'*/) {
          wstream.write(code + '\n');
        } else {
            // console.log('pop ', repl.rli);
          // rpl.rli.historyIndex++;
          // rpl.rli.history.pop();
        }
    });

    process.on('exit', function() {
        fs.closeSync(fd);
    });

    // repl.commands['history'] = {
    //     help : 'Show the history',
    //     action : function() {
    //         var out = [];
    //         repl.rli.history.forEach(function(v, k) {
    //         out.push(v);
    //     });
    //     repl.outputStream.write(out.reverse().join('\n') + '\n');
    //     repl.displayPrompt();
    //     }
    // };
}

// var doCLICommand_help = function(cmd) {
//     console.log(chalk.blue.bold(cmd) ,
//                 '\n\t',chalk.bold('Usage :'),
//                 '\n\t\t',helpCommand[cmd].Usage,
//                 '\n\t',chalk.bold('Description :'),
//                 '\n\t\t',helpCommand[cmd].Description)
// }
/**
 * @param {string} command name
 * @param {any} arg 1
 * @param {any} arg 2
 * @return {[type]} [description]
 */

var question = function (ques) {
    return new Promise(function(resolve,reject){
        /*shell.on ('SIGINT',function() {
            shellflag = true;
            return
        })*/
        if (shellflag === false) {
            shell.question(ques, (answer)=>{
                if(answer){
                    resolve (answer) ;
                }else{
                    reject ();
                }
            })
        }

         /*setTimeout(() => {
            shellflag = false;
        }, 1000);*/
    })
}

var EnterRelayID = function(){
    return new Promise(function(resolve,reject){
        var relayID;
        if(program.relayid){
            //console.log('Found relayid');
            resolve(program.relayid);
        }
        else{
            /*shell.on('SIGINT',function() {
                console.log ("...Working...");
            })*/
            question('Enter RelayID ').then (function (relayID) {
                console.log("\nEntered RelayID: ",relayID);
                resolve(relayID)
            },function (err) {
                reject ();
            })
        }
    })
}


var EnterPairingCode =function(){
    inputflag =true;
    return new Promise(function(resolve,reject){
        var pairingcode;
        if(program.pairingcode) {
            resolve(program.pairingcode);
        } else {
            //console.log('Asking pairingcode');
            /*shell.question('Enter PairingCode ',(answer)=>{
                pairingcode= answer;
                console.log("\nEntered pairingCode: ",pairingcode);
                if(pairingcode){
                    // shell.close();
                    resolve(pairingcode)
                }else{
                    // shell.close();
                    reject();
                }
            })*/
            question('Enter PairingCode ').then (function (pairingcode) {
                console.log("\nEntered PairingCode: ",pairingcode);
                resolve(pairingcode)
            },function (err) {
                reject ();
            })
        }
    })
}

var EnterSitename =function(){
    inputflag =true;
    return new Promise(function(resolve){
        var sitename;
        if(program.sitename){
            resolve(program.sitename);
        }else{
            shell.question('Enter Sitename ',(answer)=>{
                sitename = answer;
                console.log("\nEntered sitename: ",sitename);
                resolve(sitename);
            })
        }
    })
}

var EnterEmail =function(){
    inputflag =true;
    return new Promise(function(resolve){
        shell.question('Enter the email-id of the user you want to give permissions to - ',(answer)=>{
            email = answer;
            console.log("\nEntered email: ",email);
            resolve(email);
        })

    })
}

var EnterPermission =function(){
    inputflag =true;
    return new Promise(function(resolve){
        var email;

        shell.question('Enter the permission, option- "account_admin" - ',(answer)=>{
            permission = answer;
            console.log("\nEntered permission: ",permission);
            resolve(permission);
        })

    })
}

var EnterNumber = function(){
    var number;
    return new Promise(function(resolve){
        shell.question('Enter the empty siteID index(number) you want the relay to be moved ',(answer)=>{
            number = answer;
            //console.log(" \n The output is ",number);
            resolve(number);
        })
    })
}

var createhelpmdfile = function() {
    return new Promise(function(resolve, reject) {
        var count
        var obj = []
        obj.push({h1:"Commands"})
        var com = Object.keys(helpCommand);
        var leng = Object.keys(helpCommand).length;
        for (count=0;count<leng;count++) {
          var a = helpCommand[com[count]];
          var usage,description,example = ""
          //if(helpCommand[com[count]].Usage)
          usage = "Usage: "+ helpCommand[com[count]].Usage;
          // if(helpCommand[com[count]].Example)
          example = "Example: "+ helpCommand[com[count]].Example;
          //if(helpCommand[com[count]].Description) 
          description = "Description: "+ helpCommand[com[count]].Description;
          var paragraph = usage +"\n"+example + "\n" +description + "\n";
          obj.push({h2:com[count]});
          obj.push ({p:paragraph})
          if(count===leng-1) {
              fs.writeFile('Help.md', json2md(obj),function(err) {
                if(err) {
                    reject(err);
                } else {
                    logger.info("Created Help.md file"); 
                    resolve();    
                }    
              });      
            } 
        }    
    })
    
}

var s = 0;

var doCLICommand = function(cmd) {
    if(!program.site && cmd !== 'getSites' && cmd !== 'set-siteid' && inputflag === false){
        if(s>0){
            console.log(chalk.yellow("siteID not defined. Run getSites then set-siteid to define it else commands might not work "));
        }
        s++;
    }
    //console.log(cmd)
    cliArgz = arguments;
    return new Promise(function(resolve) {
    if(cliArgz[1] == '-h' || cliArgz[1] == '-help' || cliArgz[1] == '--help' || cliArgz[1] == '--h' ||cliArgz[1] ==  'help') {
        if(helpCommand[cmd]){
            //console.log(helpCommand[cmd])
            var cmdDetails = Object.keys(helpCommand[cmd])
            console.log(chalk.blue.bold(cmd))
            for(var i = 0; i< cmdDetails.length; i++){
                console.log('\n\t',chalk.bold(cmdDetails[i]),
                         '\n\t\t',helpCommand[cmd][cmdDetails[i]])
            }
            resolve()
            return
        }
    } else if(cliArgz[1] && cliArgz[1].indexOf('-all') > -1) {
        DCS.getSites().then(function(result){
            var sites = Object.keys(result)
                 var applyAllSites = async (sites) => {
                try{
                    for(let site of sites) {
                        program.site = site
                        console.log(chalk.bold("started command "+cliArgz[0]+" for siteID "+site, "...") )
                        await doCLICommand(cliArgz[0])
                        //await sleep(500)
                    }
                }catch(err){
                    console.log('error')
                }finally{
                    console.log(chalk.blue.bold("Finished command "+ cliArgz[0]+ " for all siteID."))
                    resolve()
                }
            }
            applyAllSites(sites)
            //resolve()
        },function(err){
        })
        return
    } else if(cliArgz.length > 0 && cliArgz[Object.keys(cliArgz).length - 1] && cliArgz[Object.keys(cliArgz).length - 1].indexOf('-d') > -1) {
        program.debug = true;
        program.command_wise_debug = true;
    }

    logdbg("doCLICommand:[", arguments, "]")

        switch (cmd) {
            case "?":
            case "resolveCommand":
                 resolve()
                break;

            case "help":
                if(helpCommand[cliArgz[1]] && cliArgz[1]){
                    //console.log(helpCommand[cmd])
                    var cmdDetails = Object.keys(helpCommand[cliArgz[1]])
                    console.log(chalk.blue.bold(cmd))
                    for(var i = 0; i< cmdDetails.length; i++){
                        console.log('\n\t',chalk.bold(cmdDetails[i]),
                                 '\n\t\t',helpCommand[cliArgz[1]][cmdDetails[i]])
                        resolve();
                    }
                }else{
                    console.log(helpCommands);
                    console.log(shellOnlyCommands);
                    resolve();
                }
                break;

            case "history":
                historyArray = fs.readFileSync(process.env.HOME + '/.dcs_repl_history', 'utf-8').split('\n')
                console.log('Total '+historyArray.length+ ' command is excuted. they are as follows...')
                for(var i = 0; i < historyArray.length - 1; i++){
                //historyArray.forEach(function(histArr){
                    console.log(i + ". " + historyArray[i])
                //})
                }
                resolve()
                break;

                break;
            case "set-accountid":
                program.account = cliArgz[1];
                program.useAccountsSubpath = true; // turn this one now, b/c we switched accounts while logged in
                                                   // It's either do this, or re-login with a new access token.
                console.log("Account ID is now:", program.account);
                resolve();
                break;
            case "set-access-key":
                program.account = cliArgz[1];
                program.useAccountsSubpath = true; // turn this one now, b/c we switched accounts while logged in
                                                   // It's either do this, or re-login with a new access token.
                console.log("access-key is now:", program.account);
                resolve();
                break;
            case "set-depth":
                var depth = parseInt(cliArgz[1])
                if (cliArgz[1]) {
                    if (isNaN(depth)) {
                        console.log("set-depth [num] must be a number")
                    } else {
                        program.depth = depth;
                    }
                }
                console.log("Inspect depth is:", program.depth);
                resolve();
                break;
            case "set-siteid":
                var format = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;
                var tempsiteID = cliArgz[1];
                //console.log(tempsiteID);
                if(ws) ws.close();
                var flag = false;
                if (tempsiteID && tempsiteID.length === 32) {
                    var test = tempsiteID.match(format)
                    if (test) {
                        console.log("Enter proper Site ID. Site ID is now",program.site);
                        resolve();
                    } else {
                        program.site = cliArgz[1];
                        console.log("Site ID is now:", program.site)
                        // if(!cliArgz[2] || cliArgz[2] !== "true" ){
                        //     resolve();
                        // } else {
                            console.log(" Validating whether the site exists in the account... ")
                            DCS.getSites().then(function(result) {
                                Object.keys(result).forEach(function(sites) {
                                    if( sites === program.site) {
                                        flag = true;
                                        program.sitename = result[sites].name;
                                        console.log("Site exists in the account");
                                    }
                                })
                            },function(err) {
                                exitWithError(" Validation failed, unable to fetch sites")
                            }).then(function() {
                                if(flag === true) {
                                    resolve();
                                } else {
                                    program.site = undefined;
                                    console.log("This site does not exist in this account ");
                                    console.log("Site ID is now:", program.site)
                                    resolve ();
                                }
                            })
                        // }
                    }
                } else {
                    console.log("Enter proper Site ID. Site ID is now",program.site);
                    resolve();
                }


                break;
            case "set-siteid-as-accountid":
                program.site = program.account;
                console.log("Site ID is now:", program.site);
                resolve();
                break;
            case "show-responses":
                DCS.showRequestsPending();
                resolve();
                break;
            case "poller-status":
                if (cliArgz[1] == "on") {
                    if (cliArgz[2]) {
                        var interval = parseInt(cliArgz[2]);
                        if (interval > 100) {
                            _pollerInterval = interval;
                            console.log("poller interval set to", _pollerInterval, "ms");
                        } else {
                            console.log("second argument must be a number greater than 100 (ms for poll interval)")
                        }
                    }
                    DCS.startRequestResponsePoller();
                    console.log("poller running.")
                } else
                if (cliArgz[1] == "off") {
                    DCS.stopRequestResponsePoller();
                    console.log("poller stopped.")
                } else {
                    if (_pollerRunning)
                        console.log("poller is running. interval:", _pollerInterval + "ms")
                    else
                        console.log("poller is stopped.")
                }
                resolve();
                break;
            case "debug":
                if (cliArgz[1] == "on") {
                    program.debug = true;
                } else
                if (cliArgz[1] == "off") {
                    program.debug = false;
                } else {
                    if (program.debug)
                        console.log('debug on');
                    else
                        console.log('debug off');
                }
                resolve();
                break;
            case "metrics":
                if (cliArgz[1] == "on") {
                    program.metrics = true;
                } else
                if (cliArgz[1] == "off") {
                    program.metrics = false;
                } else {
                    console.log('metrics command takes "on" or "off"');
                }
                resolve();
                break;
            case "login":
                savingaccesstoken();
                break;

            case "shell":
                var startShell = function() {
                    var getBaseName = /^[Hh][Tt][Tt][Pp][Ss]?\:\/\/([^\.]+).*/;
                    var m = getBaseName.exec(program.cloud);
                    var cloud = program.cloud;
                    if (m && m[1]) {
                        cloud = m[1];
                    }
                    inShell = true;
                    DCS.startRequestResponsePoller();
                    shell = repl.start({
                        prompt: "DCS(" + (serialnumber || cloud) + ")> ",
                        eval: myEval,
                        completer: myCompleter
                    })

                    cmdHistory(shell, process.env.HOME + '/.dcs_repl_history')
                    //					var _complete = shell.complete;

                    shell.on('exit', function() {
                        DCS.getUserByEmail(program.user).then(function(res){
                            if(res && res.id) {
                                console.log("Logging Out.....");
                                if(program.cloud.indexOf('mbed') <= -1) {
                                    DCS.saveLogout(res.id,program.cloud).then(function(result){
                                        console.log("goodbye.")
                                        process.exit(0);
                                    },function(err){
                                        logerr("Error in saving loging out details" + JSON.stringify(err));
                                        console.log("goodbye.")
                                        process.exit(0);
                                    })
                                } else {
                                    console.log("goodbye.")
                                    process.exit(0);
                                }
                            }
                        },function(err){
                            logerr("Error in fetching userID" + err);
                            console.log("goodbye.")
                            process.exit(0);
                        })
                    });
                    shell.on('SIGINT', function() {
                        if(ws) ws.close();
                    });
                    shell.complete = function(line) {
                        myCompleter.apply(this, arguments);
                        //                      _complete.apply(this,arguments);
                    }

                }
                if (!inShell) {

                    if ((!program.cloud || !program.user) && !program.access_key) {
                        exitWithError("'shell' mode requires: cloud server, account ID, username and password.");
                    } else {
                        if (!program.account && !program.admin) {
                            console.log("No account stated. Attempting to determine if this is a single account user...");
                            DCS.getAccounts().then(function(res) {
                                if (res && res[0] && res[0].id) {
                                    if (res.length == 1) {
                                        program.useAccountsSubpath = true;
                                        program.account = res[0].id;
                                        console.log("Found", res[0].id, "This user is in a single account.");
                                        console.log("Accountid is set to  "+res[0].id);
                                        //savingaccesstoken();

                                    } else {
                                        console.log("Can't find a solitary account. This user is in accounts:");
                                        console.log("S.No.| Name                                     | Id")
                                        console.log("Use anyone account to Enter");
                                        for (var n = 0; n < res.length; n++) {
                                            var i =n;
                                            if (n<10) {
                                                i = '0'+n;
                                            }
                                            console.log(i+"   |",res[n].name, "|", res[n].id)
                                        }
                                        while(!program.account || program.account === null){
                                            var accountid = readlineSync.question('Enter the Account from the above list which has Authorization ? ')
                                            if(accountid.length <= 2){
                                                program.account = res[accountid].id;
                                            }else{
                                                program.account = accountid;
                                            }

                                            program.useAccountsSubpath = true;
                                            console.log("Accountid is set to  "+ program.account);
                                        }
                                        /*if(program.account){
                                            var p = savingaccesstoken();
                                        }*/
                                        
                                        //resolve();
                                    }
                                }
                            }).then(function(){ 
                                if(program.account){
                                    var p = savingaccesstoken();
                                }
                                DCS.getSites().then(function(res) {
                                    if (Object.keys(res).length > 0) {
                                        if (res && Object.keys(res)[0] ) {
                                            if (Object.keys(res).length == 1) {
                                                program.site = Object.keys(res)[0];
                                                console.log("Found", Object.keys(res)[0], "This account has a single site.");
                                                console.log("SiteID is set to  "+Object.keys(res)[0]);
                                                if (!inShell)
                                                    startShell();
                                                resolve();
                                            } else {
                                                // console.log("Can't find a solitary site");
                                                if (!inShell)
                                                    startShell();
                                                resolve();
                                            }
                                        }
                                    } else {
                                        console.log(chalk.bold("No site found! Please, run createSite cmd"));
                                        if (!inShell)
                                            startShell();
                                        resolve();
                                    } 
                                })
                            });

                        }
                         else {
                            startShell();    
                        }
                    }
                } else {
                    console.log('Already in shell mode.');
                    resolve();
                }
                break;
            case "version":
                printVersion();
                resolve();
                break;
            case "info":
                console.log("Cloud URL:", program.cloud);
                console.log("Account ID:", program.account);
                console.log("Site ID:", program.site);
                console.log("Site Name:", program.sitename);
                console.log("Logged in as:", program.user);
                console.log("Config storage file:", accessObjectStorageFile);
                console.log("");
                if (program.debug) {
                    console.log("Access info:", access);
                    var decoded = jwt.decode(access.access_token);
                    console.log("Decoded token:", decoded);
                }
                resolve();
                break;
            case "login":
                if (cliArgz.length < 3) {
                    logerr("Requires username and password arguments.");
                    resolve();
                } else {
                    console.log("connecting...");
                    DCS._loginWithPass(cliArgz[1], cliArgz[2]).then(function(result) {
                        logdbg('program:', program)
                        logdbg("OK---", util.inspect(result, {
                            depth: program.depth
                        }));
                        access = result;
                        program.user = cliArgz[1];
                        console.log("log in complete.")
                    }, function(err) {
                        logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err)
                    }).then(function() {
                        resolve();
                    });
                }
                break;
            case "LOGINTESTING":
                var obj = {
                    "grant_type": "password",
                    "username": program.user,
                    "password": program.password

                }
                DCS.Login(obj,program.cloud).then(function(result) {
                    console.log("log in complete")
                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err)
                }).then(function() {
                    resolve();
                });
                break;

            case "getLoginHistory":
                if(!cliArgz[1]) {
                    logerr("Require userID");
                    resolve();
                } else {
                    DCS.getLogin(program.cloud, cliArgz[1]).then(function(result) {
                        console.log("Login history of " + cliArgz[1]) ;
                        if(!cliArgz[2]) {
                            console.log('---------------------------------------------------------------------------------------------------------');
                            console.log('\t\tTime\t\t| Login\t| Lat | Long | IP Address | Device Type | App Version | User Agent')
                            console.log('---------------------------------------------------------------------------------------------------------');
                            result.logs.forEach(function(lg) {
                                d = new Date(lg.timestamp);
                                if(d == 'Invalid Date') {
                                    d = new Date(parseInt(lg.timestamp));
                                }
                                console.log(d.toUTCString() + '\t| ' + (lg.login ? chalk.green('login') + '\t': chalk.red('logout')) + '\t| ' + lg.latitude + ' | ' + lg.longitude + ' | ' + lg.ipaddress + ' | ' + lg.deviceType + ' | ' + lg.appVersion + ' | ' + lg.userAgent);
                            });
                            console.log('---------------------------------------------------------------------------------------------------------');
                        } else {
                            console.log(result);
                        }
                    }, function(err) {
                        logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err)
                    }).then(function() {
                        resolve();
                    });
                }

                break;

            case "LOGOUTTESTING":
                DCS.Logout(program.cloud).then(function(result) {
                    console.log("log out complete.")
                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err)
                }).then(function() {
                    resolve();
                });
                break;

            case "exit":
                console.log("Exiting.");
                process.exit(0);
                break;
            // case "getProperty":
            //     // selection, property
            //     DCS.cmdGetProperty(cliArgz[1], cliArgz[2]).then(function(resp) {
            //         console.log("OK. Waiting for response... [" + resp.id + "]");
            //         resolve();
            //     }, function(err) {
            //         logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
            //         resolve();
            //     }).then(function() {
            //         resolve();
            //     });
            //     break;
            case "getResponse":
                DCS.getRequestResponse(cliArgz[1]).then(function(resp) {
                    console.log("Response:", resp);
                }, function(err) {
                    logerr("Failed (getResponse):", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                }).catch(function(err) {
                    logerr("Failed (getResponse):", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                }).then(function() {
                    resolve();
                })
                break;

            case "postRequests":
                if(!program.site){
                    exitWithError("SiteID null. Set SiteID first");
                    resolve();
                    break;
                }
                if(cliArgz[5]){
                var arg= cliArgz[5].split(",")
                } else {
                    arg = cliArgz[5];
                }
                /*if(arg){
                    if(arg.indexOf(",")!==-1){
                    arg = arg.substring(0,(arg.indexOf(",")))
                    }
                    if(!isNaN(Number(cliArgz[5]))){
                        arg=Number(cliArgz[5]);
                    }
                    if(cliArgz[5]==="true"|| cliArgz[5]==="false") {
                        arg = cliArgz[5]==="true"? true:false;
                    }
                }*/

                DCS.postRequest(cliArgz[1], cliArgz[2], cliArgz[3], cliArgz[4], arg,cliArgz[6],useAccountsSubpath,program.account,program.site).then(function(resp) {
                    console.log("OK.")
                    DCS.getRequestStatus(resp.id).then(function(resp1){

                            //console.log(resp1.state);

                        if(resp1.state === "complete"){

                            DCS.getRequestResponse(resp1.id).then(function(resp1) {
                                console.log("OK.");
                                console.log("Results: SUCCESS",util.inspect(resp1, {depth:program.depth}));
                            }, function(err) {
                                logerr("Failed: getRequestResponse ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                            }).then(function() {
                                resolve();
                            });

                        }
                    },function(err){
                       logerr("Failed: doAPI_getrequeststatus ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                    })
                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                    resolve();
                })
                break;

            case "modbusLogLevel":
                if(!program.site){
                    exitWithError("SiteID null. Set SiteID first");
                    resolve();
                    break;
                }
                var arg= parseInt(cliArgz[1]);
                // if(arg){
                //     if(arg.indexOf(",")!==-1){
                //     arg = arg.substring(0,(arg.indexOf(",")))
                //     }
                //     if(!isNaN(Number(cliArgz[5]))){
                //         arg=Number(cliArgz[5]);
                //     }
                //     if(cliArgz[5]==="true"|| cliArgz[5]==="false") {
                //         arg = cliArgz[5]==="true"? true:false;
                //     }
                // }
                DCS.executeCommand(program.site,"id=\"ModbusDriver\"", "logLevel", arg).then(function(resp) {
                    console.log("OK.");
                    console.log("Results: SUCCESS",util.inspect(resp,{depth:program.depth}));
                     resolve();
                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                    resolve();
                })
                break;

            case "modbusDeleteDevice":
                if(!program.site){
                    exitWithError("SiteID null. Set SiteID first");
                    resolve();
                    break;
                }
                var arg= cliArgz[1]
                if(arg){
                    if(arg.indexOf(",")!==-1){
                    arg = arg.substring(0,(arg.indexOf(",")))
                    }
                    /*if(!isNaN(Number(cliArgz[5]))){
                        arg=Number(cliArgz[5]);
                    }
                    if(cliArgz[5]==="true"|| cliArgz[5]==="false") {
                        arg = cliArgz[5]==="true"? true:false;
                    }*/
                }
                shell.question('are you sure(yes/no) ?', (answer) =>{
                    if(answer == 'yes'){
                        DCS.executeCommand(program.site,"id=\"ModbusDriver\"", "deleteAll", arg).then(function(resp) {
                            console.log("OK.")
                            console.log("Results: SUCCESS",util.inspect(resp,{depth:program.depth}));
                            resolve();
                        }, function(err) {
                            logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                            resolve();
                        })
                    }else if(answer == 'no'){
                        console.log('\nOoops! command executed by mistake')
                        resolve()
                    }else{
                        console.log('\nreply either yes or no')
                        resolve()
                    }
                })

                break;

            case "modbusDeleteAll":
                if(!program.site){
                    exitWithError("SiteID null. Set SiteID first");
                    resolve();
                    break;
                }
                var arg= cliArgz[1]
                if(arg){
                    if(arg.indexOf(",")!==-1) {
                        arg = arg.substring(0,(arg.indexOf(",")))
                    }
                    /*if(!isNaN(Number(cliArgz[5]))){
                        arg=Number(cliArgz[5]);
                    }
                    if(cliArgz[5]==="true"|| cliArgz[5]==="false") {
                        arg = cliArgz[5]==="true"? true:false;
                    }*/
                }
                DCS.executeCommand(program.site, "id=\"ModbusDriver\"", "deleteAll", arg).then(function(resp) {
                    console.log("OK.")
                    console.log("Results: SUCCESS",util.inspect(resp,{depth:program.depth}));
                    resolve();
                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                    resolve();
                })
                break;

            case "modbusListDevices":
                if(!program.site){
                    exitWithError("SiteID null. Set SiteID first");
                    resolve();
                    break;
                }
                var arg= cliArgz[1]
                if(arg){
                    if(arg.indexOf(",")!==-1){
                    arg = arg.substring(0,(arg.indexOf(",")))
                    }
                }
                DCS.executeCommand(program.site, "id=\"ModbusDriver\"", "listDevices").then(function(resp) {
                    console.log("OK.");
                    console.log("Results: SUCCESS",util.inspect(resp,{depth:program.depth}));
                    resolve();
                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                    resolve();
                });
                break;



            case "modbusGetDeviceMetadata":
                if(!program.site){
                    exitWithError("SiteID null. Set SiteID first");
                    resolve();
                    break;
                }
                var arg= cliArgz[1]
                if(arg){

                    /*if(!isNaN(Number(cliArgz[5]))){
                        arg=Number(cliArgz[5]);
                    }
                    if(cliArgz[5]==="true"|| cliArgz[5]==="false") {
                        arg = cliArgz[5]==="true"? true:false;
                    }*/
                }

                DCS.executeCommand(program.site,"id=\"ModbusDriver\"", "getAll", arg).then(function(resp) {
                    console.log("OK.");
                    console.log("Results: SUCCESS",util.inspect(resp,{depth:program.depth}));
                    resolve();
                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                    resolve();
                })
                break;

            case "modbusConfiguration":
                if(!program.site){
                    exitWithError("SiteID null. Set SiteID first");
                    resolve();
                    break;
                }
                DCS.executeCommand(program.site, "id=\"ModbusDriver\"", "config", null).then(function(resp) {
                    console.log("OK.")
                    console.log("Results: SUCCESS",util.inspect(resp,{depth:program.depth}));
                    resolve();
                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                    resolve();
                })
                break;

            case "modbusGetAllDeviceStates":
                if(!program.site){
                    exitWithError("SiteID null. Set SiteID first");
                    resolve();
                    break;
                }
                DCS.executeCommand(program.site,"id=\"ModbusDriver\"", "getAllDeviceStates", null).then(function(resp) {
                    console.log("OK.")
                    console.log("Results: SUCCESS",util.inspect(resp,{depth:program.depth}));
                    resolve();
                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                    resolve();
                })
                break;

            case "modbusResetUSB":
                if(!program.site){
                    exitWithError("SiteID null. Set SiteID first");
                    resolve();
                    break;
                }

                DCS.executeCommand(program.site,"id=\"ModbusDriver\"", "resetFTDI", null).then(function(resp) {
                    console.log("OK.")
                    console.log("Results: SUCCESS",util.inspect(resp,{depth:program.depth}));
                    resolve();
                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                    resolve();
                })
                break;

            case "modbusStart":
                if(!program.site){
                    exitWithError("SiteID null. Set SiteID first");
                    resolve();
                    break;
                }
                if(!cliArgz[1]){
                    exitWithError("Enter JSON file");
                    resolve();
                    break;
                }

                function getDeviceRecipe() {
                    return new Promise(function(resolve, reject) {
                        var deviceRecipe;
                        if(cliArgz[1].indexOf('http') > -1) {
                            console.log('Found url, executing wget on ' + cliArgz[1]);
                            wget(cliArgz[1], function(err, resp, body) {
                                if(err) {
                                    reject(err);
                                } else {
                                    resolve(body);
                                }
                            });
                        } else {
                            if(fs.existsSync(cliArgz[1])) {
                                try {
                                    deviceRecipe = fs.readFileSync(cliArgz[1], 'utf8');
                                } catch(e) {
                                    reject(e);
                                    return;
                                }
                                resolve(deviceRecipe);
                            } else {
                                reject('Not a valid file path!');
                            }
                        }
                    });
                }

                getDeviceRecipe().then(function(deviceRecipe) {
                    console.log('Got recipe ', deviceRecipe);
                    if(deviceRecipe.indexOf('404 Not Found') > -1) {
                        resolve();
                        return;
                    }
                    try {
                        deviceRecipe = JSON.stringify(JSON.parse(jsonminify(deviceRecipe)));
                    } catch(e) {
                        console.log('Error ', e);
                        exitWithError('Failed to parse JSON- ' + e);
                        resolve();
                        return;
                    }

                    DCS.executeCommand(program.site, "id=\"ModbusDriver\"", "start", deviceRecipe).then(function(resp) {
                        console.log("OK.");
                        console.log("Results: SUCCESS",util.inspect(resp,{depth:program.depth}));
                        resolve();
                    }, function(err) {
                        logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                        resolve();
                    })

                    // DCS.postRequest("id=\"ModbusDriver\"", "start", "call", null, deviceRecipe, null, useAccountsSubpath,program.account,program.site).then(function(resp) {
                    //     console.log("OK.")
                    //     DCS.getRequestStatus(resp.id).then(function(resp1){
                    //         if(resp1.state === "complete"){
                    //             DCS.getRequestResponse(resp1.id).then(function(resp1) {
                    //                 console.log("OK.");
                    //                 console.log("Results: SUCCESS",util.inspect(resp1,{depth:program.depth}));
                    //             }, function(err) {
                    //                 logerr("Failed: doAPI_getCreateVirtualDevicerequestresponse ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                    //             }).then(function() {
                    //                 resolve();
                    //             });
                    //         }
                    //     },function(err){
                    //        logerr("Failed: doAPI_getrequeststatus ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                    //     })
                    // }, function(err) {
                    //     logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                    //     resolve();
                    // })
                }, function(err) {
                    logerr('Failed with error ' + err);
                    resolve();
                })
                break;

            case "resetImod6":
                DCS.executeCommand(program.site, "id=\"ModbusDriver\"", "resetImod6").then(function(resp){
                    console.log("OK.")
                    console.log(resp)
                    resolve()
                }, function(err){
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                    resolve();
                    //reject(err);
                });
            break;

            case "setImod6":
                DCS.executeCommand(program.site, "id=\"ModbusDriver\"", "setImod6", cliArgz[1]).then(function(resp){
                    console.log("OK.")
                    console.log(resp)
                    resolve()
                }, function(err){
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                    resolve();
                    //reject(err);
                });
            break;

            case "programImod6":
                if(!program.site){
                    exitWithError("SiteID null. Set SiteID first");
                    resolve();
                    break;
                }
                if(!cliArgz[1]){
                    exitWithError("Enter hex file path");
                    resolve();
                    break;
                }

                function getFirmware() {
                    return new Promise(function(resolve, reject) {
                        var code;
                        if(cliArgz[1].indexOf('http') > -1) {
                            console.log('Found url, executing wget on ' + cliArgz[1]);
                            wget(cliArgz[1], function(err, resp, body) {
                                if(err) {
                                    reject(err);
                                } else {
                                    resolve(body);
                                }
                            });
                        } else {
                            if(fs.existsSync(cliArgz[1])) {
                                try {
                                    code = fs.readFileSync(cliArgz[1], 'utf8');
                                } catch(e) {
                                    reject(e);
                                    return;
                                }
                                resolve(code);
                            } else {
                                reject('Not a valid file path!');
                            }
                        }
                    });
                }

                getFirmware().then(function(code) {
                    // console.log('Got firmware ', code);
                    if(code.indexOf('404 Not Found') > -1) {
                        resolve();
                        return;
                    }
                    var str = code.toString();
                    var lines = str.split('\n');
                    if(lines[lines.length -1].length == 0) { lines.splice(lines.length - 1, 1)};
                    console.log(lines);
                    DCS.executeCommand(program.site, "id=\"ModbusDriver\"", "programImod6", [lines]).then(function(resp){
                        console.log("OK.")
                        console.log(resp)
                        resolve()
                    }, function(err){
                        logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                        resolve();
                        //reject(err);
                    });
                }, function(err) {
                    logerr('Failed with error- ', err);
                    resolve();
                });

                break;

            case "executeBash":
                if(!program.site){
                    exitWithError("SiteID null. Set SiteID first");
                    resolve();
                    break;
                }
                var arg= cliArgz[1]
                if(arg){
                    if(arg.indexOf(",")!==-1){
                    arg = arg.substring(0,(arg.indexOf(",")))
                    }
                    /*if(!isNaN(Number(cliArgz[5]))){
                        arg=Number(cliArgz[5]);
                    }
                    if(cliArgz[5]==="true"|| cliArgz[5]==="false") {
                        arg = cliArgz[5]==="true"? true:false;
                    }*/
                }
                DCS.executeCommand(program.site,"id=\"RelayStats\"", "execute", arg).then(function(resp) {
                    console.log("OK.")
                    console.log("OK.");
                    console.log("Results: SUCCESS",util.inspect(JSON.stringify(resp,null,4),{depth:program.depth}));
                    resolve();
                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                    resolve();
                })
                break;

            case "startTunnel":
                if(!program.site){
                    exitWithError("SiteID null. Set SiteID first");
                    resolve();
                    break;
                }
                var arg= cliArgz[1]
                if(arg){
                    if(arg.indexOf(",")!==-1){
                    arg = arg.substring(0,(arg.indexOf(",")))
                    }
                    /*if(!isNaN(Number(cliArgz[5]))){
                        arg=Number(cliArgz[5]);
                    }
                    if(cliArgz[5]==="true"|| cliArgz[5]==="false") {
                        arg = cliArgz[5]==="true"? true:false;
                    }*/
                }
                if(cliArgz[1]) {
                    DCS.executeCommand(program.site,"id=\"RUNNER\"", "startTunnel", arg).then(function(resp) {
                        console.log("OK.");
                        console.log("Results: SUCCESS",util.inspect(resp,{depth:program.depth}));
                        resolve();
                    }, function(err) {
                        logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                        resolve();
                    })
                } else {
                    DCS.executeCommand(program.site,"id=\"RelayStats\"", "startTunnel", arg).then(function(resp) {
                        console.log("OK.");
                        console.log("Results: SUCCESS",util.inspect(resp,{depth:program.depth}));
                        resolve();
                    }, function(err) {
                        logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                        resolve();
                    })
                }
                break;

            case "getUsers":
                DCS.getUsers().then(function(result) {
                    console.log(result);
                    console.log("OK.");
                    if(!cliArgz[1]) {
                        if(program.cloud.indexOf('mbed') > -1) {
                            console.log('-----------------------------------------------');
                            console.log('Name \t\t| Email');
                            console.log('-----------------------------------------------');
                            Object.keys(result).forEach(function(name) {
                                console.log(result[name].name + (!result[name].name ? "\t": "") + ' \t\t| ' + result[name].email);
                            });
                            console.log('-----------------------------------------------');
                        } else {
                            console.log('-----------------------------------------------');
                            console.log('ID | Username');
                            console.log('-----------------------------------------------');
                            Object.keys(result).forEach(function(name) {
                                console.log(result[name].id + ' | ' + name);
                            });
                            console.log('-----------------------------------------------');
                        }
                    } else {
                        console.log("Results:", util.inspect(result, {
                            depth: 10
                        }));
                    }
                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                }).then(function() {
                    resolve();
                })
                break;
            case "getUserinfo":
                DCS.getUserinfo(cliArgz[1]).then(function(result) {
                    console.log("OK.");
                    console.log("Results:", util.inspect(result,{depth:program.depth}));
                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                }).then(function() {
                    resolve();
                })
                break;

             case "createSite":
                DCS.postSite().then(function(result) {
                    console.log("OK.");
                    console.log("Results:", util.inspect(result,{depth:program.depth}));
                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                }).then(function() {
                    resolve();
                })
                break;

            case "createsitesWithNames":
                 var prefix = readlineSync.question('Enter the prefix to be entered in all site name ')
                 if(!prefix){
                    prefix =" ";
                 } else{
                    prefix = prefix +" ";
                 }

                  var filename = readlineSync.question('Enter the file name ')
                  var sitename=[]

                  /*if(cliArgz[2]){
                      var row = Number(cliArgz[2]);
                  }else{
                      row=1;
                  }
                  if(!cliArgz[3]){
                    exitWithError("Please enter the column which has site name if the file has csv format")
                    resolve();
                    break;
                  }*/
                  var column = Number(cliArgz [3]);
                  var filereading = function(filename){
                    return new Promise(function(resolve,reject){
                        try{
                            if(filename.indexOf('.csv')===-1){
                            lineReader.eachLine(filename, function(line, last) {
                                var line = line.replace('[','');
                                var line = line.replace(']','');
                                var line = line.replace('{','');
                                var line = line.replace('}','');
                                var line = line.replace(',','');
                                var line=line.trimLeft();
                                var line=line.trimRight();
                                //console.log(line);
                                if(line!==''){
                                    line=prefix+line;
                                    sitename.push(line);
                                }
                                if(last){
                                    //console.log(sitename);
                                    return resolve(sitename);
                                }
                            })
                          }
                          else
                          {    console.log("This file is .csv")
                                var row = readlineSync.question('Enter the row from which it has to be read ');
                                row --;
                                row = Number(row);
                                var column = readlineSync.question('Enter the column from which it has to be read ')
                                column --;
                                column = Number(column);
                               var counter = 0;
                                lineReader.eachLine(filename, function(line, last) {
                                var line=line.trimLeft();
                                var line=line.trimRight();
                                line = line.split(',');

                                if(counter >= row){
                                  //console.log(line[column]);
                                  sitename.push((prefix+line[column]));
                                }
                                counter ++;
                                if(last){
                                        //console.log(sitename);
                                        return resolve(sitename);
                                    }
                                })
                          }
                        }catch(e)
                        {
                           reject("Error:",e)
                        }
                    })

                    }

                    var resolve = require('path').resolve
                    resolve(filename);
                    console.log(filename);
                    fs.stat(filename, function(err,stats) {
                    if(err){
                        console.log(err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                        resolve();
                    }else{
                        //console.log(stats);
                        console.log("File exists");
                        filereading(filename).then(function(sitename){
                        var number = sitename.length;
                        if(number>0){
                            for(let i=0;i<number;i++){
                                DCS.postSite().then(function(result) {
                                console.log("OK.");
                                console.log("Results:", util.inspect(result.id));
                                //console.log(result.id);
                                //console.log(sitename[i]+""+i);
                                DCS.updateSite(result.id,'true', sitename[i]).then(function(result) {
                                console.log("OK.");
                                console.log("Results:", result);
                                }, function(err) {
                                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                                }).then(function(){
                                    //resolve();
                                })
                                 }, function(err) {
                                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                                    //resolve();
                                })
                            }
                        }else{
                            console.log("Cannot fetch any name from file ");
                            resolve();
                        }
                    }, function(err) {
                        console.log("Error:"+err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);

                    }).then(function(){
                        resolve();
                    })

                    }
                    })
                  break;

            case "deletesitesWithNames":
                 //var prefix = readlineSync.question('Enter the prefix to be entered in all site name ')
                 if(!prefix){
                    prefix =" ";
                 } else{
                    prefix = prefix +" ";
                 }

                  var filename = readlineSync.question('Enter the file name ')
                  var sitename=[]

                  var filereading = function(filename){
                    return new Promise(function(resolve,reject){
                        try{
                            if(filename.indexOf('.csv')===-1){
                            lineReader.eachLine(filename, function(line, last) {
                                var line = line.replace('[','');
                                var line = line.replace(']','');
                                var line = line.replace('{','');
                                var line = line.replace('}','');
                                var line = line.replace(',','');
                                var line=line.trimLeft();
                                var line=line.trimRight();
                                //console.log(line);
                                if(line!==''){
                                    line=prefix+line;
                                    sitename.push(line);
                                }
                                if(last){
                                    //console.log(sitename);
                                    return resolve(sitename);
                                }
                            })
                          }
                          else
                          {    console.log("This file is .csv")
                                var row = readlineSync.question('Enter the row from which it has to be read ');
                                row --;
                                row = Number(row);
                                var column = readlineSync.question('Enter the column from which it has to be read ')
                                column --;
                                column = Number(column);
                               var counter = 0;
                                lineReader.eachLine(filename, function(line, last) {
                                var line=line.trimLeft();
                                var line=line.trimRight();
                                line = line.split(',');

                                if(counter >= row){
                                  //console.log(line[column]);
                                  sitename.push((prefix+line[column]));
                                }
                                counter ++;
                                if(last){
                                        //console.log(sitename);
                                        return resolve(sitename);
                                    }
                                })
                          }
                        }catch(e)
                        {
                           reject("Error:",e)
                        }
                    })

                    }

                    var resolve = require('path').resolve
                    resolve(filename);
                    //console.log(filename);
                    fs.stat(filename, function(err,stats) {
                    if(err){
                        console.log(err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                        resolve();
                    }else{
                        var AllSites=[];
                        //var counter = 0;
                        console.log("File exists");
                        filereading(filename).then(function(sitename){
                        var number = sitename.length;
                        if(number>0){
                            for(let i=0;i<number;i++){
                                DCS.getSites().then(function(result1) {
                                    //console.log("OK.");
                                    matchname=sitename[i]
                                    AllSites=Object.values(result1)
                                    //console.log(AllSites);
                                    for(let j=0;j<AllSites.length;j++){
                                         names=AllSites[j].name
                                         names=names.trimLeft();
                                         names=names.trimRight();
                                         matchname=matchname.trimLeft();
                                         matchname=matchname.trimRight();
                                         /*console.log(names);
                                         console.log(matchname);*/
                                         if(names === matchname){
                                            //counter ++;
                                            deleteSiteid=AllSites[j].id;
                                            console.log("Found name "+names);
                                            DCS.deleteSite(deleteSiteid).then(function(result) {
                                                console.log("OK.");
                                                console.log("Results: site is successfully deleted");
                                            }, function(err) {
                                                logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                                            })
                                        }
                                    }
                                    /*if(counter===0){
                                        console.log("No site is deleted as the sitename provided in file doesn't exists ");
                                    }*/

                                 }, function(err) {
                                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                                    //resolve();
                                })
                            }
                            /*if(counter===0){
                                console.log("No site is deleted as the sitename provided in file doesn't exists ");
                            } */
                        }else{
                            console.log("Cannot fetch any name from file ");
                            resolve();
                        }
                    }, function(err) {
                        console.log("Error:"+err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);

                    }).then(function(){
                        resolve();
                    })

                    }
                    })
                  break;

            // case "getSites":
            //     DCS.getSites().then(function(result) {
            //         console.log("OK.");
            //         allSites = result;
            //         if(cliArgz[1] && cliArgz[1].indexOf('-raw') > 0) {
            //             console.log(JSON.stringify(result, null, 4));
            //         } else {
            //             console.log('-------------------------------------------------------------------')
            //             console.log('SiteID                           | Site Name');
            //             console.log('-------------------------------------------------------------------')
            //             Object.keys(result).forEach(function(id) {
            //                 console.log(id + ' | ' + result[id].name);
            //             });
            //             console.log('-------------------------------------------------------------------')
            //             // console.log("Results:", util.inspect(result,{depth:null}));
            //         }
            //     }, function(err) {
            //         logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
            //     }).then(function() {
            //         resolve();
            //     })
            //     break;

            case "siteMap":
                DCS.getSiteMap().then(function(result) {
                    console.log('-----------------------------------------------------------------------------');
                    console.log('SiteID                           | Active | Site Name                        ');
                    console.log('-----------------------------------------------------------------------------');
                    Object.keys(result.allSites).forEach(function(id) {
                        console.log(id + ' | ' + (result.allSites[id].active ? 'true ' : 'false') + '  | ' + result.allSites[id].name);
                    });
                    console.log('-----------------------------------------------------------------------------');
                    delete result.allSites;
                    delete result.siteNames;
                    console.log('Site Groups:')
                    console.log(JSON.stringify(result, null, 4));
                    console.log('-----------------------------------------------------------------------------')
                    // console.log("Results:", util.inspect(result,{depth:null}));
                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                }).then(function() {
                    resolve();
                })
                break;

            case "getSiteInfo":
                if(!program.site){
                    exitWithError("Run set-siteid command to enter the siteID whose information has to be retrived ");
                    resolve();
                    break ;
                }

                DCS.getaSite(program.site).then(function(result) {
                    console.log("OK.");
                    console.log("Results:", util.inspect(result,{depth:null}));
                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                }).then(function() {
                    resolve();
                })
                break;

            case "siteName":
                if(!program.site){
                    exitWithError("Run set-siteid command to enter the siteID whose information has to be retrived ");
                    resolve();
                    break ;
                }

                DCS.getaSite(program.site).then(function(result) {
                    //console.log("OK.");
                    program.sitename = result.name;
                    console.log("The name of siteID "+program.site+" is "+result.name);
                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                }).then(function() {
                    resolve();
                })
                break;

            case "deleteSite":
                if(!cliArgz[1]) {
                    exitWithError("Enter the siteID to be deleted");
                    resolve();
                    break ;
                }
                shell.question('are you sure (yes/no)?',(answer) =>{
                    if(answer == 'yes'){
                        DCS.deleteSite(cliArgz[1]).then(function(result) {
                        console.log("OK.");
                        console.log("Results: site is successfully deleted");
                        }, function(err) {
                            logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                        }).then(function() {
                            resolve();
                        })
                    }else if(answer == 'no'){
                        console.log('\nOoops! command executed by mistake')
                        resolve()
                    }else{
                        console.log('\nreply either yes or no')
                        resolve()
                    }
                })

                break;

            case "updateSite":
                if(!program.site) {
                    exitWithError("Run set-siteid command to enter the siteID to be updated");
                    resolve();
                    break ;
                }
                if(cliArgz[1]!== "true" && cliArgz[1]!== "false") {
                    exitWithError("active only takes boolean value");
                    resolve();
                    break;
                }
                DCS.updateSite(program.site,cliArgz[1],cliArgz[2]).then(function(result) {
                    console.log("OK.");
                    console.log("Results:", result);
                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                }).then(function() {
                    resolve();
                })
                break;

            case "renameSite":
                if(!program.site) {
                    exitWithError("Run set-siteid command to enter the siteID to be renamed ");
                    resolve();
                    break ;
                }
                if(!cliArgz[1]) {
                    exitWithError("Enter the name to be given to the site");
                    resolve();
                    break;
                }
                DCS.updateSite(program.site,"true",cliArgz[1]).then(function(result) {
                    console.log("OK.");
                    console.log("Results:", result);
                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                }).then(function() {
                    resolve();
                })
                break;

            case "getSiteresourcetypes":
                if(!program.site) {
                    exitWithError("Run set-siteid command to enter the siteID whose resourcetypes to be listed");
                    resolve();
                    break ;
                }
                DCS.getSiteresourcetypes(program.site).then(function(result) {
                    console.log("OK.");
                    console.log("Results:", JSON.stringify(result, null, 4));
                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                }).then(function() {
                    resolve();
                })
                break;

            case "getSiteinterfaces":
                if(!program.site) {
                    exitWithError("Run set-siteid command to enter the siteID whose interfaces to be listed");
                    resolve();
                    break ;
                }
                DCS.getSiteinterfaces(program.site).then(function(result) {
                    console.log("OK.");
                    console.log("Results:", JSON.stringify(result, null, 4));
                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                }).then(function() {
                    resolve();
                })
                break;

            case "getDeviceInterfaces":
                if(!cliArgz[1]) {
                    exitWithError('Usage: getDeviceInterfaces [resourceID]');
                    resolve();
                    return;
                }
                DCS.getDeviceInterfaces(program.site, cliArgz[1]).then(function(result) {
                    console.log("OK.");
                    console.log("Results:", JSON.stringify(result, null, 4));
                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                }).then(function() {
                    resolve();
                })
            break;

            case "getAccounts":
                DCS.getAccounts(10).then(function(result) {
                    console.log("OK.");
                    console.log("Results:", util.inspect(result, {
                        depth: program.depth
                    }));
                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                }).then(function() {
                    resolve();
                })
                break;

            case "renameAccount":
                if(cliArgz.length < 2) {
                    console.log("Usage: renameAccount [Name] [accountID]\n Example: renameAccount 'Super Manager' 556565656566");
                    return resolve();
                }

                if(!cliArgz[1]){
                    cliArgz[1]="";
                }
                 if(!cliArgz[2]){
                    cliArgz[2]=program.account;
                }

                DCS.renameAccount(cliArgz[2],cliArgz[1]).then(function(result) {
                    console.log("OK.");
                    console.log("Results:", util.inspect(result, {
                        depth: program.depth
                    }));
                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                }).then(function() {
                    resolve();
                })
                break;

            case "getSites":
            case "getRelays":
                DCS.getSites().then(function(siteresult) {
                    // console.log("OK.");
                    if(Object.keys(siteresult).length <= 0) {
                        exitWithError("No site found!").then(function() {
                            resolve();
                        });
                        return;
                    }
                    allSites = JSON.parse(JSON.stringify(siteresult));
                    DCS.getRelays(cliArgz[1], cliArgz[2], cliArgz[3], cliArgz[4]).then(function(result) {
                        console.log("OK.");
                        if(cliArgz[1] && cliArgz[1].indexOf('-raw') > 0) {
                            console.log(JSON.stringify(result, null, 4));
                        }  else {
                            if(program.cloud.indexOf('mbed') <= -1) {
                                console.log('-----------------------------------------------------------------------------------------------------------------------');
                                console.log('ID         | Pairing Code              | SiteID                           | devicejs connected  | Site Name            ');
                                console.log('-----------------------------------------------------------------------------------------------------------------------');
                                // console.log(result);
                                result.forEach(function(relay) {
                                    console.log(relay.id + ' | ' + relay.pairingCode + ' | ' + (relay.siteID ? relay.siteID : 'null \t\t\t\t ') + ' | ' + relay.devicejsConnected + '\t\t| ' + (relay.siteID ? siteresult[relay.siteID].name : 'null'));
                                    delete siteresult[relay.siteID];
                                });
                                Object.keys(siteresult).forEach(function(id) {
                                    console.log('---------- | ------------------------- | ' + id + ' | ------------------- | ' + siteresult[id].name);
                                });
                                console.log('-----------------------------------------------------------------------------------------------------------------------');
                            } else {
                                console.log('-----------------------------------------------------------------------------------------------------------------------');
                                console.log('ID                               | SiteID                           | devicejs connected  | Site Name            ');
                                console.log('-----------------------------------------------------------------------------------------------------------------------');
                                // console.log(result);
                                result.forEach(function(relay) {
                                    try { 
                                        console.log(relay.id + ' | ' + (relay.siteID ? relay.siteID : 'null \t\t\t\t ') + ' | ' + relay.devicejsConnected + '\t\t| ' + (relay.siteID ? (siteresult[relay.siteID] ? siteresult[relay.siteID].name : 'null') : 'null'));
                                        delete siteresult[relay.siteID];
                                    } catch(err) {
                                        console.log(siteresult[relay.siteID]);
                                    }
                                });
                                Object.keys(siteresult).forEach(function(id) {
                                console.log('-------------------------------- | ' + id + ' | ----------------- | ' + siteresult[id].name);
                                });
                                console.log('-----------------------------------------------------------------------------------------------------------------------');

                            }
                            // console.log("Results:", util.inspect(result, {
                            //     depth: 10
                            // }));
                        }
                        resolve();
                    }, function(err) {
                        logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                        resolve();
                    });
                    // if(cliArgz[1] && cliArgz[1].indexOf('-raw') > 0) {
                    //     console.log(JSON.stringify(result, null, 4));
                    // } else {
                    //     console.log('-------------------------------------------------------------------')
                    //     console.log('SiteID                           | Site Name');
                    //     console.log('-------------------------------------------------------------------')
                    //     Object.keys(result).forEach(function(id) {
                    //         console.log(id + ' | ' + result[id].name);
                    //     });
                    //     console.log('-------------------------------------------------------------------')
                    //     // console.log("Results:", util.inspect(result,{depth:null}));
                    // }
                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                    resolve();
                });
            break;

            /*case "getRelay":
                if(!cliArgz[1]){
                    exitWithError("Enter the relay to be searched");
                    resolve();
                    break;
                }
                DCS.getRelays().then(function(result) {
                    console.log("OK.");
                    var i = 0;
                    var found = 0;
                    for(i=0;i<result.length;i++){
                        if(cliArgz[1]===result[i].id){
                            console.log("Found Relay \n");
                            found++;
                            console.log("Results:", util.inspect(result[i], {
                            depth: 10
                            }));
                            break;
                        }
                    }
                    if(found === 0){
                        console.log("Relay not found");
                    }
                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                }).then(function() {
                    resolve();
                })
                break;*/

            case "getRelay":
                if(!cliArgz[1]){
                    exitWithError("Enter the relay to be searched");
                    resolve();
                    break;
                }
                DCS.getRelay(cliArgz[1]).then(function(result) {
                    console.log("OK.");
                    console.log(result);
                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                }).then(function() {
                    resolve();
                })
                break;

            case "modbusListResourcesInCloud":
                var selection = (cliArgz[1] && cliArgz[1] != '--id') ? cliArgz[1] : "id=*";
                DCS.getResources(program.site, selection).then(function(result) {
                    console.log("OK.");
                    var devs = [];
                    result.forEach(function(element, index, array) {
                        var type = element.type.toLowerCase();
                        if(type.indexOf('modbus') > -1) {
                            if(cliArgz[1] === '--id') {
                                devs.push(element.id)
                            } else {
                                devs.push(element);
                            }
                        }
                    })
                    console.log("Results:", JSON.stringify(devs,null,4));
                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                }).then(function() {
                    resolve();
                })
                break;

            case "bacnetListResourcesInCloud":
                var selection = (cliArgz[1] && cliArgz[1] != '--id') ? cliArgz[1] : "id=*";
                DCS.getResources(program.site, selection).then(function(result) {
                    console.log("OK.");
                    var devs = [];
                    result.forEach(function(element, index, array) {
                        var type = element.type.toLowerCase();
                        if(type.indexOf('bacnet') > -1) {
                            if(cliArgz[1] === '--id') {
                                devs.push(element.id)
                            } else {
                                devs.push(element);
                            }
                        }
                    })
                    console.log("Results:", JSON.stringify(devs,null,4));
                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                }).then(function() {
                    resolve();
                })
                break;

            case "6lowpanListResourcesInCloud":
                var selection = (cliArgz[1] && cliArgz[1] != '--id') ? cliArgz[1] : "id=*";
                DCS.getResources(program.site, selection).then(function(result) {
                    console.log("OK.");
                    var devs = [];
                    result.forEach(function(element, index, array) {
                        var type = element.type.toLowerCase();
                        if(type.indexOf('filament') > -1) {
                            if(cliArgz[1] === '--id') {
                                devs.push(element.id)
                            } else {
                                devs.push(element);
                            }
                        }
                    })
                    console.log("Results:", JSON.stringify(devs,null,4));
                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                }).then(function() {
                    resolve();
                })
                break;

            case "zigbeeListResourcesInCloud":
                var selection = (cliArgz[1] && cliArgz[1] != '--id') ? cliArgz[1] : "id=*";
                DCS.getResources(program.site, selection).then(function(result) {
                    console.log("OK.");
                    var devs = [];
                    result.forEach(function(element, index, array) {
                        var type = element.type.toLowerCase();
                        if(type.indexOf('zigbee') > -1) {
                            if(cliArgz[1] === '--id') {
                                devs.push(element.id)
                            } else {
                                devs.push(element);
                            }
                        }
                    })
                    console.log("Results:", JSON.stringify(devs,null,4));
                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                }).then(function() {
                    resolve();
                })
                break;

            case "zwaveListResourcesInCloud":
                var selection = (cliArgz[1] && cliArgz[1] != '--id') ? cliArgz[1] : "id=*";
                DCS.getResources(program.site, selection).then(function(result) {
                    console.log("OK.");
                    var devs = [];
                    result.forEach(function(element, index, array) {
                        var type = element.type.toLowerCase();
                        if(type.indexOf('zwave') > -1) {
                            if(cliArgz[1] === '--id') {
                                devs.push(element.id)
                            } else {
                                devs.push(element);
                            }
                        }
                    })
                    console.log("Results:", JSON.stringify(devs,null,4));
                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                }).then(function() {
                    resolve();
                })
                break;

            case "enoceanListResourcesInCloud":
                var selection = (cliArgz[1] && cliArgz[1] != '--id') ? cliArgz[1] : "id=*";
                DCS.getResources(program.site, selection).then(function(result) {
                    console.log("OK.");
                    var devs = [];
                    result.forEach(function(element, index, array) {
                        var type = element.type.toLowerCase();
                        if(type.indexOf('enocean') > -1) {
                            if(cliArgz[1] === '--id') {
                                devs.push(element.id)
                            } else {
                                devs.push(element);
                            }
                        }
                    })
                    console.log("Results:", JSON.stringify(devs,null,4));
                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                }).then(function() {
                    resolve();
                })
                break;

            case "listSiteResources":
                var selection = (cliArgz[1] && cliArgz[1] != '--raw') ? cliArgz[1] : "id=*";
                DCS.getResources(program.site, selection).then(function(result) {
                    // console.log("OK.");
                    if(cliArgz[1] !== '--raw' || !cliArgz[1]) {
                        var list = [];
                        console.log('---------------------------------------------');
                        console.log('Reachable | Resource');
                        console.log('---------------------------------------------');
                        result.forEach(function(element) {
                            console.log(element.reachable + '\t  | ' + element.id);
                        });
                        console.log('---------------------------------------------');
                        // console.log("Result: ", list);
                    } else {
                        console.log("Results:", JSON.stringify(result,null,4));
                    }

                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                }).then(function() {
                    resolve();
                })
            break;

            case "getControlableResourceStates":
                DCS.getDeviceData(program.site, "false").then(function(result) {
                    console.log("OK.");
                    console.log("Results:", JSON.stringify(result, null, 4));
                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                }).then(function() {
                    resolve();
                })
            break;

            case "listDevices":
                DCS.getDevices(program.site).then(function(result) {
                    // console.log("OK.");
                    if(cliArgz[1] === '--id' || !cliArgz[1]) {
                        var list = [];
                        console.log('---------------------------------------------');
                        console.log('Reachable | ResourceID | Name | Icon');
                        console.log('---------------------------------------------');
                        result.forEach(function(element) {
                            console.log(element.reachable + '\t  | ' + element.id + ' | ' + element.name + ' | ' + element.icon);
                        });
                        console.log('---------------------------------------------');
                        // console.log("Result: ", list);
                    } else {
                        console.log("Results:", JSON.stringify(result,null,4));
                    }

                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                }).then(function() {
                    resolve();
                })
            break;

            case "forgetSiteResource":
                shell.question('are you sure (yes/no)?',(answer) =>{
                    if(answer == 'yes'){
                        DCS.deleteResources(program.site, `id=\"${cliArgz[1]}\"`).then(function(result) {
                            console.log("OK.");
                            console.log("Results:", result);
                        }, function(err) {
                            logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                        }).then(function() {
                            resolve();
                        })
                    }else if(answer == 'no'){
                        console.log('\nOoops! command executed by mistake')
                        resolve()
                    }else{
                        console.log('\nreply either yes or no')
                        resolve()
                    }
                })

                break;

            case "nocache":
                program.nocache = (cliArgz[1] == 'true');
                resolve();
            break;

            case "getSiteResourceState":
                if(!cliArgz[1]) {
                    exitWithError("Enter the resourceID");
                    resolve();
                    break;
                }
                DCS.getResourceState(program.site, `id=\"${cliArgz[1]}\"`, cliArgz[2], program.nocache).then(function(result) {
                    console.log("OK.");
                    console.log("Results:", JSON.stringify(result.state, null, 4));
                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                }).then(function() {
                    resolve();
                })
                break;

            case "getAllResourceStates":
                if(cliArgz[1]) { //anything then use new way otherwise use old method. This calls the command instead of state
                    DCS.executeCommand(program.site, "id=\"DevStateManager\"", "data").then(function(result) {
                        console.log("OK.");
                        console.log("Results:", JSON.stringify(result, null, 4));
                    }, function(err) {
                        logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                    }).then(function() {
                        resolve();
                    })
                } else {
                    DCS.getDeviceData(program.site).then(function(result) {
                        console.log("OK.");
                        console.log("Results:", JSON.stringify(result, null, 4));
                    }, function(err) {
                        logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                    }).then(function() {
                        resolve();
                    })
                }
                break;

            case "getDevicesPerProtocol":
                DCS.getResourceState(program.site, "id=\"DevStateManager\"", "devicesPerProtocol", null).then(function(result) {
                    console.log("OK.");
                    console.log("Results:", JSON.stringify(result.state, null, 4));
                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                }).then(function() {
                    resolve();
                })
            break;

            case "updateDevStateManagerForDevice":
                if(!program.site){
                    exitWithError("SiteID null. Set SiteID first");
                    resolve();
                    break;
                }
                DCS.executeCommand(program.site, "id=\"DevStateManager\"", "pullDeviceState",  cliArgz[1]).then(function(resp) {
                    console.log("OK.");
                    console.log("Results: SUCCESS",util.inspect(resp,{depth:program.depth}));
                    resolve();
                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                    resolve();
                })
                break;

            case "updateSiteResourceState":
                if(!cliArgz[1]){
                    exitWithError("Device ID not mentioned").then(function(){
                    resolve();
                    });
                    break;
                }
                if(!cliArgz[2]){
                    exitWithError("State to be updated not mentioned").then(function(){
                    resolve();
                    });
                    break;
                }
                if(!cliArgz[3]){
                    exitWithError("Value to be updated not mentioned").then(function(){
                    resolve();
                    });
                    break;
                }
                var value= cliArgz[3]
                if(!isNaN(Number(cliArgz[3]))){
                    value=Number(cliArgz[3]);
                }
                if(cliArgz[3]==="true"|| cliArgz[3]==="false") {
                    value = cliArgz[3]==="true"?true:false;
                }
                var device = cliArgz[1];
                var state = cliArgz[2];
                var obj = {
                    [device]: {
                        [state]: value
                    }
                }
                // DCS.getUserByEmail(program.user).then(function(res){
                    // if(res && res.id){
                        //DCS.updateResourceState(program.site,obj).then(function(result) {
                        DCS.updateResourceStateCUIS(program.site, cliArgz[1], cliArgz[2], value, program.user).then(function(result) {
                            console.log("OK.");
                            console.log("Results: Resource state updated successfully via CUIS");
                        }, function(err) {
                            logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                        }).then(function() {
                            resolve();
                        })
                    // }
                // },function(err){
                //     logerr("Failed:to retirieve userID");
                //     resolve();
                // })

                break;

            case "createGroup":
                if (!program.site) {
                   exitWithError("siteID not defined. Run set-siteid first to set siteID").then(function() {
                        resolve();
                     })
                   break;
                }
                DCS.createGroup(program.site,cliArgz[1]).then(function(result) {
                    console.log("Results:", util.inspect(result,{depth:program.depth}));
                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                }).then(function() {
                    resolve();
                })
                break;

            case "updateGroup":
                if (!program.site) {
                   exitWithError("siteID not defined. Run set-siteid first to set siteID").then(function() {
                        resolve();
                     })
                   break;
                }
                if(cliArgz[2] !== "add" && cliArgz[2]!== "remove"){
                    console.log("Takes 3 arguments location, option, resource");
                    exitWithError("2 argument only takes add or remove only").then(function() {
                        resolve();
                     })
                   break;
                }

                if(!cliArgz[3]){
                    console.log("Takes 3 arguments location, option, resource");
                    exitWithError("add resource to be added or removed").then(function() {
                        resolve();
                     })
                   break;
                }

                DCS.updateGroup(program.site,cliArgz[1],cliArgz[2],cliArgz[3]).then(function(result) {
                    console.log("Results:", util.inspect(result,{depth:program.depth}));
                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                }).then(function() {
                    resolve();
                })
                break;

            case "deleteGroup":
                if (!program.site) {
                   exitWithError("siteID not defined. Run set-siteid first to set siteID").then(function() {
                        resolve();
                     })
                   break;
                }
                shell.question('are you sure (yes/no)?',(answer) =>{
                    if(answer == 'yes'){
                        DCS.deleteGroup(program.site,cliArgz[1]).then(function(result) {
                            console.log("Results:", util.inspect(result,{depth:program.depth}));
                        }, function(err) {
                            logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                        }).then(function() {
                            resolve();
                        })
                    }else if(answer == 'no'){
                        console.log('\nOoops! command executed by mistake')
                        resolve()
                    }else{
                        console.log('\nreply either yes or no')
                        resolve()
                    }
                })

                break;

            case "getGroup":
                if (!program.site) {
                   exitWithError("siteID not defined. Run set-siteid first to set siteID").then(function() {
                        resolve();
                     })
                   break;
                }
                DCS.getGroupWithImage(program.site,cliArgz[1] || '').then(function(result) {
                    console.log("Results:", JSON.stringify(result,null,4));
                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                }).then(function() {
                    resolve();
                })
                break;

            case "createSiteGroup":
                if (!cliArgz[1]) {
                    console.log("Takes 3 arguments groupname, option, siteID");
                    exitWithError("Enter the group name").then(function() {
                        resolve();
                    })
                   break;
                }
                if(cliArgz[2] !== "add" && cliArgz[2]!== "remove"){
                    console.log("Takes 3 arguments group name, option, siteID");
                    exitWithError("1 argument only takes add or remove only").then(function() {
                        resolve();
                     })
                   break;
                }

                if(!cliArgz[3]){
                    console.log("Takes 3 arguments group name, option, siteID");
                    exitWithError("add siteID to be added or removed from a group").then(function() {
                        resolve();
                     })
                   break;
                }

                DCS.createSiteGroup(cliArgz[1],cliArgz[2],cliArgz[3]).then(function(result) {
                    console.log("Results:", util.inspect(result,{depth:program.depth}));
                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                }).then(function() {
                    resolve();
                })
                break;

            case "getSiteGroup":
                DCS.getSiteGroup(cliArgz[1]).then(function(result) {
                    console.log("Results: ", JSON.stringify(result, null, 4));
                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                }).then(function() {
                    resolve();
                })
                break;

            case "getAllSiteGroups":
                DCS.getSiteGroup().then(function(result) {
                    console.log("Results: ", JSON.stringify(result, null, 4));
                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                }).then(function() {
                    resolve();
                })
                break;

            case "deleteSiteGroup":
                 if (!cliArgz[1]) {
                    exitWithError("Enter the group name").then(function() {
                        resolve();
                    })
                   break;
                }
                shell.question('are you sure (yes/no)?',(answer) =>{
                    if(answer == 'yes'){
                        DCS.deleteSiteGroup(cliArgz[1]).then(function(result) {
                            console.log("Results: ", util.inspect(result,{depth:program.depth}));
                        }, function(err) {
                            logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                        }).then(function() {
                            resolve();
                        })
                    }else if(answer == 'no'){
                        console.log('\nOoops! command executed by mistake')
                        resolve()
                    }else{
                        console.log('\nreply either yes or no')
                        resolve()
                    }
                })

                break;

            case  "postSchedule":
                if (!program.site) {
                   exitWithError("siteID not defined. Run set-siteid first to set siteID").then(function() {
                        resolve();
                     })
                   break;
                }
                if (cliArgz.length < 2) {
                    exitWithError(cmd, "takes 1 arguments i.e. JSON string").then(function() {
                        resolve();
                    })
                    break;
                }
                var obj = undefined;
                try {
                    obj = JSON.parse(cliArgz[1])
                } catch (e) {
                    exitWithError("Not valid JSON - Need valid JSON object as  argument:", e).then(function() {
                        resolve();
                    });
                    break;
                }
                if (typeof obj != "object") {
                    exitWithError("Need a JSON object as argument.").then(function() {
                        resolve();
                    });
                    break;
                }
                if (!obj.activated || !obj.name || !obj.span || !obj.priority) {
                    exitWithError("Failed: Enter Mandatory Parameters:", "activated", "name", "span", "priority").then(function() {
                        resolve();
                    })
                    break;
                }

                DCS.postSchedule(program.site, obj).then(function(res) {
                    console.log("OK");
                    console.log("Results: " + JSON.stringify(res));
                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err)
                }).then(function() {
                    resolve();
                })
                break;

            case "getSchedules":
                DCS.getSchedules(program.site).then(function(result) {
                    console.log("OK.");
                    console.log("Results:", JSON.stringify(result, null, 4));
                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                }).then(function() {
                    resolve();
                })
                break;

            case "getaSchedule":
                DCS.getASchedule(program.site, cliArgz[1]).then(function(result) {
                    console.log("OK.");
                    console.log("Results:", util.inspect(result,{depth:program.depth}));
                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                }).then(function() {
                    resolve();
                })
                break;

            case "putSchedule":
                if (cliArgz.length < 3) {
                    exitWithError(cmd, "takes 2 arguments  scheduleid, JSON string").then(function() {
                        resolve();
                    })
                    break;
                }
                var obj = undefined;
                try {
                    obj = JSON.parse(cliArgz[2])
                } catch (e) {
                    exitWithError("Not valid JSON - Need valid JSON object as second argument:", e).then(function() {
                        resolve();
                    });
                    break;
                }
                if (typeof obj != "object") {
                    exitWithError("Need a JSON object as second argument.").then(function() {
                        resolve();
                    });
                    break;
                }
                if (!obj.activated || !obj.name || !obj.span || !obj.priority) {
                    exitWithError("Failed: Enter Mandatory Parameters:", "activated", "name", "span", "priority").then(function() {
                        resolve();
                    })
                    break;
                }
                DCS.putSchedule(program.site, cliArgz[1], obj).then(function(res) {
                    console.log("OK");
                    console.log("Results: Schedule Updated");
                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err)
                }).then(function() {
                    resolve();
                })
                break;

            case "deleteSchedule":
                shell.question('are you sure (yes/no)?',(answer) =>{
                    if(answer == 'yes'){
                        DCS.deleteSchedule(program.site, cliArgz[1]).then(function(result) {
                            console.log("OK.");
                            console.log("Results:", util.inspect(result,{depth:program.depth}));
                        }, function(err) {
                            logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                        }).then(function() {
                            resolve();
                        })
                    }else if(answer == 'no'){
                        console.log('\nOoops! command executed by mistake')
                        resolve()
                    }else{
                        console.log('\nreply either yes or no')
                        resolve()
                    }
                })

                break;

            case "deleteSchedulesAll":
                DCS.getSchedules(program.site).then(function(result) {
                    console.log("OK.");
                    console.log("Results:", util.inspect(result,{depth:program.depth}));
                    if(Object.keys(result).length>0){
                        var scheduleid = Object.keys(result);
                        var c = Object.keys(result).length;
                        var i=0;
                        for(;i<c;){
                            DCS.deleteSchedule(program.site, scheduleid[i]).then(function(result) {
                            console.log("OK.");
                            console.log("Results: Deleted ");
                            }, function(err) {
                            logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                            })
                            i++;
                        }
                        /*if(i === c){
                            resolve();
                        }*/
                    }else{
                        console.log("There is no schedule to delete");
                        resolve();
                    }
                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                    resolve();
                })
            break;

            case "executeSiteResourceCommand":
                if(!cliArgz[1]){
                    exitWithError("DeviceID format [id=\"deviceId\"]not mentioned").then(function(){
                    resolve();
                    });
                    break;
                }
                if(!cliArgz[2]){
                    exitWithError("Command not mentioned").then(function(){
                    resolve();
                    });
                    break;
                }
                value= cliArgz[3]
                if(value){
                    if(value.indexOf(",")!==-1){
                    value = value.substring(0,(value.indexOf(",")))
                    }
                    if(!isNaN(Number(cliArgz[3]))){
                        value=Number(cliArgz[3]);
                    }
                    if(cliArgz[3]==="true"|| cliArgz[3]==="false") {
                        value = cliArgz[3]==="true"? true:false;
                    }
                }
                DCS.executeCommand(program.site, cliArgz[1], cliArgz[2], [value]).then(function(resp) {
                    console.log("OK.");
                    console.log("Results: SUCCESS",util.inspect(resp,{depth:program.depth}));
                    resolve();
                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                    resolve();
                })
                break;

            case "getDiagnostics":

                DCS.getDiagnosticsCUIS(program.site).then(function(result) {
                    console.log("OK.");
                    if(result && result.metadata && result.metadata.lastUpdated) {
                        console.log(chalk.yellow("Last Updated: " + result.metadata.lastUpdated));
                    }
                    if(result && result.System)
                        delete result.System.Processes
                    console.log("Results:", JSON.stringify(result, null, 4));
                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                }).then(function() {
                    resolve();
                })
                // var startTime = Date.now();
                // DCS.executeCommand(program.site, "id=\"RelayStats\"", "diagnostics", cliArgz[1]).then(function(resp) {
                //     // console.log("OK.");
                //     var endTime = Date.now();
                //     console.log('Round trip time ', (endTime - startTime)/1000);
                //     console.log("Results:", JSON.stringify(resp, null, 4));
                //     resolve();
                // }, function(err) {
                //     logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                //     resolve();
                // })
                break;

            case "VirtualDeviceStopPeriodicEvents":
                DCS.executeCommand(program.site, "id=\"VirtualDeviceDriver\"","stopPeriodicStateChange", null).then(function(resp) {
                    console.log("OK.");
                    console.log("Results:",util.inspect(resp,{depth:program.depth}));
                    resolve();
                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                    resolve();
                })
                break;

            case "VirtualDeviceLogLevel":
                console.log('This command will generate periodic events for all the registered Virtual Devices');
                DCS.executeCommand(program.site, "id=\"VirtualDeviceDriver\"" ,"logLevel", parseInt(cliArgz[1])).then(function(resp) {
                    console.log("OK.");
                    console.log("Results:",util.inspect(resp,{depth:program.depth}));
                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                }).then(function(){
                    resolve();
                })
                break;

            case "VirtualDeviceGeneratePeriodicEvents":
                console.log('This command will generate periodic events for all the registered Virtual Devices');
                DCS.executeCommand(program.site, "id=\"VirtualDeviceDriver\"" ,"startPeriodicStateChange", null).then(function(resp) {
                    console.log("OK.")
                    console.log("Results:",util.inspect(resp,{depth:program.depth}));
                    resolve();
                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                    resolve();
                })
                break;

            case "VirtualDeviceTemplateslist":
                DCS.getResourceState(program.site, "id=\"VirtualDeviceDriver\"", "templates", null).then(function(resp) {
                    console.log("OK.")
                    console.log("Results:", JSON.stringify(resp.state, null, 4));
                    resolve();

                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                    resolve();
                })
                break;

            case "VirtualDeviceCreate":
                    var obj = {
                        "VirtualDeviceDriver": {
                            "create": cliArgz[1]
                        }
                    }
                    DCS.executeCommand(program.site, "id=\"VirtualDeviceDriver\"" , "create", cliArgz[1]).then(function(resp) {
                        console.log("OK.")
                        console.log("Results:",util.inspect(resp,{depth:program.depth}));
                    }, function(err) {
                        logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);

                    }).then(function(){
                        resolve();
                    })

                break;

            case "VirtualDeviceList":
                DCS.getResourceState(program.site, "id=\"VirtualDeviceDriver\"" , "devices", null).then(function(resp) {
                    console.log("OK.")
                    console.log("Results:",JSON.stringify(resp.state, null, 4));
                    }, function(err) {
                        logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);

                    }).then(function(){
                        resolve();
                    })
                break;

            case "VirtualDeviceProgress":
                DCS.getResourceState(program.site, "id=\"VirtualDeviceDriver\"" , "progress", null).then(function(resp) {
                    console.log("OK.")
                    console.log("Results:", JSON.stringify(resp.state, null, 4));
                    }, function(err) {
                        logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);

                    }).then(function(){
                        resolve();
                    })
                break;

            case "VirtualDeviceStop":
                var obj = {
                    "VirtualDeviceDriver": {
                        "stop": cliArgz[1]
                    }
                }
                DCS.updateResourceState(program.site, obj).then(function(resp) {
                    console.log("OK.")
                    console.log("Results:",util.inspect(resp,{depth:program.depth}));
                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                }).then(function(){
                    resolve();
                })
                break;

            case "VirtualDeviceDelete":
                shell.question('are you sure (yes/no)?',(answer) =>{
                    if(answer == 'yes'){
                        var obj = {
                            "VirtualDeviceDriver": {
                                "delete": cliArgz[1]
                            }
                        }
                        DCS.updateResourceState(program.site, obj).then(function(resp) {
                            console.log("OK.")
                            console.log("Results:",util.inspect(resp,{depth:program.depth}));
                        }, function(err) {
                            logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                        }).then(function(){
                            resolve();
                        })
                    }else if(answer == 'no'){
                        console.log('\nOoops! command executed by mistake')
                        resolve()
                    }else{
                        console.log('\nreply either yes or no')
                        resolve()
                    }
                })

                break;

            case "VirtualDeviceDeleteAll":
                shell.question('are you sure (yes/no)?',(answer) =>{
                    if(answer == 'yes'){
                        var obj = {
                            "VirtualDeviceDriver": {
                                "deleteAll": null
                            }
                        }
                        DCS.updateResourceState(program.site, obj).then(function(resp) {
                            console.log("OK.");
                            console.log("Results:",util.inspect(resp,{depth:program.depth}));

                        }, function(err) {
                            logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                        }).then(function(){
                            resolve();
                        })
                    }else if(answer == 'no'){
                        console.log('\nOoops! command executed by mistake')
                    }else{
                        console.log('\nreply either yes or no')
                    }
                })
            break;

            case "VirtualDeviceUpdate":
                if(!cliArgz[1]) {
                    exitWithError("Enter the resourceID");
                    resolve();
                    break;
                }
                DCS.executeCommand(program.site,`id=\"${cliArgz[1]}\"`, "emit", cliArgz[2]).then(function(resp) {
                    console.log("OK.");
                    console.log("Results:",util.inspect(resp,{depth:program.depth}));

                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                }).then(function(){
                    resolve();
                });
            break;

            case "zigbeeStartPairing":
                if(!program.site){
                    exitWithError("SiteID null. Set SiteID first");
                    resolve();
                    break;
                }
                DCS.executeCommand(program.site, "id=\"ZigbeeHA/DevicePairer\"", "addDevice", 60).then(function(resp) {
                    console.log("OK.")
                    console.log("Results:",util.inspect(resp,{depth:program.depth}));
                    resolve();
                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                    resolve();
                })
                break;

            case "zwaveRemoveDevice":
                if(!program.site){
                    exitWithError("SiteID null. Set SiteID first");
                    resolve();
                    break;
                }
                shell.question('are you sure (yes/no) ?', (answer) => {
                    if(answer == 'yes'){
                        DCS.executeCommand(program.site,"id=\"Zwave/DevicePairer\"", "removeDevice",  null).then(function(resp) {
                            console.log("OK.")
                            console.log("Results:",util.inspect(resp,{depth:program.depth}));
                            resolve();
                        }, function(err) {
                            logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                            resolve();
                        })
                    }else if(answer == 'no'){
                        console.log('\noops! command executed by mistake')
                        resolve()
                    }else{
                        console.log("\nreply either yes or no")
                        resolve()
                    }
                })

                break;

            case "6lowpanStartPairing":
                if(!program.site){
                    exitWithError("SiteID null. Set SiteID first");
                    resolve();
                    break;
                }
                if(!cliArgz[1]){
                    exitWithError("Provide Filament ID");
                    resolve();
                    break;
                }
                if(!cliArgz[2]) {
                    exitWithError("Provide Filament AES Key");
                    resolve();
                    break;
                }
                DCS.executeCommand(program.site,"id=\"WigWag/DevicePairer\"", "startPairingProcess",  [cliArgz[1], cliArgz[2]]).then(function(resp) {
                    console.log("OK.")
                    console.log("Results:",util.inspect(resp,{depth:program.depth}));
                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                }).then(function(){
                    resolve();
                })
                break;

            case "6lowpanRemoveDevice":
                if(!program.site){
                    exitWithError("SiteID null. Set SiteID first");
                    resolve();
                    break;
                }
                if(!cliArgz[1]){
                    exitWithError("Provide Filament ID");
                    resolve();
                    break;
                }
                DCS.executeCommand(program.site,"id=\"WigWag/DevicePairer\"", "startUnpairingProcess",  cliArgz[1]).then(function(resp) {
                    console.log("OK.")
                    console.log("Results:",util.inspect(resp,{depth:program.depth}));
                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                }).then(function(){
                    resolve();
                })
                break;

            case "getCameraIP":
                if(!cliArgz[1]){
                    exitWithError("Usage: getCameraIP <resourceID>");
                    resolve();
                    break;
                }
                DCS.executeCommand(program.site,`id=\"${cliArgz[1]}\"`, "getCameraIP",  null).then(function(resp) {
                    console.log("OK.")
                    console.log("Results:",util.inspect(resp,{depth:program.depth}));
                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                    //resolve();
                }).then(function(){
                    resolve();
                })
            break;

            case "zwaveStartPairing":
                if(!program.site){
                    exitWithError("SiteID null. Set SiteID first");
                    resolve();
                    break;
                }
                DCS.executeCommand(program.site,"id=\"Zwave/DevicePairer\"", "addDevice",  null).then(function(resp) {
                    console.log("OK.")
                    console.log("Results:",util.inspect(resp,{depth:program.depth}));
                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                    //resolve();
                }).then(function(){
                    resolve();
                })
                break;

            case "renameDevice":
                if(!program.site){
                    exitWithError("SiteID null. Set SiteID first");
                    resolve();
                    break;
                }
                if(cliArgz.length < 3) {
                    console.log("Usage: renameDevice [resourceID] [Name]\n Example: renameDevice VirtualThermostat1 'Kitchen Thermostat'");
                    console.log("Use command- 'getAllDeviceNames' to check if the name is saved correctly.")
                    return resolve();
                }
                DCS.executeCommand(program.site,"id=\"DevStateManager\"", "saveDeviceName", [cliArgz[1], cliArgz[2]]).then(function(resp) {
                    console.log("OK.")
                    console.log("Results:",util.inspect(resp,{depth:program.depth}));
                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                }).then(function(){
                    resolve();
                })
                break;

            case "getAllDeviceNames":
                if(!program.site){
                    exitWithError("SiteID null. Set SiteID first");
                    resolve();
                    break;
                }
                DCS.executeCommand(program.site,"id=\"DevStateManager\"", "getAllDeviceNames",  null).then(function(resp) {
                    console.log("OK.")
                    console.log("Results: SUCCESS",util.inspect(resp,{depth:program.depth}));
                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                }).then(function(){
                    resolve();
                })
                break;

            case "bacnetActivityLog":
                if(!program.site){
                    exitWithError("SiteID null. Set SiteID first");
                    resolve();
                    break;
                }
                DCS.executeCommand(program.site,"id=\"BacnetDriver\"", "activityLog",null).then(function(resp) {
                    console.log("OK.")
                    console.log("Results: SUCCESS",util.inspect(resp,{depth:program.depth}));
                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                }).then(function(){
                    resolve();
                })

                break;

            case "bacnetApplyRecipe":
                if(!cliArgz[1]) {
                    exitWithError('Usage: bacnetApplyRecipe deviceId');
                    resolve();
                    break;
                }
                var obj = {
                    "BacnetDriver": {
                        "applyRecipe": {
                            deviceId: cliArgz[1]
                        }
                    }
                }
                DCS.updateResourceState(program.site, obj).then(function(resp) {
                    console.log("OK.")
                    console.log("Results: SUCCESS",util.inspect(resp,{depth:program.depth}));
                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                }).then(function(){
                    resolve();
                })
                break;

            case "bacnetGetAllDeviceStates":
                if(!program.site){
                    exitWithError("SiteID null. Set SiteID first");
                    resolve();
                    break;
                }
                DCS.executeCommand(program.site,"id=\"BacnetDriver\"", "getAllDeviceStates",  null).then(function(resp) {
                   console.log("OK.")
                    console.log("Results: SUCCESS",util.inspect(resp,{depth:program.depth}));
                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                }).then(function(){
                    resolve();
                })
                break;

            case "bacnetSendWhoIs":
                if(!program.site){
                    exitWithError("SiteID null. Set SiteID first");
                    resolve();
                    break;
                }
                DCS.executeCommand(program.site,"id=\"BacnetDriver\"", "whoIs",  null).then(function(resp) {
                    console.log("OK.")
                    console.log("Results: SUCCESS",util.inspect(resp,{depth:program.depth}));
                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                }).then(function(){
                    resolve();
                })
                break;

            case "bacnetDeleteAll":
                if(!program.site){
                    exitWithError("SiteID null. Set SiteID first");
                    resolve();
                    break;
                }
                shell.question('are you sure(yes/no) ?', (answer) =>{
                    if(answer == 'yes'){
                        console.log('\n')
                        DCS.executeCommand(program.site,"id=\"BacnetDriver\"", "deleteAll",  null).then(function(resp) {
                            console.log("OK.")
                            console.log("Results: SUCCESS",util.inspect(resp,{depth:program.depth}));
                        }, function(err) {
                            logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                        }).then(function(){
                            resolve();
                        })
                    }else if(answer == 'no'){
                        console.log('\nOops! command executed by mistake')
                        resolve()
                    }else{
                        console.log('\nreply either yes or no')
                        resolve()
                    }
                })

                break;

            case "bacnetStartAll":
                if(!program.site){
                    exitWithError("SiteID null. Set SiteID first");
                    resolve();
                    break;
                }
                DCS.executeCommand(program.site,"id=\"BacnetDriver\"", "startAll",  null).then(function(resp) {
                    console.log("OK.")
                    console.log("Results: SUCCESS",util.inspect(resp,{depth:program.depth}));
                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                }).then(function(){
                    resolve();
                })
                break;

            case "bacnetGetHealth":
                if(!program.site){
                    exitWithError("SiteID null. Set SiteID first");
                    resolve();
                    break;
                }
                DCS.executeCommand(program.site,"id=\"BacnetDriver\"", "stats",  null).then(function(resp) {
                    console.log("OK.")
                    console.log("Results: SUCCESS",util.inspect(resp,{depth:program.depth}));
                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                }).then(function(){
                    resolve();
                })
                break;


            case "bacnetNativeLogLevel":
                if(!program.site){
                    exitWithError("SiteID null. Set SiteID first");
                    resolve();
                    break;
                }
                DCS.executeCommand(program.site,"id=\"BacnetDriver\"", "nativeLogLevel",  null).then(function(resp) {
                    console.log("OK.")
                    console.log("Results: SUCCESS",util.inspect(resp,{depth:program.depth}));
                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                }).then(function(){
                    resolve();
                })
                break;

            case "bacnetLogLevel":
                if(!program.site){
                    exitWithError("SiteID null. Set SiteID first");
                    resolve();
                    break;
                }
                DCS.executeCommand(program.site,"id=\"BacnetDriver\"", "logLevel",  null).then(function(resp) {
                    console.log("OK.")
                    console.log("Results: SUCCESS",util.inspect(resp,{depth:program.depth}));
                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                }).then(function(){
                    resolve();
                })
                break;

            case "bacnetGetRecipes":
                if(!program.site){
                    exitWithError("SiteID null. Set SiteID first");
                    resolve();
                    break;
                }
                DCS.executeCommand(program.site,"id=\"BacnetDriver\"", "getRecipes",  null).then(function(resp) {
                    console.log("OK.")
                    console.log("Results: SUCCESS",util.inspect(resp,{depth:program.depth}));
                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                }).then(function(){
                    resolve();
                })
                break;

            case "bacnetDeleteRecipes":
                if(!program.site){
                    exitWithError("SiteID null. Set SiteID first");
                    resolve();
                    break;
                }
                shell.question('are you sure (yes/no)?',(answer) =>{
                    if(answer == 'yes'){
                        DCS.executeCommand(program.site,"id=\"BacnetDriver\"", "deleteAllRecipes",  null).then(function(resp) {
                            console.log("OK.")
                            console.log("Results: SUCCESS",util.inspect(resp,{depth:program.depth}));
                        }, function(err) {
                            logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                        }).then(function(){
                            resolve();
                        })
                    }else if(answer == 'no'){
                        console.log('\nOoops! command executed by mistake')
                        resolve()
                    }else{
                        console.log('\nreply either yes or no')
                        resolve()
                    }
                })

                break;

            case "bacnetSaveRecipe":
                if(!program.site){
                    exitWithError("SiteID null. Set SiteID first");
                    resolve();
                    break;
                }

                var recipefilepath = cliArgz[1];
                if(arg) {
                    if(arg.indexOf(",")!==-1){
                    arg = arg.substring(0,(arg.indexOf(",")))
                    }
                }

                var deviceRecipe = fs.readFileSync(recipefilepath, 'utf8');
                console.log('deviceRecipe ', deviceRecipe);
                try {
                    deviceRecipe = JSON.stringify(JSON.parse(jsonminify(deviceRecipe)));
                } catch(e) {
                    console.log('Error ', e);
                    exitWithError('Failed to parse JSON- ' + e);
                    resolve();
                    break;
                }
                console.log(deviceRecipe);
                DCS.executeCommand(program.site,"id=\"BacnetDriver\"", "saveRecipe",  null).then(function(resp) {
                    console.log("OK.")
                    console.log("Results: SUCCESS",util.inspect(resp,{depth:program.depth}));
                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                }).then(function(){
                    resolve();
                })
            break;

            case "bacnetListDevices":
                if(!program.site){
                    exitWithError("SiteID null. Set SiteID first");
                    resolve();
                    break;
                }

                DCS.executeCommand(program.site, "id=\"BacnetDriver\"", "devices").then(function(resp) {
                    console.log("OK.");
                    console.log("Results: SUCCESS",util.inspect(resp,{depth:program.depth}));
                    resolve();
                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                    resolve();
                });
                break;

            case "bacnetStartPortal":
                if(!program.site){
                    exitWithError("SiteID null. Set SiteID first");
                    resolve();
                    break;
                }
                DCS.executeCommand(program.site,"id=\"BacnetDriver\"", "startBacportal",  null).then(function(resp) {
                    console.log("OK.")
                    console.log("Results: SUCCESS",util.inspect(resp,{depth:program.depth}));
                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                }).then(function(){
                    resolve();
                })
                break;

            case "bacnetWhoHas":
                if(!program.site){
                    exitWithError("SiteID null. Set SiteID first");
                    resolve();
                    break;
                }
                if(cliArgz.length < 3) {
                    console.log("Usage: bacnetWhoHas [ObjectType] [ObjectInstance]\n Example: bacnetWhoHas 4 1");
                    return resolve();
                }
                DCS.executeCommand(program.site,"id=\"BacnetDriver\"", "whoHas",  [cliArgz[1], cliArgz[2]]).then(function(resp) {
                   console.log("OK.")
                    console.log("Results: SUCCESS",util.inspect(resp,{depth:program.depth}));
                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                }).then(function(){
                    resolve();
                })
                break;

            case "bacnetReadProperty":
                if(!program.site){
                    exitWithError("SiteID null. Set SiteID first");
                    resolve();
                    break;
                }
                if(cliArgz.length < 5) {
                    console.log("Usage: bacnetReadProperty [DeviceId] [ObjectType] [ObjectInstance] [ObjectProperty]");
                    return resolve();
                }
                DCS.executeCommand(program.site,"id=\"BacnetDriver\"", "readProperty", [cliArgz[1], cliArgz[2], cliArgz[3], cliArgz[4]]).then(function(resp) {
                    console.log("OK.")
                    console.log("Results: SUCCESS",util.inspect(resp,{depth:program.depth}));
                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                }).then(function(){
                    resolve();
                })

                break;

            case "bacnetWriteProperty":
                if(!program.site){
                    exitWithError("SiteID null. Set SiteID first");
                    resolve();
                    break;
                }
                if(cliArgz.length < 9) {
                    console.log("Usage: bacnetWriteProperty [DeviceId] [ObjectType] [ObjectInstance] [ObjectProperty] [PropertyIndex (use 0xFFFFFFFF)] [DataType] [Priority] [Value]");
                    return resolve();
                }
                DCS.executeCommand(program.site,"id=\"BacnetDriver\"", "writeProperty", [cliArgz[1], cliArgz[2], cliArgz[3], cliArgz[4],cliArgz[5], cliArgz[6], cliArgz[7], cliArgz[8]]).then(function(resp) {
                    console.log("OK.")
                    console.log("Results: SUCCESS",util.inspect(resp,{depth:program.depth}));
                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                }).then(function(){
                    resolve();
                })

                break;

            case "bacnetRelinquishAll":
                if(!program.site){
                    exitWithError("SiteID null. Set SiteID first");
                    resolve();
                    break;
                }
                if(cliArgz.length < 4) {
                    console.log("Usage: bacnetRelinquishAll [Interface/Facade] [Priority] [ReliniquishDefaultTextValue] \n Example: bacnetRelinquishAll Facades/Switchable 8 off");
                    return resolve();
                }
                DCS.executeCommand(program.site,"id=\"BacnetDriver\"", "relinquishAll", [cliArgz[1], parseInt(cliArgz[2]), cliArgz[3]]).then(function(resp) {
                    console.log("OK.")
                    console.log("Results: SUCCESS",util.inspect(resp,{depth:program.depth}));
                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                }).then(function(){
                    resolve();
                })

                break;

            case "bacnetSetPriority":
                if(!program.site){
                    exitWithError("SiteID null. Set SiteID first");
                    resolve();
                    break;
                }
                if(cliArgz.length < 2) {
                    console.log("Usage: bacnetSetPriority 8");
                    return resolve();
                }
                DCS.executeCommand(program.site,"id=\"BacnetDriver\"", "setPriority", [parseInt(cliArgz[1])]).then(function(resp) {
                    console.log("OK.")
                    console.log("Results: SUCCESS",util.inspect(resp,{depth:program.depth}));
                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                }).then(function(){
                    resolve();
                })

                break;

            case "bacnetRelinquishDefault":
                if(!program.site){
                    exitWithError("SiteID null. Set SiteID first");
                    resolve();
                    break;
                }
                if(cliArgz.length < 2) {
                    console.log("Usage: bacnetRelinquishDefault [Interface/Facade]\n Example: bacnetRelinquishDefault Facades/Switchable");
                    return resolve();
                }
                DCS.executeCommand(program.site,"id=\"BacnetDriver\"", "relinquishDefaults",  [cliArgz[1]]).then(function(resp) {
                    console.log("OK.")
                    console.log("Results: SUCCESS",util.inspect(resp,{depth:program.depth}));
                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                }).then(function(){
                    resolve();
                })
                break;

            case "bacnetPriorityArray":
                if(!program.site){
                    exitWithError("SiteID null. Set SiteID first");
                    resolve();
                    break;
                }
                if(cliArgz.length < 2) {
                    console.log("Usage: bacnetPriorityArray [Interface/Facade]\n Example: bacnetPriorityArray Facades/Switchable");
                    return resolve();
                }
                DCS.executeCommand(program.site,"id=\"BacnetDriver\"", "priorityArrays", [cliArgz[1]]).then(function(resp) {
                    console.log("OK.")
                    console.log("Results: SUCCESS",util.inspect(resp,{depth:program.depth}));
                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                }).then(function(){
                    resolve();
                })

                break;

            // case "bacnetDeleteAll":
            //     if(!program.site){
            //         exitWithError("SiteID null. Set SiteID first");
            //         resolve();
            //         break;
            //     }
            //     DCS.executeCommand(program.site,"id=\"BacnetDriver\"", "deleteAll", "call", null, null, null,useAccountsSubpath,program.account,program.site).then(function(resp) {
            //         console.log("OK.")
            //         var c = 0;
            //         var inter = setInterval(function() {

            //             DCS.getRequestStatus(resp.id).then(function(resp1){
            //                 if(c!=1) {
            //                     console.log(resp1.state);

            //                 if(resp1.state === "complete"){
            //                     c++;
            //                     clearInterval(inter);

            //                     if (c==1){
            //                         DCS.getCreateVirtualDevicerequestresponse(resp1.id).then(function(resp1) {
            //                             console.log("OK.");
            //                             console.log("Results: SUCCESS",util.inspect(resp1,{depth:program.depth}));
            //                         }, function(err) {
            //                             logerr("Failed: doAPI_getCreateVirtualDevicerequestresponse ", err);
            //                         }).then(function() {
            //                             resolve();
            //                         });
            //                     }
            //                 }}
            //             },function(err){
            //                logerr("Failed: doAPI_getrequeststatus ", err);
            //             })
            //         },500);
            //     }, function(err) {
            //         logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
            //         resolve();
            //     })
            //     break;


            case "devStateManagerLogLevel":
                if(!program.site){
                    exitWithError("SiteID null. Set SiteID first");
                    resolve();
                    break;
                }
                DCS.executeCommand(program.site,"id=\"DevSateManager\"", "logLevel",  parseInt(cliArgz[1])).then(function(resp) {
                    console.log("OK.")
                    console.log("Results: SUCCESS",util.inspect(resp,{depth:program.depth}));
                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                }).then(function(){
                    resolve();
                })

                break;

            case "saveDevState":
                if(!program.site){
                    exitWithError("SiteID null. Set SiteID first");
                    resolve();
                    break;
                }
                DCS.executeCommand(program.site,"id=\"DevSateManager\"", "saveDevState", [cliArgz[1], cliArgz[2], cliArgz[3], cliArgz[4]]).then(function(resp) {
                    console.log("OK.")
                    console.log("Results: SUCCESS",util.inspect(resp,{depth:program.depth}));
                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                }).then(function(){
                    resolve();
                })
                break;

            case "playtone":
                if(!program.site){
                    exitWithError("SiteID null. Set SiteID first");
                    resolve();
                    break;
                }

                if(!cliArgz[1] || (typeof parseInt(cliArgz[1]) !== 'number')) {
                    exitWithError('Usage: playtone <playtone_index>');
                    resolve();
                    break;
                }

                // var arg= cliArgz[1]
                // if(arg) {
                //     if(arg.indexOf(",")!==-1){
                //     arg = arg.substring(0,(arg.indexOf(",")))
                //     }
                // }
                // console.log('sending arg ', arg);

                var obj = {
                    "LEDDriver": {
                        "piezo": parseInt(cliArgz[1])
                    }
                }
                DCS.updateResourceState(program.site, obj).then(function(resp) {
                // DCS.(program.site,"id=\"LEDDriver\"", "piezo",  parseInt(cliArgz[1])).then(function(resp) {
                    console.log("OK.")
                    console.log("Results: SUCCESS",util.inspect(resp,{depth:program.depth}));
                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                }).then(function(){
                    resolve();
                })
                break;

            case "findGateway":
            case "locateGateway":
            case "locate":
                if(!program.site){
                    exitWithError("SiteID null. Set SiteID first");
                    resolve();
                    break;
                }

                // var arg= cliArgz[1]
                // if(arg) {
                //     if(arg.indexOf(",")!==-1){
                //     arg = arg.substring(0,(arg.indexOf(",")))
                //     }
                // }
                // console.log('sending arg ', arg);

                var obj = {
                    "LEDDriver": {
                        "find": null
                    }
                }
                DCS.updateResourceState(program.site, obj).then(function(resp) {
                // DCS.(program.site,"id=\"LEDDriver\"", "piezo",  parseInt(cliArgz[1])).then(function(resp) {
                    console.log("OK.")
                    console.log("Results: SUCCESS",util.inspect(resp,{depth:program.depth}));
                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                }).then(function(){
                    resolve();
                })

            break;

            case "led":
                if(!program.site){
                    exitWithError("SiteID null. Set SiteID first");
                    resolve();
                    break;
                }

                // var arg= cliArgz[1]
                // if(arg) {
                //     if(arg.indexOf(",")!==-1){
                //     arg = arg.substring(0,(arg.indexOf(",")))
                //     }
                // }
                // console.log('sending arg ', arg);
                var obj = {
                    "LEDDriver": {
                        "led": {
                            r: parseInt(cliArgz[1]),
                            g: parseInt(cliArgz[2]),
                            b: parseInt(cliArgz[3])
                        }
                    }
                }
                DCS.updateResourceState(program.site, obj).then(function(resp) {
                    console.log("OK.")
                    console.log("Results: SUCCESS",util.inspect(resp,{depth:program.depth}));
                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                }).then(function(){
                    resolve();
                })
                break;

            case "getAccountsExt":
                DCS.getAccounts(cliArgz[1]).then(function(result) {
                    var finalOut = "";
                    console.log("OK. Looking up accounts user info...");
                    // console.log("Results:",result);
                    var proms = [];
                    for (var n = 0; n < result.length; n++) {
                        proms.push((function(n) {
                            logdbg("getting users for account:", result[n].id)
                            return DCS.getAccountInfoAsRoot(result[n].id).then(function(r) {
                                finalOut += "" + result[n].id + " -- " + result[n].name + " -- " + util.inspect(r) + "\n";
                            }, function(err) {
                                logerr("Error getting user for account:", result[n].id, err);
                            });
                        })(n))
                    }
                    Promise.all(proms).then(function() {
                        console.log("OUT:\n" + finalOut);
                    }, function(err) {
                        logerr("Error in final:", err)
                    }).catch(function(e) {
                        logerr("Catch in final:", err)
                    }).then(function() {
                        resolve();
                    })
                }, function(err) {
                    logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                    resolve();
                });
                break;

            case "inviteUser":
                if(!cliArgz[1]) {
                    exitWithError("Usage: inviteUser [email_of_new_user]");
                    resolve();
                }
                DCS.getUserByEmail(program.user).then(function(resp) {
                    if(resp && resp.id) {
                        DCS.inviteUser(resp.id, cliArgz[1], program.user).then(function() {
                            console.log('Invitation sent successfully');
                            resolve();
                        }, function(err) {
                            logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                            resolve();
                        });
                    } else {
                        logerr("Failed to retrieve user id of logged in user- ", program.user);
                        resolve();
                    }
                });
            break;

            case "createUserAccessRule":
                /**
             * createUserAccessRule [email-address-of-user-who-needs-rule] [JSON-object] [account-id]
             */
                // if (!program.account) {
                //     exitWithError(cmd, "requires an account: -a [account ID]").then(function() {
                //         resolve();
                //     })
                //     break;
                // }
                /*if(inShell===true){
                    exitWithError(chalk.red("This command cannot be executed in the shell"));
                    resolve();
                    break;
                }*/

                /*if(!cliArgz[1]&&!cliArgz[2]) {
                    var emailid = readlineSync.question('Enter the userId you want to give account_admin or root permission to? ')
                    cliArgz[1]= emailid;
                    cliArgz[2] = readlineSync.question('Enter the kind of permission  account_admin or root ? ');
                    cliArgz.length =3;
                }*/

                /*console.log(cliArgz[1]+"   "+ cliArgz[2]);
                console .log(cliArgz.length);
                console.log(cliArgz[0]);*/
                var email;
                var permission;               //In original code cliArgz[1],cliArgz[2] is replaced by email,permission
                EnterEmail().then((result)=>{
                    email = result;
                    //console.log(cliArgz);
                }).then(function(){
                    EnterPermission().then(function(result2){
                        permission = result2;
                        //console.log(cliArgz);
                        //cliArgz.length = 3;
                   // }).then(function(){
                        /*if (cliArgz.length < 3) {
                            exitWithError(cmd, "takes 2 arguments").then(function() {
                                resolve();
                            })
                            break;
                        }*/
                        //console.log(cliArgz);
                        var obj = undefined;
                        try {
                            //obj = {permissions:[cliArgz[2]]};
                            obj = {permissions:[permission]};
                        } catch (e) {
                            exitWithError("kind of permission  account_admin or root", e).then(function() {
                                resolve();
                            });
                            //break;
                        }
                        if (typeof obj != "object") {
                            exitWithError("obj is not a valid JSON object ").then(function() {
                                resolve();
                            });
                            //break;
                        }

                        if (!obj.attributes) obj.attributes = {};
                        if (obj.enabled == undefined) obj.enabled = true;
                        //              obj.accountID = program.account;
                        obj.id = "enterpriseToolsCli";

                        DCS.getUserByEmail(email).then(function(res){
                            //console.log(res);
                            if(res && res.id) {

                                logdbg("  Found user",email,"userid:",res.id);
                                var userid = res.id;

                                // if(cliArgz[3]) { // an account ID was provided as an arg...
                                //     obj.accountID = cliArgz[3];
                                //     DCS.postUserAccessRule(userid,obj).then(function(){
                                //         console.log("Access rule added successfully.");
                                //         //resolve();
                                //     },function(err){
                                //         logerr("Error in final (postUserAccessRule):",err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err)
                                //     }).catch(function(e){
                                //         logerr("Catch in final (postUserAccessRule):",err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err)
                                //     })
                                    /*.then(function(){
                                        resolve();
                                    });*/
                                // } else {
                                    // DCS.getUsersAccounts(res.id).then(function(res){
                                    //     logdbg("   ...results:",util.inspect(res,{depth:program.depth}));
                                    //     if(res && util.isArray(res) && res.length > 0) {
                                            // if(res.length < 2) {
                                            //     obj.accountID = res[0].id;
                                            //     DCS.postUserAccessRule(userid,obj).then(function(){
                                            //         console.log("Access rule added successfully.");
                                            //         //resolve();
                                            //     },function(err){
                                            //         logerr("Error in final (postUserAccessRule):",err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err)
                                            //     }).catch(function(e){
                                            //         logerr("Catch in final (postUserAccessRule):",err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err)
                                            //     }).then(function(){
                                            //         resolve();
                                            //     });

                                            // } else {
                                                // console.log("User",email,"has multiple account. State one as third parameter. Accounts:");
                                                // console.log("Account Name                             | Id")
                                                // for(var n=0;n<res.length;n++) {
                                                //     console.log(res[n].name,"|",res[n].id)
                                                // }
                                                question("\nEnter the account ID ").then(function(account){
                                                    obj.accountID = account
                                                    DCS.postUserAccessRule(userid,obj).then(function(){
                                                    console.log("Access rule added successfully.");
                                                    //resolve();
                                                    },function(err){
                                                        logerr("Error in final (postUserAccessRule):",err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err)
                                                    }).catch(function(e){
                                                        logerr("Catch in final (postUserAccessRule):",err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err)
                                                    }).then(function(){
                                                        resolve();
                                                    })
                                                },function(err){
                                                    logerr(("AccountID entered null"));
                                                    resolve();
                                                })
                                            // }
                                        // } else {
                                        //     exitWithError("Malformed result from API for getUsersAccounts()").then(function(){
                                        //         resolve();
                                        //     });
                                        // }
                                        //resolve();
                                    // },function(err){
                                    //     logerr("Error in final (postUserAccessRule):",err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err)
                                    //     resolve();
                                    // }).catch(function(e){
                                    //     logerr("Catch in final (postUserAccessRule):",err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err)
                                    //     resolve();
                                    // })
                                    /*.then(function(){
                                        resolve();
                                    });*/
                                // }

                            } else {
                                exitWithError("Could not find user:"+cliArgz[1]).then(function(){
                                    resolve();
                                });
                            }
                        })
                    })/*.then(function(){
                        resolve();
                    })*/
                })
                break;

            case "getUserAccessRules":
                if(!cliArgz[1]){
                    console.log("Usage: getUserAccessRule [userID] \n Example: getUserAccessRule 252515265416565526 ");
                    return resolve();
                }
                DCS.getUserAccessRule(cliArgz[1],cliArgz[2]).then(function(resp){
                    console.log("OK.")
                    console.log("Result:"+JSON.stringify(resp,null,4));
                },function(err){
                    console.log("Error : ",err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err)
                }).then(function(){
                    resolve();
                })
                break;

            case "getaUserAccessRule":
                if(!cliArgz[1]||!cliArgz[2]){
                    console.log("Usage: getUserAccessRule [userID] [ruleID] \n Example: getaUserAccessRule 252515265416565526 545245214abc");
                    return resolve();
                }
                DCS.getaAccessRule(cliArgz[1],cliArgz[2]).then(function(resp){
                    console.log("OK.")
                    console.log("Result:"+JSON.stringify(resp,null,4));
                },function(err){
                    console.log("Error : ",err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err)
                }).then(function(){
                    resolve();
                })
                break;

            case "deleteUserAccessRule":
                if(!cliArgz[1]||!cliArgz[2]){
                    console.log("Usage: deleteUserAccessRule [userID] [ruleID] \n Example: deleteUserAccessRule 252515265416565526 545245214abc");
                    return resolve();
                }
                DCS.deleteUserAccessRule(cliArgz[1],cliArgz[2]).then(function(resp){
                    console.log("OK.")
                    console.log("Result: Rule successfully deleted");
                },function(err){
                    console.log("Error : ",err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err)
                }).then(function(){
                    resolve();
                })
                break;

            case "putImage":
                var path = cliArgz[1];
                var json = cliArgz[2];
                jsonParse(json).then(function(obj) {
                    DCS.putImage(path, obj).then(function(res) {
                        console.log("OK. Done. Upload is here:", program.cloud + res)
                        resolve();
                    }).catch(function(err) {
                        logerr("Failed. Error:", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                        resolve();
                    });
                }).catch(function(err) {
                    console.log("Invalid JSON as second param.", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                    resolve();
                });
                break;

            case "createApp":
                var appname = cliArgz[1];
                var apptype = cliArgz[2];
                DCS.putApp(appname, apptype).then(function(res) {
                    console.log("OK. Created.")
                    resolve();
                }).catch(function(err) {
                    logerr("Failed. Error:", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                    resolve();
                });
                break
            case "listApps":
                DCS.getApps().then(function(res) {
                    console.log("OK.", util.inspect(res, {
                        depth: program.depth
                    }))
                    resolve();
                }).catch(function(err) {
                    logerr("Failed. Error:", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                    resolve();
                });
                break;
            case "publishApp":
                var appname = cliArgz[1];
                var version = cliArgz[2];
                var imageDefJson = cliArgz[3];
                var description = cliArgz[4];
                var apptype = cliArgz[5];

                jsonParse(imageDefJson).then(function(obj) {
                    DCS.putPublishApp(appname, version, obj, description, apptype).then(function(res) {
                        console.log("OK. Published", util.inspect(res, {
                            depth: program.depth
                        }))
                        resolve();
                    }).catch(function(err) {
                        logerr("Failed. Error:", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                        resolve();
                    });
                }).catch(function(err) {
                    console.log("Invalid JSON as third param.", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                    resolve();
                });
                break;
            case "getImage":
                var imagename = cliArgz[1];
                var outpath = cliArgz[2];
                DCS.getImage(imagename, outpath).then(function(res) {
                    console.log("OK. Downloaded to:", res);
                    resolve();
                }).catch(function(err) {
                    logerr("Failed. Error:", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                    resolve();
                });
                break;
            case "createRelayConfig":
                var configDefJson = cliArgz[1];
                jsonParse(configDefJson).then(function(obj){
                    DCS.postRelayConfiguration(obj).then(function(res){
                        console.log("OK. Configuration created. id =",res.id)
                        resolve();
                    }).catch(function(err){
                        logerr("Failed. Error:",err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                        resolve();
                    });
                }).catch(function(e){
                    console.log("Invalid JSON as third param.",e);
                    resolve();
                });
                break;
            case "applyRelayConfig":
                var name = cliArgz[1];
                var relays = cliArgz[2];
                var configId = cliArgz[3];
                var params = cliArgz[4];

                if (typeof relays == 'string') {
                    relays = [relays]
                }

                var do_api = function() {
                    var opDef = {
                        type: "upgrade",
                        parameters: {}
                    }
                    if(params && typeof params == 'object') {
                        opDef.parameters = params;
                    }
                    opDef.parameters.configurationID = configId;
                    DCS.postRelayTasks(name,opDef,relays).then(function(res){
//                      opDef.type = "update";
                        console.log("OK. Submitted. Task ID is",res.id);
                        resolve();
                    }).catch(function(err){
                        logerr("Failed. Error:",err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                        resolve();
                    });
                }
                if (params) {
                    jsonParse(params).then(function(obj){
                        params = obj;
                        do_api();
                    }).catch(function(err){
                        console.log("Invalid JSON as third param.",err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                        resolve();
                    });
                } else {
                    do_api();
                }
                break;
            case "listRelayConfigs":
                DCS.getRelayConfigurations().then(function(res) {
                    console.log("Ok.", util.inspect(result, {
                        depth: program.depth
                    }));
                    resolve();
                }).catch(function(e) {
                    logerr("Failed. Error:", e);
                    if (e.stack) console.log("Stack:", e.stack)
                    resolve();
                });
                break;
            case "getRelayTask":
                var taskid = cliArgz[1];

                DCS.getRelayTask(taskid).then(function(res) {
                    console.log("Ok.", util.inspect(res, {
                        depth: program.depth
                    }));
                    resolve();
                }).catch(function(e) {
                    logerr("Failed. Error:", e);
                    if (e.stack) console.log("Stack:", e.stack)
                    resolve();

                })
                break;
            case "importRelay":
                var relayID = cliArgz[1];
                var pairingcode = cliArgz[2];
                if (relayID && pairingcode) {
                    DCS.importRelay(relayID,pairingcode).then(function(res) {
                        console.log(res);
                        resolve();
                    }).catch(function(e) {
                        if(e.statusCode == 500){
                            console.log(chalk.bold("500: This relay mighty be already imported "+relayID));
                            resolve();
                        }else{
                           if(e.statusCode == 403){
                                console.log("Login as root to import relays. This account does not have root permission ")
                           }
                           console.log(chalk.bold("Failed. Error:" + "Invalid response: " + e.statusCode + " --> " + e.statusMessage+" for relayID "+relayID));
                           resolve();
                        }
                        //logerr("Failed. Error:"+"Invalid response: " + e.statusCode + " --> " + e.statusMessage);

                    })
                } else {
                    console.log("Usage: importRelay [relayID] [pairing code]");
                    resolve();
                }
                break;

/*            case "importRelays":
                if(cliArgz[1]) {
                    if(! fs.existsSync(cliArgz[1])) {
                        //FilePath doesn't exists
                        logerr("File not found");
                        resolve();
                    } else {
                        //Get array of relays from the file
                        var relays = JSON.parse(fs.readFileSync(cliArgz[1], 'utf8'));
                        console.log("OK.");
                        var p = [];
                        var res = {};
                        relays.forEach(function(relay) {
                            var relayID = relay.relayID;
                            var pairingcode = relay.pairingCode;
                            if (relayID && pairingcode) {
                                p.push(DCS.importRelay(relayID, pairingcode).then(function(resp) {
                                    res = relayID + " : " + resp;
                                }, function(e) {
                                    if(e.statusCode == 500) {
                                        res = relayID + " : " + "The relay is already imported.";
                                    }
                                    logerr("Failed. Error:" + "Invalid response: " + e.statusCode + " --> " + e.statusMessage);
                                }).then(function() {
                                    return new Promise(function(resolve, reject) {
                                        resolve(res);
                                    });
                                }));
                            }
                        });
                        Promise.all(p).then(function(result) {
                            console.log("Results:\n" + JSON.stringify(result, null, 4));
                            resolve();
                        }, function(err) {
                            console.log("Error is - " + err);
                            resolve();
                        });
                    }
                } else {    //filePath not passed
                    console.log("Usage: importRelays [filePath]\n\t\tfilePath must be valid");
                    resolve();
                }
                break;*/

            case "importRelays":
                if(cliArgz[1]) {
                    if(! fs.existsSync(cliArgz[1])) {
                        //FilePath doesn't exists
                        logerr("File not found");
                        resolve();
                    } else {
                        var p =[]
                        filename = cliArgz[1];
                        if(filename.indexOf('.csv')>=0){
                            try{
                                lineReader.eachLine(filename, function(line, last) {
                                    var line=line.trimLeft();
                                    var line=line.trimRight();
                                    line = line.split(',');
                                    var relayID = line[0];
                                    var pairingcode = line[1];
                                    p.push(
                                    DCS.importRelay(relayID, pairingcode).then(function(resp){
                                        console.log(resp + "-" + relayID);
                                    },function(e){
                                        if(e.statusCode == 500){
                                            console.log(chalk.bold("500: This relay mighty be already imported "+relayID));
                                        }else{
                                           if(e.statusCode == 403){
                                                console.log("Login as root to import relays. This account does not have root permission ")
                                           }
                                           console.log(chalk.bold("Failed. Error:" + "Invalid response: " + e.statusCode + " --> " + e.statusMessage+" for relayID "+relayID));
                                        }
                                    }))
                                    if(last){
                                        Promise.all(p).then(function(){
                                            resolve();
                                        })
                                    }
                                })
                            } catch(e){
                                exitWithError("Error: ",e);
                                resolve();
                            }

                        }else{
                            try{
                                var relays = JSON.parse(fs.readFileSync(cliArgz[1], 'utf8'));
                                console.log("OK.");
                                var p = [];
                                var res = {};
                                relays.forEach(function(relay) {
                                    var relayID = relay.relayID;
                                    var pairingcode = relay.pairingCode;
                                    if (relayID && pairingcode) {
                                        p.push(DCS.importRelay(relayID, pairingcode).then(function(resp) {
                                            res = relayID + " : " + resp;
                                        }, function(e) {
                                            if(e.statusCode == 500) {
                                                res = relayID + " : " + "The relay is already imported.";
                                            }
                                            logerr("Failed. Error:" + "Invalid response: " + e.statusCode + " --> " + e.statusMessage);
                                        }).then(function() {
                                            return new Promise(function(resolve, reject) {
                                                resolve(res);
                                            });
                                        }));
                                    }
                                });
                                Promise.all(p).then(function(result) {
                                    console.log("Results:\n" + JSON.stringify(result, null, 4));
                                    resolve();
                                }, function(err) {
                                    console.log("Error is - " + err);
                                    resolve();
                                });
                            }catch(e){
                                exitWithError("Error: ",e);
                                resolve();
                            }
                        }
                    }
                } else {    //filePath not passed
                    console.log("Usage: importRelays [filePath]\n\t\tfilePath must be valid");
                    resolve();
                }
                break;

            case "updateRelay":
                var relayID = cliArgz[1];
                var latitude = parseInt(cliArgz[2]);
                var longitude = parseInt(cliArgz[3]);
                if(!relayID && !latitude && !longitude){
                    exitWithError("Enter relayID latitude and longitude")
                    resolve()
                }else{
                    var obj = {
                        "coordinates": {
                            "latitude": latitude,
                            "longitude": longitude
                        }
                    }
                    DCS.patchRelays(relayID, obj, null).then(function(resp){
                        console.log("OK. relay updated")
                        resolve()
                    }).catch(function(err){
                        logerr("Failed. Error:", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                        resolve();
                    })
                }
            break;

            case "uploadEnrollmentID":
                if(program.cloud.indexOf('mbed') === -1) {
                    exitWithError("This command only works aganist mbed integration cloud!");
                    resolve();
                    break;
                }
                if(!cliArgz[1]) {
                    exitWithError('Usage: uploadEnrollmentID <enrollment_identity>');
                    exitWithError("Example: uploadEnrollmentID 'A-35:e7:72:8a:07:50:3b:3d:75:96:57:52:72:41:0d:78:cc:c6:e5:53:48:c6:65:58:5b:fa:af:4d:2d:73:95:c5'")
                    resolve();
                    break;
                }
                DCS.uploadEnrollmentID(cliArgz[1]).then(function(resp) {
                    console.log('OK. Response ', resp);
                    resolve();
                }, function(err) {
                    logerr("Failed. Error:", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                    resolve();
                })
            break;

            case "moveRelayToAccount":
                var relayID = cliArgz[1];
                var accountID = cliArgz[2];
                var pairingcode = cliArgz[3];
                if (relayID && accountID && pairingcode) {
                    var obj = {
                        accountID: accountID
                    }
                    DCS.patchRelays(relayID, obj, pairingcode).then(function(res) {
                        console.log("OK. Moved.");
                        resolve();
                    }).catch(function(err) {
                        logerr("Failed. Error:", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                        resolve();
                    })
                } else {
                    console.log("Usage: moveRelayToAccount [relayID] [accountID] [pairing code]")
                    resolve();
                }
                break;
            case "moveRelayToSite":
                var relayID = cliArgz[1];
                var siteID = cliArgz[2];
                var pairingcode = cliArgz[3];
                if (relayID && siteID && pairingcode) {
                    var obj = {
                        siteID: siteID
                    }
                    DCS.patchRelays(relayID, obj, pairingcode).then(function(res) {
                        console.log("OK. Moved.");
                        resolve();
                    }).catch(function(err) {
                        logerr("Failed. Error:", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                        resolve();
                    })
                } else {
                    console.log("Usage: moveRelayToSite [relayID] [siteID] [pairing code]")
                    resolve();
                }
                break;

            case "showHistory":
                var historyOutput = '';
                var dumpStdout = function(s) {
                    historyOutput += JSON.stringify(s, null, 4);
                    // console.log(historyOutput);
                }
                var historyOpts = {
                    format: null,
                    pagenated: false,
                    // limit: number of records to be returned, max=100
                    sortOrder: 'desc',
                    // choice: 1 or 2 -- need to know what this is
                    // id: source or relayID
                    // downrange: timestamp
                    // uprange: timestamp
                    maxPages: 100
                }
                DCS.getHistory(dumpStdout, program.site, historyOpts).then(function(res) {
                    console.log("", res, "events returned.");
                    console.log("Output saved to history.out file");
                    logdbg("Done.")
                    fs.writeFileSync('./history.out', historyOutput);
                }, function(err) {
                    logerr("Error in final (getHistory):", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err)
                }).catch(function(e) {
                    logerr("Catch in final (getHistory):", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err)
                }).then(function() {
                    resolve();
                })

            break;

//             case "getHistory":
//                 if(inShell===true){
//                     exitWithError(chalk.red("This command cannot be executed in the shell. Run using commandline"));
//                     resolve();
//                     break;
//                 }
//                 var siteID = cliArgz[1];
//                 if (!siteID|| siteID === "null"){ siteID = program.site; cliArgz[1]=program.site;}
//                 if (!siteID) {
//                     exitWithError(cmd, "requires argument with siteID - or siteID must be set on command line.").then(function() {
//                         resolve();
//                     });
//                     break;
//                 }
//                 var format = cliArgz[2];
//                 var dumpStdout = function(s) {
//                     console.log(s);
//                 }
//                 var pagenated =cliArgz[3];
//                 if(!pagenated){
//                     pagenated =false;
//                 }
//                 var ans=[];
//                 ans[0]=readlineSync.question("Enter the limit to form to enhance readability ");
//                 //if(!ans[0]){ans[0]=50;}

//                 ans[1] = readlineSync.question("Enter the order in which you want the result.asc(ascending order) or desc (descending order) ")
//                 /*if(!ans[1]){
//                     ans[1]="asc";
//                 }*/
//                 console.log(chalk.yellow("1. timestamp based queries use the 'source’, 'maxAge’, ‘afterTime’ and ‘beforeTime’ parameters together"));
//                 console.log(chalk.yellow("2. serial number based queries use the 'minSerial’, 'maxSerial’, and ‘relayid’ parameters together"));
//                 ans[2]=readlineSync.question("Enter choice(number) to get history:- 1. Bysource(timestamp based queries) 2.ByrelayID(serial number based queries) ");
//                 if(ans[2]==='1'){
//                     console.log(" Polling history using sourceID ")
//                     ans[3]= readlineSync.question("Enter DeviceID ");
//                     if(ans[3]){
//                         console.log("Query by 1. maxAge or 2. afterTime & beforeTime ");
//                         var choice = readlineSync.question("Enter choice no. 1 or 2 ");
//                         if(choice === '1'){
//                             ans[4]=readlineSync.question("Enter the maximum age of returned events in milliseconds ");
//                         }
//                         else if(choice === '2'){
//                             console.log("ISO 8601 pattern yyyy-mm-ddThh:mm:ss.sZ");
//                             ans[4]=readlineSync.question("Enter the timestamp representing the earliest timestamp that returned events can have in ISO 8601 format ");
//                             ans[5]=readlineSync.question("Enter the timestamp representing the latest timestamp that returned events can have in ISO 8601 format ");
//                         }
//                         else{
//                             exitWithError("Try again using valid choice");
//                             resolve();
//                             break;
//                         }
//                     }
//                 }
//                 else if(ans[2]==='2'){
//                     console.log(" Polling history using relayID(serial number based queries)")
//                     ans[3]=readlineSync.question("Enter the relay ID from which the events originated ")
//                     if(ans[3]){
//                         ans[4]= readlineSync.question("Enter the minimum serial number of returned events. Defaults to 0 ");
//                         if(!ans[4]){ans[4]=0;}
//                         //ans[5]=readlineSync.question("The maximum serial number of returned events ")
//                     }
//                 }
//                 var sliced = [];
//                 for (var i=0; i<cliArgz.length; i++)
//                 sliced[i] = cliArgz[i];
//                 //console.log(sliced);
//                 var apiArgs = [dumpStdout,siteID, format, pagenated];
//                 apiArgs = apiArgs.concat(ans)
//                 /*if (cliArgz.length > 3) {
//                     var options = sliced.slice(3)
//                     apiArgs = apiArgs.concat(options)
//                 }*/
//                 /*apiArgs.unshift(DCS._metricOut);
//                 apiArgs.unshift(DCS._toApiUri);
//                 apiArgs.unshift(authedRequest);
//                 apiArgs.unshift(useAccountsSubpath);
//                 apiArgs.unshift(DCS._metricIn);
//                 apiArgs.unshift(DCS.cleanupCSVText);
//                 apiArgs.unshift(DCS.cleanupCSVJson);*/
//                 //apiArgs.unshift(program.account);
//                 //apiArgs.unshift(useAccountsSubpath);
// //                DCS.getHistory.apply(null, apiArgs).then(function(res) {
//                 DCS.getHistory.apply(DCS, apiArgs).then(function(res) {
//                     console.log("", res, "events returned.");
//                     logdbg("Done.")
//                 }, function(err) {
//                     logerr("Error in final (getHistory):", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err)
//                 }).catch(function(e) {
//                     logerr("Catch in final (getHistory):", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err)
//                 }).then(function() {
//                     resolve();
//                 })
//                 //function(siteID,format,dataCB /** options....*/ ) {
//                 break;

            case "removeRelayFromAccount":
                if(!program.account){
                    exitWithError("Please enter -a [accountID] which has admin authorization");
                    resolve();
                }

                if(!cliArgz[1]){
                    console.log("Usage: removeRelayFromAccount [relayID] [pairingcode{optional}]\n Example: removeRelayFromAccount WLDR0000 WICJ2KYMTNCMTF760E6Z2GPXS");
                    exitWithError("Please enter Relay ID");
                    return resolve();
                }

                DCS.removeRelayFromAccount(cliArgz[1],cliArgz[2], null, null).then(function(response){
                    console.log("Result:",response);
                    logdbg("Done.")
                    DCS.getRelays().then(function(response1){
                    //console.log("Result:",JSON.stringify(response1));
                    console.log("Results:", util.inspect(response1, {
                                    depth: 10
                                }));
                    logdbg("Done.")
                    return resolve();
                    },function(err){
                    console.log("getRelays is not working",err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                    return resolve();
                    })
                },function(err){
                    console.log("removeRelayFromAccount is not working",err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                    logerr("removeRelayFromAccount is not working",err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                    return resolve();
                })
                break;

            case "moveRelayToAnotherSite":

                var rel = []
                var pair = []

                if(!program.account){
                    exitWithError("Please enter -a [accountID] which has admin authorization");
                    resolve();
                }
                shell.question(' Please Enter RelayID: ',(relayID) => {
                    //console.log(relayID)
                    DCS.getRelays().then(function(relayResp) {
                        relayResp.forEach(function(resp) {
                            rel.push(resp.id)
                            pair.push(resp.pairingCode)
                        })
                        if(rel.includes(relayID) === false) {
                            exitWithError("Relay Id is not exist in this account");
                            resolve();
                        }
                        shell.question('Please Enter Pairing Code: ', (pairingcode) => {
                            if(pair.includes(pairingcode) === false) {
                                exitWithError("Pairing Code is not valid");
                                resolve();
                            }
                            shell.question('Please Enter Where The Relay Current In: ', (currentSite) => {
                                shell.question('Please Enter New site Id: ', (newSite) => {
                                    DCS.getSites().then(function(resp) {
                                        if(Object.keys(resp).includes(currentSite) === false) {
                                            exitWithError("Current Site is Not Exists");
                                            resolve();
                                        }
                                        if(Object.keys(resp).includes(newSite) === false) {
                                            exitWithError("New Site is Not Exists");
                                            resolve();
                                        }
                                        var obj = {
                                            accountID: program.account,
                                            siteID: newSite
                                        }
                                        //console.log(relayID + ' ' + pairingcode + ' ' + currentSite + ' '+ newSite)
                                        DCS.patchRelays(relayID, obj, pairingcode).then(function(res1) {
                                            console.log(`Relay moved from ${currentSite} to ${newSite} site`)
                                            resolve()
                                        }, function(err) {
                                            console.log(err)
                                        })
                                    }, function(err) {
                                        console.log(err)
                                    })
                                })
                            })
                        })
                    }, function(err) {
                        console.log(err)
                    })
                },function(err){
                    console.log(err)
                })
            break;

            case "bindRelayToExistingSite":
                 /*if(inShell===true){
                    exitWithError(chalk.red("This command cannot be executed in the shell"));
                    resolve();
                    break;
                }*/
                var relayID;
                var pairingcode;
                var sitename;

                inputflag = true;
                if(!program.account){
                    exitWithError("Please enter -a [accountID] which has admin authorization");
                    resolve();
                }

                EnterRelayID("Enter RelayID").then(function(resp){
                    relayID = resp;
                    //console.log(resp)
                },function(err){
                    console.log("RelayID is null")
                    //resolve();
                }).then(()=>{
                    EnterPairingCode().then(function(resp){
                        pairingcode =resp;
                        //console.log(resp)
                    },function(err){
                        console.log("pairingCode is null ")
                    }).then(()=>{
                        EnterSitename().then(function(resp1){
                            sitename = resp1;
                            //console.log(resp1);
                        }).then(()=> {
                            var siteID;
                            var occupiedsites=[]
                            var name=[]
                            var emptysites=[]
                            DCS.getRelays().then(function(response){
                                for(var i=0;i<response.length;i++)
                                {
                                    occupiedsites[i]=response[i].siteID;
                                }
                                //console.log(occupiedsites);
                            }).then(function(){
                                DCS.getSites().then(function(response){
                                 var sites=[]

                                 sites=Object.keys(response);
                                 sites.forEach(function(s){
                                    if(occupiedsites.indexOf(s)<0){
                                        emptysites.push(s);
                                        name.push(response[s].name);
                                    }
                                 })
                                 if(emptysites[0]==undefined) {
                                    logerr(chalk.red("No empty sites thus have to create new site. Please run the command bindRelayToSite"));
                                    resolve();
                                 } else {
                                     var p = new Promise(function(resolve,reject) {
                                        if(program.site){
                                            if(emptysites.indexOf(program.site)>=0) {
                                                siteID=program.site;
                                                resolve();
                                            } else {
                                                console.log("The site entered is not an empty site");
                                                console.log("Relay unoccupied Sites:");
                                                console.log("No."+"|   "+"        SiteID       "+"          |       "+"Name     ");
                                                for(var s =0;s<emptysites.length;s++){
                                                    console.log(s+"  : "+ emptysites[s]+"   "+name[s]);
                                                }
                                                EnterNumber().then((resp)=>{
                                                    siteID=emptysites[resp];
                                                    //console.log(siteID);
                                                    if(!siteID){
                                                    exitWithError(chalk.red("Enter valid siteID index. siteID is null "));
                                                    reject();
                                                    }
                                                    if(siteID===program.site){
                                                    exitWithError(chalk.red("Enter valid siteID index. siteID  is occupied "));
                                                    reject();
                                                    }else{
                                                        resolve();
                                                    }

                                                },function(err){
                                                    exitWithError(chalk.red("Enter valid siteID index "));
                                                    reject();
                                                })
                                                //siteID=emptysites[numb];
                                                /*if(siteID===program.site){
                                                    exitWithError(chalk.red("Enter valid siteID index. siteID  is occupied "));
                                                    resolve();
                                                }*/
                                                /*if(!siteID){
                                                    exitWithError(chalk.red("Enter valid siteID index. siteID is null "));
                                                    resolve();
                                                }*/
                                            }
                                        }else{
                                            console.log("Relay unoccupied Sites:");
                                            for(var s =0;s<emptysites.length;s++){
                                                console.log(s+" : "+ emptysites[s])
                                            }
                                            // var numb=readlineSync.question("Enter the empty siteID index(number) you want the relay to be moved ");
                                            // siteID=emptysites[numb];
                                            /*if(!siteID){
                                                exitWithError(chalk.red("Enter valid siteID index. siteID is null "));
                                                resolve();
                                            }*/
                                            EnterNumber().then((resp)=>{
                                                siteID=emptysites[resp];
                                                console.log(siteID);
                                                resolve();
                                            },function(err){
                                                exitWithError(chalk.red("Enter valid siteID index "));
                                                reject();
                                            })
                                        }
                                    });

                                     p.then(function(){
                                        if(emptysites && siteID){
                                            var obj = {
                                            accountID: program.account
                                            }
                                            DCS.patchRelays(relayID, obj, pairingcode).then(function(res) {
                                                console.log("Relay moved to account "+program.account+" successfully");
                                            }, function(err) {
                                                exitWithError("Failed. Error:",err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                                                resolve();
                                                return Promise.reject('error');
                                            }).then(function(){
                                                var obj = {
                                                    siteID: siteID
                                                }
                                                DCS.patchRelays(relayID, obj, pairingcode).then(function(res){
                                                    console.log("Relay moved to site "+siteID+" successfully ");
                                                    console.log(chalk.yellow("Reboot relay for these changes to take in effect "));
                                                }).catch(function(err){
                                                    logerr("Failed. Error:",err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                                                    return Promise.reject('error');
                                                    resolve();
                                                }).then (function(){
                                                     DCS.updateSite(siteID,"true",sitename).then(function(result) {
                                                        console.log("Site name is updated");
                                                    }, function(err) {
                                                        logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                                                        return Promise.reject('error');
                                                        resolve();
                                                    })
                                                }).then(function(){
                                                    DCS.getRelay(relayID).then(function(result) {
                                                    console.log("Results:", util.inspect(result, {
                                                        //depth: 2
                                                    }));
                                                    }, function(err) {
                                                        logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                                                        return Promise.reject('error');
                                                    }).then(function() {
                                                        inputflag = false;
                                                        resolve();
                                                    })
                                                })
                                            }, function(err) {
                                                inputflag = false;
                                                // console.log('Got error ', err);
                                            })
                                        }else{
                                           exitWithError(chalk.red("No empty sites thus have to create new site. Please run the command bindRelayToSite"));
                                           inputflag = false;
                                           resolve();
                                        }
                                     },function(err){
                                        inputflag = false;
                                        resolve();
                                     })
                                    }
                                })
                            })
                        });
                    });
                });
                break;


            // case "bindRelayToSite":
            //     if(inShell===true){
            //         exitWithError(chalk.red("This command cannot be executed in the shell"));
            //         resolve();
            //         break;
            //     }

            //     console.log(chalk.blue("Reminder: This command cannot be executed in shell"));
            //     if(!program.account){
            //         exitWithError("Please enter -a [accountID] which has admin authorization");
            //         resolve();
            //     }

            //     var sitename;
            //     if(!program.relayid || !program.pairingcode ){
            //         console.log(chalk.yellow("Relay ID and Pairing Code not entered in command"));
            //         do{
            //             var relayID = readlineSync.question('Enter Relay ID ');
            //             var pairingcode = readlineSync.question('Enter Pairing Code of Relay ');

            //         }while(!relayID||!pairingcode);

            //         //exitWithError("Enter in this format: bindRelayToSite -R[relayid] -P[pairingcode]");
            //     }else{
            //         var relayID = program.relayid;
            //         var pairingcode= program.pairingcode;

            //     }

            //     if(!program.sitename){
            //         var sitename = readlineSync.question('Enter the site name ');

            //     }else{
            //         var sitename = program.sitename;
            //     }
            //     //console.log(sitename);
            //     var siteID;

            //    /* DCS.importRelay(relayID,pairingcode).then(function(res) {
            //         console.log(res);
            //         //resolve();
            //     }).catch(function(e) {
            //         //console.log(e);
            //         if(e.statusCode === 500){
            //             console.log(chalk.bold("Got 500"));
            //             console.log("This relay might already exist in the cloud");
            //         }else{
            //             exitWithError("Failed. Error:"+"Invalid response: " + e.statusCode + " --> " + e.statusMessage);
            //             resolve();
            //         }

            //     }).then(function(){*/

            //     DCS.postSite().then(function(result) {
            //         console.log("Site created with id:", util.inspect(result.id,{depth:program.depth}));
            //         siteID = result.id;
            //      }, function(err) {
            //         exitWithError("Failed: ", err).then(function(){resolve();});
            //     }).then(function(){
            //         var obj = {
            //             accountID: program.account
            //         }
            //         DCS.patchRelays(relayID, obj, pairingcode).then(function(res) {
            //             console.log("Relay moved to account "+program.account+" successfully");
            //         }).catch(function(e) {
            //         // logerr("Failed. Error:",e);
            //             DCS.deleteSite(siteID).then(function(result) {
            //                 exitWithError("Thus " +siteID+" site is successfully deleted");
            //             }, function(err) {
            //                 console.log("site ID deletion Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
            //                 resolve();
            //             })
            //         }).then(function(){
            //             var obj = {
            //                 siteID: siteID
            //             }
            //             DCS.patchRelays(relayID, obj, pairingcode).then(function(res){
            //                 console.log("Relay moved to site "+siteID+" successfully ");
            //                 console.log(chalk.yellow("Reboot relay for these changes to take in effect."));
            //             }).catch(function(e){
            //                 logerr("Failed. Error:",e);
            //                 resolve();
            //             }).then (function(){
            //                  DCS.updateSite(siteID,"true",sitename).then(function(result) {
            //                     console.log("Site name is updated");
            //                 }, function(err) {
            //                     logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
            //                     resolve();
            //                 })
            //             }).then(function(){
            //                 DCS.getRelay(relayID).then(function(result) {
            //                     console.log("Results:", util.inspect(result, {
            //                         depth: 10
            //                     }));
            //                 }, function(err) {
            //                     logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
            //                 }).then(function() {
            //                     resolve();
            //                 })
            //             })
            //         })
            //     })

            //     //})
            //     break;


                case "bindRelayToSite":

                if(!program.account){
                    exitWithError("Please enter -a [accountID] which has admin authorization");
                    resolve();
                }

                var relayID;
                var pairingcode;
                var sitename;

                inputflag = true;
                if(!program.account){
                    exitWithError("Please enter -a [accountID] which has admin authorization");
                    resolve();
                }

                EnterRelayID("Enter RelayID").then(function(resp){
                    relayID = resp;
                    //console.log(resp)
                },function(err){
                    console.log("RelayID is null")
                    //resolve();
                }).then(()=>{
                    EnterPairingCode().then(function(resp){
                        pairingcode =resp;
                        //console.log(resp)
                    },function(err){
                        console.log("pairingCode is null ")
                    }).then(()=>{
                        EnterSitename().then(function(resp1){
                            sitename = resp1;
                            //console.log(resp1);
                        }).then(()=> {
                            inputflag = false;
                            var siteID;
                            DCS.postSite().then(function(result) {
                                console.log("Site created with id:", util.inspect(result.id,{depth:program.depth}));
                                siteID = result.id;
                             }, function(err) {
                                exitWithError("Failed: ", err).then(function(){return Promise.reject('error');resolve();});
                            }).then(function(){
                                var obj = {
                                    accountID: program.account
                                }
                                //console.log(pairingcode);
                                DCS.patchRelays(relayID, obj, pairingcode).then(function(res) {
                                    console.log("Relay moved to account "+program.account+" successfully");
                                }).catch(function(e) {
                                    logerr("Failed. Error:",e);
                                    DCS.deleteSite(siteID).then(function(result) {
                                        exitWithError("Thus " +siteID+" site is successfully deleted");
                                    }, function(err) {
                                        console.log("site ID deletion Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                                        //return Promise.reject('error');
                                        resolve();
                                    }).then(()=>{resolve();})
                                    return Promise.reject('error');
                                }).then(function(){
                                    var obj = {
                                        siteID: siteID
                                    }
                                    DCS.patchRelays(relayID, obj, pairingcode).then(function(res){
                                        console.log("Relay moved to site "+siteID+" successfully ");
                                        console.log(chalk.yellow("Reboot relay for these changes to take in effect."));
                                    }).catch(function(e){
                                        logerr("Failed. Error:",e);
                                        return Promise.reject('error');
                                        resolve();
                                    },function(err){
                                        inputflag = false;
                                    }).then (
                                         DCS.updateSite(siteID,"true",sitename).then(function(result) {
                                            console.log("Site name is updated");
                                        }, function(err) {
                                            logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                                            return Promise.reject('error');
                                            resolve();
                                        })).then(function(){
                                        DCS.getRelay(relayID).then(function(result) {
                                            console.log("Results:", util.inspect(result, {
                                                depth: 10
                                            }));
                                            console.log("Done successfully");
                                        }, function(err) {
                                            logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                                            //return Promise.reject('error');
                                        }).then(function() {
                                            inputflag = false;
                                            //console.log("I am here");
                                            resolve();
                                        })
                                    })
                                },function(err){
                                    inputflag = false;
                                })
                            },function(err){
                                inputflag = false;
                            })
                        },function(err){
                            inputflag = false;
                        })

                    })
                });
                //})
                break;


                case "subscribeToEvents":
                    if(!program.site || !program.account){
                        exitWithError("Run set-siteid command first")
                        break;
                    }
                    if(ws !== null) {
                        ws.close()
                    }
                    var url = program.cloud;
                    if(program.cloud.indexOf('mbed') > -1) url += "/wigwag";
                    url += '/api';
                    if(program.useAccountsSubpath && program.account) {
                         url += "/accounts/"+ program.account;
                    }
                    url += '/events'
                    console.log('using url ', url);
                    try{
                        ws = new WebSocket(url,{ headers:{
                            'Authorization': 'Bearer ' + access.access_token,
                            'accept': 'application/hal+json'
                            }
                        });
                        // console.log(ws);
                        var body = {type:"subscribe",payload:{stream:"state",siteID:program.site}};
                        var body1= {type:"subscribe",payload:{stream:"event",siteID:program.site}};
                        var body2= {type:"subscribe",payload:{stream:"alert",siteID:program.site}};
                        ws.on('open',function open(){
                            console.log("Events webSocket connection established")
                            ws.send(JSON.stringify(body));
                            ws.send(JSON.stringify(body1));
                            ws.send(JSON.stringify(body2));
                            ws.on('message', function incoming(data) {
                                // console.log(data);
                                // console.log(typeof data);
                                try {
                                    data = JSON.parse(data);
                                } catch(err) {
                                    console.error(chalk.red('Failed to parse event ', err));
                                }
                                process.stdout.write('Site: ' + data.payload.siteID + ' ' + data.payload.body.source + ' ');
                                process.stdout.write(data.payload.stream + ' ' + data.payload.body.type + ' ' + JSON.stringify(data.payload.body.data) + '\n');
                                // console.log(data);
                            });
                            ws.on('close',function close(data){console.log("Events websocket disconnected " + data);})
                            ws.on('error', function incoming(error) { console.log(error);});
                            resolve();
                        });
                        ws.on('error', function incoming(error) { console.log(error);
                        ws.close('message',function incoming(data){ console.log(data);})
                        });
                    }catch(e){
                        console.log("Error:"+e);
                    }
                    break;

                case "createRole":

                    if(!cliArgz[1]|| !cliArgz[2]){
                        exitWithError("Command takes 2 arguments: name and accountID");
                        resolve();
                        break;
                    }

                    var obj={"name":cliArgz[1],"accountID":cliArgz[2]};

                    DCS.createRoles(obj).then(function(result){
                        console.log("Results:",result)
                    },function(err){
                        logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err)
                    }).then(function(){
                        resolve();
                    })
                    break;

                case "getRoles":
                    if(!cliArgz[1]&& !cliArgz[2] && !cliArgz[3]){
                        console.log("Command takes 3 arguments:userID,accountID and name ")
                        exitWithError("Enter at least one argument");
                        resolve();
                        break;
                    }
                    DCS.getRoles(cliArgz[1],cliArgz[2],cliArgz[3]).then(function(result){
                        console.log("Results:",JSON.stringify(result,null,4));
                    },function(err){
                        logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err)
                    }).then(function(){
                        resolve();
                    })
                    break;

                case "getaRole":
                    if(!cliArgz[1]){
                        exitWithError("Command takes 1 argument:roleID");
                        resolve();
                        break;
                    }
                    DCS.getaRole(cliArgz[1]).then(function(result){
                        console.log("Results:",JSON.stringify(result,null,4));
                    },function(err){
                        logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err)
                    }).then(function(){
                        resolve();
                    })
                    break;

                case "deleteaRole":
                    if(!cliArgz[1]){
                        exitWithError("Command takes 1 argument:roleID");
                        resolve();
                        break;
                    }
                    shell.question('are you sure (yes/no)?',(answer) =>{
                        if(answer == 'yes'){
                            DCS.deleteaRole(cliArgz[1]).then(function(result){
                                console.log("Results:",JSON.stringify(result,null,4));
                            },function(err){
                                logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err)
                            }).then(function(){
                                resolve();
                            })
                        }else if(answer == 'no'){
                            console.log('\nOoops! command executed by mistake')
                            resolve()
                        }else{
                            console.log('\nreply either yes or no')
                            resolve()
                        }
                    })

                    break;

                case "getSitedatabase":
                    if(!program.site){
                        exitWithError("Run set-siteid first");
                        resolve();
                        break;
                    }
                    DCS.getDatabase(program.site).then(function(result){
                        console.log("Results:",JSON.stringify(result,null,4));
                    },function(err){
                        logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err)
                    }).then(function(){
                        resolve();
                    })
                    break;

                case "getSitebuckets":
                    if(!program.site){
                        exitWithError("Run set-siteid first");
                        resolve();
                        break;
                    }
                    if(!cliArgz[1]){
                        exitWithError("Command takes 1 argument: Valid buckets include 'cloud’, 'shared’ or ‘lww’");
                        resolve();
                        break;
                    }
                    DCS.getBuckets(program.site,cliArgz[1]).then(function(result){
                        console.log("Results:",JSON.stringify(result,null,4));
                    },function(err){
                        logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err)
                    }).then(function(){
                        resolve();
                    })
                    break;

                case "getKeysdata":
                    if(!program.site){
                        exitWithError("Run set-siteid first");
                        resolve();
                        break;
                    }
                    if(inShell === false){
                        if(program.inputtype&&program.valueinputtype&&program.bucket){
                            cliArgz[1]=program.bucket;
                            cliArgz[2]=program.inputtype;
                            cliArgz[3]=program.valueinputtype;
                        }else{
                            exitWithError("The commandline takes -B (shared/lww/cloud) , -I (key/prefix), -V (Value of key/prefix)");
                            resolve();
                        }
                    }
                    if(!cliArgz[1]){
                        exitWithError("Command takes 1 argument: Valid buckets include 'cloud’, 'shared’ or ‘lww’");
                        resolve();
                        break;
                    }
                    if(cliArgz[2]!== 'key'&& cliArgz[2] !== 'prefix'){
                        exitWithError("Enter Valid inputtype:'key' or 'prefix'");
                        resolve();
                        break;
                    }
                    if(!cliArgz[3]){
                        exitWithError("Enter Value of:'key' or 'prefix'");
                        resolve();
                        break;
                    }
                    DCS.getKeysdata(program.site,cliArgz[1],cliArgz[2],cliArgz[3]).then(function(result){
                        console.log("Results:",JSON.stringify(result,null,4));
                    },function(err){
                        logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err)
                    }).then(function(){
                        resolve();
                    })
                    break;

                case "enoceanRemoveDevice":
                    if(!program.site){
                        exitWithError("SiteID null. Set SiteID first");
                        resolve();
                        break;
                    }
                    DCS.executeCommand(program.site,"id=\"EnoceanDriver\"", "removeDevice",  null).then(function(resp) {
                        console.log("OK.");
                        console.log("Results: SUCCESS",util.inspect(resp,{depth:program.depth}));
                    }, function(err) {
                        logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                    }).then(function(){
                        resolve();
                    })
                break;

                case "enoceanLogLevel":
                    if(!program.site){
                        exitWithError("SiteID null. Set SiteID first");
                        resolve();
                        break;
                    }
                    DCS.executeCommand(program.site,"id=\"EnoceanDriver\"", "logLevel", parseInt(cliArgz[1])).then(function(resp) {
                        console.log("OK.");
                        console.log("Results: SUCCESS",util.inspect(resp,{depth:program.depth}));
                    }, function(err) {
                        logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                    }).then(function(){
                        resolve();
                    })

                break;


                case "enoceanGetBase":
                    if(!program.site){
                        exitWithError("SiteID null. Set SiteID first");
                        resolve();
                        break;
                    }
                    DCS.executeCommand(program.site,"id=\"EnoceanDriver\"", "getBase", null).then(function(resp) {
                        console.log("OK.")
                        console.log("Results: SUCCESS",util.inspect(resp,{depth:program.depth}));
                    }, function(err) {
                        logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                    }).then(function(){
                        resolve();
                    })
                break;

                case "enoceanGetVersion":
                    if(!program.site){
                        exitWithError("SiteID null. Set SiteID first");
                        resolve();
                        break;
                    }
                    DCS.executeCommand(program.site,"id=\"EnoceanDriver\"", "getVersion", null).then(function(resp) {
                        console.log("OK.")
                        console.log("Results: SUCCESS",util.inspect(resp,{depth:program.depth}));
                    }, function(err) {
                        logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                    }).then(function(){
                        resolve();
                    })
                break;

                case "enoceanConfig":
                    if(!program.site){
                        exitWithError("SiteID null. Set SiteID first");
                        resolve();
                        break;
                    }
                    DCS.executeCommand(program.site,"id=\"EnoceanDriver\"", "config", null).then(function(resp) {
                        console.log("OK.")
                        console.log("Results: SUCCESS",util.inspect(resp,{depth:program.depth}));
                    }, function(err) {
                        logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                    }).then(function(){
                        resolve();
                    })
                break;

                case "enoceanStartPairing":
                    if(!program.site){
                        exitWithError("SiteID null. Set SiteID first");
                        resolve();
                        break;
                    }
                    DCS.executeCommand(program.site,"id=\"EnoceanDriver\"", "addDevice", null).then(function(resp) {
                        console.log("OK.")
                        console.log("Results: SUCCESS",util.inspect(resp,{depth:program.depth}));
                    }, function(err) {
                        logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                    }).then(function(){
                        resolve();
                    })
                break;

                case "updateKeys":
                    console.log(chalk.blue("Command takes 5 inputs bucket type,option,keypath,value to be updated (optional),context (optional)"))

                    if(!program.site){
                        exitWithError("Run set-siteid first");
                        resolve();
                        break;
                    }
                    if(!cliArgz[1]){
                        exitWithError("Command takes 1 argument: Valid buckets include 'cloud’, 'shared’ or ‘lww’");
                        resolve();
                        break;
                    }
                    if(cliArgz[2]!== 'remove'&& cliArgz[2] !== 'replace'){
                        exitWithError("Enter Valid option:'remove' or 'replace'");
                        resolve();
                        break;
                    }
                    if(!cliArgz[3]){
                        exitWithError("Enter path of the'key'");
                        resolve();
                        break;
                    }
                    DCS.updateKeys(program.site,cliArgz[1],cliArgz[2],cliArgz[3],cliArgz[4],cliArgz[5]).then(function(result){
                        console.log("Results:",JSON.stringify(result,null,4));
                    },function(err){
                        logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err)
                    }).then(function(){
                        resolve();
                    })
                    break;

                case "updateSiteResourceName":

                    if(!program.site){
                        exitWithError("Run set-siteid first");
                        resolve();
                        break;
                    }

                    if(!cliArgz[1]){
                        exitWithError("Enter resourceID");
                        resolve();
                        break;
                    }
                    else{
                        cliArgz[1]= 'WigWagUI:appData.resource.' + cliArgz[1] + '.name'
                    }

                    if(!cliArgz[2]){
                        exitWithError("No friendly name given to resource");
                        resolve();
                        break;
                    }
                    DCS.updateKeys(program.site,"shared","replace",cliArgz[1],cliArgz[2]).then(function(result){
                        console.log("Results: Name updated successfully");
                    },function(err){
                        logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err)
                    }).then(function(){
                        resolve();
                    })
                    break;

                case "zigbeeGetPanId":
                    if(!program.site){
                        exitWithError("SiteID null. Set SiteID first");
                        resolve();
                        break;
                    }
                    DCS.executeCommand(program.site,"id=\"ZigbeeDriver\"", "getPanId", null).then(function(resp) {
                        console.log("OK.")
                        console.log("Results: SUCCESS",util.inspect(resp,{depth:program.depth}));
                    }, function(err) {
                        logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                    }).then(function(){
                        resolve();
                    })
                break;

                case "zigbeeDeleteAll":
                    if(!program.site){
                        exitWithError("SiteID null. Set SiteID first");
                        resolve();
                        break;
                    }
                    shell.question('are you sure (yes/no)?',(answer) =>{
                        if(answer == 'yes'){
                            DCS.executeCommand(program.site,"id=\"ZigbeeDriver\"", "deleteZigbeeDatabase", null).then(function(resp) {
                                console.log("Results: SUCCESS",util.inspect(resp,{depth:program.depth}));
                            }, function(err) {
                                logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                            }).then(function(){
                                resolve();
                            })
                        }else if(answer == 'no'){
                            console.log('\nOops! command executed by mistake')
                            resolve()
                        }else{
                            console.log('\nreply either yes or no')
                            resolve()
                        }
                    })
                break;

                case "zigbeeGetChannel":
                    if(!program.site){
                        exitWithError("SiteID null. Set SiteID first");
                        resolve();
                        break;
                    }
                    DCS.executeCommand(program.site,"id=\"ZigbeeDriver\"", "getChannel",  null).then(function(resp) {
                        console.log("OK.")
                        console.log("Results: SUCCESS",util.inspect(resp,{depth:program.depth}));
                    }, function(err) {
                        logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                    }).then(function(){
                        resolve();
                    })
                break;

                case "zigbeeGetAddress":
                    if(!program.site){
                        exitWithError("SiteID null. Set SiteID first");
                        resolve();
                        break;
                    }
                    DCS.executeCommand(program.site,"id=\"ZigbeeDriver\"", "getExtendedSrcAddress", null).then(function(resp) {
                        console.log("OK.")
                        console.log("Results: SUCCESS",util.inspect(resp,{depth:program.depth}));
                    }, function(err) {
                        logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                    }).then(function(){
                        resolve();
                    })
                break;

                case "zigbeeNetworkTopology":
                    if(!program.site){
                        exitWithError("SiteID null. Set SiteID first");
                        resolve();
                        break;
                    }
                    DCS.executeCommand(program.site,"id=\"ZigbeeDriver\"", "getNetworkTopology", null).then(function(resp) {
                        console.log("OK.")
                        console.log("Results: SUCCESS",util.inspect(resp,{depth:program.depth}));
                    }, function(err) {
                        logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                    }).then(function(){
                        resolve();
                    })
                break;

                case "zigbeeStatus":
                    if(!program.site){
                        exitWithError("SiteID null. Set SiteID first");
                        resolve();
                        break;
                    }
                    DCS.executeCommand(program.site,"id=\"ZigbeeDriver\"", "status", null).then(function(resp) {
                        console.log("OK.")
                       console.log("Results: SUCCESS",util.inspect(resp,{depth:program.depth}));
                    }, function(err) {
                        logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                    }).then(function(){
                        resolve();
                    })
                break;

                case "zigbeeNodes":
                    if(!program.site){
                        exitWithError("SiteID null. Set SiteID first");
                        resolve();
                        break;
                    }
                    DCS.executeCommand(program.site,"id=\"ZigbeeDriver\"", "getNodes", null).then(function(resp) {
                        console.log("OK.")
                        console.log("Results: SUCCESS",util.inspect(resp,{depth:program.depth}));
                    }, function(err) {
                        logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                    }).then(function(){
                        resolve();
                    })
                break;

                case "zigbeePingDevices":
                    if(!program.site){
                        exitWithError("SiteID null. Set SiteID first");
                        resolve();
                        break;
                    }
                    DCS.executeCommand(program.site,"id=\"ZigbeeDriver\"", "ping",  null).then(function(resp) {
                        console.log("OK.")
                        console.log("Results: SUCCESS",util.inspect(resp,{depth:program.depth}));
                    }, function(err) {
                        logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                    }).then(function(){
                        resolve();
                    })
                break;

                case "zigbeeLogLevel":
                    if(!program.site){
                        exitWithError("SiteID null. Set SiteID first");
                        resolve();
                        break;
                    }
                    var num;
                    if(!cliArgz[1]){
                        exitWithError("Enter number 0 to 5");
                        resolve();
                        break;
                    }else{
                        num=Number(cliArgz[1]);
                        if(num<0 || num>5){
                            exitWithError("Enter number 0 to 5");
                        resolve();
                        break;
                        }
                    }
                    DCS.executeCommand(program.site,"id=\"ZigbeeDriver\"", "logLevel", num).then(function(resp) {
                        console.log("OK.")
                        console.log("Results: SUCCESS",util.inspect(resp,{depth:program.depth}));
                    }, function(err) {
                        logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                    }).then(function(){
                        resolve();
                    })
                break;

                case "getAlerts":
                    if(!program.site){
                        exitWithError("SiteID null. Set SiteID first");
                        resolve();
                        break;
                    }
                    DCS.getAlerts(program.site,cliArgz[1],cliArgz[2],cliArgz[3]).then(function(result){
                        console.log("Results:",result)
                    },function(err){
                        logerr("Failed:",err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err)
                    }).then(function(){
                        resolve();
                    })
                    break;

                case "getAnAlert":
                    if(!cliArgz[1]){
                        exitWithError("Enter the relayID");
                        resolve();
                        break;
                    }
                    if(!cliArgz[2]){
                        exitWithError(" Enter the serial number of the alert");
                        resolve();
                        break;
                    }
                    DCS.getAnAlert(cliArgz[1],cliArgz[2]).then(function(result){
                        console.log("Results:",result)
                    },function(err){
                        logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err)
                    }).then(function(){
                        resolve();
                    })
                    break;

                case "dismissAlert":
                    if(!cliArgz[1]){
                        exitWithError("Enter the relayID");
                        resolve();
                        break;
                    }
                    if(!cliArgz[2]){
                        exitWithError(" Enter the serial number of the alert");
                        resolve();
                        break;
                    }
                    DCS.dismissAlert(cliArgz[1],cliArgz[2]).then(function(result){
                        console.log("Results:",result)
                    },function(err){
                        logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err)
                    }).then(function(){
                        resolve();
                    })
                    break;

                case "getDeviceLogs":
                    DCS.getDeviceLogs(program.account, program.site, cliArgz[1], cliArgz[2], cliArgz[3], null, null, cliArgz[4],cliArgz[5]).then((resp) => {
                        console.log(JSON.stringify(resp,null,4))
                        resolve()
                    }, (err) => {
                        logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err)
                    })
                break;
                //ble commands
                case "bleStartScan":
                    DCS.executeCommand(program.site, "id=\"BluetoothDriver\"", "startScan").then(function(resp) {
                        console.log("OK.")
                        console.log(resp)
                        resolve()
                    }, function(err){
                        logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                        resolve();
                        //reject(err);
                    });
                break;

                case "bleStopScan":
                    DCS.executeCommand(program.site, "id=\"BluetoothDriver\"", "stopScan").then(function(resp) {
                        console.log("OK.")
                        console.log(resp)
                        resolve()
                    }, function(err){
                        logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                        resolve();
                        //reject(err);
                    });
                break;

                case "getBleScanResults":
                    if(!program.site){
                        exitWithError("Run set-siteid first");
                        resolve();
                        break;
                    }
                    DCS.getKeysdata(program.site,'shared','key','Bluetooth-driver.scanresult').then(function(result) {
                        console.log('OK.')
                        console.log('----------------------------------------------------------------------');
                        console.log('UUID         | Mac Address       | RSSI |Supported | Name');
                        console.log('----------------------------------------------------------------------');
                        result.keys[0].siblings.forEach(data=> {
                            var data = JSON.parse(data)
                            var uuids = Object.keys(data)
                            uuids.forEach(devicedata=> {
                                if(data[devicedata].name === undefined) {
                                    data[devicedata].name = '..............'
                                }
                               console.log(data[devicedata].uuid + ' | '+ data[devicedata].address + ' | '+ data[devicedata].rssi+'  | '+data[devicedata].supported+'\t   | '+data[devicedata].name);
                            })
                        });
                    },function(err){
                        logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err)
                    }).then(function(){
                        console.log('-----------------------------------------------------------------------');
                        resolve();
                    })
                break;

                case "getBleConnectedDevice":
                    if(!program.site){
                        exitWithError("Run set-siteid first");
                        resolve();
                        break;
                    }

                    
                    DCS.getKeysdata(program.site,'shared','key','Bluetooth-driver.connectedDevices').then(function(result) {
                        console.log('OK.')
                        console.log('----------------------------------------------------');
                        console.log('UUID         | Paired   | Connected | Name');
                        console.log('----------------------------------------------------');
                        result.keys[0].siblings.forEach(data=>{
                            var data = JSON.parse(data)
                            var uuids = Object.keys(data)
                            
                            uuids.forEach(devicedata=> {
                              //  console.log(devicedata);
                                console.log(data[devicedata].uuid + ' | '+ data[devicedata].paired + '\t| '+ data[devicedata].state+' | '+data[devicedata].name);

                            })
                            
                        })


                      /*  result.keys[0].siblings.forEach(data=> {
                            var data = JSON.parse(data)
                            var uuids = Object.keys(data)
                            uuids.forEach(devicedata=> {
                               console.log(data[devicedata].uuid + ' | '+ data[devicedata].address + ' | '+ data[devicedata].rssi+'  | '+data[devicedata].supported);
                            })
                        });*/
                    },function(err){
                        logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err)
                    }).then(function(){
                        console.log('----------------------------------------------------');
                        resolve();
                    })
                break;

                case "bleConnect":
                    if(!cliArgz[1]) {
                       exitWithError(" Enter the mac Address of device");
                        resolve();
                        break; 
                    }


                    DCS.executeCommand(program.site,"id=\"Bluetooth/DevicePairer\"", "addDevice",cliArgz[1]).then(function(resp) {
                        console.log('OK.');
                        if(resp) {
                            console.log(resp);
                        }

                    }, err=>{
                        logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err)
                    }).then(function(){
                        resolve();
                    })
                break;

                case "bleDisconnect":
                    if(!cliArgz[1]) {
                       exitWithError(" Enter the mac Address of device");
                        resolve();
                        break; 
                    }
                    
                    shell.question('are you sure (yes/no)?',(answer)=>{
                    if(answer=='yes') {
                    DCS.executeCommand(program.site,"id=\"Bluetooth/DevicePairer\"", "removeDevice",cliArgz[1]).then(function(resp) {
                        console.log('OK.');
                        if(resp) {
                            console.log(resp);
                        }

                        }, err=>{
                            logerr("Failed: ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err)
                        }).then(function(){
                        resolve();
                        })
                    }
                    else if(answer=='no') {
                        resolve();
                    }
                    else {
                        console.log("Please enter the valid command");
                    }

                });
                break;

                case "createmdfile":
                    createhelpmdfile().then(function(){
                        resolve();
                    },function(err){
                        console.log("Command failed to convert helpCommand.json to markdown file" + err);
                        resolve();
                    });
                break;

                case "listFirmwareImages":
                    if(program.cloud.indexOf('mbed') < 0) {
                        exitWithError("Command only runs in mbed clouds")
                        resolve()
                    } else  if(!program.access_key) {
                        exitWithError("Command requires access key. Run set-access-key first.")
                        resolve()
                    } else {
                        UpdateApi = new mbedCloudSDK.UpdateApi({
                            host: program.cloud,
                            apiKey: program.access_key
                        });

                        UpdateApi.listFirmwareImages().then(images => {
                            console.log('------------------------------------------------------------------------------------------------');
                            console.log('SNo | ID                               | Image Size   | Name');
                            console.log('------------------------------------------------------------------------------------------------');
                            var count = 0;
                            images.data.forEach(function(image) {
                                count++;
                                console.log(' ' + count + (count>9?'':' ') + ' | ' + image.id + ' | ' + image.datafileSize + ' '.repeat(12 - image.datafileSize.toString().length) + ' | ' + image.name);
                            });
                            console.log('------------------------------------------------------------------------------------------------');
                            resolve();
                        }, error => {
                            logerr("listFirmwareImages failed - (", error.code, ") ", error.details.message);
                            resolve()
                        })
                    }
                break;

                case "addFirmwareImage":
                    if(program.cloud.indexOf('mbed') < 0) {
                        exitWithError("Command only runs in mbed clouds")
                        resolve()
                    } else  if(!program.access_key) {
                        exitWithError("Command requires access key. Run set-access-key first.")
                        resolve()
                    } else {
                        UpdateApi = new mbedCloudSDK.UpdateApi({
                            host: program.cloud,
                            apiKey: program.access_key
                        });

                        shell.question('Enter the fw image path - ',(fw_path) => {
                            if(fs.existsSync(fw_path)) {
                                shell.question('Enter the fw image name - ',(fwName) => {
                                    if(fwName.length > 0) {
                                        shell.question('Enter the description - ',(description) => {
                                            UpdateApi.addFirmwareImage({
                                                name: fwName,
                                                dataFile: fs.createReadStream(fw_path),
                                                description: description
                                            }).then(result => {
                                                console.log("Firmware uploaded successfully, response - "+JSON.stringify(result,null,4));
                                                resolve();
                                            }, error => {
                                                logerr("addFirmwareImage failed - ", error.details.message);
                                                resolve();
                                            })
                                        })
                                    } else {
                                        logerr("Firmware name cant be null")
                                        resolve();
                                    }
                                })
                            } else {
                                if(fw_path == '') logerr("You have to enter file path.");
                                else logerr("No such file exists.")
                                resolve();
                            }
                        })
                    }
                break;

                case "listFirmwareManifests":
                    if(program.cloud.indexOf('mbed') < 0) {
                        exitWithError("Command only runs in mbed clouds")
                        resolve()
                    } else  if(!program.access_key) {
                        exitWithError("Command requires access key. Run set-access-key first.")
                        resolve();
                    } else {
                        UpdateApi = new mbedCloudSDK.UpdateApi({
                            host: program.cloud,
                            apiKey: program.access_key
                        });

                        UpdateApi.listFirmwareManifests().then(manifests => {
                            console.log('-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------');
                            console.log('SNo | ID                               | Created At                              | Device Class                         | Name');
                            console.log('-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------');
                            var count = 0;
                            manifests.data.forEach(function(manifest) {
                                count++;
                                console.log(' ' + count + (count>9?'':' ') + ' | ' + manifest.id + ' | ' + manifest.createdAt + ' | ' + manifest.deviceClass + ' | ' + manifest.name);
                            });
                            console.log('-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------');
                            resolve();
                        }, error => {
                            logerr("listFirmwareManifests failed - ", error.details.message);
                            resolve();
                        })
                    }
                break;

                case "startUpdateCampaign":
                    if(program.cloud.indexOf('mbed') < 0) {
                        exitWithError("Command only runs in mbed clouds")
                        resolve()
                    } else if(!program.access_key) {
                        exitWithError("Command requires access key. Run set-access-key first.")
                        resolve()
                    } else if(!program.site){
                        exitWithError("SiteID null. Set SiteID first");
                        resolve();
                    } else {
                        shell.question('Are you sure you want to upgrade this site (yes/no) ?', (answer) =>{
                            if(answer == 'yes'){
                                UpdateApi = new mbedCloudSDK.UpdateApi({
                                    host: program.cloud,
                                    apiKey: program.access_key
                                });
                                UpdateApi.listFirmwareManifests().then(manifests => {
                                    console.log('-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------');
                                    console.log('SNo | ID                               | Created At                              | Device Class                         | Name');
                                    console.log('-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------');
                                    var count = 0;
                                    manifests.data.forEach(function(manifest) {
                                        count++;
                                        console.log(' ' + count + (count>9?'':' ') + ' | ' + manifest.id + ' | ' + manifest.createdAt + ' | ' + manifest.deviceClass + ' | ' + manifest.name);
                                    });
                                    console.log('-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------');
                                    shell.question('Make sure the manifest is uploaded, or run addFirmwareManifest first.\nSelect the manifest - ',(manifest_index) => {
                                        if(manifest_index < 1 || manifest_index > count) {
                                            exitWithError("Invalid index");
                                            resolve();
                                        } else {
                                            shell.question('Enter the campaign name - ',(campaignName) => {
                                                if(campaignName.length > 0) {
                                                    shell.question('Enter the description - ',(description) => {
                                                        UpdateApi.addCampaign({
                                                            name: campaignName,
                                                            description: description,
                                                            deviceFilter: {
                                                                alias: { $eq: program.site }
                                                            },
                                                            manifestId: manifests.data[manifest_index - 1].id
                                                        }).then(campaign => {
                                                            // Utilize campaign here
                                                            console.log("Campaign data - "+JSON.stringify(campaign,null,4));
                                                            UpdateApi.startCampaign(campaign.id).then(result => {
                                                                console.log("Campaign started - "+JSON.stringify(result,null,4));
                                                                resolve();
                                                            }, error => {
                                                                logerr("Start campaign failed - "+error.details.message)
                                                                resolve()
                                                            })
                                                        }, error => {
                                                            logerr("Create campaign failed - "+error.details.message)
                                                            resolve()
                                                        });
                                                    })
                                                } else {
                                                    logerr("Campaign name cannot be null.")
                                                    resolve()
                                                }
                                            })
                                        }
                                    })
                                }, error => {
                                    logerr("listFirmwareManifests failed - ", error.details.message);
                                    resolve();
                                })
                            } else if (answer == 'no'){
                                console.log('\nOoops! command executed by mistake')
                                resolve()
                            } else {
                                console.log('\nreply either yes or no')
                                resolve()
                            }
                        })
                    }
                break;

                case "getCampaign":
                    if(program.cloud.indexOf('mbed') < 0) {
                        exitWithError("Command only runs in mbed clouds")
                        resolve()
                    } else if(!program.access_key) {
                        exitWithError("Command requires access key. Run set-access-key first.")
                        resolve()
                    } else {
                        UpdateApi = new mbedCloudSDK.UpdateApi({
                            host: program.cloud,
                            apiKey: program.access_key
                        });
                        shell.question('Enter campaign id - ',(id) => {
                            UpdateApi.getCampaign(id).then(campaign => {
                                console.log(JSON.stringify(campaign, null, 4))
                                resolve();
                            }, error => {
                                console.log("getCampaign failed - ", error);
                                resolve()
                            })
                        })
                    }
                break;

                case "listCampaignDeviceStates":
                    if(program.cloud.indexOf('mbed') < 0) {
                        exitWithError("Command only runs in mbed clouds")
                        resolve()
                    } else if(!program.access_key) {
                        exitWithError("Command requires access key. Run set-access-key first.")
                        resolve()
                    } else {
                        UpdateApi = new mbedCloudSDK.UpdateApi({
                            host: program.cloud,
                            apiKey: program.access_key
                        });
                        shell.question('Enter campaign id - ',(id) => {
                            UpdateApi.listCampaignDeviceStates(id).then(deviceStates => { console.log(JSON.stringify(deviceStates, null, 4))
                                console.log('-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------');
                                console.log('SNo | DeviceID                               | Name                              | State');
                                console.log('-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------');
                                var count = 0;
                                deviceStates.data.forEach(function(deviceState) {
                                    count++;
                                    console.log(' ' + count + (count>9?'':' ') + ' | ' + deviceState.deviceId + ' | ' + deviceState.name + ' | ' + deviceState.state);
                                });
                                console.log('-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------');
                                resolve();
                            }, error => {
                                console.log("listCampaignDeviceStates failed - ", error);
                                resolve();
                            });
                        })
                    }
                break;



            default:
                if(cliArgz[0] =='yes' || cliArgz[0] == 'no'|| inputflag === true) {
                    //resolve()
                }else{
                    unknownCommandHelp(cliArgz[0])
                    resolve()
            }
        }
    }) // outer Promise
}

var getPassword = function() {
    // Handle the secret text (e.g. password).
    var pw = readlineSync.question('Password: ', {
        hideEchoBack: true // The typed text on screen is hidden by `*` (default).
    });

    return pw;
}

function findGatewayInLocalLan() {
    var services = {};
    return new Promise(function(resolve, reject) {
        bonjour.find({ type: 'wwservices' }, function (service) {
            if(service && service.txt && service.txt.wwid) {
                services[service.txt.wwid] = service;
            }
        });

        setTimeout(function() {
            resolve(services);
        }, 5000);
    });
}

var serialnumber = null;
getSavedConfig().then(function() {
    if(program.cloud.indexOf('wigwaggateway.local') > -1) {
        console.log('Searching...');
        findGatewayInLocalLan().then(function(gateways) {
            // console.log('Found gateways ', gateways);
            if(Object.keys(gateways).length <= 0) {
                console.error('Failed to find any gateway in your local LAN. Please make sure you are in the same network as the gateways and try again.');
            } else {
                console.log('Found %d gateways, select one of the following-- ', Object.keys(gateways).length);
                console.log('---------------------------------------------------------');
                console.log(' S.No. |\tGateway\t\t|\tIP\t\t|');
                console.log('---------------------------------------------------------');
                Object.keys(gateways).forEach(function(element, index) {
                    console.log("   " + (index + 1) + "   |\t" + element + '\t|\t' + gateways[element].referer.address + '\t|');
                });
                console.log('---------------------------------------------------------');
                serialnumber = readlineSync.question('Enter the S.No or Gateway serial number from the above list? ')
                if(serialnumber.length < 4) {
                    serialnumber = Object.keys(gateways)[serialnumber - 1];
                }
                if(gateways[serialnumber]) {
                    program.cloud = "http://" + gateways[serialnumber].referer.address + ":" + gateways[serialnumber].port;
                    console.log("Logging into %s...", program.cloud);
                    savingaccesstoken();
                } else {
                    logerr("Entered incorrect serial number. Please enter from the above list!");
                    process.exit(1);
                }
            }
        });
    } else {
        savingaccesstoken();
    }
})


var savingaccesstoken = function (){
    DCS.initAPI(program,{
            logdbg: logdbg,
            logerr: logerr
        }
    );
    return new Promise(function(resolve,reject){
        var doLoginAndGo = function() {
            DCS.getAuthWithPass(program.user, program.password).then(function(result) {
                // logdbg('program:', program)
                // logdbg("OK---", result);
                //console.log(result);
                logdbg("RESULT:",result);
                access = result;
                //console.log("do Login and GO working"+JSON.stringify(access));
                saveToken(program.user, program.cloud, access, program.account).then(function() {
                    logdbg("Finished config file write.");
                }, function(err) {
                    logerr("Error writing config file", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err);
                }).then(function(){
                    doCLICommand.apply({}, argz)
                })
            }, function(err) {
                logerr("Failed (doLoginAndGo): ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err)
                reject("Failed to login.")
            }).catch(function(err){
                logerr("Catch [failed] (doLoginAndGo): ", err.statusCode ? (err.statusCode + " --> " + err.statusMessage) : err)
                reject("Failed to login.")
            })
        }

        logdbg("after getSavedConfig");
        var argz = JSON.parse(JSON.stringify(program.args));
        if (program.password) {
            doLoginAndGo();
        } else {
            if(program.access_key) {
                access = {};
                access.access_token = program.access_key;
                DCS.setAccessObject(access, program.cloud,  program.account || access.account_id);
                doCLICommand.apply({}, argz)
            } else {
                access = getValidToken(program.user, program.cloud)
                DCS.setAccessObject(access, program.cloud, program.account || access.account_id);
                // console.log(access);
                if (access) {
                    logdbg("Using stored token in config file.")
                    DCS.setAccessObject(access, program.cloud, program.account || access.account_id);
                    doCLICommand.apply({}, argz)
                } else {
                    console.log("No stored / valid token for user", program.user, "Need to login with password. \n( Config file:", accessObjectStorageFile, ")");
                    if (!program.muted) {
                        program.password = getPassword();
                        doLoginAndGo();
                    }

                }
            }
        }
        return resolve();
    });
}
/************ EXAMPLES ******************



This will add joe@domain.com as an admin for account 69c24e162a3441008b4597547f8ABCD:
node ./index.js -d -c https://fsg-cloud.wigwag.io -u joe@domain.com -p XXXXXXXX -a 69c24e162a3441008b4597547f8ABCD createUserAccessRule ygoyal+admin@izuma.net "{\"permissions\":[\"account_admin\"]}"

Pulls all history for a given Site and account:
node ./index.js -c https://devcloud.wigwag.io -u ygoyal+dev1@wigwag.com -p yash123 -a 95d84a628a264e75906e471295c4a9c0 getHistory cd5b7cc4c4704ab9aa8d04a824d87083 csv > dump-history.txt


**/
