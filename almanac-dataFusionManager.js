"use strict";
/*
	Virtualization Layer | Data Fusion Manager client module
		by Alexandre Alapetite http://alexandre.alapetite.fr
			from Alexandra Institute http://www.alexandra.dk
			for the ALMANAC European project http://www.almanac-project.eu
*/

module.exports = function (almanac) {

	function proxyDfm(req, res) {

		if (!almanac.config.hosts.dfmUrl) {
			almanac.basicHttp.serve503(req, res);
			return;
		}

		var url = almanac.config.hosts.dfmUrl + req.url;

		req.pipe(almanac.request({
				method: req.method,
				url: url,
				timeout: 15000,
				encoding: null,
			}, function (error, response, body) {
				if (error || response.statusCode != 200 || !body) {
					almanac.log.warn('VL', 'Error ' + (response ? response.statusCode : 'undefined') + ' proxying to Data Fusion Manager!');
					if (!body) {
						almanac.basicHttp.serve503(req, res);
					}
				}
			}).on('error', function (err) {
				almanac.log.warn('VL', 'Error ' + err + ' proxying to Data Fusion Language Manager!');
				almanac.basicHttp.serve503(req, res);
			}).pipe(res, {
				end: true,
			}));
	}

	almanac.routes['dfm/'] = proxyDfm;	//Proxying to Data Fusion Manager
};
