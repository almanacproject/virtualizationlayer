"use strict";
/*
	Virtualization Layer | SmartSantander client module
		by Alexandre Alapetite http://alexandre.alapetite.fr
			from Alexandra Institute http://www.alexandra.dk
			for the ALMANAC European project http://www.almanac-project.eu
*/

module.exports = function (almanac) {

	function proxySmartSantander(req, res) {

		if (!almanac.config.hosts.santanderUrl) {
			almanac.basicHttp.serve503(req, res);
			return;
		}

		var url = almanac.config.hosts.santanderUrl + req.url;

		req.pipe(almanac.request({
				method: req.method,
				url: url,
				timeout: 15000,
				encoding: null,
			}, function (error, response, body) {
				if (error || response.statusCode != 200 || !body) {
					almanac.log.warn('VL', 'Error ' + (response ? response.statusCode : 'undefined') + ' proxying to SmartSantander!');
					if (!body) {
						almanac.basicHttp.serve503(req, res);
					}
				}
			})).pipe(res, {
					end: true,
				});
	}

	almanac.routes['santander/'] = proxySmartSantander;	//Proxying to SmartSantander
};
