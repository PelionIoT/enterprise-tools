# Firmware update

### For firmware upgrade and manifest commands to work

For use of commands to manage device firmware and upgrade the gateways: 

    ./install.sh

## Commands

#### `listFirmwareImages`

Example:

```
dcs-tools -c <CLOUD-URL> -k <KEY> listFirmwareImages
------------------------------------------------------------------------------------------------
SNo | ID                               | Image Size   | Name
------------------------------------------------------------------------------------------------
 1  | 016a1f7345b1000000000001001002ba | 2169         | factory-diff-25-24
 2  | 016a20a9069e000000000001001003e5 | 48383763     | factory-diff-26-25
 3  | 016a2270c4ce00000000000100100000 | 2174         | 26to27-factory-diff
 4  | 016a5b21b79500000000000100100061 | 91130801     | 35-24-factory-diff
 5  | 016a68a75cb0000000000001001002d8 | 55155925     | RPi upgrade 36-26
------------------------------------------------------------------------------------------------
```
Lists all firmware images in the device management system.

#### `addFirmwareImage`

This command should be executed in shell mode.

Example:

```
DCS(api-os2)> addFirmwareImage
Enter the fw image path - diff-dev-3-to-4.tar.gz
Enter the fw image name - upgrade-rpi-dev-3-to-4
Enter the description - Demo upgrade rpi
Firmware uploaded successfully, response - {
    "_api": { // api data
    },
    "createdAt": "2019-06-18T07:47:57.760246Z",
    "url": "http://firmware-catalog-media-8a31.s3.dualstack.eu-west-1.amazonaws.com/0168e7bff4f2263cf4be560700000000/016b698bdb9d0000000000010010019d",
    "datafileSize": 45822491,
    "description": "Demo upgrade rpi",
    "id": "016b698e8ac1000000000001001001a8",
    "name": "upgrade-rpi-dev-3-to-4",
    "updatedAt": "2019-06-18T07:47:57.764141Z"
}
```
Add/upload a new firmware image `diff-dev-3-to-4.tar.gz` with name `upgrade-rpi-dev-3-to-4` to the cloud. If the upload is successfull, it returns `image id` (here 016b698e8ac1000000000001001001a8) in response. 

#### `listFirmwareManifests`

Example:

```
dcs-tools -c <CLOUD-URL> -k <KEY> listFirmwareManifests
-----------------------------------------------------------------------------------------------------------------------------------------
SNo | ID                               | Device Class                         | Name
-----------------------------------------------------------------------------------------------------------------------------------------
 1  | 016a1f8f01db0000000000010010032a | c56f3a62-b52b-4ef6-95a0-db7a6e3b5b21 | manifest-factory-diff-25-24
 2  | 016a20ab498f000000000001001003f2 | c56f3a62-b52b-4ef6-95a0-db7a6e3b5b21 | manifest_26-25
 3  | 016a227304f600000000000100100006 | c56f3a62-b52b-4ef6-95a0-db7a6e3b5b21 | manifest-factory-26-to-27
 4  | 016a2479961d0000000000010010004d | c56f3a62-b52b-4ef6-95a0-db7a6e3b5b21 | factory-diff-26to27-take2
 5  | 016a5b1f72c500000000000100100054 | c56f3a62-b52b-4ef6-95a0-db7a6e3b5b21 | manifest-austin-mvp1-35-24-diff
----------------------------------------------------------------------------------------------------------------------------------------
```
Lists all firmware manifest bins in the device management system.

#### `createFirmwareManifest`

This command should be executed in shell mode.

Example:

```
DCS(api-os2)> createFirmwareManifest
------------------------------------------------------------------------------------------------
SNo | ID                               | Image Size   | Name
------------------------------------------------------------------------------------------------
 1  | 016aafcb67d8000000000001001001e8 | 45819964     | build-gateway-ww-developer-3-to-4
 2  | 016aafeec8920000000000010010027f | 45256531     | jusruu-test-8-to-9
 3  | 016ab5d8aab900000000000100100213 | 47293321     | jusruu-test-9-to-10
 4  | 016ac0dddbf600000000000100100096 | 59836922     | diff-gateway-ww-developer-4-to-5
 5  | 016b698e8ac1000000000001001001a8 | 45822491     | upgrade-rpi-dev-3-to-4
------------------------------------------------------------------------------------------------
Make sure the image is uploaded, or run addFirmwareImage first.
Select the firmware - 5
Enter the local firmware path - diff-dev-3-to-4.tar.gz
Enter the update certificate - default.der
Enter the certificate key - default.key.pem
Enter the manifest name - manifest-rpi-dev-3-to-4
Enter the description - Demo upgrade manifest
Manifest created - manifests/manifest-rpi-dev-3-to-4.bin
Would you like to upload this manifest (yes/no) ? - yes
Manifest uploaded successfully with id - 016b699bda96000000000001001001dc
```
Creates and upload a new firmware manifest `manifest-rpi-dev-3-to-4.bin` with name `manifest-rpi-dev-3-to-4` to the cloud. Requires the firmware image, update cert, key, manifest name and optional description. If the upload is successfull, it returns `manifest id` (here 016b699bda96000000000001001001dc) in response.

#### `addFirmwareManifest`

This command should be executed in shell mode.

Example:

```
DCS(api-os2)> addFirmwareManifest
Enter the manifest bin file - manifests/manifest-rpi-dev-3-to-4.bin
Enter the manifest name - manifest-rpi-dev-3-to-4
Enter the description - Demo manifest
Manifest uploaded successfully, with id - 016b699bda96000000000001001001dc
```
Upload a new firmware manifest bin `manifest-rpi-dev-3-to-4.bin` with name `manifest-rpi-dev-3-to-4` to the cloud. Requires the manifest bin, manifest name and optional description. If the upload is successfull, it returns `manifest id` (here 016b699bda96000000000001001001dc) in response.

#### `startUpdateCampaign`

This command should be executed in shell mode.

Example:

```
DCS(api-os2)> startUpdateCampaign
Are you sure you want to upgrade this site (yes/no) ?yes
-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
SNo | ID                               | Device Class                         | Name
-----------------------------------------------------------------------------------------------------------------------------------------
 1  | 016ab5dd303700000000000100100230 | 42fa7b48-1a65-43aa-890f-8c704daade54 | jusruu-test-9-to-10
 2  | 016ac462578500000000000100100091 | c56f3a62-b52b-4ef6-95a0-db7a6e3b5b21 | manifest-gw-ww-developer 4 to 5
 3  | 016ae456ad370000000000010010008a | c56f3a62-b52b-4ef6-95a0-db7a6e3b5b21 | diff-gateway-ww-developer-4-to-5-2
 4  | 016b12f3130c0000000000010010032b | c56f3a62-b52b-4ef6-95a0-db7a6e3b5b21 | manifest-gw-dev-3-to-4
 5  | 016b699bda96000000000001001001dc | c56f3a62-b52b-4ef6-95a0-db7a6e3b5b21 | manifest-rpi-dev-3-to-4
-----------------------------------------------------------------------------------------------------------------------------------------
Make sure the manifest is uploaded, or run addFirmwareManifest first.
Select the manifest - 5
Enter the campaign name - Test-Campaign-1
Enter the description - Demo update campaign
Campaign started with id - 016b69cf36d100000000000100100147 , state - scheduled , phase - starting
```
Create and start a new update campaign with name `Test-Campaign-1` to the cloud. Requires selecting an uploaded manifest to be applied, and an optional description. Applied update on the set site. If the campaign is started successfully, it returns `campaign id` (here 016b69cf36d100000000000100100147), `state`(scheduled/created/publishing/stopped) and `phase` in response.

#### `getCampaign`
Usage: getCampaign [campaign-id]

Example:

```
DCS(api-os2)> getCampaign 016b69cf36d100000000000100100147
Campaign data - {
    "_api": { // api data
    },
    "deviceFilter": {
        "alias": {
            "$eq": "016b69c963a500000000000100100288"
        }
    },
    "createdAt": "2019-06-18T08:58:36.019Z",
    "description": "Demo update campaign",
    "finishedAt": null,
    "id": "016b69cf36d100000000000100100147",
    "manifestId": "016b699bda96000000000001001001dc",
    "manifestUrl": "https://api-os2.mbedcloudstaging.net/v3/firmware-manifests/016b699bda96000000000001001001dc",
    "name": "Test-Campaign-1",
    "startedAt": "2019-06-18T08:58:37.739Z",
    "state": "publishing",
    "phase": "active",
    "scheduledAt": null,
    "updatedAt": "2019-06-18T08:58:38.118Z"
}
```
Returns the campaign details, device filter applied, metadata and current status.

#### `listCampaignDeviceStates`
Usage: listCampaignDeviceStates [campaign-id]

Example:

```
DCS(api-os2)> listCampaignDeviceStates 016b69cf36d100000000000100100147
------------------------------------------------------------------------------------------------------------
SNo | DeviceID                         | Name                             | State
------------------------------------------------------------------------------------------------------------
 1  | 016b69c963a500000000000100100288 | 016b69c963a500000000000100100288 | deployed
------------------------------------------------------------------------------------------------------------
```
Lists the status of devices in an update campaign.

`Note: The device is successfully upgraded if the state has reached deployed.`
