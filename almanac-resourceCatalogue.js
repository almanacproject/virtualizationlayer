"use strict";
/*
	Virtualization Layer | LinkSmart.NET ResourceCatalogue client module
		by Alexandre Alapetite http://alexandre.alapetite.fr
			from Alexandra Institute http://www.alexandra.dk
			for the ALMANAC European project http://www.almanac-project.eu
*/

var spawn = require('child_process').spawn;

module.exports = function (almanac) {

	function proxyResourceCatalogue(req, res) {

		if (!almanac.config.hosts.recourceCatalogueUrl) {
			almanac.basicHttp.serve503(req, res);
			return;
		}

		/**
		 * cURL is used due to TCP socket problems for the Resource Catalogue running Mono.
		 * It looks from WireShark that Resource Catalogue sends some strange TCP packets back,
		 * such as a FIN before having received the HTTP request.
		 * It was working more or less with Node.JS 0.10.x, but not with Node.JS 4.x+.
		 */
		var url = almanac.config.hosts.recourceCatalogueUrl + req.url,
			needData = true,
			curl = spawn('curl', [
				'-s',
				'-m', Math.round(almanac.config.proxyTimeoutMs / 1000),
				'-H', 'Content-Type: application/json',	//Work-around bug in Resource Catalogue
				'-H', 'Accept: application/json',
				url,
			]);
		curl.stdout.on('data', function (data) {
				if (needData) {
					needData = false;
					res.writeHead(200, { 'Content-Type': 'application/json' });
				}
				res.write(data);	//TODO: Try to use pipe instead (must work also in the case of errors)
			});
		curl.stdout.on('end', function () {
				if (!needData) {
					res.end();
				}
			});
		curl.on('close', function (code) {
				if (code) {
					almanac.log.warn('VL', 'Error cURL response ' + code + ' proxying to Resource Catalogue! @ ' + url);
					if (needData) {
						needData = false;
						almanac.basicHttp.serve503(req, res);
					} else {
						res.end();
					}
				}
			});
	}

	almanac.routes['ResourceCatalogue/'] = proxyResourceCatalogue;
	almanac.openPaths['/ResourceCatalogue/'] = true;
};
