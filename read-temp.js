var agileSDK = require('agile-sdk');

var Devices = require('./devices');

var Firebase = require('./firebase');

var agile = agileSDK({
    api: 'http://127.0.0.1:8080'
});
var sensorTagDeviceId = 'bleB09122F73E80';

var DATA = {};
var HOUSE_ID = 1;

global.HOUSE_ID = HOUSE_ID;
global.agile = agile;

var round = function(value, precision) {
    var multiplier = Math.pow(10, precision || 0);
    return Math.round(value * multiplier) / multiplier;
};

var sendUpdatedValueToServer = function(type, value) {
    console.log('send update to server for ' + type + ' the new value is: ')
    console.log(value);
    var path = HOUSE_ID + '/' + type;
    Firebase.sendMessage(path, value);
};

var readTemperature = function() {
    agile.device
        .get(sensorTagDeviceId, 'Temperature')
        .then(function(deviceComponent) {
            var value = parseFloat(deviceComponent.value);
            value = round(value, 1);

            if (DATA.temperature !== value) {
                //Send to server
                sendUpdatedValueToServer('temperature', {
                    value: value,
                    unit: deviceComponent.unit
                });
            }

            //Set for next check
            DATA.temperature = value;
        }).catch(function(err) {
            console.log(err);
        });
};

var readOptical = function() {
    agile.device
        .get(sensorTagDeviceId, 'Optical')
        .then(function(deviceComponent) {
            var value = parseFloat(deviceComponent.value);
            value = round(value);

            if (DATA.optical !== value) {
                //Send to server
                sendUpdatedValueToServer('optical', {
                    value: value,
                    unit: deviceComponent.unit
                });
            }

            //Set for next check
            DATA.optical = value;
        }).catch(function(err) {
            console.log(err);
        });
};

var readPressure = function() {
    agile.device
        .get(sensorTagDeviceId, 'Pressure')
        .then(function(deviceComponent) {
            var value = parseFloat(deviceComponent.value);
            value = round(value, 1);

            if (DATA.pressure !== value) {
                //Send to server
                sendUpdatedValueToServer('pressure', {
                    value: value,
                    unit: deviceComponent.unit
                });
            }

            //Set for next check
            DATA.pressure = value;
        }).catch(function(err) {
            console.log(err);
        });
};

var readHumidity = function() {
    agile.device
        .get(sensorTagDeviceId, 'Humidity')
        .then(function(deviceComponent) {
            var value = parseFloat(deviceComponent.value);
            value = round(value, 2);

            if (DATA.humidity !== value) {
                //Send to server
                sendUpdatedValueToServer('humidity', {
                    value: value,
                    unit: deviceComponent.unit
                });
            }

            //Set for next check
            DATA.humidity = value;
        }).catch(function(err) {
            console.log(err);
        });
};

// //Every 5 seconds read values
// setInterval(function(params) {
//     readOptical();
// }, 5 * 1000);

// //Every 5 minutes
// setInterval(function() {
//     readPressure();
//     readHumidity();
//     readTemperature();
// }, 5 * 60 * 1000);

// //Read right from beggining
// readTemperature();
// readOptical();
// readPressure();
// readHumidity();

agile.device.subscribe(sensorTagDeviceId, 'Temperature')
    .then(function(stream) {
        stream.onerror = function() {
            console.log('Connection Error');
        };

        stream.onopen = function() {
            console.log('WebSocket Client Connected');
        };

        stream.onclose = function() {
            console.log('echo-protocol Client Closed');
        };

        stream.onmessage = function(e) {
            if (typeof e.data === 'string') {
                console.log("Received: '" + e.data + "'");
                var value = parseFloat(e.data);
                value = round(value, 1);

                // if (DATA.temperature !== value) {
                //Send to server
                sendUpdatedValueToServer('temperature', {
                    // value: value,
                    value: e.data,
                    unit: deviceComponent.unit
                });
                // }

                //Set for next check
                DATA.temperature = value;
            }
        };
    });

Firebase.onCommand(HOUSE_ID, function(command) {
    if (command.type === 'discovery_on') {
        Devices.start(agile);
    } else if (command.type === 'discovery_off') {
        Devices.stop(agile);
    }
});