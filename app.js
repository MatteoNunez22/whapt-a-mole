// vim:ts=4:noexpandtab:sw=4
// Copyright 2014, Evothings AB
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// RedBearLab - Simple Chat
// version: 0.5 - 2014-12-11
//



/********** STATE MACHINES FOR EXPERIMENT **********/
// On the left there is the state machine of the views
// On the right there is the function that are involved in changing the views
// Felix Dube


/* 	INTRODUCTION
* 	The idea of the introduction phase is that the user is presented with the 
* 	pictogram of each tactons one by one and by clicking on the pictogram the 
* 	tacton is felt on the shoe. At the end of all the tactons, the user have the
* 	choice of ending the introduction or to go throught all the tactons again.

	
	--> selectorView
	|		|					app.goSession = function()
	|		v
 OR |   userInfo
	|		|					app.userInfo = function(userID, position, positions, type, max)
	|		v
	|->	   rht 				--
	|	   	|				  |
	|		v 				  |
	|	   trh 				  |
	|		| 				  |
	|		v 				  |
	|	   hlt 				  |
	|		|				  |
	|		v 				  |
	|	   hrl 				  |	app.doIntro = function(pattern)
	|		| 				  |
	|		v 				  |
	|	   ltr 				  |
	|		| 				  |
	|		v 				  |
	|	   rlt 				  |
	|		| 				  |
	|		v 				  |
	|	   rht 				  |
	|		| 				--
	 <------
*/


/* 	TRAINING
* 	The idea of the training phase is that the user is being presented with the 
* 	vibration of a tactons after which they have to choose the tacton they felt
* 	from a list of pictogram presenting all the possible tactons. After each trial
* 	they user is presented with a feedback telling him if he was right or wrong.

				   selectorView
						|					app.goSession = function()
			    		v
			 	     userInfo 				app.userInfo = function(userID, position, positions, type, max)
						|					app.doExperiment = function()
					    v 					app.goPrompt = function()
------------------>	promptView
|					    | 					app.goRecord = function(promptAnswer)
|					    v 					
|				  experimentView
|				  	  /     \				app.recordPattern = function(pattern)
|				  	 /   OR  \				app.interResult = function()
|				  	/         \
|				   v 		   v
|	experimentRightView      experimentWrongView
|            |						|
| 		 	 |						|		app.resumeExp = function()
 -----------------------------------		app.trainingResult = function()
		OR	 			|
			 			|
						v
					resultView
*/



/*	OFFICIAL
*	The idea of the official phase is that the user is being presented with the 
* 	vibration of a tacton. No feedback is provided to the user.

		selectorView
			|					app.goSession = function()
			v
		 userInfo 				app.userInfo = function(userID, position, positions, type, max)
			|					app.doExperiment = function()
		    v 					app.goPrompt = function()
  ---->	promptView
 |		    | 					app.goRecord = function(promptAnswer)
 |			v 					
 |	  experimentView
 |		    |					app.recordPattern = function(pattern)
  ----------|	
        OR  |
			|
			v
		resultView
*/



$(document).ready(function() { app.initialize() });

//document.addEventListener('deviceready', function() { app.initialize() }, false);

// to calculate the response time 
var timeStartInMs;
var timeEndInMs;
var timeDeltaInMs;

var app = {};

var expType;

app.rightShoe = false;
app.leftShoe = false;
var finalShoe= true;
var numShoe= 0;

var maxExperiment = 0;

var needZeroOutRight = true;
var needZeroOutLeft = true;
var pitchOffset = 0;
var rollOffset = 0;
var yawOffset = 0;
var heightOffset = 0;
var numRecieved = 0;
var start = new Date();

var results;
var userIDSubject;
var resultCount = 1;

app.connectionFaking = false;
app.debugLog = false;
app.mcuDebug = true;

app.RBL_SERVICE_UUID = '713d0000-503e-4c75-ba94-3148f18d941e';
app.RBL_CHAR_TX_UUID = '713d0002-503e-4c75-ba94-3148f18d941e';
app.RBL_CHAR_RX_UUID = '713d0003-503e-4c75-ba94-3148f18d941e';
app.RBL_TX_UUID_DESCRIPTOR = '00002902-0000-1000-8000-00805f9b34fb';

app.playContinous = false;
app.playFootFall = false;
app.buzzCount = 1;
app.showingSettings = false;
app.streamSensorData = true;
app.gauges = false;
app.pacman = false;
app.pacmanStarted = false;
app.scanOptionsOpen = true;

app.sensorValues = {};
app.patternValues = {};

app.deviceRight = null;
app.deviceLeft = null;

var experimentCount = 0;

app.pastPattern = ["l", "l", "l", "l", "l", "l"];

app.selectablePatterns = [ 
				"ltr", "rlt",
				"trh", "hlt",
				"hrl", "rht"
			];

app.testing = false;
app.testPatterns = [ 
				"ll", "rr",
				"hh", "tt"
			];

app.manualPatterns = app.selectablePatterns.concat([ "t", "l", "r", "h" ]);

app.populatedExperiment = false;
// old pattern
/*
app.selectablePatterns = [ 
				"th", "tlh", "trh",
				"lr", "lrh", "lhr",
				"rl", "rlh", "rhl",
				"ht", "hlt", "hrt", "hlr", "hrl",
				"t","l","r","h",
			];
			*/

app.initialize = function() {
	app.connected = false;
	app.updateScanOptions();
	app.updateContinous();
	app.updateStreamingButton();
	app.updateDebugButton();
	app.updateMCUDebugButton();
	app.updateFootFall();
	app.updateGaugeToggle();
	app.updatePacman();
	$('#shoeButtons').hide();
	$('.rightShoeDisplay').hide();
	$('.leftShoeDisplay').hide();


	var canvasRight = document.getElementById('soleCanvasRight');
	var canvasLeft = document.getElementById('soleCanvasLeft');
	app.touchVibration(canvasRight);
	app.touchVibration(canvasLeft);
};

app.initFirebase = function() {
	// Initialize Firebase
	var config = {
		apiKey: "AIzaSyA1uOkVytyJbqvE0R3UgwEnWdsS1SLAdq8",
		authDomain: "srlshoe-xp-2.firebaseapp.com",
		databaseURL: "https://srlshoe-xp-2.firebaseio.com",
		storageBucket: "srlshoe-xp-2.appspot.com"
	};

	firebase.initializeApp(config);
	firebase.auth().signInWithCredential( firebase.auth.EmailAuthProvider.credential('shoelog@23t.de', 'rau7meiP' ));

	app.db = firebase.database();
};

app.initFirebase();

app.setLoadingLabel = function(message) {
	console.log(message);
	$('#loadingStatus').text(message);
};

app.connectTo = function(address,finalShoe) {
	device = app.devices[address];	
	console.log("Connecting to:" + address);
	if(numShoe>0) {
		finalShoe=true;
	}

	$('#loadingView').css('display', 'table');

	app.setLoadingLabel('Trying to connect to ' + device.name);

	function onConnectSuccess(device) {

		function onServiceSuccess(device) {
			// Application is now connected
			app.connected = true;
			numShoe += 1;
			if (device.name == "SRL Haptic Shoe Right"){
				app.deviceRight = device;
				app.rightShoe = true;
				app.enableButton('right');
			}
			else if (device.name == "SRL Haptic Shoe Left"){
				app.deviceLeft = device;
				app.leftShoe = true;
				app.enableButton('left');
			}
			console.log('Connected to ' + device.name);

			device.writeDescriptor(
				app.RBL_CHAR_TX_UUID, // Characteristic for accelerometer data
				app.RBL_TX_UUID_DESCRIPTOR, // Configuration descriptor
				new Uint8Array([1,0]),
				function() {
					console.log('Status: writeDescriptor ok.');

					if(finalShoe) {
						$('#startView').hide();
						$('#loadingView').hide();
						$('#scanResultView').hide();
						$('#selectorView').show();
						$('#shoeButtons').show();
					}
					else {
						$('#startView').hide();
						$('#loadingView').hide();
						$('#scanResultView').show();
						$('#selectorView').hide();
					}
				},
				function(errorCode) {
					// Disconnect and give user feedback.
					app.disconnect('Failed to set descriptor.');

					// Write debug information to console.
					console.log('Error: writeDescriptor: ' + errorCode + '.');
				}
			);

			if (finalShoe) {
				var connectMsg = "";
				if(app.deviceRight!=null) {
					connectMsg=connectMsg.concat("Right Shoe\n");
					//updateWhichShoe inverses the decision, in order to get accurate initialization have to pretend current shoe is opposite
					if(app.rightShoe) app.rightShoe=false; else app.rightShoe=true;
					app.updateWhichShoe("Right Shoe");
				}
				if(app.deviceLeft!=null) {
					connectMsg=connectMsg.concat("Left Shoe\n");
					//updateWhichShoe inverses the decision, in order to get accurate initialization have to pretend current shoe is opposite
					if(app.leftShoe) app.leftShoe=false; else app.leftShoe=true;
					app.updateWhichShoe("Left Shoe");
				}
				navigator.notification.alert(connectMsg, function() {},"Connected to:");
			}

			if(app.rightShoe) {
				app.deviceRight.enableNotification(
					app.RBL_CHAR_TX_UUID,
					app.receivedMessageRight,
					function(errorcode) {
						if (typeof errorCode != "undefined") {
							console.log('BLE enableNotification error: ' + errorCode);
						} else {
							console.log('BLE enableNotification error');
						}
					}
				);
			}
			if (app.leftShoe) {
				app.deviceLeft.enableNotification(
					app.RBL_CHAR_TX_UUID,
					app.receivedMessageLeft,
					function(errorcode) {
						if (typeof errorCode != "undefined") {
							console.log('BLE enableNotification error: ' + errorCode);
						} else {
							console.log('BLE enableNotification error');
						}
					}
				);
			}

			$('#scanResultView').hide();
			$('#selectorView').show();
		}

		function onServiceFailure(errorCode) {
			// Disconnect and show an error message to the user.
			app.disconnect('Device is not from RedBearLab');

			// Write debug information to console.
			console.log('Error reading services: ' + errorCode);
		}

		app.setLoadingLabel('Identifying services...');

		// Connect to the appropriate BLE service
		device.readServices(
			[app.RBL_SERVICE_UUID],
			onServiceSuccess,
			onServiceFailure
		);
	} 

	function onConnectFailure(errorCode) {
		app.disconnect('Disconnected from device');

		// Show an error message to the user
		console.log('Error ' + errorCode);
	}

	// Stop scanning
	if(finalShoe) {
		evothings.easyble.stopScan();
	}

	// Connect to our device
	console.log('Identifying service for communication');
	device.connect(onConnectSuccess, onConnectFailure);
};

var pos = 0;
var step = 0.1;
var fakeTimer;

app.fakeSensorGenerator = function(interval) {
	var values = {};
	var message = "";
	if (fakeTimer != 0) {
		clearInterval(fakeTimer);
	}

	fakeTimer = setInterval(function() {
		if (pos < 2*Math.PI) {
			pos += step;
		} else {
			pos = 0;
		}

		values.yaw = Math.sin(pos);
		values.roll = Math.cos(pos);
		values.pitch = -Math.sin(pos);

		values.right = Math.sin(pos);
		values.left = Math.cos(pos);
		values.toe = -Math.sin(pos);
		values.heel = -Math.cos(pos);

		values.height = Math.cos(pos);

	//	document.getElementById('ID').innerHTML
	//	app.saveSensors("jtest23", values, "Main", "walking");
		// generate fake string
		// A19312708S000617083 BH968L883R886T968 CZ051Y205P193O185
		app.receivedMessageRight("A19312708S000617083\n");

		//message = "BH968L883R886T968 CZ051Y205P193O185\n";
		message = "B";
		message = message.concat("H" + Math.round(values.heel.map(-1, 1, 1, 1023)));
		message = message.concat("L" + Math.round(values.left.map(-1, 1, 1, 1023)));
		message = message.concat("R" + Math.round(values.right.map(-1, 1, 1, 1023)));
		message = message.concat("T" + Math.round(values.toe.map(-1, 1, 1, 1023)));
		app.receivedMessageRight(message+"\n");
		message = "C";
		message = message.concat("Z" + Math.round(values.height.map(-1, 1, 1, 255)));
		message = message.concat("Y" + Math.round(values.yaw.map(-1, 1, 1, 255)));
		message = message.concat("P" + Math.round(values.pitch.map(-1, 1, 1, 255)));
		message = message.concat("O" + Math.round(values.roll.map(-1, 1, 1, 255)));
		app.receivedMessageRight(message+"\n");
	}, interval);
};

app.fakeConnect = function() {
	console.log('Starting w/ fake device');
	$('#startView').hide();
	app.connected = true;
	app.connectionFaking = true;
	app.fakeSensorGenerator(100);
	$('#startView').hide();
	$('#loadingView').hide();
	$('#selectorView').show();
	$('#shoeButtons').show();
	app.enableButton('right');
	app.enableButton('left');
	app.updateWhichShoe("Right Shoe");
	app.updateWhichShoe("Left Shoe");
}

app.startScan = function(finalShoe) {
	evothings.easyble.closeConnectedDevices();
	app.disconnect();
	app.disableButton('right');
	app.disableButton('left');

	console.log('Scanning started...');

	app.devices = {};

	var htmlString =
		'<img src="img/loader_small.gif" style="display:inline; vertical-align:middle">' +
		'<p style="display:inline">   Scanning...</p>';

	$('#scanResultView').append($(htmlString));

	$('#scanResultView').show();

	function onScanSuccess(device) {
		if (device.name != null) {
			app.devices[device.address] = device;

			console.log('Found: ' + device.name + ', ' + device.address + ', ' + device.rssi);

			var htmlString =
				'<div class="deviceContainer" onclick="app.connectTo(\'' +
					device.address + '\',' + finalShoe +')">' +
				'<p class="deviceName">' + device.name + '</p>' +
				'<p class="deviceAddress">' + device.address + '</p>' +
				'</div>';

			$('#scanResultView').append($(htmlString));
		}
	};

	function onScanFailure(errorCode) {
		// Show an error message to the user
		app.disconnect('Failed to scan for devices.');

		// Write debug information to console.
		console.log('Error ' + errorCode);
	};

	evothings.easyble.reportDeviceOnce(true);
	evothings.easyble.startScan(onScanSuccess, onScanFailure);

	$('#startView').hide();
};

app.autoConnect = function() {
	evothings.easyble.closeConnectedDevices();
	app.disconnect();
	$('#loadingView').show();
	app.disableButton('right');
	app.disableButton('left');

	console.log('Scanning started...');

	var finalShoe = false;
	app.devices = {};
	var lastTime = 0;
	var devicesFound = 0;

	//all of the setTimeout delays are in place in order for the shoes to connect seperately, multiple ~simultaneous connectTo() calls mess things up
	function onScanSuccess(device) {
		if (device.name != null) {
			lastTime = Date.now();
			app.devices[device.address] = device;

			console.log('Found: ' + device.name + ', ' + device.address + ', ' + device.rssi);

			if (device.name == "SRL Haptic Shoe Right") {
				devicesFound++;
				setTimeout(function(){
					if(devicesFound<2) finalShoe=true;
				}, 500);
				setTimeout(function(){app.connectTo(device.address,finalShoe)},700);
			}
			if (device.name == "SRL Haptic Shoe Left") {
				devicesFound++;
				setTimeout(function(){app.connectTo(device.address,true)},1700);
			}
		}
	};

	function onScanFailure(errorCode) {
		// Show an error message to the user
		app.disconnect('Failed to scan for devices.');

		// Write debug information to console.
		console.log('Error ' + errorCode);
	};

	evothings.easyble.reportDeviceOnce(true);
	evothings.easyble.startScan(onScanSuccess, onScanFailure);
	setTimeout(function(){
		if(devicesFound==0) app.disconnect('No devices found');
		}, 3000);

};

var populated = false;
app.populatePatterns = function() {
//	hyper.log(app.manualPatterns);
	
	if (!populated) {
		for (var i = 0; i < app.manualPatterns.length; i++) {
			var htmlString =
				'<div class="patternContainer" onclick="app.playPattern(\'' +
					app.manualPatterns[i] + '\')">' +
				'<img src="img/pictograms/'+ app.buzzCount + app.manualPatterns[i] + '.png"/>' +

				'</div>';

			//console.log(htmlString);
			$('#shoeView').append($(htmlString));
		}
		populated = true;
	}

}

app.populatePatternsExperiment = function() {
	if (!app.populatedExperiment) {
		//hyper.log(app.selectablePatterns);
		if (app.testing) {
			patterns = app.testPatterns;
		} else {
			patterns = app.selectablePatterns;
		}

		$('#experimentView').empty();
		var htmlString = "<button id='unknownButton' class='red wide' onclick='app.goRecord(unknownButton)'>I don't know</button>";
		for (var i = 0; i < patterns.length; i++) {
			htmlString = htmlString.concat(
				'<div class="patternContainer" onclick="app.recordPattern(\'' +
					patterns[i] + '\')">' +
				'<img src="img/pictograms/'+ app.buzzCount + patterns[i] + '.png"/>' +

				'</div>');

			//console.log(htmlString);
		}
		$('#experimentView').append($(htmlString));
		app.populatedExperiment = true;
	}
}


app.updateScanOptions = function() {
	if (app.scanOptionsOpen) {
		app.scanOptionsOpen = false;
		$('#scanOptions').hide();
	}
	else {
		app.scanOptionsOpen = true;
		$('#scanOptions').show();
	}
}

app.updateContinous = function() {
	if (app.playContinous) {
		document.getElementById('continous').innerHTML = "Play Continously";
	} else {
		document.getElementById('continous').innerHTML = "Play Single";
	}
}

app.showSettings = function() {
	if (!app.showingSettings) {
		app.showingSettings = true;
		$('#settingsView').show();
	} else 
	{
		$('#settingsView').hide();
		app.showingSettings = false;
	}
}

app.saveSettings = function() {
	$('#settingsView').hide();
}

app.disableShoeNotifications = function() {
	if(app.deviceRight != null) {
		app.deviceRight.disableNotification(
			app.RBL_CHAR_TX_UUID,
			function(){
				console.log("Right shoe notification disabled");
			},
			function(errorcode) {
				if (typeof errorCode != "undefined") {
					console.log('BLE enableNotification error: ' + errorCode);
				} else {
					console.log('BLE enableNotification error');
				}
			}
		);
	}
	if(app.deviceLeft != null) {
		app.deviceLeft.disableNotification(
			app.RBL_CHAR_TX_UUID,
			function(){
				console.log("Left shoe notification disabled");
			},
			function(errorcode) {
				if (typeof errorCode != "undefined") {
					console.log('BLE enableNotification error: ' + errorCode);
				} else {
					console.log('BLE enableNotification error');
				}
			}
		);
	}	
}

app.updateWhichShoe = function(shoe) {
	var LSB = document.getElementById("leftShoeButton");
	var RSB = document.getElementById("rightShoeButton");
	if (shoe=="Right Shoe") {
		app.updateRightShoe();
	} else if (shoe == "Left Shoe") {
		app.updateLeftShoe();
	}
}

app.updateLeftShoe = function() {
	var LSB = document.getElementById("leftShoeButton");
	if(app.leftShoe) {
		app.leftShoe = false;
		if(!LSB.disabled) LSB.style.opacity='0.4';
		if(app.rightShoe) $('.rightShoeDisplay').css("width","300px");
		$('.leftShoeDisplay').hide();
	}
	else {
		app.leftShoe = true;
		if (!LSB.disabled) LSB.style.opacity='1';
		if (app.rightShoe) {
			$('.rightShoeDisplay').css("width","150px");
			$('.leftShoeDisplay').css("width","150px");
		}
		else $('.leftShoeDisplay').css("width","300px");
		$('.leftShoeDisplay').show();
	}
}

app.updateRightShoe = function() {
	var RSB = document.getElementById("rightShoeButton");
	if(app.rightShoe) {
		app.rightShoe = false;
		if(!RSB.disabled) RSB.style.opacity='0.4';
		if(app.leftShoe) $('.leftShoeDisplay').css("width","300px");
		$('.rightShoeDisplay').hide();
	}
	else {
		app.rightShoe = true;
		if(!RSB.disabled) RSB.style.opacity='1';
		if(app.leftShoe) {
			$('.leftShoeDisplay').css("width","150px");
			$('.rightShoeDisplay').css("width","150px");
		}
		else $('.rightShoeDisplay').css("width","300px");
		$('.rightShoeDisplay').show();
	}
}

app.toggleContinous = function() {
	if (app.playContinous) {
		app.playContinous = false;
	} else {
		app.playContinous = true;
	}
	app.updateContinous();
	//hyper.log("toggle continous");
	app.sendMessage(" c\r");
}

/**
* @brief: toggle real time streaming of sensor data
*/
app.toggleStreaming = function() {
	if (app.streamSensorData) {
		app.streamSensorData = false;
	} else {
		app.streamSensorData = true;
	}
	app.updateStreamingButton();
}

app.updateStreamingButton = function() {
	if (app.streamSensorData) {
		document.getElementById('streamSensorData').innerHTML = "Stream Sensor Data";
	} else {
		document.getElementById('streamSensorData').innerHTML = "Don't Stream Sensor Data";
	}
}
		
app.toggleDebugLog = function() {
	if (app.debugLog) {
		app.debugLog = false;
	} else {
		app.debugLog = true;
	}
	app.updateDebugButton();
}

app.toggleMCUDebug = function() {
	if (app.mcuDebug) {
		app.mcuDebug = false;
		app.sendMessage(" D 0 \r");
	} else {
		app.mcuDebug = true;
		app.sendMessage(" D 1 \r");
	}
	app.updateMCUDebugButton();
}

app.updateDebugButton = function() {
	if (app.debugLog) {
		document.getElementById('debugLog').innerHTML = "Don't Log Serial";
	} else {
		document.getElementById('debugLog').innerHTML = "Log Serial";
	}
}
		
app.updateMCUDebugButton = function() {
	if (app.mcuDebug) {
		document.getElementById('mcuDebug').innerHTML = "MCU Debug Enabled";
	} else {
		document.getElementById('mcuDebug').innerHTML = "MCU Debug Disabled";
	}
}

/**
* @brief: toggle gauges
*/

app.toggleGauges = function() {
	if (app.gauges) {
		app.gauges = false;
	} else {
		app.gauges = true;
	}
	app.updateGaugeToggle();
}

app.updateGaugeToggle = function() {
	if (app.gauges) {
		document.getElementById('gauges').innerHTML = "Turn Gauges Off";
		$('#gaugeView').show();
	} else {
		document.getElementById('gauges').innerHTML = "Turn Gauges On";
		$('#gaugeView').hide();	
	}
}

/**
* toggleFootFall
* @brief: send command to shoe that toggle the setting to play on foot fall
*/
app.toggleFootFall = function() {
	if (app.playFootFall) {
		app.playFootFall = false;
		app.sendMessage(" f 0 \r");
	} else {
		app.playFootFall = true;
		app.sendMessage(" f 1 \r");
	}
	app.updateFootFall();
}


/**
* updateFootFall
* @brief: Update the view for the footfall button
*/
app.updateFootFall = function() {
	if (app.playFootFall) {
		document.getElementById('footFall').innerHTML = "Play on Foot Fall";
	} else {
		document.getElementById('footFall').innerHTML = "Dont Play on Foot Fall";
	}
}

app.playPattern = function(pattern) {
	//hyper.log("Play pattern " + pattern + " with " + app.buzzCount + " buzzes.");
	// first char is ignored
	app.sendMessage(" p " + app.buzzCount + pattern + "\r");
	var time = new Date().toISOString();
	if (typeof (app.patternValues.pPlaytimes) != "undefined") {
	  app.patternValues.pPlayTimes.push(time);
	}
}

app.setBuzzes = function(count) {
	app.buzzCount = count;
}

app.sendMessage = function(message) {
	var debugMsg = {};
	if (app.debugLog) {
		debugMsg['v'] = 1;
		debugMsg['f'] = app.connectionFaking;
		debugMsg['x'] = false;
		debugMsg['s'] = true;
		debugMsg['d'] = false;
		debugMsg['m'] = message;
		debugMsg['t'] = new Date().toISOString();
		var userID = document.getElementById('ID').value;
		var path = "serial/" + debugMsg['t'].slice(0, 10).replace(/-/g,"") + "-" + userID;
		
		debugMsg['u'] = userID;
	}

	if (app.connectionFaking) {
		console.log('fake sendMessage:' + message);
	} else {
		if (app.connected) {
			function onMessageSendSucces() {
				console.log('Succeded to send message.');
				if (app.debugLog) {
					debugMsg['x'] = true;
				}
			}

			var err;
			function onMessageSendFailure(errorCode) {
			if (app.debugLog) {
				debugMsg['e'] = errorCode;
			}

				// Disconnect and show an error message to the user.
				app.disconnect('Disconnected');

				// Write debug information to console
				console.log('Error - No device connected.');
			};

			//hyper.log(message);
			var data = new Uint8Array(message.length);

			for (var i = 0, messageLength = message.length;
				i < messageLength;
				i++) {
				data[i] = message.charCodeAt(i);
			}

			if(app.rightShoe) {
				app.deviceRight.writeCharacteristic(
					app.RBL_CHAR_RX_UUID,
					data,
					onMessageSendSucces,
					onMessageSendFailure
				);
			}
			else {
				app.deviceLeft.writeCharacteristic(
				app.RBL_CHAR_RX_UUID,
				data,
				onMessageSendSucces,
				onMessageSendFailure
			);
			}
		}
		else {
			// Disconnect and show an error message to the user.
			app.disconnect('Disconnected');

			// Write debug information to console
			console.log('Error - No device connected.');
		}
	}
		if (app.debugLog) {
			app.db.ref(path).push(debugMsg);
		}
}

function convertRange( value, r1, r2 ) { 
	return ( value - r1[ 0 ] ) * ( r2[ 1 ] - r2[ 0 ] ) / ( r1[ 1 ] - r1[ 0 ] ) + r2[ 0 ];
}

// extend number class to allow value scaling to 0..1023
Number.prototype.map = function ( in_min , in_max , out_min , out_max ) {
	return ( this - in_min ) * ( out_max - out_min ) / ( in_max - in_min ) + out_min;
}


var elapsed = new Date() - start;

app.receivedMessageRight = function(data) {	
	if(app.gauges){
		if(numRecieved==0){
			start = new Date();
			numRecieved++;
		}
		else if ((new Date() - start) < 1000){
			numRecieved++;
		}
		else {
			document.getElementById("recieveRate").innerHTML = numRecieved;
			numRecieved = 0;
		}
	}
	var userID = document.getElementById('ID').value;
	var time = new Date().toISOString();
	if (app.debugLog) {
		var debugMsg = {};
		var debugPath = "serial/" + time.slice(0, 10).replace(/-/g,"") + "-" + userID;
		debugMsg['u'] = userID;
		debugMsg['v'] = 1;
		debugMsg['f'] = app.connectionFaking;
		debugMsg['s'] = false;
		debugMsg['t'] = time;
	}

	var message = "";
	var log = "";

	if (app.connected) {

		app.sensorValues.iUserID = userID;
		app.sensorValues.iSession = document.getElementById('typeExp').value;
		app.sensorValues.iPosition = document.getElementById('position').value;

		var path = "sensors/" + time.slice(0, 10).replace(/-/g,"") + "-" + userID;

		if (app.connectionFaking) {
			message = data;
			if (app.debugLog) {
				debugMsg['m'] = data;
			}
		} else {
			// Convert data to String
			var dataArray = new Uint8Array(data);
			message = String.fromCharCode.apply(null, dataArray);
		}
		if (app.debugLog) {
			debugMsg['m'] = message;
			if (app.debugLog) {
				debugMsg['m'] = message;
			}
			//console.log(JSON.stringify(debugMsg));
		}

		if (message.charAt(0) === 'D') {
			debugMsg['d'] = true;
		}
      	
		if (app.debugLog) {
			app.db.ref(debugPath).push(debugMsg);
		}

        //String s1 = "A"+ sHour+ sMinute+ sDay+ sMonth+ "S"+ sTimestamp+ "\n";
		if (message.charAt(0) === 'A') {
			//log = message;
			app.sensorValues.tMCU = parseInt(message.substring(1,10))
		}
		else if (message.charAt(0) === 'B') {
			app.sensorValues.tAnalog = time;
			//console.log('Message received: ' + message);
			var matches = /H(\d+)L(\d+)R(\d+)T(\d+)/.exec(message);
			var leftVal= parseInt(matches[1]);
			var rightVal= parseInt(matches[4]);
			var heelVal= parseInt(matches[2]);
			var toeVal= parseInt(matches[3]);

			var canvas = document.getElementById('soleCanvasRight');
			app.clear(canvas);
			app.transformBeginRight(canvas);
			app.drawFoot(canvas);
			app.drawCircleHeel(canvas,parseInt(heelVal, 10));
			app.drawCircleLeft(canvas,parseInt(leftVal, 10));
			app.drawCircleRight(canvas,parseInt(rightVal, 10));
			app.drawCircleToe(canvas,parseInt(toeVal, 10));
			app.transformEndRight(canvas);

			if ($('#hapticZoomView').is(':visible')) {
            	app.zoomDir(leftVal, rightVal, heelVal, toeVal);
            }

			if ($('#moleView').is(':visible')) {
            	mole.rightPress(leftVal, rightVal, heelVal, toeVal);
            }

			if (app.gauges) {
				document.getElementById("leftData").innerHTML = leftVal;
				document.getElementById("rightData").innerHTML = rightVal;
				document.getElementById("toeData").innerHTML = toeVal;
				document.getElementById("heelData").innerHTML = heelVal;
			}

			var r1 = [800,1000];
			var r2 = [0,100];

			var heelPercent= parseInt(convertRange(heelVal, r1, r2));
			var leftPercent= parseInt(convertRange(leftVal, r1, r2));
			var rightPercent= parseInt(convertRange(rightVal, r1, r2));
			var toePercent= parseInt(convertRange(toeVal, r1, r2));

            if(!app.connectionFaking)changeDir(leftPercent, rightPercent, heelPercent, toePercent);

		}
		else if (message.charAt(0) === 'C') {
			
			app.sensorValues.tOrientation = time;

			var matches = /Z(\d+)Y(\d+)P(\d+)O(\d+)/.exec(message);
			var height = parseInt(matches[1]);
			var yaw = parseInt(matches[2]);
			var pitch = parseInt(matches[3]);
			var roll = parseInt(matches[4]);

			app.sensorValues.sHeight = height;
			app.sensorValues.sYaw = yaw;
			app.sensorValues.sPitch = pitch + 180;
			app.sensorValues.SRoll = roll + 180;

			if (needZeroOutRight) {
				rollOffsetRight = roll;
				pitchOffsetRight = pitch;
				yawOffsetRight = yaw;
				heightOffsetRight = height;
				needZeroOutRight = false;
			}

			if (app.gauges) {
				document.getElementById("heightDataRight").innerHTML = height;
				document.getElementById("yawDataRight").innerHTML = yaw;
				document.getElementById("pitchDataRight").innerHTML = pitch;
				document.getElementById("rollDataRight").innerHTML = roll;
				setAttitudeR(roll - rollOffsetRight, pitch - pitchOffsetRight);
				setHeadingR(yaw - yawOffsetRight);
				setAltitudeR((height - heightOffsetRight)*(255-heightOffsetRight)/50);
			}

			app.sensorValues.iSchemaVersion = 1;
			app.sensorValues.tServer = firebase.database.ServerValue.TIMESTAMP;

			if (typeof app.sensorValues.tAnalog != "undefined" ) {
				if (app.streamSensorData) {
					app.db.ref(path).push(app.sensorValues);
				}
				app.sensorValues = {};
			}
		}
	} else {
		// Disconnect and show an error message to the user.
		app.disconnect('Disconnected');

		// Write debug information to console
		console.log('Error - No device connected.');
	}
};

app.receivedMessageLeft = function(data) {
	if(app.gauges){
		//document.getElementById("recieveRate").innerHTML = numRecieved;
		if(numRecieved==0){
			start = new Date();
			numRecieved++;
		}
		else if ((new Date() - start) < 1000){
			numRecieved++;
		}
		else {
			document.getElementById("recieveRate").innerHTML = numRecieved;
			numRecieved = 0;
		}
	}
	var userID = document.getElementById('ID').value;
	var time = new Date().toISOString();
	if (app.debugLog) {
		var debugMsg = {};
		var debugPath = "serial/" + time.slice(0, 10).replace(/-/g,"") + "-" + userID;
		debugMsg['u'] = userID;
		debugMsg['v'] = 1;
		debugMsg['f'] = app.connectionFaking;
		debugMsg['s'] = false;
		debugMsg['t'] = time;
	}

	var message = "";
	var log = "";

	if (app.connected) {

		app.sensorValues.iUserID = userID;
		app.sensorValues.iSession = document.getElementById('typeExp').value;
		app.sensorValues.iPosition = document.getElementById('position').value;

		var path = "sensors/" + time.slice(0, 10).replace(/-/g,"") + "-" + userID;

		if (app.connectionFaking) {
			message = data;
			if (app.debugLog) {
				debugMsg['m'] = data;
			}
		} else {
			// Convert data to String
			var dataArray = new Uint8Array(data);
			message = String.fromCharCode.apply(null, dataArray);
		}
		if (app.debugLog) {
			debugMsg['m'] = message;
			if (app.debugLog) {
				debugMsg['m'] = message;
			}
			//console.log(JSON.stringify(debugMsg));
		}

		if (message.charAt(0) === 'D') {
			debugMsg['d'] = true;
		}
      	
		if (app.debugLog) {
			app.db.ref(debugPath).push(debugMsg);
		}

        //String s1 = "A"+ sHour+ sMinute+ sDay+ sMonth+ "S"+ sTimestamp+ "\n";
		if (message.charAt(0) === 'A') {
			//log = message;
			app.sensorValues.tMCU = parseInt(message.substring(1,10))
		}
		else if (message.charAt(0) === 'B') {
			app.sensorValues.tAnalog = time;
			//console.log('Message received: ' + message);
			var matches = /H(\d+)L(\d+)R(\d+)T(\d+)/.exec(message);
			var leftVal= parseInt(matches[1]);
			var rightVal= parseInt(matches[4]);
			var heelVal= parseInt(matches[2]);
			var toeVal= parseInt(matches[3]);

			//quickfix: left shoe sensors are at a flat 500+ rather than 800+ of right shoe
			//TODO: figure out a better system
			if (!app.connectionFaking) {
				heelVal += 300;
				toeVal += 300;
				rightVal += 300;
				leftVal += 300;
			}


			var canvas = document.getElementById('soleCanvasLeft');
			app.clear(canvas);
			app.transformBeginLeft(canvas);	
			app.drawFoot(canvas);
			app.drawCircleHeel(canvas,parseInt(heelVal, 10));
			app.drawCircleLeft(canvas,parseInt(rightVal, 10));
			app.drawCircleRight(canvas,parseInt(leftVal, 10));				
			app.drawCircleToe(canvas,parseInt(toeVal, 10));
			app.transformEndLeft(canvas);
			
            if ($('#hapticZoomView').is(':visible')) {
            	app.zoomDir(leftVal, rightVal, heelVal, toeVal);
            }

            if ($('#moleView').is(':visible')) {
                mole.leftPress(leftVal, rightVal, heelVal, toeVal);
            }

			if (app.gauges) {
				document.getElementById("leftData").innerHTML = leftVal;
				document.getElementById("rightData").innerHTML = rightVal;
				document.getElementById("toeData").innerHTML = toeVal;
				document.getElementById("heelData").innerHTML = heelVal;
			}

			var r1 = [800,1000];
			var r2 = [0,100];

			var heelPercent= parseInt(convertRange(heelVal, r1, r2));
			var leftPercent= parseInt(convertRange(leftVal, r1, r2));
			var rightPercent= parseInt(convertRange(rightVal, r1, r2));
			var toePercent= parseInt(convertRange(toeVal, r1, r2));

            if(!app.connectionFaking)changeDir(leftPercent, rightPercent, heelPercent, toePercent);
		}
		else if (message.charAt(0) === 'C') {
			app.sensorValues.tOrientation = time;

			var matches = /Z(\d+)Y(\d+)P(\d+)O(\d+)/.exec(message);
			var height = parseInt(matches[1]);
			var yaw = parseInt(matches[2]);
			var pitch = 360-parseInt(matches[3]);
			var roll = 360-parseInt(matches[4]);

			app.sensorValues.sHeight = height;
			app.sensorValues.sYaw = yaw;
			app.sensorValues.sPitch = pitch + 180;
			app.sensorValues.SRoll = 180 + roll;

			if (needZeroOutLeft) {
				rollOffsetLeft = roll;
				pitchOffsetLeft = pitch;
				yawOffsetLeft = yaw;
				heightOffsetLeft = height;
				needZeroOutLeft = false;
			}

			if (app.gauges) {
				document.getElementById("heightDataLeft").innerHTML = height;
				document.getElementById("yawDataLeft").innerHTML = yaw;
				document.getElementById("pitchDataLeft").innerHTML = pitch;
				document.getElementById("rollDataLeft").innerHTML = roll
				setAttitudeL(roll - rollOffsetLeft, pitch - pitchOffsetLeft);
				setHeadingL(yaw - yawOffsetLeft);
				setAltitudeL((height - heightOffsetLeft)*(255-heightOffsetLeft)/50);
			}

			app.sensorValues.iSchemaVersion = 1;
			app.sensorValues.tServer = firebase.database.ServerValue.TIMESTAMP;

			if (typeof app.sensorValues.tAnalog != "undefined" ) {
				if (app.streamSensorData) {
					app.db.ref(path).push(app.sensorValues);
				}
				app.sensorValues = {};
			}
		}
	} else {
		// Disconnect and show an error message to the user.
		app.disconnect('Disconnected');

		// Write debug information to console
		console.log('Error - No device connected.');
	}
};


app.clear = function(canvas) {
	var ctx = canvas.getContext('2d');
	ctx.clearRect(0, 0, canvas.width, canvas.height);
}

app.transformBeginRight = function(canvas) {
	var ctx = canvas.getContext('2d');
	var canvasWidth = canvas.width;
	var canvasHeight = canvas.height;
	var scaleFactor = 0.48;
	var translateX = -343.0;
	var translateY = -135.0;
	ctx.scale(scaleFactor,scaleFactor);
	ctx.translate(translateX, translateY);
	ctx.translate(canvasWidth,canvasHeight/2);
}
	
app.transformEndRight = function(canvas) {
	var ctx = canvas.getContext('2d');
	var canvasWidth = canvas.width;
	var canvasHeight = canvas.height;
	var scaleFactor = 0.48;
	var translateX = -343.0;
	var translateY = -135.0;
	ctx.translate(-canvasWidth,-canvasHeight/2);
	ctx.translate(-translateX, -translateY);
	ctx.scale(1/scaleFactor,1/scaleFactor);
}

app.transformBeginLeft = function(canvas) {
	var ctx = canvas.getContext('2d');
	var canvasWidth = canvas.width;
	var canvasHeight = canvas.height;
	var scaleFactor = 0.48;
	var translateX = 343.0;
	var translateY = -135.0;
	ctx.scale(scaleFactor,scaleFactor);
	ctx.translate(translateX, translateY);
	ctx.translate(canvasWidth,canvasHeight/2);
	ctx.scale(-1,1);
}
	
app.transformEndLeft = function(canvas) {
	var ctx = canvas.getContext('2d');
	var canvasWidth = canvas.width;
	var canvasHeight = canvas.height;
	var scaleFactor = 0.48;
	var translateX = 343.0;
	var translateY = -135.0;
	ctx.scale(-1,1);
	ctx.translate(-canvasWidth,-canvasHeight/2);
	ctx.translate(-translateX, -translateY);
	ctx.scale(1/scaleFactor,1/scaleFactor);
}

app.touchVibration = function(canvas) {
	    canvas.addEventListener("touchstart", touchLocation, false);
	    canvas.addEventListener("touchhold", touchLocation, false);
	    canvas.addEventListener("touchmove", touchLocation, false);
}

var lastMove = 0;
function touchLocation(event) {
	//Only sends data if 100ms have passed from the last data send. Needed so that waves dont stack on top of each other
	if(Date.now() - lastMove > 100) {
		lastMove = Date.now();
	  	if(app.rightShoe) var touchzone = document.getElementById("soleCanvasRight");
	  	else var touchzone = document.getElementById('soleCanvasLeft');
		var canvasWidth = canvas.width;
		var canvasHeight = canvas.height;
		var scaleFactor = 0.5;
		var translateX = -343.0;
		var translateY = -135.0;
		var coords = document.getElementById("coords");
		var offsets = offsetVal(touchzone);

		//calculates relative distance xDis and yDis which are 0,0 at upper left corner of canvas, not the upper left corner of the page
		var xDis = event.touches[0].pageX - offsets[0];
		var yDis = event.touches[0].pageY - offsets[1];

		//prevents scrolling while touching the canvas
		event.preventDefault();

		//limit touch to only the canvas size
		if(!(xDis<0) && !(xDis>canvasWidth) && !(yDis<0) && !(yDis>canvasHeight)) {		
			//Heel distance calculation
			var xDiff = xDis - (330+translateX+canvasWidth)*scaleFactor;
			var yDiff = yDis - (505+translateY+canvasHeight/2)*scaleFactor;
			var heelDis = Math.round(Math.sqrt(xDiff*xDiff+yDiff*yDiff));

			//Toe distance calculation
			xDiff = xDis - (230+translateX+canvasWidth)*scaleFactor;
			yDiff = yDis - (90+translateY+canvasHeight/2)*scaleFactor;
			toeDis = Math.round(Math.sqrt(xDiff*xDiff+yDiff*yDiff));

			//Right distance calculation
			xDiff = xDis - (430+translateX+canvasWidth)*scaleFactor;
			yDiff = yDis - (250+translateY+canvasHeight/2)*scaleFactor;
			rightDis = Math.round(Math.sqrt(xDiff*xDiff+yDiff*yDiff));

			//Left distance calculation
			xDiff = xDis - (240+translateX+canvasWidth)*scaleFactor;
			yDiff = yDis - (230+translateY+canvasHeight/2)*scaleFactor;
			leftDis = Math.round(Math.sqrt(xDiff*xDiff+yDiff*yDiff));

			//coords.innerHTML = 'x: ' + Math.round(xDis) + ', y: ' + Math.round(yDis) + ', dis: ' + rightDis;
			if (heelDis < 90) {
				var val=Math.round(130+130*20/(heelDis+1));
				if (val>255) val = 255;
				app.sendMessage(' t h '+ val +' 100 \r');
			}
			if (toeDis < 90) {
				var val=Math.round(130+130*20/(toeDis+1));
				if (val>255) val = 255;
				app.sendMessage(' t t '+ val +' 100 \r');
			}
			if (rightDis < 90) {
				var val=Math.round(130+130*20/(rightDis+1));
				if (val>255) val = 255;
				app.sendMessage(' t r '+ val +' 100 \r');
			}
			if (leftDis < 90) {
				var val=Math.round(130+130*20/(leftDis+1));
				if (val>255) val = 255;
				app.sendMessage(' t l '+ val +' 100 \r');
			}
		}
	}
}

function offsetVal(obj) {
	var left = 0;
	var top = 0;
	do {
	if (!isNaN(obj.offsetTop)) {
		top += obj.offsetTop;
	}   
	if (!isNaN(obj.offsetLeft)) {
		left += obj.offsetLeft;
	}
	} while(obj = obj.offsetParent );
	return [left,top];
}   

app.drawFoot = function(canvas) {
	var ctx = canvas.getContext('2d');
	var canvasWidth = canvas.width;
	var canvasHeight = canvas.height;

	//Sole tracing
	ctx.beginPath();
	ctx.moveTo(343.0, 135.0);
	ctx.bezierCurveTo(267.0, 135.0, 230.0, 155.0, 213.0, 188.0);
	ctx.bezierCurveTo(196.0, 221.0, 204.0, 257.0, 222.0, 278.0);
	ctx.bezierCurveTo(240.0, 299.0, 271.0, 309.0, 280.0, 361.0);
	ctx.bezierCurveTo(289.0, 413.0, 244.0, 495.0, 278.0, 543.0);
	ctx.bezierCurveTo(312.0, 591.0, 381.0, 563.0, 401.0, 532.0);
	ctx.bezierCurveTo(421.0, 501.0, 450.0, 373.0, 456.0, 320.0);
	ctx.bezierCurveTo(462.0, 267.0, 459.0, 197.0, 439.0, 174.0);
	ctx.bezierCurveTo(419.0, 151.0, 400.0, 136.0, 343.0, 135.0);
	ctx.stroke();

	//Big toe tracing
	ctx.beginPath();
	ctx.moveTo(219.0, 50.0);
	ctx.bezierCurveTo(196.0, 65.0, 192.0, 81.0, 200.0, 99.0);
	ctx.bezierCurveTo(208.0, 117.0, 234.0, 149.0, 256.0, 135.0);
	ctx.bezierCurveTo(278.0, 121.0, 272.0, 88.0, 264.0, 73.0);
	ctx.bezierCurveTo(256.0, 58.0, 240.0, 40.0, 219.0, 50.0);
	ctx.stroke();

	//Second toe tracing
	ctx.beginPath();
	ctx.moveTo(301.0, 55.0);
	ctx.bezierCurveTo(273.0, 57.033318, 280.0, 83.91672, 281.0, 89.0);
	ctx.bezierCurveTo(282.0, 94.08329, 285.0, 112.9989, 301.0, 115.99945);
	ctx.bezierCurveTo(317.0, 119.0, 326.0, 92.866196, 325.0, 81.4331);
	ctx.bezierCurveTo(324.0, 70.0, 322.0, 55.0, 301.0, 55.0);
	ctx.stroke();

	//Third toe tracing
	ctx.beginPath();
	ctx.moveTo(360.0, 71.0);
	ctx.bezierCurveTo(345.0, 71.0, 341.0, 84.69604, 343.0, 96.4355);
	ctx.bezierCurveTo(345.0, 108.17496, 345.0, 115.02298, 357.0, 116.00127);
	ctx.bezierCurveTo(369.0, 116.97956, 377.0, 105.2401, 376.0, 93.50063);
	ctx.bezierCurveTo(375.0, 81.76117, 376.0, 71.97829, 360.0, 71.0);
	ctx.stroke();

	//Fourth toe tracing
	ctx.beginPath();
	ctx.moveTo(407.0, 90.0);
	ctx.bezierCurveTo(394.0, 89.0, 392.0, 95.0, 390.0, 103.0);
	ctx.bezierCurveTo(388.0, 111.0, 389.0, 119.0, 399.0, 124.0);
	ctx.bezierCurveTo(409.0, 129.0, 416.0, 118.0, 417.0, 111.0);
	ctx.bezierCurveTo(418.0, 104.0, 415.0, 92.0, 407.0, 90.0);
	ctx.stroke();

	//Pinky toe tracing
	ctx.beginPath();
	ctx.moveTo(440, 116);
	ctx.bezierCurveTo(435.0032, 114.93463, 428.3025, 117.26154, 427.3453, 121.139755);
	ctx.bezierCurveTo(426.38803, 125.01797, 422.34845, 133.30518, 431.17422, 136.65259);
	ctx.bezierCurveTo(440.0, 140.0, 445.06567, 132.34363, 445.53284, 129.67181);
	ctx.bezierCurveTo(446.0, 127.0, 450.0, 122.0, 440, 116);
	ctx.stroke();
}

app.drawCircleHeel = function(canvas,data) {
	if (data > 767) {
		var ctx = canvas.getContext('2d');
		var canvasWidth = canvas.width;
		var canvasHeight = canvas.height;
		var radius = (data*3-2300)/15;
		//343.0, 135.0
		ctx.beginPath();
		ctx.arc(330.0, 505.0, radius,0,2*Math.PI);
		ctx.fill();
	}
} 

app.drawCircleRight = function(canvas,data) {
	if (data > 767) {
		var ctx = canvas.getContext('2d');
		var canvasWidth = canvas.width;
		var canvasHeight = canvas.height;
		var radius = (data*3-2300)/15;

		ctx.beginPath();
		ctx.arc(430, 250, radius,0,2*Math.PI);
		ctx.fill();
	}
}

app.drawCircleToe = function(canvas,data) {
	if (data > 767) {
		var ctx = canvas.getContext('2d');
		var canvasWidth = canvas.width;
		var canvasHeight = canvas.height;
		var radius = (data*3-2300)/15;

		ctx.beginPath();
		ctx.arc(230, 90, radius,0,2*Math.PI);
		ctx.fill();
	}
}

app.drawCircleLeft = function(canvas,data) {
	if (data > 767) {
		var ctx = canvas.getContext('2d');
		var canvasWidth = canvas.width;
		var canvasHeight = canvas.height;
		var radius = (data*3-2300)/15;

		ctx.beginPath();
		ctx.arc(240, 230, radius,0,2*Math.PI);
		ctx.fill();
	}	
}

app.enableButton = function(shoe) {
	document.getElementById(shoe+"ShoeButton").disabled = false;
	document.getElementById(shoe+"ShoeButton").style.opacity='0.4';
	document.getElementById(shoe+"ShoeButton").className='blue half';
};

app.disableButton = function(shoe) {
	document.getElementById(shoe+"ShoeButton").disabled = true;
	document.getElementById(shoe+"ShoeButton").style.opacity='0.4';
	document.getElementById(shoe+"ShoeButton").className='grey half';
};

var lastMsgTime = 0;
app.notifMsg = function (message) {
	if(Date.now()-lastMsgTime > 1000) {		//in order to stop spamming of error messages allows only one send per second
		lastMsgTime = Date.now();
		console.log('Popup message: '+ message);
		navigator.notification.alert(message, function() {});
	}
}

var lastErrorTime = 0;
app.disconnect = function(errorMessage) {
	if(Date.now()-lastErrorTime > 1000) {		//in order to stop spamming of error messages allows only one send per second
		lastErrorTime = Date.now();
		if (app.connectionFaking) {
			clearInterval(fakeTimer);
		} else 
		{
			if (errorMessage) {
				console.log('Error message: '+errorMessage);
				navigator.notification.alert(errorMessage, function() {});
			}

			app.connected = false;
			app.device = null;

			// Stop any ongoing scan and close devices.
			evothings.easyble.stopScan();
			evothings.easyble.closeConnectedDevices();
		}

		app.connected = false;

		console.log('Disconnected');

		$('#loadingView').hide();
		$('#scanResultView').hide();
		$('#scanResultView').empty();
		$('#shoe').empty();
		$('#shoeView').hide();
		$('#pacmanView').hide();
		$('#scanOptions').hide();
		$('#startView').show();
		$('#shoeButtons').hide();
		$('.rightShoeDisplay').hide();
		$('.leftShoeDisplay').hide();
	}
};

app.updatePacman = function() {
	if (app.pacman) {
		$('#pacmanView').show();
	} else {
		$('#pacmanView').hide();	
	}
}

app.togglePacman = function() {
	if (app.pacman) {
		app.pacman = false;
		pause();
	} else {
		app.pacman = true;
    	$('#pacPause').hide();
    	if(gamePaused) {
    		$('#pacStart').hide();
    		$('#pacRestart').show();
    		$('#pacResume').show();
    	}
    	else {
    		$('#pacStart').show();
    		$('#pacResume').hide();
    		$('#pacRestart').hide();
    	}
	}
	app.updatePacman();
}

/**
* goFreeRunning
* @brief: 	change the view from the selection between freerunning and session to the 
*			freerunning view
*/
app.goFreeRunning = function() {
	$('#selectorView').hide();
	app.populatePatterns();
	$('#shoeView').show();
	app.sendMessage(" f 0 \r");
}



/**
* goSession
* @brief: 	change the view from the selection between freerunning and session to the 
*			user info gathering view
*/
app.goSession= function() {
	$('#title').hide();
	$('#selectorView').hide();
	$('#userInfo').show();	
	app.disablePrompt();
}


/**
* userInfo
* @brief: Sends user info to server and change the view to the experiment view
*/
app.userInfo = function(userID, position, positions, type, max) {
	//publish2("---\n");

	// init the result view and the count for results display
	$('#resultView')
  		.contents()
  		.filter(function() {
    		return this.nodeType == Node.TEXT_NODE;
		}).remove();

	$('#resultView br').remove();

	resultCount = 1

	app.patternValues.iSchemaVersion = 1;
	app.patternValues.iUserID = userID;
	app.patternValues.iSession = type;
	app.patternValues.iPosition = position;
	app.patternValues.iPositions = positions;
	app.patternValues.pCount = max;
	app.patternValues.pPlayTimes = [];

	app.addToResult("UserID: "+ userID);
	$('#resultView').append($('<br>'));
	results = "UserID: "+ userID +"%0D%0A";
	userIDSubject = userID;

	app.addToResult("Position: "+ position);
	$('#resultView').append($('<br>'));
	results = results.concat("Position: "+ position+"%0D%0A");

	app.addToResult("Type: "+ type);
	$('#resultView').append($('<br>'));
	$('#resultView').append($('<br>'));
	$('#resultView').append($('<br>'));
	results = results.concat("Type: "+ type+"%0D%0A %0D%0A %0D%0A");


	if (position.localeCompare("walking") == 0) {
		app.sendMessage(" f 1 \r");
		// TODO FIXME use setTimeout()?!
		for(i= 0; i< 100000000; i++) {}
		//alert("ready not?");
	} else {
		app.sendMessage(" f 0 \r");
		for(i= 0; i< 100000000; i++) {}
		//alert("ready?");
	}


	maxExperiment = max;

	expType = type;

	$('#userInfo').hide();

	experimentCount = 0;

	if (type == "Test") {
		app.testing = true;
		app.populatedExperiment = false;
		app.doExperiment();
	} if (type == "Main") {
		app.populatedExperiment = false;
		app.testing = false;
		app.doExperiment();
	} else if (type == "Introduction") {
		app.doIntro(0);

	} else if (type == "Training") {
		app.populatedExperiment = false;
		expType = "training";
		app.doExperiment();
	}
}

/**
* doIntro
* @brief: present one pattern, and the user can click on it to fell it
*		 It introduce all the pattern to the user
*/
app.doIntro = function(pattern) {
	switch(pattern) {
		case 0:
			$('#rht').hide();
			$('#trh').show();
			break;
		case 1:
			$('#trh').hide();
			$('#hlt').show();
			break;
		case 2:
			$('#hlt').hide();
			$('#hrl').show();
			break;
		case 3:
			$('#hrl').hide();
			$('#ltr').show();
			break;
		case 4:
			$('#ltr').hide();
			$('#rlt').show();
			break;
		case 5:
			$('#rlt').hide();
			$('#rht').show();
			break;
		case 6:
			$('#rht').hide();
		 	app.goHome();
			break;


		// case 0:
		// 	$('#th').show();
		// 	break;
		// case 1:
		// 	$('#th').hide();
		// 	$('#tlh').show();
		// 	break;
		// case 2:
		// 	$('#tlh').hide();
		// 	$('#trh').show();
		// 	break;
		// case 3:
		// 	$('#trh').hide();
		// 	$('#lr').show();
		// 	break;
		// case 4:
		// 	$('#lr').hide();
		// 	$('#lrh').show();
		// 	break;
		// case 5:
		// 	$('#lrh').hide();
		// 	$('#lhr').show();
		// 	break;
		// case 6:
		// 	$('#lhr').hide();
		// 	$('#rl').show();
		// 	break;
		// case 7:
		// 	$('#rl').hide();
		// 	$('#rlh').show();
		// 	break;
		// case 8:
		// 	$('#rlh').hide();
		// 	$('#rhl').show();
		// 	break;
		// case 9:
		// 	$('#rhl').hide();
		// 	$('#ht').show();
		// 	break;
		// case 10:
		// 	$('#ht').hide();
		// 	$('#hlt').show();
		// 	break;
		// case 11:
		// 	$('#hlt').hide();
		// 	$('#hrt').show();
		// 	break;
		// case 12:
		// 	$('#hrt').hide();
		// 	$('#hlr').show();
		// 	break;
		// case 13:
		// 	$('#hlr').hide();
		// 	$('#hrl').show();
		// 	break;
		// case 14:
		// 	$('#hrl').hide();
		// 	$('#t').show();
		// 	break;
		// case 15:
		// 	$('#t').hide();
		// 	$('#l').show();
		// 	break;
		// case 16:
		// 	$('#l').hide();
		// 	$('#r').show();
		// 	break;
		// case 17:
		// 	$('#r').hide();
		// 	$('#h').show();
		// 	break;
		// case 18:
		// 	$('#h').hide();
		// 	app.goHome();
		// 	break;
		default:
			break;
	}

}


/**
* doExperiment
* @brief: 	switch between stimulating the user and recording what the user thing 
*			was the pattern
*/
var repeatVar;
var patternForCheckingApp;
var timeOutRecognition;
app.doExperiment = function() {
	stopWalking = false;


	//select a random pattern to be played
	//make sure the one selected is not one of the last 5
	var sanityCheck  = false;
	while(!sanityCheck) {
		sanityCheck = true;
		if (app.testing) {
			pattern = app.testPatterns[Math.floor(Math.random() * app.testPatterns.length)];
		} else {
			pattern = app.selectablePatterns[Math.floor(Math.random() * app.selectablePatterns.length)];
		}
		for (var i = 0; i < 5; i++) {
			if (pattern == app.pastPattern[i]) {
				sanityCheck = false;
			}
		}
	}

	for (var i = 0; i < 4; i++) {
		app.pastPattern[i] = app.pastPattern[i+1];
	}
	app.pastPattern[4] = pattern;

	patternForCheckingApp = pattern;
	
	app.patternValues.pPlayed = pattern;

	app.addToResult(resultCount);
	$('#resultView').append($('<br>'));
	$('#interResultView').append($('<br>'));

	app.patternValues.pPlayed = pattern;

	app.addToResult("Real: "+ pattern);
	$('#resultView').append($('<br>'));
	$('#interResultView').append($('<br>'));

	results = results.concat(resultCount+"%0D%0A"+"Real: "+ pattern+"%0D%0A");
	resultCount++;

	//send the pattern once and then repeat at a certain interval
	repeatNum = 0;
	var randomStartTime = ((Math.random()*12)+3)*1000;		// random number of seconds between 3 and 15
	setTimeout(app.startPattern, (randomStartTime));

	$('#experimentView').hide();
	app.goPrompt(randomStartTime );

	//timeOutRecognition = setTimeout(app.goRecord, randomStartTime + 11000);
}

/**
* startPattern
* @brief: Start the sequence of tactons and repeat
*/
app.startPattern = function() {
	timeStartInMs = Date.now();
	app.playPattern(pattern);
	repeatVar = setInterval(app.repeatPattern, 2000);
}

/**
* repeatPattern
* @brief: used to repeat a vibrationnal pattern a certain number of time
*/
var repeatNum = 0;
app.repeatPattern = function() {
	app.playPattern(pattern);
	repeatNum++;
	if (repeatNum == 2) {
		clearInterval(repeatVar);
	}

}

/**
* goPromt
* @brief: prompt the user if he felt the vibration
*/
app.goPrompt = function(timeout) {
	$('#promptView').show();
	$('#experimentView').hide();

	setTimeout(app.enablePrompt, (timeout));
}

app.disablePrompt = function() {
	document.getElementById('promptButton').disabled = true;
}

app.enablePrompt = function() {
	document.getElementById('promptButton').disabled = false;
}

/**
* goRecord
* @brief: 			if the user felt the vibration it is then ask to select the pattern he felt
*					if not "unknown" is being recorded
* param: promptAnswer 	yes or no
*/
var stopWalking = false;		//TODO: implement function that detect when the user stops walking to control this variable
app.goRecord = function(promptAnswer) {
	//clearTimeout(timeOutRecognition);

	//if the user click the pattern should stop repeating
	clearInterval(repeatVar);

	if (!stopWalking) {
		timeEndInMs = Date.now();
		timeDeltaInMs = timeEndInMs - timeStartInMs;
	}


	$('#promptView').hide();
	if (experimentCount == 0) {
		app.populatePatternsExperiment();
		//setTimeout(function() {$('#experimentView').show();}, 500);
	}

	if (promptAnswer == promptButton) {
		setTimeout(function() {$('#experimentView').show();}, 500);
		app.disablePrompt();
	} else if (promptAnswer == unknownButton) {
		app.recordPattern("unknown");
	}
}


/**
* recordPattern
* @brief: 			send the pattern selected to the server to be logged and the next 
*					vibration if not done
* param: pattern 	pattern felt by the user
*/
var patternForChecking;
app.recordPattern = function(pattern) {
	//console.log("User:" + pattern);
	patternForCheckingUser = pattern;
	app.patternValues.pPerceived = pattern;
	pattern = pattern+" in "+timeDeltaInMs+ "ms after "+ (repeatNum+1)+" repetitions";
	app.patternValues.pResponse = timeDeltaInMs;
	app.patternValues.pRepeats = repeatNum+1;
	if (app.patternValues.pPlayed === app.patternValues.pPerceived) 
	{
		app.patternValues.pCorrect = true;
	} else
	{
		app.patternValues.pCorrect = false;
	}

	app.addToResult("Perceived: "+ pattern);
	$('#resultView').append($('<br>'));
	$('#resultView').append($('<br>'));

	$('#interResultView').append($('<br>'));
	$('#interResultView').append($('<br>'));


	results = results.concat("Perceived: "+ pattern+"%0D%0A %0D%0A");

	if (typeof app.patternValues.pPerceived != "undefined" ) {
		var time = new Date().toISOString();
		app.patternValues.tAnswer = time;
		app.patternValues.pIndex = experimentCount;
		if (app.streamSensorData) {
			app.db.ref("patterns/").push(app.patternValues);
		}
		app.patternValues.pPlayTimes = [];
	}

	experimentCount++;
	if (experimentCount < maxExperiment) {
		if (expType == "training") {
			//alert("training");
			app.interResult();
		} else {
			app.doExperiment();
		}

	}
	else {
		if (expType == "training") {
			$('#experimentView').hide();

			if (patternForCheckingApp == patternForCheckingUser) {
				$('#lastExperimentRightView').show();
			} else {
				$('#lastExperimentWrongView').show();
			}

			setTimeout(app.trainingResult, 3000);


		} else {
			$('#experimentView').hide();
			alert('Done!');

			$('#resultView').show();
		}

		// $('#selectorView').show();
		// $('#title').show();

		//publish2("---");
	}


}


/**
*	zeroOut()
* 	@brief	zero out roll yaw pitch data
*/
app.zeroOutRight = function() {
	needZeroOutRight = true;
}

app.zeroOutLeft = function() {
	needZeroOutLeft = true;
}


/**
* @brief	add test to the resultView
* @param	toAdd: 	text to be added
*/
app.addToResult = function(toAdd) {
	var theDiv = document.getElementById("resultView");
	var content = document.createTextNode(toAdd);
	theDiv.appendChild(content);

	//theDiv = document.getElementById("interResultView");
	//content = document.createTextNode(toAdd);
	//theDiv.appendChild(content);
}

/**
* @brief: 	Send the results of the experiment by email
*/
app.emailResults = function() {
	resultCount = 1;
	var subject = "Experiment Results: "+ userIDSubject;
	window.open('mailto:?subject='+subject+'&body='+results);
}

/**
* @brief: go back to selection shoe scan and simulation
*/
app.goStart = function() {
	$('#resultView').hide();
	$('#shoeView').hide();
	$('#selectorView').hide();
	$('#startView').hide();
}

/**
* goHome
* @brief: go back to selection between experiment and manual mode
*/
app.goHome = function() {
	$('#rht').hide();
	$('#rlt').hide();
	$('#ltr').hide();
	$('#hrl').hide();
	$('#hlt').hide();
	$('#trh').hide();
	$('#lastExperimentWrongView').hide();
	$('#lastExperimentRightView').hide();
	$('#experimentWrongView').hide();
	$('#experimentRightView').hide();
	$('#loadingIndicator').hide();
	$('#loadingView').hide();
	$('#promptView').hide();
	//$('#settingsView').hide();
	//$('#shoeControl').hide();
	$('#sendPatternView').hide();
	$('#experimentView').hide();
	$('#scanResultView').hide();
	$('#startView').hide();
	$('#resultView').hide();
	$('#shoeView').hide();
	$('#title').hide();
	$('#selectorView').hide();
	$('#shoeView').hide();
	$('#userInfo').hide();	
	$('#pacmanView').hide();
	$('#hapticZoomView').hide();
	$('#moleView').hide();
	$('#shoeButtons').show();

	
	$('#selectorView').show();
}


/**
* interResult
* @brief: Used to display feedback to the user during traning phase
*/
app.interResult = function() {
	$('#experimentView').hide();
	//$('#interResultView').show();

	if (patternForCheckingApp == patternForCheckingUser) {
		$('#experimentRightView').show();
	} else {
		$('#experimentWrongView').show();
	}
}

/**
* resumeExp
* @brief: used to go back to the experiement after giving feedback to the user
*/
app.resumeExp = function() {
	//$('#interResultView').hide();
	$('#experimentRightView').hide();
	$('#experimentWrongView').hide();
	setTimeout(app.doExperiment, 1000);
}

/**
* trainingResult
* @brief: Used to display the results after training
*/

app.trainingResult = function() {
	$('#lastExperimentRightView').hide();
	$('#lastExperimentWrongView').hide();
	alert('Done!');
	$('#resultView').show(), 3000;
}



var randomAlarm = 0;
var lastAlarm = 0;
var lastAlarmScenario = 0;
var alarm = false;
var leftAlarm = false;
var rightAlarm = false;
var toeAlarm = false;
var heelAlarm = false;
var alarmScenarioActive = false;
var leftAlarmTime = 0;
var rightAlarmTime = 0;
var heelAlarmTime = 0;
var toeAlarmTime = 0;
var alarmSide = null;
var numberOfAlarms = 0;
var correctSide = 0;
var correctLevel = 0;


app.hapticZoomStart = function() {
	$('#title').hide();
	$('#selectorView').hide();
	$('#hapticZoomView').show();
	$('#zoomSelectionView').show();
	$('#hapticZoomTester').hide();
	$('#hapticZoomExperiment').hide();
	$('#zoomResultView').hide();	
	$('#shoeButtons').hide();
	$('.experimentButton').hide();
	$('.coverButton').show();
	leftAlarm = false;
	rightAlarm = false;
	toeAlarm = false;
	heelAlarm = false;	
	numberOfAlarms = 0;
	correctSide = 0;
	correctLevel = 0;
}

app.zoomTester = function() {
	$('#zoomSelectionView').hide();
	$('#hapticZoomTester').show();
}

app.zoomExperiment = function() {
	$('#zoomSelectionView').hide();
	$('#hapticZoomExperiment').show();
}

app.zoomResults = function() {
	$('#zoomSelectionView').hide();
	$('#zoomResultView').show();	
}

app.coverToggle = function(side) {
	$('.coverButton').show();
	$('.experimentButton').hide();
	if(side == 'toe') {
		$('#toeButtonCover').hide();
		$('.topButton').show();
	}
	else if(side == 'left') {
		$('.leftZoomExp').show();
		$('#leftButtonCover').hide();
	}
	else if(side == 'right') {
		$('.rightZoomExp').show();
		$('#rightButtonCover').hide();
	}
	else if(side == 'heel') {
		$('.botButton').show();
		$('#heelButtonCover').hide();
	}
}

app.zoomGuess = function(side,level) {
	var htmlString =
		'<div class="deviceContainer">' +
		side + ' ' + level +
		'</div>';
	$('#zoomResultView').append($(htmlString));
	if(side==alarmSide) {
		correctSide += 1;
		if(level==alarmLevel) {
			correctLevel += 1;
		}
	}
	$('.coverButton').show();
	$('.experimentButton').hide();
}

app.randomAlarm = function() {
	if(Date.now()-lastAlarm > 5000 && !alarm && !zoomedIn) {
		lastAlarm = Date.now();
		randomAlarm = Math.floor((Math.random() * 4) + 1);
		alarm = true;
		alarmSide = null;
		switch (randomAlarm) {
			case 1: 
				leftAlarm = true;
				alarmSide = 'l';
				leftAlarmTime = Date.now();
				LAI = setInterval(function(){				//left alarm interval = LAI
					app.sendMessage(" p " + 1 + "l" + "\r");
					if(!leftAlarm) clearInterval(LAI)
				},500);
				break;
			case 2: 
				rightAlarm = true;
				alarmSide = 'r';
				rightAlarmTime = Date.now();
				RAI = setInterval(function(){				//right alarm interval = RAI
					app.sendMessage(" p " + 1 + "r" + "\r");
					if(!rightAlarm) clearInterval(RAI)
				},500);
				break;
			case 3: 
				toeAlarm = true;
				alarmSide = 't';
				toeAlarmTime = Date.now();
				TAI = setInterval(function(){				//toe alarm interval = TAI
					app.sendMessage(" p " + 1 + "t" + "\r");
					if(!toeAlarm) clearInterval(TAI)
				},500);
				break;
			case 4: 
				heelAlarm = true;
				alarmSide = 'h';
				heelAlarmTime = Date.now();
				HAI = setInterval(function(){				//heel alarm interval = HAI
					app.sendMessage(" p " + 1 + "h" + "\r");
					if(!heelAlarm) clearInterval(HAI)
				},500);
				break;
			default:
				alarm=false;
				break;
		}
	}
}

app.toeAlarm = function() {
	toeAlarm = true;
	toeAlarmTime = Date.now();
	TAI = setInterval(function(){				//toe alarm interval = TAI
		app.sendMessage(" p " + 1 + "t" + "\r");
		if(!toeAlarm) clearInterval(TAI)
	},500);
}

app.leftAlarm = function() {
	leftAlarm = true;
	leftAlarmTime = Date.now();
	LAI = setInterval(function(){				//left alarm interval = LAI
		app.sendMessage(" p " + 1 + "l" + "\r");
		if(!leftAlarm) clearInterval(LAI)
	},500);
}

app.rightAlarm = function() {
	rightAlarm = true;
	rightAlarmTime = Date.now();
	RAI = setInterval(function(){				//right alarm interval = RAI
		app.sendMessage(" p " + 1 + "r" + "\r");
		if(!rightAlarm) clearInterval(RAI)
	},500);
}

app.heelAlarm = function() {
	heelAlarm = true;
	heelAlarmTime = Date.now();
	HAI = setInterval(function(){				//heel alarm interval = HAI
		app.sendMessage(" p " + 1 + "h" + "\r");
		if(!heelAlarm) clearInterval(HAI)
	},500);
}

var SPO2rate = 1500;
var bloodPressureRate = 1000;
var brainPressureRate = 2000;

var brainPressureActiveLeft = false;
var HRactiveHeel = false;
var bloodPressureActiveRight = false;
var SPO2activeToe = false;

app.bloodPressurePlayRight = function(bloodPressure) {
	if(!bloodPressureActiveRight)
	{
		bloodPressureActiveRight = true;
		bloodPressureIntervalRight=setInterval(function() {
			app.sendMessage(' t r ' + bloodPressure +' 100 \r');
		},bloodPressureRate);
	}
}

app.brainPressurePlayLeft = function(brainPressure) {
	var spacing = 0;
	if(!brainPressureActiveLeft)
	{
		brainPressureActiveLeft = true;
		if(brainPressure == "low") spacing = 400;
		if(brainPressure == "medium") spacing = 200;
		if(brainPressure == "high") spacing = 50;
		brainPressureIntervalLeft=setInterval(function() {
			app.sendMessage(' t l ' + 255 +' 100 \r');
			setTimeout(function() {app.sendMessage(' t l ' + 255 +' 100 \r');}, spacing);
			setTimeout(function() {app.sendMessage(' t l ' + 255 +' 100 \r');}, 2*spacing);
		},brainPressureRate);
	}
}

app.heartbeatPlayHeel = function(BPM) {
	if(!HRactiveHeel)
	{
		var HRrate = 1000*60/BPM;
		var HRdiffTime = 3*HRrate/10;
		HRactiveHeel = true;
		HRIntervalHeel=setInterval(function() {
			app.sendMessage(' t h ' + 255 +' 100 \r');
			setTimeout(function(){app.sendMessage(' t h ' + 255 +' 100 \r');},HRdiffTime);
		},HRrate);
	}
}

app.SPO2PlayToe = function(number) {
	if(!SPO2activeToe)
	{
		SPO2activeToe = true;
		SPO2intervalToe=setInterval(function() {
			for(var i=0; i<number; i++) {
				app.sendMessage(' t t ' + 255 +' 100 \r');
			}
		},SPO2rate);
	}
}

app.stopAllDataStreams = function() {
	if(bloodPressureActiveRight){
		bloodPressureActiveRight = false;
		clearInterval(bloodPressureIntervalRight);
	}
	if(brainPressureActiveLeft){
		brainPressureActiveLeft = false;
		clearInterval(brainPressureIntervalLeft);
	}
	if(HRactiveHeel){
		HRactiveHeel = false;
		clearInterval(HRIntervalHeel);
	}
	if(SPO2activeToe){
		SPO2activeToe = false;
		clearInterval(SPO2intervalToe);
	}
}


var toeOffset = 0;
var leftOffset = 0;
var rightOffset = 0;
var heelOffset = 0;
var zeroOutFSR = true;

var bloodPressure = 200;
var brainPressure = "medium";
var percentSPO2 = 98;
var BPM = 60;
var zoomedIn = false;

app.zoomDir = function(left, right, heel, toe) {
    winner = 0;
    winnerVal = 0;
    zoomedIn = true;

    if(zeroOutFSR) {
    	leftOffset = left;
    	rightOffset = right;
    	toeOffset = toe;
    	heelOffset = heel;
    	zeroOutFSR = false;

    }

    left = left - leftOffset;
    right = right - rightOffset;
    heel = heel - heelOffset;
    toe = toe - toeOffset;

	document.getElementById("leftDataZoom").innerHTML = left;
	document.getElementById("rightDataZoom").innerHTML = right;
	document.getElementById("toeDataZoom").innerHTML = toe;
	document.getElementById("heelDataZoom").innerHTML = heel;

    if (left > winnerVal){
        winner = 1;
        winnerVal = left;
    }
    if (right > winnerVal){
        winner = 2;
        winnerVal = right;
    }
    if (heel > winnerVal){
        winner = 3;
        winnerVal = heel;
    }
    if (toe > winnerVal){
        winner = 4;
        winnerVal = toe;
    }

    if (winnerVal-left < 30 && winnerVal-left != 0){
    	app.stopAllDataStreams();
    	zoomedIn = false;
        return;
    }
   	if (winnerVal-right < 30 && winnerVal-right != 0){
   		app.stopAllDataStreams();
   		zoomedIn = false;
        return;
    }
   	if (winnerVal-heel < 30 && winnerVal-heel != 0){
   		app.stopAllDataStreams();
   		zoomedIn = false;
        return;
    }
   	if (winnerVal-toe < 30 && winnerVal-toe != 0){
   		app.stopAllDataStreams();
   		zoomedIn = false;
        return;
    }

    bloodPressure = 200;		//intensity out of 255
    brainPressure = "medium";	//intensity: high - medium - low
    percentSPO2 = 96;			//percentage out of 100 (clinically 95+ is good, below is bad)
    BPM = 70;					//beats per minute (50-100 is healthy)

    randomLevel = Math.floor((Math.random() * 3) + 1);	//1 = high level, 2 = normal (already set above so dont change for alarm), 3 = low
    if(randomLevel==1) alarmLevel='h';
    if(randomLevel==2) alarmLevel='m';
    if(randomLevel==3) alarmLevel='l';

    if(Date.now()-leftAlarmTime < 10000) {
    	if(randomLevel==1)brainPressure = "high";
    	if(randomLevel==3)brainPressure = "low";
    }
    if(Date.now()-rightAlarmTime < 10000) {
    	if(randomLevel==1)bloodPressure = 255;
    	if(randomLevel==3)bloodPressure = 160;
    }
    if(Date.now()-toeAlarmTime < 10000) {
    	if(randomLevel==1)percentSPO2 = 92;
    	if(randomLevel==3)percentSPO2 = 99;
    }
    if(Date.now()-heelAlarmTime < 10000) {
    	if(randomLevel==1)BPM = 140;
    	if(randomLevel==3)BPM = 40;
    }

    switch(winner) {
    	case 1:
    		app.brainPressurePlayLeft(brainPressure);
    		leftAlarm=false;
    		alarm=false;
    		break;
    	case 2:
    		app.bloodPressurePlayRight(bloodPressure);
    		rightAlarm=false;
    		alarm=false;
    		break;
    	case 3:
    		app.heartbeatPlayHeel(BPM);
    		heelAlarm=false;
    		alarm=false;
    		break;
    	case 4:
    		app.SPO2PlayToe(100-percentSPO2);
    		toeAlarm=false;
    		alarm=false;
    		break;
    	default:
    		return;
    		break;
    }
}

app.zoomCal = function() {
	zeroOutFSR = true;
}

app.userCommand = function() {
	       let command = document.getElementById('userCommand').value;
	       console.log(command);
	       app.sendMessage(" " + command.trim() + "\r");
	       //app.sendMessage(" p " + 1 + "t" + "\r");
}
	