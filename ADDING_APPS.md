
# Deploying Applications

Details on how applications are deployed and managed on a gateway controlled by DCS.

## Overview

Application management is handled through a number of DCS API calls. These include calls in the `/apps`, `/relayconfigurations`, and `/relaytasks` sections of the API.  Note the term "relay" is synonymous with the term "gateway" in the DCS documentation.

```
                    ........                          
                  ..............    .....              
           .................................           
        ......................................         
       ........................................             
      ........................................         
       .........***********************......          
        ........|                     |........        
          ......|        DCS          |..........      
         .......|                     |..........      
       .........|                     |.........       
       .........***********************........        
        ........***********************......          
         .......|                     |....            
             ...|    relayMQ Server   |                
                |                     |                
                |                     |                
                ***********************                
                           |                           |             *           *
                           |                           |            ***         ***
                           |                           |             |           |
                           |   HTTPS                   |   Initial   |           |
                           |                           |   Request   |           |
                           |                           |             | Ack       |  Status 
                           |                           |             |           |  Updates
                           |                          ***            |           |
                 *********************                 *             |           |
                 |                   |                
                 |  relayMQ client   |                
                 |                   |               
                 *********************               
                .;;;;;;;;;;;;;;;;;;;;,...              
            .....*********************........        
        .........|                   |.......'        
        ,,'......|      maestro      |....''.         
         ..',,,'.|    w/ config DB   |..,'.           
            .....**********************,'.             
                .'''',:lolc;,'''''';lc.                
                      .....,;;;;;;;'.         Gateway / Relay
                           ........       
```

deviceOS, the gateway OS, runs a system management daemon called `maestro` Maestro will upon statup establish
a connection with DCS by way of a `relayMQ` connection. RelayMQ is a AMPQ-like connection which provides reliable 
messaging to and from the gateway.  Using a specific RelayMQ channel, maestro will get update requests for
the gateway.

When an update request tells the gateway to install and run a new application, maestro will download, verify, unpack and then start the application. 

Once successfully installed, the application's information will be stored in maestro's database. On the soft-relay, the database is stored in the `/config` volume as `maestro.db`. In deviceOS on physical relay, it will be in the `data` partition under `/wigwag`. The application is now persistent on the gateway or soft-relay.

If the gateway is rebooted, the application will be automatically started since the application is now permanently installed. Ohter DCS commands can remove or upgrade the application.

Maestro also starts all core services (which are just other "apps") and managed the configurations passed to these Apps on startup. If you kill maestro, you will kill all it's child processes.

```
# pstree
bash-+-avahi-daemon---avahi-daemon
     |-dbus-daemon
     |-emacs---{gmain}
     `-entry.sh---maestro-+-devicedb---10*[{devicedb}]
                          |-2*[node-+-4*[{V8 WorkerThread}]]
                          |         `-5*[{node}]]
                          |-node-+-4*[{V8 WorkerThread}]
                          |      `-6*[{node}]
                          `-20*[{maestro}]
```

## Adding applications 

Adding applications to one or more gateways involves a number of steps:

1. Place an image at a specific URL. The currently only supported image type is a .zip file.

1. Create a new App entry in DCS. This basically creates a unique name (unique cloud wide) for 
the App, which will be used to refer to App and all it's versions, in all configurations. This is done
with the [`createApp`](https://github.com/WigWagCo/enterprise-tools#createapp) command in `dcs-tools` which uses the `PUT /apps/{appName}` REST call. 

1. Create a _version_ of the App in DCS, which will inform DCS about the image's location. 
This is done with the [`publishApp`](https://github.com/WigWagCo/enterprise-tools#publishapp) commands in `dcs-tools` which uses
the `PUT /apps/{appname}/versions/{version}` REST call.

1. Next you will create a _Relay configuration_ which defines which App (one or more) will be ran in what process. For simplicity sake
you can simply define a single process here, which will run your single App. This is done through the [`createRelayConfig`](https://github.com/WigWagCo/enterprise-tools#createrelayconfig)
which uses the `POST /relayconfigurations` REST call.

1. Finally, you can _apply_ this configuration to one or more Relays / gateways. This is done with the [`applyRelayConfig`](https://github.com/WigWagCo/enterprise-tools#applyrelayconfig) command
in `dcs-tools` which uses the `POST /relaytasks` REST call. This call will give you a _Task ID_ back. 

1. The _Task ID_ can be followed up on with the [`getRelayTask`](https://github.com/WigWagCo/enterprise-tools#getrelaytask) command. This is implemented
using the `GET /relaytasks/{taskId}` REST call. 

