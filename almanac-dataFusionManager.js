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

		function responseInjectAmount(json) {
			almanac.request({
					method: req.method,
					url: url + 'statement/',
					timeout: 15000,
					encoding: null,
					json: true,
				}, function (error, response, body) {
					if (!json.status) {
						json.status = {};
					}
					json.status.amount = 0;
					if (!error && response.statusCode == 200 && body && body.EsperEngine) {
						json.status.amount = Object.keys(body.EsperEngine).length;
					}
					almanac.basicHttp.serveJson(req, res, json);
				});
		}

		if (req.url === '') {

			almanac.request({
					method: req.method,
					url: url,
					timeout: 5000,
					encoding: null,
					json: true,
				}, function (error, response, body) {
					if (error || response.statusCode != 200 || !body) {
						almanac.log.warn('VL', 'Error ' + (response ? response.statusCode : 0) + ' proxying to Data Fusion Language Manager! ' + error + ' @ ' + url);
						almanac.basicHttp.serve503(req, res);
					} else {
						responseInjectAmount(body);
					}
				});

		} else {

			almanac.request({
					method: req.method,
					url: url,
					timeout: 15000,
					encoding: null,
				}, function (error, response, body) {
					if (error || response.statusCode != 200 || !body) {
						almanac.log.warn('VL', 'Error ' + (response ? response.statusCode : 0) + ' proxying to Data Fusion Language Manager! ' + error + ' @ ' + url);
						if (!body) {
							almanac.basicHttp.serve503(req, res);
						}
					}
				}).pipe(res, {
					end: true,
				});

		}
	}

	almanac.routes['dfm/'] = proxyDfm;	//Proxying to Data Fusion Manager
	almanac.openPaths['/dfm/'] = true;
};
