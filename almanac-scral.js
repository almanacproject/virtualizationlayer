"use strict";
/*
	Virtualization Layer | SCRAL client module
		by Alexandre Alapetite http://alexandre.alapetite.fr
			from Alexandra Institute http://www.alexandra.dk
			for the ALMANAC European project http://www.almanac-project.eu
*/

module.exports = function (almanac) {

	function proxyScral(req, res) {

		if (!almanac.config.hosts.scralUrl) {
			almanac.basicHttp.serve503(req, res);
			return;
		}

		var url = almanac.config.hosts.scralUrl + req.url;

		req.pipe(almanac.request({
				method: req.method,
				url: url,
				timeout: 15000,
				encoding: null,
			}, function (error, response, body) {
				if (error || response.statusCode != 200 || !body) {
					almanac.log.warn('VL', 'Error ' + (response ? response.statusCode : 'undefined') + ' proxying to SCRAL!');
					if (!body) {
						almanac.basicHttp.serve503(req, res);
					}
				}
			}).on('error', function (err) {
				almanac.log.warn('VL', 'Error ' + err + ' proxying to SCRAL!');
				almanac.basicHttp.serve503(req, res);
			})).pipe(res, {
				end: true,
			});
	}

	function proxyScralUi(req, res) {
		req.pipe(almanac.request({
				method: req.method,
				uri: almanac.config.hosts.scralUiUrl + req.url,
				timeout: 15000,
			}, function (error, response, body) {
				if (error || response.statusCode != 200 || !body) {
					almanac.log.warn('VL', 'Error ' + (response ? response.statusCode : 'undefined') + ' proxying to SCRAL GUI!');
					if (!body) {
						almanac.basicHttp.serve503(req, res);
					}
				}
			}).on('error', function (err) {
				almanac.log.warn('VL', 'Error ' + err + ' proxying to SCRAL UI!');
				almanac.basicHttp.serve503(req, res);
			})).pipe(res, {
				end: true,
			});
	}

	almanac.routes['scral/'] = proxyScral;	//Proxying to SCRAL
	almanac.routes['scralUi/'] = proxyScralUi;	//Proxying to SCRAL GUI
};
