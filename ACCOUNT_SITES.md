# Site & Accounts

General hiearchy in DCS.
```
************
* Accounts *
************
            \ 
             \
             ***********
             *  Sites  *
             ***********
                        \
                         \
                          ************
                          * Gateways *
                          ************
```

Normally, Gateways (aka "Relays") belong in a Site. An account, may have one or more Sites. Sites may also be groups in "Site Groups" which serve as a way to select multiple Sites as one.

Gateways may also not be in a Site. However, certain DCS APIs will not work for Gateways, unless they are placed in a Site first.

## Privledges

A user which wants to create, delete and move Relays into Sites, must have the `account_admin` privledge for the specific account in question.

The `dcs-tools` command `createUserAccessRule` can add a `account_admin` permission rule. Example:
```
DCS(devcloud)> createUserAccessRule ed+test1@izuma.net {"permissions":["account_admin"]}
DCS(devcloud)> Access rule added successfully.
```

Here user `ed+test1@izuma.net` will now have `account_admin` permissions for the account `dcs-tools` is current logged in with. If you need to switch accounts, use the `set-accountid` command in the shell, or use the `-a [accountID]` option on the command line. `dcs-tools` must be logged in as a super-admin user to run such a command.

This command has multiple steps with regard to the actual API. It will look up the user ID `ed+test1@izuma.net` in DCS. It will then add an access rule for that user's ID, for the account currently logged in.

## Looking & Creating Sites

Use `getSites` to see the sites in the account.

```DCS(mbed)> getSites
OK.
Results: { c928809b1a29464f8c5620e13c9a0476: 
   { id: 'c928809b1a29464f8c5620e13c9a0476',
     accountID: 'c2eaa64165f9437c98f8299dd893c4e6',
     active: true,
     name: 'c928809b1a29464f8c5620e13c9a0476',
     _links: 
      { self: [Object],
        relays: [],
        resources: [Object],
        groups: [Object],
        history: [Object],
        database: [Object],
        account: [Object],
        interfaces: [Object],
        resourcetypes: [Object] } } }
```

Use `createSite` to make a new Site.

```DCS(mbed)> createSite testSite
siteID not defined. Run getSites then set-siteid to define it else commands might not work 
OK.
Results: { id: 'c928809b1a29464f8c5620e13c9a0476',
  accountID: 'c2eaa64165f9437c98f8299dd893c4e6',
  active: true,
  name: 'c928809b1a29464f8c5620e13c9a0476',
  _links: 
   { self: { href: '/sites/c928809b1a29464f8c5620e13c9a0476' },
     relays: [],
     resources: { href: '/sites/c928809b1a29464f8c5620e13c9a0476/resources' },
     groups: { href: '/sites/c928809b1a29464f8c5620e13c9a0476/groups/' },
     history: { href: '/history?siteID=c928809b1a29464f8c5620e13c9a0476' },
     database: { href: '/sites/c928809b1a29464f8c5620e13c9a0476/database' },
     account: { href: '/accounts/c2eaa64165f9437c98f8299dd893c4e6' },
     interfaces: { href: '/sites/c928809b1a29464f8c5620e13c9a0476/interfaces' },
     resourcetypes: { href: '/sites/c928809b1a29464f8c5620e13c9a0476/resourcetypes' } } }
```

Here the new site has a Site ID of `c928809b1a29464f8c5620e13c9a0476`

## Moving Gateways into Sites

Gateways can be moved into a Site, by an Account Admin, by using the `moveRelayToSite` command. This requires the Relay ID and the pairing code of the Relay. You can get this information using the `getRelays`. If you need information about a Relay which is not bound to a site, make sure your site ID is `undefined` (don't set it). Super admin can also see all Relays across all accounts.

You will get an array of one or more objects about each Relay. Here is a single Relay example:
```
{ id: 'WWSR00000V',
    pairingCode: '4DB9YGBI99VD2HFA9WTYRHXH4',
    accountID: 'c2eaa64165f9437c98f8299dd893c4e6',
    siteID: 'c928809b1a29464f8c5620e13c9a0476',
    devicejsConnected: true,
    devicedbConnected: true,
    coordinates: { latitude: 0, longitude: 0 },
    _links: 
     { self: { href: '/relays/WWSR00000V' },
       site: { href: '/sites/c928809b1a29464f8c5620e13c9a0476' },
       account: { href: '/accounts/c2eaa64165f9437c98f8299dd893c4e6' } } }
```

The `pairingCode` and `id` are visible. 

To move the Relay do a `moveRelayToSite`

```
DCS(mbed)> moveRelayToSite WWSR00000V c928809b1a29464f8c5620e13c9a0476 4DB9YGBI99VD2HFA9WTYRHXH4
OK. Moved.
```

