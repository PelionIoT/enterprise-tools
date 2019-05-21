# enterprise-tools

### Prerequisites

You must have node.js installed on your machine. Goto [nodejs.org](https://nodejs.org/en/) and download + install the latest LTS version of node.js for your platform. The tools should work on Windows, Mac and Linux. You will also need [git](https://git-scm.com/downloads).

## Installation

For a variety of reasons WigWag does not recommend installing `npm` modules globally as a developer. 

    mkdir tools
    npm install git+https://githubusername:githubpass@github.com/armPelionEdge/enterprise-tools.git

If you have checked out the project with `git clone`, run:
    
    npm install . 

You can user any directory name you like vs. `tools`

From the directory you ran this in, you may run `dcs-tools` by (it will print out a help message):

    node_modules/enterprise-tools/bin/dcs-tools -h

If you are on Windows please use

    C:/ ... /tools/node_modules/enterprise-tools/dcs-tools.cmd -h

Fill in `...` with you appropriate path.

##### Adding to your PATH

If you want the command to work anywhere, you can simply add `[INSTALL FOLDER]/node_modules/enterprise-tools/bin` to your PATH

On Windows, you should add `[INSTALL FOLDER]/node_modules/enterprise-tools`

Where `[INSTALL FOLDER`] is the full path to the folder you used for the install procedure above.

##### Installing via Docker (Linux only)

    docker pull docker-registry.wigwag.io:5000/dcs-tools

then, commands like:

    sudo docker run --rm -it docker-registry.wigwag.io:5000/dcs-tools -c https://devcloud.wigwag.io -u USER -p PASS -a acdefgh12312121211221211 shell

##### Global Install via npm

If you really want to...

    npm install -g https://github.com/armPelionEdge/enterprise-tools

If you have checked out the project, run: 

    npm install -g . 
    
from inside the project directory this will install `dcs-tools` command globally.

### Fast Start

To start the shell, do something like this

     dcs-tools -c https://devcloud.wigwag.io -u USER -p PASS -a acdefgh12312121211221211 shell

Replace `USER` with the user which has appropriate permissions to the account (here account is `abdefghi123...`)


## Commands

#### Login credentials

    dcs-tools -c https://api-gateway-url.net> -u USER -p PASS -a acdefgh12312121211221211 [COMMAND]
    dcs-tools -c https://<api-gateway-url.net> -k api_key [COMMAND]

Most commands typically require a combination of these switches:

    -c [CLOUD URL]
    -u [USER EMAIL]
    -p [PASSWORD]
    -a [ACCOUNT ID]
    -k [API Key]
    
If you run the tool with the `--admin` (or `-A`), and use credentials for the *super user* cloud account, you do not have to provide an `[ACCOUNT ID]`  If you do not provide a password, and one is needed, `dcs-tools` will prompt for one. This prompting can be disabled, as with all interactive input, using the `--muted` option. 

##### Useful options

`-d` Turns on debugging output, which is quite verbose.

`-D [num]` Changes depth of object inspection. By default this is `2` - turn it up on to inspect deeper objects. In the shell use `set-depth`

`-A` Use a command or shell, as super-admin, which means no Account ID is used in your access token. 

##### Config file

The tool automatically stores a config file saving authentication tokens in $HOME/.dcs-tools (or $HOME/dcs-tools.conf on Windows). This file get `0600` permissions, and is rewritten any time a new password is used for authentication. If you have a token which is not expired stored here, you do not need to specify `-p [PASSWORD]` (i.e. most times the tool is ran)

You may specifc an alternate config file using the `-C [CONFFILE]` switch. If a password is provided via the `-p` switch, `dcs-tools` will always login - regardless of stored credentials, and will update the config file with this new token.

#### `shell`

The easiest way to see what the `dcs-tools` can do is to enter the command shell.

Do this by using the `shell` command.

    dcs-tools -c https://somecloud.wigwag.io -u USER -p PASS -a acdefgh1231212121122121? shell

All other commands stated here can be entered in the shell, or can be ran as your `[COMMAND]` when your run `dcs-tools`

#### `putImage`

Example:

```
dcs-tools -A -a b609fb83d5d24736aa36ca07b1b9f6aa -u todd+jan20@wigwag.com \
  -c https://devcloud.wigwag.io putImage ~/work/zip1.zip \
  "{\"imageType\":\"devicejs\",\"imageName\":\"zip1\",\"imageVersion\":\"0.0.1\"}"

OK. Done. Upload is here: https://devcloud.wigwag.io/api/images/devicejs-zip1-0.0.1.img

```
Uploads a file `zip1.zip` as a `devicejs` type image, called `zip1` with version `0.0.1`

The file is accessible by doing a GET `https://devcloud.wigwag.io/api/images/devicejs-zip1-0.0.1.img` with correct authentication.

#### `getImage`

Example:

```
dcs-tools -A -a b609fb83d5d24736aa36ca07b1b9f6aa -u todd+jan20@wigwag.com \
  -c https://devcloud.wigwag.io \
  getImage devicejs-zip1-0.0.1.img `pwd`
```

Downloads image `devicejs-zip1-0.0.1.img` and places it in the current working directory (output of `pwd`)

#### `createApp`

Example:

```
dcs-tools -A -a b609fb83d5d24736aa36ca07b1b9f6aa -u todd+jan20@wigwag.com \
  -c https://devcloud.wigwag.io createApp testApp1
```

Creates a new App called `testApp1` 

The App's type will default to `devicejs` which is currently the only supported App type.


#### `listApps`

Example:

```
dcs-tools -A -a b609fb83d5d24736aa36ca07b1b9f6aa -u todd+jan20@wigwag.com \
  -c https://devcloud.wigwag.io listApps

OK. [ { name: 'testApp1',
    type: 'devicejs',
    versions: [ '0.0.1', '0.0.2' ],
    _links: { self: [Object], versions: [] } } ]

```

Lists all Apps for the Account `b609fb83d5d24736aa36ca07b1b9f6aa`

In the example there one `devicejs` App called `testApp1`, with two versions: `0.0.1` and `0.0.2`

#### `publishApp`

Example:

```
dcs-tools -A -a b609fb83d5d24736aa36ca07b1b9f6aa -u todd+jan20@wigwag.com \
  -c https://devcloud.wigwag.io publishApp testApp1 0.0.1 \
  "{\"url\":\"https://code.wigwag.com/\
   example-devicejs-apps/zip1.zip\",\"checksum\":\
   \"000381f094c4dad9174d832afd18e227\",\"checksumType\":\"md5\",\"size\":271}" a-test-app
```

This is the JSON payload formatted out:

```
{
    "url": "https://code.wigwag.com/example-devicejs-apps/zip1.zip",
    "checksum": "000381f094c4dad9174d832afd18e227",
    "checksumType": "md5",
    "size": 271
}
```

This command publishes an App called `testApp1` with version `0.0.1` which is at URL `https://code.wigwagcom/examples-devicejs-apps/zip1.zip`

#### `createRelayConfig`

Example:

```
dcs-tools -A -d -a b609fb83d5d24736aa36ca07b1b9f6aa -u todd+jan20@wigwag.com \
   -c https://devcloud.wigwag.io createRelayConfig \
   "{\"name\":\"testConfig2\",\"accountID\":\"b609fb83d5d24736aa36ca07b1b9f6aa\",\
   \"processes\":[{\"name\":\"testProcess1\",\"type\":\"devicejs\",\"apps\":\
   [\"testApp1\"],\"limits\":{\"cpu\":0,\"memory\":0}}],\
   \"apps\":[{\"name\":\"testApp1\",\"version\":\"0.0.1\",\"enabled\":true,\
   \"configuration\":\"{\\\"fruits\\\":\\\"bannanas\\\"}\"}]}"

OK. Configuration created. id = 0face17d28dd446c87536040ca6c7a24
```

This creates a configuration of:
```
{
  "name": "testConfig2",
  "accountID": "b609fb83d5d24736aa36ca07b1b9f6aa",
  "processes": [
    {
      "name": "testProcess1",
      "type": "devicejs",
      "apps": [
        "testApp1"
      ],
      "limits": {
        "cpu": 0,
        "memory": 0
      }
    }
  ],
  "apps": [
    {
      "name": "testApp1",
      "version": "0.0.1",
      "enabled": true,
      "configuration": "{\"fruits\":\"bannanas\"}"
    }
  ]
}
```

So this is a single process, which will be termed `testProcess1` and will have logs which refer to said process. Inside this process is one _deviceJS_ app called `testApp1`. This `testApp1` will be passed a configuration string of: <br>
`"{\"fruits\":\"bannanas\"}"`

Note `.configuration` in the `.apps` objects array, must be a string.  Recommend using the following tools to get your JSON right:

- Write normal JSON, then minify it, using this: http://www.webtoolkitonline.com/json-minifier.html
- Then convert to escaped JSON for the command line: https://www.freeformatter.com/json-escape.html#ad-output

#### `applyRelayConfig`

Example:

```
dcs-tools -A -a b609fb83d5d24736aa36ca07b1b9f6aa -u todd+jan20@wigwag.com \
  -c https://devcloud.wigwag.io applyRelayConfig apply-config-task1 \
  WWRL000000 0face17d28dd446c87536040ca6c7a24

OK. Submitted. Task ID is 782a016ce3984a13af794e36c7a63c16
```

Creates a task `apply-config-task1` which applies the relay config `0face17d28dd446c87536040ca6c7a24` to `WWRL000000`

#### `getRelayTask`

Example:

```
dcs-tools -a b609fb83d5d24736aa36ca07b1b9f6aa -u todd+jan20@wigwag.com \
  -c https://devcloud.wigwag.io getRelayTask 1650e0e677b4460692d3fef540025c12

Ok. { _links: 
   { self: { href: '/relaytasks/1650e0e677b4460692d3fef540025c12' },
     subtasks: { href: '/relaytasks/1650e0e677b4460692d3fef540025c12/subtasks' } },
  submitted: '2017-09-14T21:59:39.673Z',
  id: '1650e0e677b4460692d3fef540025c12',
  state: 'submitted',
  relays: [ 'WWRL000000' ],
  op: 
   { type: 'upgrade',
     configurationID: '0face17d28dd446c87536040ca6c7a24' },
  remainingRelays: 1 }
```

#### `listRelayConfigs`

If you have created a Relay config, or want to see what is available, for a specific account:

```
bin/dcs-tools -a b609fb83d5d24736aa36ca07b1b9f6aa -u todd+jan20@wigwag.com -c https://devcloud.wigwag.io listRelayConfigs
Ok. [ { id: 'a319589064bf431cafd7d46a08d5eea8',
    name: 'testConfig1',
    accountID: 'b609fb83d5d24736aa36ca07b1b9f6aa',
    processes: 
     [ { name: 'testProcess1',
         type: 'devicejs',
         apps: [ 'testApp1' ],
         limits: { cpu: 0, memory: 0 } } ],
    apps: 
     [ { name: 'testApp1',
         version: '0.0.1',
         enabled: true,
         configuration: '{"fruits":"bannanas"}' } ],
    _links: { self: { href: '/relayconfigurations/a319589064bf431cafd7d46a08d5eea8' } } },
 ...
{ id: 'a319589064bf431cafd7d46a08d5eea8',
    name: 'testConfig1',
    accountID: 'b609fb83d5d24736aa36ca07b1b9f6aa',
    processes: 
     [ { name: 'testProcess1',
         type: 'devicejs',
         apps: [ 'testApp1' ],
         limits: { cpu: 0, memory: 0 } } ],
    apps: 
     [ { name: 'testApp1',
         version: '0.0.1',
         enabled: true,
         configuration: '{"fruits":"bannanas"}' } ],
    _links: { self: { href: '/relayconfigurations/a319589064bf431cafd7d46a08d5eea8' } } } ]
```


#### `getUsers`

#### `getAccounts`

#### `getAccountsExt`

#### `moveRelayToAccount`

Example:

```
dcs-tools  -u ygoyal@izuma.net -c https://devcloud.wigwag.io \
  moveRelayToAccount WWRL000000 \
  b609fb83d5d24736aa36ca07b1b9f6aa KYDZ9BAGAFU7N79S3KR3CJPBV

OK. Moved.
```

Moves the gateway `WWRL000000` to account `b609fb83d5d24736aa36ca07b1b9f6aa`. The Relay has pairing code `KYDZ9BAGAFU7N79S3KR3CJPBV` (which is required for moving).

In this case `ygoyal@izuma.net` is the super-admin of the cloud `devcloud.wigwag.io`. It is important that the login account have the appropriate permissions to be able to move a relay and place it in the stated account.

#### `getRelays`

Example:
 
```
dcs-tools -A -a b609fb83d5d24736aa36ca07b1b9f6aa -u todd+jan20@wigwag.com \
  -c https://devcloud.wigwag.io getRelays

OK.
Results: [ { id: 'WWRL00000D',
    pairingCode: 'QFRGB2M64BYRFMWHY8NRXCVMD',
    accountID: 'b609fb83d5d24736aa36ca07b1b9f6aa',
    siteID: '50fc5760b99a4470acab5b349de2fc9d',
    devicejsConnected: false,
    devicedbConnected: true,
    coordinates: { latitude: 30.2433238, longitude: -97.8456484 },
    _links: { self: [Object], site: [Object], account: [Object] } },

...

  { id: 'WWSR000017',
    pairingCode: 'BSHP3DHPINDCK2I82J6EF0S76',
    accountID: 'b609fb83d5d24736aa36ca07b1b9f6aa',
    siteID: '01ac8a23d0174230ab415bbb98550234',
    devicejsConnected: false,
    devicedbConnected: false,
    coordinates: { latitude: 37.376269, longitude: -121.9556573 },
    _links: { self: [Object], site: [Object], account: [Object] } } ]

```

Lists all gateways (aka. "relays") for stated account as an array of objects. The first one in the list is `WWRL00000D` and the last `WWSR000017`.

#### `createUserAccessRule`

Usage: `createUserAccessRule [user-email] [JSON-rule] {account-id}`

Where `account-id` is the account which this rule applies to. If the `[user-email]` only has one account, then the third parameter is not needed.

Example:

```
dcs-tools  -c https://devcloud.wigwag.io -u ygoyal@izuma.net createUserAccessRule ygoyal+wwdev1@wigwag.com {\"permissions\":[\"account_admin\"]} 
Access rule added successfully.

```

Above, `ygoyal@izuma.net` is a root admin for the cloud `devcloud.wigwag.io`. This command adds a rule which gives `ygoyal+wwdev1@wigwag.com` account admin privleges for `ygoyal+wwdev1@wigwag.com`'s account (allowing creation of sites, adding gateways, etc.) If `ygoyal+wwdev1@wigwag.com` has more than one account then the command will state that you must provide a third parameter with the account ID.

#### `getHistory`

#### `request`

### Typical Procedures

* [Adding Applications to Relay](https://github.com/armPelionEdge/enterprise-tools/blob/master/ADDING_APPS.md)
* [Moving Relays to Sites](https://github.com/armPelionEdge/enterprise-tools/blob/master/ACCOUNT_SITES.md)

