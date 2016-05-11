"use strict";
/*
	Virtualization Layer | SmartSantander client module
		by Alexandre Alapetite http://alexandre.alapetite.fr
			from Alexandra Institute http://www.alexandra.dk
			for the ALMANAC European project http://www.almanac-project.eu
*/

module.exports = function (almanac) {

	function proxySmartSantander(req, res) {
		almanac.proxy(req, res, almanac.config.hosts.santanderUrl, req.url, 'SmartSantander', false);
	}

	almanac.routes['santander/'] = proxySmartSantander;	//Proxying to SmartSantander
};
