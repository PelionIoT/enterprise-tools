# Edge Command Line Tool
## Commands
### **1.** **help** 

Lists all the commands available to the user in the edge-tool with their usage and example

```
DCS(lab-api)> help

Commands:

    request [selection] [command] [[arguments...]]
       * requires account ID
       * arguments should be wrapped as a stringified JSON array

    postRequests [selection][command] [type] [property] [argument] [value]
        Generic Request function

    executeSiteResourceCommand [deviceID] [command] [argument]
        Execute command on device controller

    getDiagnostics
        Relay description

    createSite
        Create a new site within your account

    getSites
        List and iterate through sites within an account

    getSiteresourcetypes
        List resources types registered at a site
```
### **2.** **info** 

Provides the logged in user information

```
DCS(lab-api)> info
siteID not defined. Run getSites then set-siteid to define it else commands might not work 
Cloud URL: https://lab-api.mbedcloudintegration.net
Account ID: 0166f9ba7080361e2d83535*****
Site ID: undefined
Site Name: undefined
Logged in as: *********@***.com
Config storage file: /home/****/.dcs-tools
```
### **3.** **debug**

Turns on debug output (helps developers to debug the api)

```
DCS(lab-api)> debug on
```
### **4.** **set-accountid**

Sets the active account for the shell to use

```
DCS(lab-api)> set-accountid 016a754a3d2a00000000****** 
Account ID is now: 016a754a3d2a00000000000******
```

### **5.** **set-siteid**

Sets the site ID/gateway for the shell to use

```
DCS(lab-api)> set-siteid 016a754a3d2a00***0000001001001e6
Site ID is now: 016a754a3d2a00000000000***1001e6
 Validating whether the site exists in the account... 
Site exists in the account
```
### **6.** **subscribeToEvents**

subscribe To Events inorder to get updates particular to that site/gateway

```
DCS(lab-api)> subscribeToEvents
using url  https://lab-api.mbedcloudintegration.net/wigwag/api/accounts/0166f9ba7080361e2d83535a00000000/events
Events webSocket connection established
```
### **7.** **led**

Updates the value of the led driver 

```
DCS(lab-api)> led
OK.
Results: SUCCESS 200
```
### **8.** **locateGateway**

Spot the physical gateway, as led color of gateway changes  

```
DCS(lab-api)> locateGateway
OK.
Results: SUCCESS 200
```
### **9.** **getLoginHistory**

List the login history of the account  

### **10.** **uploadEnrollmentID**

Upload the enrollment identity of the gateway after provisioning of it  

```
DCS(lab-api)> uploadEnrollmentID 'A-35:e7:72:8a:07:50:3b:3d:75:96:57:52:72:41:0d:78:cc:c6:e5:53:48:c5'
```
### **11.** **uploadEnrollmentID**

Upload the enrollment identity of the gateway after provisioning of it  

```
DCS(lab-api)> uploadEnrollmentID 'A-35:e7:72:8a:07:50:3b:3d:75:96:57:52:72:41:0d:78:cc:c6:e5:53:48:c5'
```
### **12.** **getRelays**

List down all the gateways binded to that account  

```
DCS(lab-api)> getRelays
OK.
-----------------------------------------------------------------------------------------------------------------------
ID                               | SiteID                           | devicejs connected  | Site Name            
-----------------------------------------------------------------------------------------------------------------------
```
### **13.** **listSiteResources**

List all the resources attached to a site 

```
DCS(lab-api)> listSiteResources
---------------------------------------------
Reachable | Resource
---------------------------------------------
true	  | DevStateManager
true	  | LEDDriver
false	  | MbedDeviceJSBridge
true	  | RelayStats
true	  | VirtualMultiSensor12
true	  | VirtualMotionSensor9
true	  | VirtualOverride10
true	  | VirtualButton2
true	  | VirtualButton20
true	  | VirtualBattery1
true	  | VirtualContactSensor3
true	  | VirtualDeviceDriver

```
### **14.** **listDevices**

List all the resources attached to a site 

```
DCS(lab-api)> listDevices
---------------------------------------------
Reachable | ResourceID | Name | Icon
---------------------------------------------
true	  | VirtualMultiSensor12 | VirtualMultiSensor12 | &#x007c
true	  | VirtualMotionSensor9 | VirtualMotionSensor9 | &#x004d
true	  | VirtualOverride10 | VirtualOverride10 | &#x0070
true	  | VirtualButton2 | VirtualButton2 | &#x0070
true	  | VirtualButton20 | VirtualButton20 | &#x0070
true	  | VirtualBattery1 | VirtualBattery1 | &#x0070
true	  | VirtualContactSensor3 | VirtualContactSensor3 | &#x004c
true	  | VirtualDoorLock4 | VirtualDoorLock4 | &#x2b56
true	  | VirtualFlipflop5 | VirtualFlipflop5 | &#x0067
true	  | VirtualHumiditySensor6 | VirtualHumiditySensor6 | &#x00ae
true	  | VirtualLuminance8 | VirtualLuminance8 | &#x0030
true	  | VirtualLightBulb7 | VirtualLightBulb7 | &#x0070
true	  | VirtualPanelLight11 | VirtualPanelLight11 | &#x0070
true	  | VirtualRegulator13 | VirtualRegulator13 | &#x0064
true	  | VirtualSmokeAlarm14 | VirtualSmokeAlarm14 | &#x2b53
true	  | VirtualTemperature15 | VirtualTemperature15 | &#x0074
true	  | VirtualThermostat16 | VirtualThermostat16 | &#x0074
true	  | VirtualUltraviolet17 | VirtualUltraviolet17 | &#x00e5
true	  | VirtualVibrationSensor18 | VirtualVibrationSensor18 | &#x004c
true	  | VirtualWaterLeak19 | VirtualWaterLeak19 | &#x2b3c
false	  | cpu-temperature-00:a5:09:63:75:66 | cpu-temperature-00a509637566 | &#x0074
false	  | thermometer-00:a5:09:63:75:66 | thermometer-00a509637566 | &#x0074
---------------------------------------------
```
### **15.** **forgetSiteResource**

Used to delete or unpair a device from the gateway 

```
DCS(lab-api)> forgetSiteResource VirtualButton20
are you sure (yes/no)?yes
OK.
Results: []
```

### **16.** **getSiteResourceState**

Gives the state of the resource 

```
DCS(lab-api)> getSiteResourceState VirtualMultiSensor12
OK.
Results: {
    "VirtualMultiSensor12": {
        "motion": true,
        "battery": 88,
        "tamper": false,
        "luminance": 45,
        "ultraviolet": 44,
        "temperature": 75
    }
}
```
### **17.** **getSiteResourceState**

Gives the state of the resource 

```
DCS(lab-api)> getSiteResourceState VirtualMultiSensor12
OK.
Results: {
    "VirtualMultiSensor12": {
        "motion": true,
        "battery": 88,
        "tamper": false,
        "luminance": 45,
        "ultraviolet": 44,
        "temperature": 75
    }
}
```
### **18.** **updateSiteResourceState**

updates the state of a resource 

```
DCS(lab-api)> updateSiteResourceState VirtualLightBulb7 power off
OK.
Results: Resource state updated successfully via CUIS
```
### **19.** **getAccounts**

List all accountID to the cloud 

```
DCS(lab-api)> getAccounts
OK.
Results: [ { id: '0166f9ba7080****35a0000***,
    name: 'Account 0166f9ba7080****35a0000***',
    _links:
     { self: [Object],
       requests: [Object],
       relayconfigurations: [Object],
       siteGroups: [Object],
       roles: [Object],
       relays: [Object],
       subscriptions: [Object],
       users: [Object],
       monitors: [Object],
       clients: [Object],
       endpoints: [Object],
       history: [Object],
       alerts: [Object],
       relaytasks: [Object],
       sites: [Object] } } ]
```
### **20.** **getDiagnostics**

Provides information about the gateway 

```
OK.
Last Updated: 7s ago
Results: {
    "Relay": {
        "Relay ID": "DEV0000K33",
        "Relay IP Address": "192.168.1.104",
        "Relay software version": "1.0.84",
        "Relay hardware version": "rpi3bplus",
        "Radio config": "00",
        "Relay LED config": "RGB",
        "Ethernet MAC": "00:a5:09:63:75:66",
        "Software Uptime": "8.2 Hrs",
        "System Uptime": "06:11:13 up  8:11",
        "SSH": "0 users",
        "Devicedb version": "1.9.3",
        "LED Status": "BLINKING_BLUE",
        "Cloud": "https://gateways.mbedcloudintegration.net",
        "Mbed Edge Core": {}
    },
    "Peripherals": {
        "ZigBee": "NOT_CONFIGURED",
        "ZigBee channel": "UNKNOWN",
        "ZigBee PAN ID": "UNKNOWN",
        "Z-Wave": "NOT_CONFIGURED",
        "6LoWPAN": "NOT_CONFIGURED",
        "6LoWPAN channel": "UNKNOWN",
        "6LoWPAN PAN ID": "UNKNOWN",
        "Modbus": "NOT_CONFIGURED",
        "Modbus serial port": "UNKNOWN",
        "Bacnet": "NOT_CONFIGURED",
        "Bacnet serial port": "UNKNOWN",
        "Enocean": "NOT_CONFIGURED",
        "Enocean serial port": "UNKNOWN",
        "Virtual": "up"
    },
    "metadata": {
        "LED Status": "BLINKING_BLUE",
        "LED Sequence": {
            "color": [
                "#0000FF",
                "#000000"
            ],
            "period": 500
        },
        "timestamp": 1557396674577,
        "lastUpdated": "7s ago"
    },
    "DevicesPerProtocol": {
        "Modbus": 0,
        "Bacnet": 0,
        "6LoWPAN": 0,
        "ZigBee": 0,
        "Virtual": 19,
        "Z-Wave": 0
    },
    "System": {
        "Total Memory": "949MB",
        "Memory Consumed": "33%",
        "Varlog": "0.69%",
        "Factory Disk": "60%",
        "Database": "1%",
        "User Disk": "13%",
        "CPU": "45.4687%",
        "Memory Available": "66.95%"
    }
}
```
### **21.** **getUsers**

List and iterate through users within an account. An administrator will be able to list all users 

```
```

### **21.** **VirtualDeviceTemplateslist**

List available virtual devices templates

```
DCS(lab-api)> VirtualDeviceTemplateslist
OK.
Results: {
    "VirtualDeviceDriver": {
        "templates": [
            "Battery",
            "Button",
            "ContactSensor",
            "DoorLock",
            "Flipflop",
            "HumiditySensor",
            "LightBulb",
            "Luminance",
            "MotionSensor",
            "MultiSensor",
            "Override",
            "PanelLight",
            "Regulator",
            "SmokeAlarm",
            "Temperature",
            "Thermostat",
            "Ultraviolet",
            "VibrationSensor",
            "WaterLeak"
        ]
    }
}
```
### **22.** **VirtualDeviceList**

List created virtual device controller's resourceIDs

```
DCS(lab-api)> VirtualDeviceList
OK.
Results: {
    "VirtualDeviceDriver": {
        "devices": [
            "VirtualBattery1",
            "VirtualButton2",
            "VirtualContactSensor3",
            "VirtualDoorLock4",
            "VirtualFlipflop5",
            "VirtualHumiditySensor6",
            "VirtualLightBulb7",
            "VirtualLuminance8",
            "VirtualMotionSensor9",
            "VirtualMultiSensor12",
            "VirtualOverride10",
            "VirtualPanelLight11",
            "VirtualRegulator13",
            "VirtualSmokeAlarm14",
            "VirtualTemperature15",
            "VirtualThermostat16",
            "VirtualUltraviolet17",
            "VirtualVibrationSensor18",
            "VirtualWaterLeak19",
            "VirtualButton20"
        ]
    }
}
```
### **23.** **VirtualDeviceCreate**

Create new device controller from available templates. It returns the resourceID on which new device controller is created

```
DCS(lab-api)> VirtualDeviceCreate Button
complete
OK.
Results: 'Started controller with id VirtualButton21'
```
### **24.** **VirtualDeviceStop**

Stops the running device controller. It takes valid resourceID as argument

```
DCS(lab-api)> VirtualDeviceStop VirtualButton21
OK.
Results: 200
```
### **25.** **VirtualDeviceDelete**

Stops and forgets a virtual device controller

```
DCS(lab-api)> VirtualDeviceDelete VirtualButton21
are you sure (yes/no)?yes
OK.
Results: 200
```
### **26.** **VirtualDeviceStopPeriodicEvents**

Stops all periodic events for virtual devices

```
DCS(lab-api)> VirtualDeviceStopPeriodicEvents
complete
OK.
Results: 'Stopped successfully'
```
### **27.** **VirtualDeviceStopPeriodicEvents**

Starts all periodic events for virtual devices

```
DCS(lab-api)> VirtualDeviceGeneratePeriodicEvents
This command will generate periodic events for all the registered Virtual Devices
complete
OK.
Results: 'Started successfully'
```
### **28.** **VirtualDeviceLogLevel**

Generate periodic events for all the registered virtual devices

```
DCS(lab-api)> VirtualDeviceLogLevel 2
This command will generate periodic events for all the registered Virtual Devices
complete
OK.
Results: 'Success. No timeout. No error!'
```
### **29.** **VirtualDeviceUpdate**

Will update soon

### **30.** **VirtualDeviceProgress**

Will update soon

```
DCS(lab-api)> VirtualDeviceProgress
OK.
Results: {
    "VirtualDeviceDriver": {
        "progress": {
            "Battery": {
                "progressBar": 0,
                "message": "",
                "inProgress": false,
                "count": 0
            },
            "Button": {
                "progressBar": 0,
                "message": "",
                "inProgress": false,
                "count": 3
            },
            "ContactSensor": {
                "progressBar": 0,
                "message": "",
                "inProgress": false,
                "count": 0
            },
            "DoorLock": {
                "progressBar": 0,
                "message": "",
                "inProgress": false,
                "count": 0
            },
            "Flipflop": {
                "progressBar": 0,
                "message": "",
                "inProgress": false,
                "count": 0
            },
            "HumiditySensor": {
                "progressBar": 0,
                "message": "",
                "inProgress": false,
                "count": 0
            },
            "LightBulb": {
                "progressBar": 0,
                "message": "",
                "inProgress": false,
                "count": 0
            },
            "Luminance": {
                "progressBar": 0,
                "message": "",
                "inProgress": false,
                "count": 0
            },
            "MotionSensor": {
                "progressBar": 0,
                "message": "",
                "inProgress": false,
                "count": 0
            },
            "MultiSensor": {
                "progressBar": 0,
                "message": "",
                "inProgress": false,
                "count": 0
            },
            "Override": {
                "progressBar": 0,
                "message": "",
                "inProgress": false,
                "count": 0
            },
            "PanelLight": {
                "progressBar": 0,
                "message": "",
                "inProgress": false,
                "count": 0
            },
            "Regulator": {
                "progressBar": 0,
                "message": "",
                "inProgress": false,
                "count": 0
            },
            "SmokeAlarm": {
                "progressBar": 0,
                "message": "",
                "inProgress": false,
                "count": 0
            },
            "Temperature": {
                "progressBar": 0,
                "message": "",
                "inProgress": false,
                "count": 0
            },
            "Thermostat": {
                "progressBar": 0,
                "message": "",
                "inProgress": false,
                "count": 0
            },
            "Ultraviolet": {
                "progressBar": 0,
                "message": "",
                "inProgress": false,
                "count": 0
            },
            "VibrationSensor": {
                "progressBar": 0,
                "message": "",
                "inProgress": false,
                "count": 0
            },
            "VideoCamera": {
                "progressBar": 0,
                "message": "",
                "inProgress": false,
                "count": 0
            },
            "WaterLeak": {
                "progressBar": 0,
                "message": "",
                "inProgress": false,
                "count": 0
            },
            "button": {
                "progressBar": 0,
                "message": "",
                "inProgress": false,
                "count": 0
            }
        }
    }
}
```
### **31.** **getAllResourceStates**

Return state of each resource

```
DCS(lab-api)> getAllResourceStates
OK.
Results: {
    "discoveredDevices": [
        "VirtualBattery1",
        "VirtualDoorLock4",
        "VirtualMultiSensor12",
        "VirtualMotionSensor9",
        "VirtualOverride10",
        "VirtualButton2",
        "VirtualContactSensor3",
        "VirtualFlipflop5",
        "VirtualHumiditySensor6",
        "VirtualLuminance8",
        "VirtualLightBulb7",
        "VirtualPanelLight11",
        "VirtualRegulator13",
        "VirtualSmokeAlarm14",
        "VirtualTemperature15",
        "VirtualThermostat16",
        "VirtualUltraviolet17",
        "VirtualVibrationSensor18",
        "VirtualWaterLeak19",
        "cpu-temperature-00:a5:09:63:75:66",
        "thermometer-00:a5:09:63:75:66"
    ],
    "VirtualBattery1": {
        "facades": [
            "Facades/HasBattery"
        ],
        "resourceType": "Core/Devices/Virtual/Battery",
        "uiPlacement": {
            "1": {
                "HasBattery": true
            },
            "2": {},
            "3": {}
        }
    }
}
```
### **32.** **renameDevice**

Rename any device

```
DCS(lab-api)> renameDevice renameDevice VirtualButton22 'TEST Button'
complete
OK.
Results: 'Success. No timeout. No error!'
```
### **33.** **getAllDeviceNames**

List the devices with their names

```
DCS(lab-api)> renameDevice renameDevice VirtualButton22 'TEST Button'
OK.
Results: SUCCESS { 'thermometer-00:a5:09:63:75:66': 'thermometer-00a509637566',
  VirtualButton22: 'TEST Button'
  }
```