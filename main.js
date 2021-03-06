var agileSDK = require('agile-sdk');

var Devices = require('./devices');

var Firebase = require('./firebase');

global.api = 'http://127.0.0.1:8080';

var agile = agileSDK({
    api: global.api
});
var sensorTagDeviceId = 'bleB09122F73E80';

var HOUSE_ID = 1;

global.HOUSE_ID = HOUSE_ID;
global.agile = agile;

var oldRegistered = [];
var registered = [];
var discoveryOn = false;

var startReading = function() {

    // //Unsubscribe first
    // for (var k = 0; k < oldRegistered.length; k++) {
    //     var id = oldRegistered[k].address;
    //     for (var p = 0; p < oldRegistered[k].streams.length; p++) {
    //         Devices.unsubscribe(id, oldRegistered[k].streams[p].id);
    //     }
    // }

    for (var k in registered) {
        if (registered.hasOwnProperty(k)) {
            Devices.connect(agile, registered[k].deviceId, registered[k].streams);
        }
    }
    // for (var i = 0; i < registered.length; i++) {
    //     Devices.connect(agile, registered[i].deviceId, registered[i].streams);
    // }

    oldRegistered = registered;
};

var tryToRead3Times = 3;
var readTimeout = null;
var registerDevices = function(registered) {

    for (var k in registered) {
        if (registered.hasOwnProperty(k)) {

            //DevicesFound might be empty in devices.js
            var device = {
                name: registered[k].name,
                protocol: registered[k].protocol,
                id: registered[k].deviceId
            };
            Devices.register(agile, device, registered[k].type);
        }
    }
    readTimeout = setTimeout(function() {
        if (tryToRead3Times < 1) {
            clearTimeout(readTimeout);
        }
        tryToRead3Times--;
        startReading();
    }, 3 * 1000);
};

Firebase.on(HOUSE_ID + '/registered', function(newRegistered) {
    //Start reading for all registered devices values
    registered = newRegistered;
    if (discoveryOn) {
        registerDevices(registered);
    }
});

//Turn on discovery right away
Devices.startDiscovery(agile, function() {
    console.log('Discovery turned on on init');
    discoveryOn = true;
    if (registered.length > 0) {
        registerDevices(registered);
    }
});

Firebase.onCommand(HOUSE_ID, function(command) {
    if (command.type === 'discovery_on') {
        Devices.startDiscovery(agile, function() {
            Devices.devicePool(agile);
        });
    } else if (command.type === 'discovery_off') {
        Devices.stopDiscovery(agile);
    } else if (command.type === 'register_device') {
        Devices.registerNewDevice(agile, command.id, command.deviceType);
    } else if (command.type === 'start_reading') {
        startReading();
    }
});

//Set online/offline statuses
var deviceRef = Firebase.database.ref(HOUSE_ID + '/device');
deviceRef.update({
    onlineState: true
});
deviceRef.onDisconnect().update({
    onlineState: false
});