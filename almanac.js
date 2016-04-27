"use strict";
/*
	Virtualization Layer | ALMANAC-specific logic
		by Alexandre Alapetite http://alexandre.alapetite.fr
			from Alexandra Institute http://www.alexandra.dk
			for the ALMANAC European project http://www.almanac-project.eu
*/

var almanac = {

	basicHttp: null,	//Static files, logs
	config: null,
	http: null,
	server: null,
	version: '0',
	request: require('request'),
	os: require('os'),

	openRoutes: {	//Routing of requests which do not need security
	},

	routes: {	//Routing of requests which need security / authorization / policy
	},

	serveHome: function (req, res) {
		var now = new Date();
		res.writeHead(200, {
				'Content-Type': 'text/html; charset=UTF-8',
				'Date': now.toUTCString(),
				'Server': almanac.basicHttp.serverSignature,
			});
		res.end('<!DOCTYPE html>\n\
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en-GB" lang="en-GB">\n\
<head>\n\
<meta charset="UTF-8" />\n\
<title>Virtualization Layer | ALMANAC</title>\n\
<meta name="robots" content="noindex,nofollow" />\n\
</head>\n\
<body>\n\
<h1>ALMANAC Virtualization Layer</h1>\n\
<pre>\n\
Hello ' + req.connection.remoteAddress + '!\n\
This is ' + req.connection.localAddress + ' running <a href="http://nodejs.org/" rel="external">Node.js</a>.\n\
I am a Virtualization Layer for the <a href="http://www.almanac-project.eu/" rel="external">ALMANAC European project (Reliable Smart Secure Internet Of Things For Smart Cities)</a>.\n\
I talk mainly to other machines, but there is a <a href="socket.html">WebSocket broadcast interface</a> for humans, and a <a href="console.html">JavaScript console</a>.\n\
<a href="./virtualizationLayerInfo">More information about this instance</a>.\n\
It is now ' + now.toISOString() + '.\n\
</pre>\n\
</body>\n\
</html>\n\
');
	},

	randomId: Math.random(),

	info: function () {
		return {
			version: almanac.version,
			instanceName: almanac.config.hosts.instanceName,
			publicUrl: almanac.config.hosts.virtualizationLayerPublicUrl,
			//hostname: os.hostname(),
			virtualAddressOk: !!almanac.virtualAddress,
			mqttVirtualAddressOk: !!almanac.mqttVirtualAddress,
			mqttConnected: almanac.mqttClient && almanac.mqttClient.connected,
			networkManagerUrlOk: !!almanac.config.hosts.networkManagerUrl,
			storageManagerUrlOk: !!almanac.config.hosts.storageManagerUrl,
			resourceCatalogueUrlOk: !!almanac.config.hosts.recourceCatalogueUrl,
			scralUrlOk: !!almanac.config.hosts.scralUrl,
			scralUiUrlOk: !!almanac.config.hosts.scralUiUrl,
			dfmUrlOk: !!almanac.config.hosts.dfmUrl,
			dflUrlOk: !!almanac.config.hosts.dflUrl,
			//server: almanac.basicHttp.serverSignature,
			authorizationOk: almanac.config.openIdPublicKey && almanac.config.requireAuthorization && almanac.config.requirePolicy,
			randomId: almanac.randomId,
			//nodejs: process.versions,
		};
	},

	internalStatus: function () {
		return {
			version: almanac.version,
			instanceName: almanac.config.hosts.instanceName,
			publicUrl: almanac.config.hosts.virtualizationLayerPublicUrl,
			hostname: almanac.os.hostname(),
			virtualAddress: almanac.virtualAddress,
			mqttVirtualAddress: almanac.mqttVirtualAddress,
			mqttConnected: almanac.mqttClient && almanac.mqttClient.connected,
			networkManagerUrl: almanac.config.hosts.networkManagerUrl,
			storageManagerUrl: almanac.config.hosts.storageManagerUrl,
			resourceCatalogueUrl: almanac.config.hosts.recourceCatalogueUrl,
			scralUrl: almanac.config.hosts.scralUrl,
			scralUiUrl: almanac.config.hosts.scralUiUrl,
			dfmUrl: almanac.config.hosts.dfmUrl,
			dflUrl: almanac.config.hosts.dflUrl,
			server: almanac.basicHttp.serverSignature,
			openIdPublicKey: almanac.config.openIdPublicKey,
			requireAuthorization: almanac.config.requireAuthorization,
			requirePolicy: almanac.config.requirePolicy,
			randomId: almanac.randomId,
			nodejs: process.versions,
		};
	},

	isMe: function (info) {
		return info && info.randomId === almanac.randomId;
	},

	serveInfo: function (req, res) {
		almanac.basicHttp.serveJson(req, res, almanac.info());
	},

	serveInternalStatus: function (req, res) {
		almanac.basicHttp.serveJson(req, res, almanac.internalStatus());
	},

	init: function() {
		almanac.basicHttp.npmlogPrefix = 'VL';
		almanac.basicHttp.serverSignature = 'ALMANAC VirtualizationLayer ' + almanac.version + ' / ' + almanac.basicHttp.serverSignature;
		almanac.basicHttp.csp = "default-src 'self'; connect-src 'self' ws:; font-src 'self' fonts.gstatic.com; style-src 'self' fonts.googleapis.com";	//TODO: Reduce white-list

		almanac.openRoutes['virtualizationLayerInfo'] = almanac.serveInfo;	//Requests the public address of this VirtualizationLayer instance and other info
		if (almanac.config.exposeInternalStatus) {
			almanac.routes['internalStatus'] = almanac.serveInternalStatus;	//Provides all kinds of info on the internal ALMANAC platform
		}

		require('./almanac-peering.js')(almanac);
		require('./almanac-resourceCatalogue.js')(almanac);
		require('./almanac-storageManager.js')(almanac);
		require('./almanac-scral.js')(almanac);
		require('./almanac-dataFusionManager.js')(almanac);
		require('./almanac-dataFusionLanguage.js')(almanac); // DFL- API
		require('./almanac-santander.js')(almanac);
		require('./almanac-distributed.js')(almanac);	//Distributed requests
		require('./almanac-websocket-custom-events.js')(almanac);	//WebSocket for custom events (from MQTT)
		require('./almanac-websocket-chat.js')(almanac);	//WebSocket for broadcast chat
		require('./almanac-mqtt.js')(almanac);	//MQTT
		require('./almanac-jsonWebToken.js')(almanac);	//JWT

		setTimeout(function() {
				require('./almanac-upnp.js')(almanac);	//UPnP (SSDP)
				require('./almanac-networkManager.js')(almanac);	//Register in the NetworkManager
			}, 2000);
	},

};

almanac.openRoutes['vl'] = almanac.serveHome;	//Virtualization Layer home page

exports.almanac = almanac;
