var Firebase = require('./firebase');

var Devices = {};

var devicePollInterval = null;

var devicesFound = [];

function devicePoll(agile) {
    devicePollInterval = setInterval(function() {
        agile.protocolManager.devices()
            .then(function(devices) {

                devicesFound = devices;
                Firebase.sendMessage(global.HOUSE_ID + '/devices', {
                    devices: devices
                });
            })
            .catch(function(err) {
                console.log(err);
            });
    }, 5000);
}

Devices.start = function start(agile) {
    agile.protocolManager.discovery.start().then(function() {
        console.log('All protocols are running discovery is on');
        devicePoll(agile);
    }).catch(function(err) {
        console.log(err);
        // keep running trying discovery is turned on
        setTimeout(function() {
            console.log('retrying');
            Devices.start(agile);
        }, 1000);
    });
};

Devices.stop = function(agile) {
    clearInterval(devicePollInterval);
    agile.protocolManager.discovery.stop().then(function() {
        console.log('Discovery is off');
        Firebase.sendMessage(global.HOUSE_ID + '/devices', {
            devices: []
        });
    }).catch(function(err) {
        console.log(err);
        // keep running trying discovery is turned on
        setTimeout(function() {
            console.log('retrying stop');
            Devices.stop(agile);
        }, 1000);
    });
};

Devices.register = function(agile, id) {
    //Find this device in array by id

    var deviceOverview = {
        "name": "CC2650 SensorTag",
        "protocol": "iot.agile.protocol.BLE",
        "id": "B0:91:22:F7:3E:80",
        "status": "CONNECTED"
    };
    var type = "TI SensorTag";

    agile.deviceManager.create(deviceOverview, type)
        .then(function(newDevice) {
            console.log('New device registered');
            console.log(newDevice);
        });
};

module.exports = Devices;