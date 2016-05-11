"use strict";
/*
	Virtualization Layer | SCRAL client module
		by Alexandre Alapetite http://alexandre.alapetite.fr
			from Alexandra Institute http://www.alexandra.dk
			for the ALMANAC European project http://www.almanac-project.eu
*/

module.exports = function (almanac) {

	function proxyScral(req, res) {
		almanac.proxy(req, res, almanac.config.hosts.scralUrl, req.url, 'SCRAL', false);
	}

	function proxyScralUi(req, res) {
		almanac.proxy(req, res, almanac.config.hosts.scralUiUrl, req.url, 'SCRAL GUI', false);
	}

	almanac.routes['scral/'] = proxyScral;	//Proxying to SCRAL
	almanac.routes['scralUi/'] = proxyScralUi;	//Proxying to SCRAL GUI
	almanac.openPaths['/scral/countDevice'] = true;
};
