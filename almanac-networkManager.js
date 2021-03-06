"use strict";
/*
	Virtualization Layer | LinkSmart.java NetworkManager client module
		by Alexandre Alapetite http://alexandre.alapetite.fr
			from Alexandra Institute http://www.alexandra.dk
			for the ALMANAC European project http://www.almanac-project.eu
*/

module.exports = function (almanac) {
	almanac.virtualAddress = '';

	//require('request').debug = true;

	function registerInNetworkManager() {
		almanac.defaultRequest.post({
				url: almanac.config.hosts.networkManagerUrl + 'NetworkManager',
				json: {
						'Endpoint': almanac.config.hosts.virtualizationLayer.scheme + '://' + almanac.config.hosts.virtualizationLayer.host + ':' + almanac.config.hosts.virtualizationLayer.port + '/',	//The port number must always be mentionned for LinkSmart
						'BackboneName': 'eu.linksmart.gc.network.backbone.protocol.http.HttpImpl',
						'Attributes': {
							'DESCRIPTION': 'VirtualizationLayer',
							'SID': 'eu.linksmart.almanac.virtualizationlayer',
						}
					},
				timeout: 4000,
			}, function (error, response, body) {
				if (!error && response.statusCode == 200 && body && body.VirtualAddress) {
					almanac.virtualAddress = body.VirtualAddress;
					almanac.log.info('VL', 'Registered in the NetworkManager with VirtualAddress: ' + almanac.virtualAddress);
				} else {
					almanac.log.warn('VL', 'Cannot register in the NetworkManager! Will try again. Status: ' + response.statusCode);
					almanac.log.verbose('VL', 'NetworkManager error: ' + body);
				}
			});
	}

	function refreshInNetworkManager() {
		almanac.defaultRequest.get({
				//url: almanac.config.hosts.networkManagerUrl + 'NetworkManager?description="VirtualizationLayer"',
				url: almanac.config.hosts.networkManagerUrl + 'GetNetworkManagerStatus?method=getLocalServices',
				json: true,
				timeout: 2000,
			}, function (error, response, body) {
				if (!error && response.statusCode == 200 && body && body.VirtualAddresses) {
					var virtualAddress = '';
					for (var i = 0; i < body.VirtualAddresses.length; i++) {
						var va = body.VirtualAddresses[i];
						if (va.description && (va.description.indexOf('SID = eu.linksmart.almanac.virtualizationlayer;') >= 0)) {
							virtualAddress = va.virtualAddress;	//Found existing local VirtualizationLayer
						}
					}
					if (!virtualAddress) {	//Needs registration
						registerInNetworkManager();
					} else if (!almanac.virtualAddress) {
						almanac.virtualAddress = virtualAddress;
						almanac.log.info('VL', 'Already registered in NetworkManager at address: ' + almanac.virtualAddress);
					} else if (almanac.virtualAddress != virtualAddress) {
						almanac.log.error('VL', 'Inconsistent virtual address in NetworkManager: ' + almanac.virtualAddress + ' != ' + virtualAddress);
					}
				} else {
					almanac.log.warn('VL', 'Cannot contact the NetworkManager! Will try again.');
				}
			});
	}
	refreshInNetworkManager();
	setInterval(refreshInNetworkManager, 120000);

	function updateMqttVirtualAddress() {
		almanac.defaultRequest.get({
				url: almanac.config.hosts.networkManagerUrl + 'NetworkManager/?DESCRIPTION="Broker:tcp://' + almanac.os.hostname() + '"',
				json: true,
				timeout: 5000,
			}, function (error, response, body) {
				if (error || response.statusCode != 200 || !(body && body[0] && body[0].VirtualAddress)) {
					almanac.mqttVirtualAddress = '';
					almanac.log.warn('VL', 'Error ' + (response ? response.statusCode : 'undefined') + ' getting broker virtual address from LinkSmart!');
				} else {
					almanac.mqttVirtualAddress = body[0].VirtualAddress;
				}
			});
	}
	updateMqttVirtualAddress();
	setInterval(updateMqttVirtualAddress, 60000);

	function proxyNetworkManagerTunnel(req, res) {
		almanac.proxy(req, res, almanac.config.hosts.networkManagerUrl, 'HttpTunneling/0/' + req.url, 'NetworkManager tunneling', false);
	}

	function proxyLinksmart(req, res) {
		if (!almanac.config.hosts.networkManagerUrl) {
			almanac.basicHttp.serve503(req, res);
			return;
		}

		var url = almanac.config.hosts.networkManagerUrl + req.url;

		if (req.url === '') {

			almanac.defaultRequest({
					method: req.method,
					url: url + 'GetNetworkManagerStatus?method=getLocalServices',
					timeout: 5000,
					json: true,
				}, function (error, response, body) {
					if (error || response.statusCode != 200 || !body) {
						almanac.log.warn('VL', 'Error ' + (response ? response.statusCode : 0) + ' proxying to LinkSmart!');
						almanac.basicHttp.serve503(req, res);
					} else {
						almanac.basicHttp.serveJson(req, res, {
								amount: body && body.VirtualAddresses ? Object.keys(body.VirtualAddresses).length : 0,
							});
					}
				});

		} else {
			almanac.proxy(req, res, almanac.config.hosts.networkManagerUrl, req.url, 'LinkSmart', false);
		}
	}

	almanac.routes['tunnel/'] = proxyNetworkManagerTunnel;	//Proxying to NetworkManager tunnel
	almanac.routes['linksmart/'] = proxyLinksmart;	//Proxying to LinkSmart Network
	almanac.openPaths['/linksmart/'] = true;
};
