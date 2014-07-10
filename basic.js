"use strict";
/*
	Basic functions for a simple Web server, serving static files, logging, and returning status codes
		by Alexandre Alapetite http://alexandre.alapetite.fr
*/

var util = require('util'),
	os = require('os'),
	fs = require('fs'),
	path = require('path');

var basic = {

	escapeHtml: function (text) {
		return text.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#039;");
	},

	serverSignature: 'Node.js / Debian ' + os.type() + ' ' + os.release() + ' ' + os.arch() + ' / Raspberry Pi',

	log: function (req, res) {
		util.log(req.connection.remoteAddress + '\t' + res.statusCode + '\t"' + req.method + ' ' + req.url + '"\t"' +
			(req.headers['user-agent'] || '') + '"\t"' + (req.headers['referer'] || '') + '"');
	},

	serveHome: function (req, res) {
		var now = new Date();
		res.writeHead(200, {
			'Content-Type': 'text/html; charset=UTF-8',
			'Date': now.toUTCString(),
			'Server': basic.serverSignature
		});
		res.end('<!DOCTYPE html>\n\
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en-GB" lang="en-GB">\n\
<head>\n\
<meta charset="UTF-8" />\n\
<title>Node.js on Raspberry Pi</title>\n\
<meta name="robots" content="noindex" />\n\
<meta name="viewport" content="initial-scale=1.0,width=device-width" />\n\
</head>\n\
<body>\n\
<pre>\n\
Hello ' + req.connection.remoteAddress + '!\n\
This is ' + req.connection.localAddress + ' running <a href="http://nodejs.org/" rel="external">Node.js</a> :-)\n\
It is now ' + now.toISOString() + '.\n\
</pre>\n\
<ul>\n\
</ul>\n\
</body>\n\
</html>\n\
');
	},

	serve400: function (req, res) {
		res.writeHead(400, {
			'Content-Type': 'text/html; charset=UTF-8',
			'Date': (new Date()).toUTCString(),
			'Server': basic.serverSignature
		});
		res.end('<!DOCTYPE html>\n\
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en-GB" lang="en-GB">\n\
<head>\n\
<meta charset="UTF-8" />\n\
<title>400 Bad request</title>\n\
</head>\n\
<body>\n\
<h1>Bad request</h1>\n\
<p>Your browser sent a request that this server could not understand.</p>\n\
</body>\n\
</html>\n\
');
	},

	serve404: function (req, res) {
	//When a static file is not found
		res.writeHead(404, {
			'Content-Type': 'text/html; charset=UTF-8',
			'Date': (new Date()).toUTCString(),
			'Server': basic.serverSignature
		});
		res.end('<!DOCTYPE html>\n\
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en-GB" lang="en-GB">\n\
<head>\n\
<meta charset="UTF-8" />\n\
<title>404 Not Found</title>\n\
</head>\n\
<body>\n\
<h1>Not Found</h1>\n\
<p>The requested <abbr title="Uniform Resource Locator">URL</abbr> <kbd>' +
	basic.escapeHtml(req.url) + '</kbd> was not found on this server.</p>\n\
</body>\n\
</html>\n\
');
	},

	serve500: function (req, res, ex) {
		console.warn(ex);
		res.writeHead(500, {
			'Content-Type': 'text/html; charset=UTF-8',
			'Date': (new Date()).toUTCString(),
			'Server': basic.serverSignature
		});
		res.end('<!DOCTYPE html>\n\
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en-GB" lang="en-GB">\n\
<head>\n\
<meta charset="UTF-8" />\n\
<title>500 Internal Server Error</title>\n\
</head>\n\
<body>\n\
<h1>Internal Server Error</h1>\n\
<p>The server encountered an internal error or misconfiguration and was unable to complete your request.</p>\n\
<pre>' + ex + '</pre>\n\
</body>\n\
</html>\n\
');
	},

	serveStaticFile: function (req, res) {
		if ((/^\/[a-z0-9_-]+\.[a-z]{2,4}$/i).test(req.url) && (!(/\.\./).test(req.url))) {
			var myPath = './static' + req.url;
			fs.stat(myPath, function (err, stats) {
				if ((!err) && stats.isFile()) {
					var ext = path.extname(myPath),
						mimes = { '.css': 'text/css', '.html': 'text/html', '.ico': 'image/x-icon', '.jpg': 'image/jpeg',
							'.js': 'application/javascript', '.json': 'application/json', '.png': 'image/png', '.txt': 'text/plain', '.xml': 'application/xml' },
						modifiedDate = new Date(stats.mtime).toUTCString();
					if (modifiedDate === req.headers['if-modified-since']) {
						res.writeHead(304, {
							'Content-Type': ext && mimes[ext] ? mimes[ext] : 'application/octet-stream',
							'Date': (new Date()).toUTCString()
						});
						res.end();
					} else {
						res.writeHead(200, {
							'Content-Type': ext && mimes[ext] ? mimes[ext] : 'application/octet-stream',
							'Content-Length': stats.size,
							'Cache-Control': 'public, max-age=86400',
							'Date': (new Date()).toUTCString(),
							'Last-Modified': modifiedDate,
							'Server': basic.serverSignature
						});
						fs.createReadStream(myPath).pipe(res);
					}
				} else {
					basic.serve404(req, res);
				}
			});
		} else {
			basic.serve404(req, res);
		}
	},

};

exports.basic = basic;
