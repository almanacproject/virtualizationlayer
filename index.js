"use strict";
/*
	Virtualization Layer | Main file
		by Alexandre Alapetite http://alexandre.alapetite.fr
			from Alexandra Institute http://www.alexandra.dk
			for the ALMANAC European project http://www.almanac-project.eu
*/

var http = require('http'),
	fs = require('fs'),
	basicHttp = require('./basicHttp.js').basicHttp,	//Static files, logs
	config = require('./config.js').config,
	almanac = require('./almanac.js').almanac;

if (fs.existsSync('./config.local.js')) {	//Load local configuration, if any
	var localConfig = require('./config.local.js').config,
		extend = require('extend');
	extend(true, config, localConfig);
}

almanac.config = config;
almanac.version = require('./package.json').version;
almanac.log = require('npmlog');
almanac.log.level = almanac.config.logLevel;
basicHttp.npmlog = almanac.log;
basicHttp.npmlogPrefix = 'VL';
basicHttp.serverSignature = 'ALMANAC VirtualizationLayer ' + almanac.version + ' / ' + basicHttp.serverSignature;
almanac.basicHttp = basicHttp;
almanac.http = http;

var server = http.createServer(function (req, res) {
	var reqUrl0 = '';	//Original request URL
	try {
		if (req && req.url) {
			reqUrl0 += req.url;
			var urlSegments = req.url.split('/', 3),
				s1 = '';
			switch (urlSegments.length) {
				case 3:
					s1 = urlSegments[1] + '/';
					break;
				case 2:
					s1 = urlSegments[1];
					break;
			}
			if (almanac.routes[s1]) {
				req.url = req.url.substring(s1.length + 1);
				almanac.routes[s1](req, res);
			} else if (s1 === '') {
				req.url = '/index.html';
				basicHttp.serveStaticFile(req, res);
			} else {
				basicHttp.serveStaticFile(req, res);
			}
		} else {
			basicHttp.serve400(req, res);
		}
	} catch (ex) {
		req.url = reqUrl0;
		basicHttp.serve500(req, res, 'Exception: ' + ex);
	}
	try {
		req.url = reqUrl0;
		basicHttp.log(req, res);
	} catch (ex) {
		almanac.log.error('VL', 'Node.js: Log exception: %s', ex);
	}
});

server.on('error', function (err) {
	almanac.log.error('VL', 'Node.js: server error: %s. Check that you can use port %d.', err.errno || err, config.hosts.virtualizationLayer.port);
	process.exit(1);
});

server.on('connection', function (socket) {
	var remoteAddress = socket.remoteAddress;	//To populate ._peername https://github.com/joyent/node/blob/03e9f84933fe610b04b107cf1f83d17485e8906e/lib/net.js#L563 (e.g. for WebSocket)
});

almanac.server = server;

server.listen(config.hosts.virtualizationLayer.port);

almanac.init();

almanac.log.warn('VL', 'Node.js: server running ALMANAC Virtualization Layer at %j', server.address());
