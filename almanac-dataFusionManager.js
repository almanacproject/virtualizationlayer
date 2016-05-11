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
					timeout: almanac.config.proxyTimeoutMs,
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
					timeout: almanac.config.proxyTimeoutMs,
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
			almanac.proxy(req, res, almanac.config.hosts.dfmUrl, req.url, 'Data Fusion Language Manager', false);
		}
	}

	almanac.routes['dfm/'] = proxyDfm;	//Proxying to Data Fusion Manager
	almanac.openPaths['/dfm/'] = true;
};
