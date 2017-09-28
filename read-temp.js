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

Firebase.on(HOUSE_ID + '/registered', function(registered) {
    //Start reading for all registered devices values
    console.log('start reading from devices');
    console.log(registered);

    //Unsubscribe first
    for (var k = 0; k < oldRegistered.length; k++) {
        var id = oldRegistered[k].deviceId;
        for (var p = 0; p < oldRegistered[k].streams.length; p++) {
            Devices.unsubscribe(id, oldRegistered[k].streams[p].id);
        }
    }

    if (!registered) {
        return;
    }

    for (var i = 0; i < registered.length; i++) {
        var id = registered[i].deviceId;

        agile.device.connect(id).then(function() {
            for (var j = 0; j < registered[i].streams.length; j++) {
                Devices.subscribeToDeviceTopic(id, registered[i].streams[j].id);
            }
            console.log('Connected! - ' + id);
        }).catch(function(err) {
            console.log('failed to connect to - ' + id);
            console.log(err);
        });
    }

    oldRegistered = registered;
});

Firebase.onCommand(HOUSE_ID, function(command) {
    if (command.type === 'discovery_on') {
        Devices.start(agile);
    } else if (command.type === 'discovery_off') {
        Devices.stop(agile);
    } else if (command.type === 'register_device') {
        Devices.register(agile, command.id, command.deviceType);
    }
});