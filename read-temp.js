var agileSDK = require('agile-sdk');

var Firebase = require('./firebase');

var agile = agileSDK({
    api: 'http://127.0.0.1:8080'
});
var sensorTagDeviceId = 'bleB09122F73E80';

var DATA = {};
var HOUSE_ID = 1;

var round = function(value, precision) {
    var multiplier = Math.pow(10, precision || 0);
    return Math.round(value * multiplier) / multiplier;
};

var sendUpdatedValueToServer = function(type, value) {
    console.log('send update to server for ' + type + ' the new value is ' + value);
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
            console.log(deviceComponent);
        }).catch(function(err) {
            console.log(err);
        });
};

var readOptical = function() {
    agile.device
        .get(sensorTagDeviceId, 'Optical')
        .then(function(deviceComponent) {
            var value = parseFloat(deviceComponent.value);

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
            value = round(value, 2);

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

//Every 3 seconds read values
setInterval(function(params) {
    readTemperature();
    readOptical();
    readPressure();
    readHumidity();
}, 3 * 1000);

//Read right from beggining
readTemperature();
readOptical();
readPressure();
readHumidity();