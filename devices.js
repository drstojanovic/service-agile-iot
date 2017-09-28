var Firebase = require('./firebase');

var Devices = {};

var devicePollInterval = null;

function devicePoll(agile) {
    devicePollInterval = setInterval(function() {
        agile.protocolManager.devices()
            .then(function(devices) {
                // console.log(devices);
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
    }).catch(function(err) {
        console.log(err);
        // keep running trying discovery is turned on
        setTimeout(function() {
            console.log('retrying stop');
            Devices.stop(agile);
        }, 1000);
    });
};

module.exports = Devices;