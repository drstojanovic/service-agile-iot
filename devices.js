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

Devices.register = function(agile, id, type) {
    //Find this device in array by id
    var device = null;
    for (var i = 0; i < devicesFound.length; i++) {
        if (devicesFound[i].id == id) {
            device = devicesFound[i];
            break;
        }
    }

    if (!device) {
        console.log('reguested device not found');
        return;
    }

    agile.deviceManager.create(device, type)
        .then(function(newDevice) {
            console.log('New device registered');
            console.log(newDevice);
            newDevice.type = type;

            //Send this to firebase
            Firebase.readOnce(global.HOUSE_ID + '/registered', function(registered) {

                registered = registered || [];
                registered.push(newDevice);

                Firebase.sendMessage(global.HOUSE_ID + '/registered', registered);
            });
        });
};

module.exports = Devices;