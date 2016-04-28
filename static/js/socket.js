"use strict";

var messages = document.getElementById('messages'),
		messageBox = document.getElementById('m'),
		actionForm = document.getElementById('actionForm');

function append(text) {
	while (messages.childNodes.length > 128) {
		messages.removeChild(messages.firstChild);
	}
	var li = document.createElement('li');
	li.textContent = text;
	messages.appendChild(li);
	li = null;
	window.scrollTo(0, document.body.scrollHeight);
	messageBox.focus();
}

try {
	var webSocket = new WebSocket('ws://' + location.host + '/ws/chat');

	webSocket.onerror = function (event) {
			append('Error: ' + JSON.stringify(event));
		};

	webSocket.onopen = function () {
			append('Connected');
		};

	webSocket.onclose = function () {
			append('Closed');
			webSocket = null;
		};

	webSocket.onmessage = function (event) {
			append('Message: ' + event.data);
		};
} catch (ex) {
	append('Exception: ' + ex.message);
}

actionForm.onsubmit = function (event) {
		if (webSocket) {
			webSocket.send(JSON.stringify({
				text: this.m.value,
			}));
		} else {
			append('WebSocket not ready!');
		}
		this.m.value = '';
		return false;
	};
