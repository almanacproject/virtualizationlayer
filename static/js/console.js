"use strict";

try {
	var webSocket = new WebSocket((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/ws/custom-events');

	webSocket.onerror = function (event) {
			console.log('WebSocket error: ' + JSON.stringify(event));
		};

	webSocket.onopen = function () {
			console.log('WebSocket connected');
			webSocket.send(JSON.stringify({
				"topic":"/.*",
				"matching":"regex"
			}));
		};

	webSocket.onclose = function () {
			console.log('WebSocket closed');
		};

	webSocket.onmessage = function (event) {
			console.log('WebSocket message: ' + event.data);
		};
} catch (ex) {
	console.log('Exception: ' + ex.message);
}
