"use strict";

// the configuration parameters
var scral_url = "./scral";
var dfm_url = "./dfm";
var network_manager_url = "./linksmart/";
var storage_manager_url = "./sm/Datastreams?$top=0";
var resource_catalog_url = "./ResourceCatalogue/";
var dfl_url = "./dfl/api/data-fusion/v0.5.0/chains/";


// the watchdog timer
var watchdog;
var vlcConnectionTimer;

// the active services tracking
var activeServicesCount = 0;
var allServicesCount = 6;

$(document).ready(function() {
	handleServiceCountUIUpdate();
	getDevicesCount();
	getStatementCount();
	getNetworkManagerStatus();
	getStorageManagerStatus();
	getResourceCatalogStatus();
	getMqttState();
	getDFLStatus();
	websocketSetUp();

	setInterval(function() {
		getDevicesCount();
		getStatementCount();
		getNetworkManagerStatus();
		getStorageManagerStatus();
		getResourceCatalogStatus();
		getMqttState();
		getDFLStatus();
	}, 10000);
});

// ------- Active services ---------------
function incActiveServices()
{
		activeServicesCount++;
		handleServiceCountUIUpdate();
}
function decActiveServices()
{
		activeServicesCount--;
		handleServiceCountUIUpdate();
}

function handleServiceCountUIUpdate()
{
	$("#activeServicesCount").text(activeServicesCount);
	if (activeServicesCount > allServicesCount * 2/3)
	{
		$("#activeServicesCount").addClass("label-success");
		$("#activeServicesCount").removeClass("label-warning");
		$("#activeServicesCount").removeClass("label-danger");
	}
	else if (activeServicesCount > allServicesCount * 1/3)
	{
		$("#activeServicesCount").removeClass("label-success");
		$("#activeServicesCount").addClass("label-warning");
		$("#activeServicesCount").removeClass("label-danger");
	}
	else
	{
		$("#activeServicesCount").removeClass("label-success");
		$("#activeServicesCount").removeClass("label-warning");
		$("#activeServicesCount").addClass("label-danger");
	}

}
// ---------------------------------------

// ------- SCRAL -------------------------
function getDevicesCount() {
	$.ajax({
		url : scral_url+"/countDevice",
		type : "GET",
		crossDomain : true,
		success : function(data) {
			var deviceCount = data;
			fillCountDevice(deviceCount);
			if ($("#scralStatus").text()=="Offline")
				incActiveServices();
			$("#scralStatus").text("Online");

			//set the class
			$("#scralStatus").removeClass("label-danger");
			$("#scralStatus").addClass("label-success");
		},
		error : function() {
			var deviceCount = 0;
			if ($("#scralStatus").text()=="Online")
				decActiveServices();
			fillCountDevice(deviceCount);
			$("#scralStatus").text("Offline");

			//set the class
			$("#scralStatus").addClass("label-danger");
			$("#scralStatus").removeClass("label-success");
		}
	});
}

function fillCountDevice(count) {
	$("#deviceCountCatalogue").text(count);
	$("#deviceCountScral").text(count);
}

// ------- END SCRAL ---------------------

// ------- VLC ---------------------------

//web socket connection
function websocketSetUp()
{
	try {
	var webSocket = new WebSocket((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/ws/custom-events');

	webSocket.onerror = function (event) {
			console.log('WebSocket error: ' + JSON.stringify(event));
			//schedule retry in 30s
			vlcConnectionTimer = setTimeout(websocketSetUp,30000);
		};

	webSocket.onopen = function () {
			console.log('WebSocket connected');
			if (vlcConnectionTimer)
				clearTimeout(vlcConnectionTimer);
			webSocket.send("{\"topic\":\"/broadcast\"}");
			handleAliveMessage();
		};

	webSocket.onclose = function () {
			console.log('WebSocket closed');
		};

	webSocket.onmessage = function (event) {
			console.log('WebSocket message: ' + event.data);
			var jsonData = JSON.parse(event.data);
			if (jsonData.payload && jsonData.payload.type == "ALIVE")
				handleAliveMessage();
		};
	} catch (ex) {
	console.log('Exception: ' + ex.message);
	}
}

//handle the Virtualization Layer Alive message
function handleAliveMessage()
{
	//reset the watchdog timer
	if (watchdog)
		clearTimeout(watchdog);

	if ($("#vlcStatus").text()=="Offline")
				incActiveServices();

	//set the alive status
	$("#vlcStatus").text("Online");

	//set the class
	$("#vlcStatus").removeClass("label-danger");
	$("#vlcStatus").addClass("label-success");

	//start the watchdog
	// the ALIVE interval is 60000ms to be safe we permit one missing alive message
	watchdog = setTimeout(handleVLCOffline, 120000);
}

function handleVLCOffline()
{
	//set the alive status
	$("#vlcStatus").text("Offline");

	//set the class
	$("#vlcStatus").addClass("label-danger");
	$("#vlcStatus").removeClass("label-success");

	decActiveServices();
}

//--------- END VLC -----------------------

//--------- DFM ---------------------------
function getStatementCount() {
	$.ajax({
		url : dfm_url + "/",
		type : "GET",
		crossDomain : true,
		dataType: "json",
		success : function(jsonData) {
			$("#dfmQueryCount").text("" + (jsonData && jsonData.status ?
				+jsonData.status.amount : 0));
			if ($("#dfmStatus").text()=="Offline")
				incActiveServices();
			$("#dfmStatus").text("Online");
			//set the class
			$("#dfmStatus").removeClass("label-danger");
			$("#dfmStatus").addClass("label-success");
		},
		error : function() {
			$("#dfmQueryCount").text("0");
			if ($("#dfmStatus").text()=="Online")
				decActiveServices();
			$("#dfmStatus").text("Offline");
			//set the class
			$("#dfmStatus").addClass("label-danger");
			$("#dfmStatus").removeClass("label-success");
		}
	});
}
//--------- END DFM -----------------------

//--------- MQTT Broker -------------------
function getMqttState() {
	$.getJSON("/virtualizationLayerInfo", function (data) {
		if (data && data.mqttConnected) {
			$("#brokerStatus").text("Online");
			$("#brokerStatus").removeClass("label-danger");
			$("#brokerStatus").addClass("label-success");
		} else {
			$("#brokerStatus").text("Offline");
			$("#brokerStatus").addClass("label-danger");
			$("#brokerStatus").removeClass("label-success");
		}
		if (data.instanceName) {
			$("#instanceName").text(data.instanceName);
			document.title = "ALMANAC - " + data.instanceName + " Platform Instance";
		}
	});
}

//----------- End MQTT broker ----------
//----------- Network Manager ----------
function getNetworkManagerStatus() {
	$.ajax({
		url : network_manager_url,
		type : "GET",
		crossDomain : true,
		dataType: "json",
		success : function(jsonData) {
			console.log(jsonData);
			if ($("#networkManagerStatus").text() === "Offline") {
				incActiveServices();
			}
			$("#networkManagerStatus").text("Online");
			$("#networkManagerCount").text("" + (jsonData ? +jsonData.amount : 0));
			//set the class
			$("#networkManagerStatus").removeClass("label-danger");
			$("#networkManagerStatus").addClass("label-success");
		},
		error : function(xhr) {
			if ($("#networkManagerStatus").text() === "Online") {
				decActiveServices();
			}
			$("#networkManagerStatus").text("Offline");
			$("#networkManagerCount").text("0");
			//set the class
			$("#networkManagerStatus").addClass("label-danger");
			$("#networkManagerStatus").removeClass("label-success");
		}
	});
}
//--------- END Network Manager ----------

//----------- Storage Manager ----------
function storageManagerUp() {
	if ($("#storageManagerStatus").text()=="Offline")
		incActiveServices();
	$("#storageManagerStatus").text("Online");
	//set the class
	$("#storageManagerStatus").removeClass("label-danger");
	$("#storageManagerStatus").addClass("label-success");
}
function storageManagerUpDown() {
	if ($("#storageManagerStatus").text()=="Online")
		decActiveServices();
	$("#storageManagerStatus").text("Offline");
	//set the class
	$("#storageManagerStatus").addClass("label-danger");
	$("#storageManagerStatus").removeClass("label-success");
	$("#smDatastreamCount").text("0");
}

function getStorageManagerStatus() {
	$.ajax({
		url : storage_manager_url,
		type : "GET",
		crossDomain : true,
		success : function(jsonData) {
			if (jsonData && jsonData.iotCount) {
				console.log("Storage Manager IoT count: " + jsonData.iotCount);
				storageManagerUp();
				$("#smDatastreamCount").text("" + (jsonData ? +jsonData.iotCount : 0));
			} else {
				console.log(jsonData);
				storageManagerUpDown();
			}
		},
		error : function() {
			console.log('getStorageManagerStatus error');
			storageManagerUpDown();
		},
	});
}
//--------- END Storage Manager  ----------

//----------- Resource Catalog ----------
function getResourceCatalogStatus() {
	$.ajax({
		url : resource_catalog_url,
		type : "GET",
		crossDomain : true,
		success : function(data) {
			console.log(data);
			if ($("#resourceCatalogStatus").text()=="Offline")
				incActiveServices();
			$("#resourceCatalogStatus").text("Online");
			//set the class
			$("#resourceCatalogStatus").removeClass("label-danger");
			$("#resourceCatalogStatus").addClass("label-success");
		},
		error : function() {
			if ($("#resourceCatalogStatus").text()=="Online")
				decActiveServices();
			$("#resourceCatalogStatus").text("Offline");
			//set the class
			$("#resourceCatalogStatus").addClass("label-danger");
			$("#resourceCatalogStatus").removeClass("label-success");
		}
	});
}
//--------- END Resource Catalog  ----------

//----------- DFL ----------
function dflOnline() {
	if ($("#dflStatus").text() === "Offline") {
		incActiveServices();
	}
	$("#dflStatus").text("Online");
	//set the class
	$("#dflStatus").removeClass("label-danger");
	$("#dflStatus").addClass("label-success");
}

function dflOffline() {
	if ($("#dflStatus").text() === "Online") {
		decActiveServices();
	}
	$("#dflStatus").text("Offline");
	//set the class
	$("#dflStatus").addClass("label-danger");
	$("#dflStatus").removeClass("label-success");
}

function getDFLStatus() {
	$.ajax({
		url : dfl_url,
		type : "GET",
		crossDomain : true,
		success : function(data) {
			console.log(data);
			dflOnline();
		},
		error : function(xhr) {
			if (xhr.status == 400) {
				dflOnline();	//A request without parameter currently returns a 400
			} else {
				dflOffline();
			}
		}
	});
}
//--------- END DFL ----------
