"use strict";
/*
	Basic functions for a simple Web server, serving static files, logging, and returning status codes
		by Alexandre Alapetite http://alexandre.alapetite.fr
*/

var os = require('os'),
	fs = require('fs'),
	path = require('path');

var basicHttp = {

	escapeHtml: function (text) {
		return ('' + text).replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#039;");
	},

	serverSignature: 'Node.js ' + process.version + ' / ' + os.type() + ' ' + os.release() + ' ' + os.arch(),

	csp: "default-src 'self'",

	npmlog: null,
	npmlogPrefix: '',

	log: function (req, res) {
		var message = (new Date()).toISOString() + '\t' + req.connection.remoteAddress + '\t' + (res ? res.statusCode : '?') + '\t"' + req.method + ' ' + req.url + '"\t"' +
			(req.headers['user-agent'] || '') + '"';
		if (basicHttp.npmlog) {
			if (res) {
				basicHttp.npmlog.http(basicHttp.npmlogPrefix, message);
			} else {
				basicHttp.npmlog.verbose(basicHttp.npmlogPrefix, message);
			}
		} else {
			console.log('HTTP:\t' + message);
		}
	},

	serveHome: function (req, res) {
		if (!res || res.finished) {
			return;
		}
		var now = new Date();
		res.writeHead(200, {
			'Content-Type': 'text/html; charset=UTF-8',
			'Date': now.toUTCString(),
			'Server': basicHttp.serverSignature,
			'Content-Security-Policy': basicHttp.csp,
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
		if (!res || res.finished) {
			return;
		}
		if (!res.headersSent) {
			res.writeHead(400, {
				'Content-Type': 'text/html; charset=UTF-8',
				'Date': (new Date()).toUTCString(),
				'Server': basicHttp.serverSignature,
				'Content-Security-Policy': basicHttp.csp,
			});
		}
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

	serve401: function (req, res, authenticate, errorDescription) {
		if (!res || res.finished) {
			return;
		}
		if (!res.headersSent) {
			res.writeHead(401, {
				'Content-Type': 'text/html; charset=UTF-8',
				'Date': (new Date()).toUTCString(),
				'Server': basicHttp.serverSignature,
				'Content-Security-Policy': basicHttp.csp,
				'WWW-Authenticate': authenticate,
			});
		}
		res.end('<!DOCTYPE html>\n\
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en-GB" lang="en-GB">\n\
<head>\n\
<meta charset="UTF-8" />\n\
<title>401 Unauthorized</title>\n\
</head>\n\
<body>\n\
<h1>Unauthorized</h1>\n\
<p>This server could not verify that you are authorized to access the document requested.</p>\n\
<pre>' + basicHttp.escapeHtml(errorDescription) + '</pre>\n\
</body>\n\
</html>\n\
');
	},

	serve404: function (req, res) {
		//When a static file is not found
		if (!res || res.finished) {
			return;
		}
		if (!res.headersSent) {
			res.writeHead(404, {
				'Content-Type': 'text/html; charset=UTF-8',
				'Date': (new Date()).toUTCString(),
				'Server': basicHttp.serverSignature,
				'Content-Security-Policy': basicHttp.csp,
			});
		}
		res.end('<!DOCTYPE html>\n\
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en-GB" lang="en-GB">\n\
<head>\n\
<meta charset="UTF-8" />\n\
<title>404 Not Found</title>\n\
</head>\n\
<body>\n\
<h1>Not Found</h1>\n\
<p>The requested <abbr title="Uniform Resource Locator">URL</abbr> <kbd>' +
	basicHttp.escapeHtml(req.url) + '</kbd> was not found on this server.</p>\n\
</body>\n\
</html>\n\
');
	},

	serve405: function (req, res, allowedMethods) {
		if (!res || res.finished) {
			return;
		}
		if (!res.headersSent) {
			res.writeHead(405, {
				'Content-Type': 'text/html; charset=UTF-8',
				'Date': (new Date()).toUTCString(),
				'Server': basicHttp.serverSignature,
				'Allow': allowedMethods,
				'Content-Security-Policy': basicHttp.csp,
			});
		}
		res.end('<!DOCTYPE html>\n\
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en-GB" lang="en-GB">\n\
<head>\n\
<meta charset="UTF-8" />\n\
<title>405 Method Not Allowed</title>\n\
</head>\n\
<body>\n\
<h1>Method Not Allowed</h1>\n\
<p>The requested method <kbd>' + basicHttp.escapeHtml(req.method) + '</kbd> is not allowed at this URL.</p>\n\
</body>\n\
</html>\n\
');
	},

	serve406: function (req, res) {
		if (!res || res.finished) {
			return;
		}
		if (!res.headersSent) {
			res.writeHead(406, {
				'Content-Type': 'text/html; charset=UTF-8',
				'Date': (new Date()).toUTCString(),
				'Server': basicHttp.serverSignature,
				'Content-Security-Policy': basicHttp.csp,
			});
		}
		res.end('<!DOCTYPE html>\n\
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en-GB" lang="en-GB">\n\
<head>\n\
<meta charset="UTF-8" />\n\
<title>406 Not Acceptable</title>\n\
</head>\n\
<body>\n\
<h1>Not Acceptable</h1>\n\
<p>The content-type is not acceptable for this URL.</p>\n\
</body>\n\
</html>\n\
');
	},

	serve413: function (req, res) {
		if (!res || res.finished) {
			return;
		}
		if (!res.headersSent) {
			res.writeHead(413, {
				'Content-Type': 'text/html; charset=UTF-8',
				'Date': (new Date()).toUTCString(),
				'Server': basicHttp.serverSignature,
				'Content-Security-Policy': basicHttp.csp,
				'Connection': 'close',
			});
		}
		res.end('<!DOCTYPE html>\n\
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en-GB" lang="en-GB">\n\
<head>\n\
<meta charset="UTF-8" />\n\
<title>413 Request Entity Too Large</title>\n\
</head>\n\
<body>\n\
<h1>Request Entity Too Large</h1>\n\
<p>The amount of data provided in the request exceeds the capacity limit.</p>\n\
</body>\n\
</html>\n\
');
	},

	serve500: function (req, res, ex) {
		if (!res || res.finished) {
			return;
		}
		if (basicHttp.npmlog) {
			basicHttp.npmlog.error(basicHttp.npmlogPrefix, ex);
		} else {
			console.error(ex);
		}
		if (!res.headersSent) {
			res.writeHead(500, {
				'Content-Type': 'text/html; charset=UTF-8',
				'Date': (new Date()).toUTCString(),
				'Server': basicHttp.serverSignature,
				'Content-Security-Policy': basicHttp.csp,
			});
		}
		res.end('<!DOCTYPE html>\n\
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en-GB" lang="en-GB">\n\
<head>\n\
<meta charset="UTF-8" />\n\
<title>500 Internal Server Error</title>\n\
</head>\n\
<body>\n\
<h1>Internal Server Error</h1>\n\
<p>The server encountered an internal error or misconfiguration and was unable to complete your request.</p>\n\
<pre>' + basicHttp.escapeHtml(ex) + '</pre>\n\
</body>\n\
</html>\n\
');
	},

	serve503: function (req, res) {
		if (!res) {
			return;
		}
		if (res.finished || res.headersSent) {
			res.end();
		} else {
			res.writeHead(503, {
				'Content-Type': 'text/html; charset=UTF-8',
				'Date': (new Date()).toUTCString(),
				'Server': basicHttp.serverSignature,
				'Content-Security-Policy': basicHttp.csp,
			});
			res.end('<!DOCTYPE html>\n\
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en-GB" lang="en-GB">\n\
<head>\n\
<meta charset="UTF-8" />\n\
<title>503 Service Unavailable</title>\n\
</head>\n\
<body>\n\
<h1>Service Unavailable</h1>\n\
<p>The service you are requesting is temporarily unavailable.</p>\n\
</body>\n\
</html>\n\
');
		}
	},

	serveStaticFile: function (req, res) {
		if (!res || res.finished) {
			return;
		}
		var url = req.url,
			qn = url.indexOf('?');
		if (qn >= 0) {	//No query string
			url = url.substring(0, qn);
		}
		if ((/^(\/[a-z0-9_-]{1,64})?\/[a-z0-9_-]{1,128}(\.[a-z0-9]{2,4})?\.[a-z0-9]{2,4}$/i).test(url) && (!(/\.\./).test(url))) {
			var myPath = './static' + url;
			fs.stat(myPath, function (err, stats) {
				if ((!err) && stats.isFile()) {
					var ext = path.extname(myPath),
						mimes = {
							'.css': 'text/css; charset=UTF-8',
							'.html': 'text/html; charset=UTF-8',
							'.ico': 'image/x-icon',
							'.jpg': 'image/jpeg',
							'.js': 'application/javascript; charset=UTF-8',
							'.json': 'application/json; charset=UTF-8',
							'.mp3': 'audio/mpeg',
							'.png': 'image/png',
							'.svg': 'image/svg+xml; charset=UTF-8',
							'.txt': 'text/plain; charset=UTF-8',
							'.woff': 'application/font-woff',
							'.xml': 'application/xml; charset=UTF-8',
						},
						modifiedDate = new Date(stats.mtime).toUTCString();
					if (modifiedDate === req.headers['if-modified-since']) {
						res.writeHead(304, {
							'Content-Type': ext && mimes[ext] ? mimes[ext] : 'application/octet-stream',
							'Date': (new Date()).toUTCString(),
							'Content-Security-Policy': basicHttp.csp,
						});
						res.end();
					} else {
						res.writeHead(200, {
							'Content-Type': ext && mimes[ext] ? mimes[ext] : 'application/octet-stream',
							'Content-Length': stats.size,
							'Cache-Control': 'public, max-age=86400',
							'Date': (new Date()).toUTCString(),
							'Last-Modified': modifiedDate,
							'Server': basicHttp.serverSignature,
							'Content-Security-Policy': basicHttp.csp,
						});
						fs.createReadStream(myPath).pipe(res);
					}
				} else {
					basicHttp.serve404(req, res);
				}
			});
		} else {
			basicHttp.serve404(req, res);
		}
	},

	serveJson: function (req, res, json) {
		if (!res || res.finished) {
			return;
		}
		res.writeHead(200, {
			'Content-Type': 'application/json; charset=UTF-8',
			'Date': (new Date()).toUTCString(),
			'Server': basicHttp.serverSignature,
		});
		res.write(JSON.stringify(json));
		res.end("\n");
	},

};

exports.basicHttp = basicHttp;
