"use strict";
/*
	Virtualization Layer | Data Fusion Language client module
		by Dario Bonino <dario.bonino@gmail.com>
			for the ALMANAC European project http://www.almanac-project.eu
*/

module.exports = function (almanac) {

	function proxyDfl(req, res) {

		if (!almanac.config.hosts.dflUrl) {
			almanac.basicHttp.serve503(req, res);
			return;
		}

		var url = almanac.config.hosts.dflUrl + req.url;

		req.pipe(almanac.request({
				method: req.method,
				url: url,
				timeout: 15000,
				encoding: null,
				headers: {
					'Accept': 'application/json',
				},
			}, function (error, response, body) {
				if (error || response.statusCode != 200 || !body) {
					almanac.log.warn('VL', 'Error ' + (response ? response.statusCode : 0) + ' proxying to Data Fusion Language API! ' + error + ' @ ' + url);
					if (!body) {
						almanac.basicHttp.serve503(req, res);
					}
				}
			}).on('error', function (err) {
				almanac.log.warn('VL', 'Error ' + err + ' proxying to Data Fusion Language API!');
				almanac.basicHttp.serve503(req, res);
			})).pipe(res, {
				end: true,
			});
	}

	almanac.routes['dfl/'] = proxyDfl;	//Proxying to Data Fusion Manager
};
