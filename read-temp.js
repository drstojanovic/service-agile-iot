var agileSDK = require('agile-sdk');

var Devices = require('./devices');

var Firebase = require('./firebase');

var agile = agileSDK({
    api: 'http://127.0.0.1:8080'
});
var sensorTagDeviceId = 'bleB09122F73E80';

var HOUSE_ID = 1;

global.HOUSE_ID = HOUSE_ID;
global.agile = agile;

var oldRegistered = [];
var registered = [];

var startReading = function() {

    // //Unsubscribe first
    // for (var k = 0; k < oldRegistered.length; k++) {
    //     var id = oldRegistered[k].deviceId;
    //     for (var p = 0; p < oldRegistered[k].streams.length; p++) {
    //         Devices.unsubscribe(id, oldRegistered[k].streams[p].id);
    //     }
    // }

    for (var i = 0; i < registered.length; i++) {
        Devices.connect(agile, registered[i].deviceId, registered[i].streams);
    }

    oldRegistered = registered;
};

Firebase.on(HOUSE_ID + '/registered', function(newRegistered) {
    //Start reading for all registered devices values
    console.log('start reading from devices');
    console.log(registered);
    registered = newRegistered;
    // startReading();
});

//Turn on discovery right away
Devices.startDiscovery(agile);

Firebase.onCommand(HOUSE_ID, function(command) {
    if (command.type === 'discovery_on') {
        Devices.startDiscovery(agile, function() {
            Devices.devicePool(agile);
        });
    } else if (command.type === 'discovery_off') {
        Devices.stopDiscovery(agile);
    } else if (command.type === 'register_device') {
        Devices.register(agile, command.id, command.deviceType);
    } else if (command.type === 'start_reading') {
        startReading();
    }
});