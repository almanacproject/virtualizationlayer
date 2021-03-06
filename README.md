# Docker image
The recommended way to install/deploy the Virtualization Layer is via its Docker image:
https://hub.docker.com/r/almanacproject/virtualizationlayer/

# Deployment
Either after using Docker (above) or a manual installation (below),
it is good to put a reverse proxy in front of the Virtualization Layer for adding a layer of security, with TLS for HTTPS and Secure WebSocket.
We suggest using the open source https://traefik.io/

See https://github.com/almanacproject/almanacdeployment/blob/master/docker-compose.ssl.lab.yml

# Manual installation of the Virtualization Layer
Requires Node.js >= 0.10.40, and NPM 1.4.28+.
Uses cURL for requests to the Resource Catalogue.
For MQTT, recommend protocol 3.1.1+ (e.g. Mosquitto version 1.3+).


1. See http://nodejs.org.
	* On Ubuntu 16.04+ or Debian 9+:
	```sh
	apt-get install nodejs nodejs-legacy npm curl
	```

	* Otherwise, use https://github.com/nodesource/distributions
		* Compatible with e.g. Raspberry Pi 3

2. Create and move to the directory where the VirtualizationLayer should be located, e.g.

```sh
mkdir -p /opt/virtualization-layer/
cd /opt/virtualization-layer/
```

3. Deploy the VirtualizationLayer source-code

```sh
git clone https://github.com/almanacproject/virtualizationlayer
```

A suggestion of path is to put it in `/opt/virtualization-layer/`

4. Use `npm` to fetch the libraries and dependencies automatically:

For a production deployment:

```sh
npm install --production
```

Or if you want to perform continuous integration and other tests, leave out the `production` flag:

```sh
npm install
```

> The main dependencies include `request`, `ws`, `mqtt`, `node-ssdp`, `jsonwebtoken`.


# Setup of the Virtualization Layer

Look at the `config.js` without changing it, and edit a `config.local.js` file according to your network (and example is provided in `config.local.example.js`).



# Testing the Virtualization Layer:
(Only available when the installation was done without the `production` flag)

```sh
npm test
```


# Running the Virtualization Layer
If you are not using Docker, then there is a number of alternatives.

## Either manually:

```sh
cd /opt/virtualization-layer/
nodejs index.js
```

## Or by using "pm2" https://github.com/Unitech/pm2
TODO: Finish documentation

```sh
sudo npm install -g pm2
pm2 start /usr/bin/nodejs /opt/virtualization-layer/index.js -- -v
pm2 save
pm2 startup
```

## Or from a cron at restart:
Edit the file `/etc/cron.d/almanac` and add:

```sh
@reboot root cd /opt/virtualization-layer/ && /usr/bin/nodejs /opt/virtualization-layer/index.js >> /var/log/virtualization-layer/virtualization-layer.log 2>&1 &
```

## Or from a Linux Upstart service

Add a new file `/etc/init/virtualization-layer.conf`

```sh
description	"ALMANAC VirtualizationLayer"

start on net-device-up
stop on shutdown

respawn
respawn limit 30 60

script
	cd /opt/virtualization-layer
	exec sudo -u almanac /usr/bin/nodejs /opt/virtualization-layer/index.js >> /var/log/virtualization-layer/virtualization-layer.log 2>&1
end script
```

And then use it a a service, such as:

```sh
service virtualization-layer restart
```


# Virtualization Layer API

## Pages

* Public information about the instance: /virtualizationLayerInfo
* More internal information about the instance: /internalStatus
* List of known instances in the federation: /distributedInstances
* WebSocket HTML+JavaScript federated chat, for debugging federation aspects: /socket.html
* WebSocket JavaScript console, showing the activity of the local MQTT broker: /console.html
* Test JSON Web Token decoding (does not check the signature): /jwt.decode/eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJmb28iOiJiYXIiLCJpYXQiOjE0MzcwMTg1ODIsImV4cCI6MTQzNzAxODU4M30.NmMv7sXjM1dW0eALNXud8LoXknZ0mH14GtnFclwJv0s
* Test JSON Web Token verifying (check the signature): /jwt.verify/eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImF1ZCI6IkNvcGVuaGFnZW4ifQ.RgBsgsm75Df5FhReDpH0yrLw5lvtTe87AgskTPEm36pYEhXcXCW07S5Y85VRc7cVx5McQHmFPo08q1eKRTEXLKfEwCl6Q1f61Kj5Zm2ZcLOvVU2S3ZFdrLePxAuON9Q7W2u4uy8NYr9S9fV1hsmHpaI1pLRfknFFadgJgR5PJgo

## HTTP Proxying + Format conversion

* Proxy to Network Manager tunnelling: /tunnel/0.0.0.8917820598345047854 (change the virtual address)
* Proxy to Resource Catalogue: /ResourceCatalogue/ using the Resource Catalogue API
	* E.g. /ResourceCatalogue/ogc/Things?%24filter=thingid%20eq%20c26958ce0b98584b3558fc9a3621c2b1541cee4a7685c2d68c741875740bfa1a
* Proxy to Storage Manager: /sm/ using the Storage Manager API
	* E.g. /sm/DataStreams%28ab1db42dea1bcdcb03f61b2a47ada8a77955715abe9bbed6611d82ba5ffa3570%29/Observations/$current
	* Format conversion to ATOM (RSS): /sm-rss/ using the Storage Manager API for observations
	* Format conversion to CSV: /sm-csv/ using the Storage Manager API for observations
	* Format conversion to TSV: /sm-tsv/ using the Storage Manager API for observations
* Proxy to SCRAL: /scral/ using the SCRAL API
	* E.g. /scral/devices
* Proxy to SmartSantander: /santander/ using SmartSantander API
	* E.g. /santander/GetNodes
* Proxy to Node-RED: /nodered/ using Node-RED Web UI and password protection


## Distributed HTTP requests

* Distributed Resource Catalogue request (using default merging strategy = split): /distributed/ResourceCatalogue/
	* E.g. /distributed/ResourceCatalogue/ogc/Things?%24filter=thingid%20eq%20c26958ce0b98584b3558fc9a3621c2b1541cee4a7685c2d68c741875740bfa1a
* Distributed Resource Catalogue request (using split strategy = details grouped per instance): /distributed-split/ResourceCatalogue/
	* E.g. /distributed-split/ResourceCatalogue/ogc/Things?%24filter=thingid%20eq%20c26958ce0b98584b3558fc9a3621c2b1541cee4a7685c2d68c741875740bfa1a
* Distributed Resource Catalogue request (using merge strategy = results merged just like if they came from one single request): /distributed-merge/ResourceCatalogue/
	* Assume JSON responses using the OGC `{"Thing":[ ]}` format
	* E.g. /distributed-merge/ResourceCatalogue/ogc/Things?%24filter=thingid%20eq%20c26958ce0b98584b3558fc9a3621c2b1541cee4a7685c2d68c741875740bfa1a

## WebSocket
Good tools to test include [wscat](https://github.com/websockets/wscat) (command line) and [Dark WebSocket Terminal](https://chrome.google.com/webstore/detail/dark-websocket-terminal/dmogdjmcpfaibncngoolgljgocdabhke) (Google Chrome extension).
(Replace localhost by the public URL of the instance)

* Pan-federation chat: ws://localhost/ws/chat
* Custom live events: ws://localhost/ws/custom-events﻿
	* One can subscribe to internal MQTT topics by sending JSON messages like the following (they must start by a slash /):
		* {"topic":"/federation1/test1"}
		* {"topic":"/federation1/test2"}
	* Or one can subscribe to multiple MQTT topics using a regular expression (the pattern is automatically anchored at beginning ^ and end $):
		* {"topic":"/federation1/test[3-7]", "matching":"regex"}
		* {"topic":"/federation1/test8/.*", "matching":"regex"}
	* Each time, one then receives a confirmation with the list of topics subscribed to:
		* {"subscriptions":{"/federation1/test1":true,"/federation1/test2":true},"subscriptionsRegex":{"/federation1/test[1-7]":{},"/federation1/test1/.*":{}}}
	* And one then receives push messages for all matching events, e.g.
		* {"topic":"/federation1/test1","payload":{"Hello":"World"}}
		* {"topic":"/federation1/test8/abcd","payload":{"Hello":"World"}}

## Authorizations
1. If `requireAuthorization` is set in the configuration, the Virtualization Layer will expect an HTTP header `Authorization` of type `Bearer` containing a JSON Web Token (JWT),
like (example generated by https://jwt.io/#debugger ):

```sh
curl -s "http://localhost/internalStatus" -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImF1ZCI6IkNvcGVuaGFnZW4ifQ.RgBsgsm75Df5FhReDpH0yrLw5lvtTe87AgskTPEm36pYEhXcXCW07S5Y85VRc7cVx5McQHmFPo08q1eKRTEXLKfEwCl6Q1f61Kj5Zm2ZcLOvVU2S3ZFdrLePxAuON9Q7W2u4uy8NYr9S9fV1hsmHpaI1pLRfknFFadgJgR5PJgo"
```

2. The signature of the JWT will be validated against the public key `openIdPublicKey` defined in the Virtualization Layer configuration.

3. The payload of the JWT must contain at least an Audience, which must match the `instanceName` defined in the Virtualization Layer configuration, like:

```javascript
{
	"aud": "Copenhagen"
}
```

4. See the URLs *Test JSON Web Token* higher up.
