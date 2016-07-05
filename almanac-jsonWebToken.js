"use strict";
/*
	Virtualization Layer | JSON Web Token (JWT) utility
		by Alexandre Alapetite http://alexandre.alapetite.fr
			from Alexandra Institute http://www.alexandra.dk
			for the ALMANAC European project http://www.almanac-project.eu
*/

var jwt = require('jsonwebtoken');

module.exports = function (almanac) {

	almanac.jwtVerifyAuthorization = function (req, res, callback) {
		if (req && req.headers && req.headers.authorization) {
			var token = req.headers.authorization;
			if (token.length) {
				token = token.trim();
				if (token.startsWith('Bearer ')) {
					token = token.substr(7);
					almanac.log.verbose('VL', 'Bearer: ' + token);
					jwt.verify(token, almanac.config.openIdPublicKey, {
							audience: almanac.config.hosts.instanceName,
							complete: true,
						}, function(err, decoded) {
							if (err) {
								almanac.basicHttp.serve401(req, res, 'Bearer realm="' + almanac.config.hosts.instanceName + '", error="invalid_token", error_description="' + err + '"', err);
							} else if (decoded) {
								almanac.log.info('VL', 'JWT: ' + JSON.stringify(decoded));
							} else {
								err = 'Invalid decoded JWT!';
							}
							req.headers.authorization = '';
							callback(err, decoded);
						});
					return;
				}
			}
		}
		almanac.basicHttp.serve401(req, res, 'Bearer realm="' + almanac.config.hosts.instanceName + '"');
	};

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
			jwt.verify(token, almanac.config.openIdPublicKey, {
					audience: almanac.config.hosts.instanceName,
					complete: true,
				}, function(err, decoded) {
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

	almanac.openRoutes['jwt.decode/'] = jwtDecode;
	almanac.openRoutes['jwt.verify/'] = jwtVerify;
};
