"use strict";
/*
	Virtualization Layer | JSON Web Token (JWT) utility
		by Alexandre Alapetite http://alexandre.alapetite.fr
			from Alexandra Institute http://www.alexandra.dk
			for the ALMANAC European project http://www.almanac-project.eu
*/

var jwt = require('jsonwebtoken');

module.exports = function (almanac) {

	function jwtDecode(req, res) {
		if (req && req.url) {
			var token = req.url,
				decoded = jwt.decode(token, {complete: true});
			almanac.basicHttp.serveJson(req, res, decoded);
		} else {
			almanac.basicHttp.serve400(req, res);
		}
	}

	function jwtVerify(req, res) {
		if (req && req.url) {
			var token = req.url;
			jwt.verify(token, almanac.config.openIdPublicKey, function(err, decoded) {
					if (err) {
						almanac.basicHttp.serveJson(req, res, err);
					} else {
						almanac.basicHttp.serveJson(req, res, decoded);
					}
				});
		} else {
			almanac.basicHttp.serve400(req, res);
		}
	}

	almanac.routes['jwt.decode/'] = jwtDecode;
	almanac.routes['jwt.verify/'] = jwtVerify;
};
