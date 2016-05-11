"use strict";
/*
	Virtualization Layer | Data Fusion Language client module
		by Dario Bonino <dario.bonino@gmail.com>
			for the ALMANAC European project http://www.almanac-project.eu
*/

module.exports = function (almanac) {

	function proxyDfl(req, res) {
		almanac.proxy(req, res, almanac.config.hosts.dflUrl, req.url, 'Data Fusion Language API', true);
	}

	almanac.routes['dfl/'] = proxyDfl;	//Proxying to Data Fusion Manager
	almanac.openPaths['/dfl/api/data-fusion/v0.5.0/chains/'] = true;
};
