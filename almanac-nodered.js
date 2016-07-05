"use strict";
/*
	Virtualization Layer | Proxy to Node-RED
		by Alexandre Alapetite http://alexandre.alapetite.fr
			from Alexandra Institute http://www.alexandra.dk
			for the ALMANAC European project http://www.almanac-project.eu
*/

module.exports = function (almanac) {

	function proxyNodeRed(req, res) {
		almanac.proxy(req, res, almanac.config.hosts.noderedUrl, req.url, 'NodeRED', false);
	}

	almanac.openRoutes['nodered/'] = proxyNodeRed;
};
