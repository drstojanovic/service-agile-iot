var Firebase = require('./firebase');

var Devices = {};

var devicePollInterval = null;

var devicesFound = [];
var DATA = {};

var round = function(value, precision) {
    var multiplier = Math.pow(10, precision || 0);
    return Math.round(value * multiplier) / multiplier;
};

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
        }).catch(function(err) {
            console.log(err);
            // keep running trying discovery is turned on
            setTimeout(function() {
                console.log('retrying');
                Devices.register(agile, id, type);
            }, 1000);
        });
};

Devices.unsubscribe = function(deviceId, topic) {
    agile.device.unsubscribe(deviceId, topic)
        .then(function() {});
};


Devices.connect = function(agile, id, streams) {
    if (!id) {
        console.log('id is required');
        return;
    }

    agile.device.connect(id)
        .then(function(newDevice) {
            console.log('Device ' + id + ' connected!');

            //Subscribe to all streams
            console.log('Subscribe to all streams of device');
            for (var j = 0; j < streams.length; j++) {
                Devices.subscribeToDeviceTopic(id, streams[j].id);
            }
        }).catch(function(err) {
            console.log(err);
            // keep running trying discovery is turned on
            setTimeout(function() {
                console.log('retrying to connect ' + id);
                Devices.connect(agile, id);
            }, 1000);
        });
};


var sendUpdatedValueToServer = function(type, value) {
    console.log('send update to server for ' + type + ' the new value is: ')
    console.log(value);
    var path = global.HOUSE_ID + '/' + type;
    Firebase.sendMessage(path, value);
};

Devices.subscribeToDeviceTopic = function(deviceId, topic) {
    var lowercaseTopic = topic.toLowerCase();
    agile.device.subscribe(deviceId, topic)
        .then(function(stream) {
            stream.onerror = function(e) {
                console.log('Connection Error: ' + deviceId + ' - ' + topic);
            };

            stream.onopen = function(e) {
                console.log('WebSocket Client Connected: ' + deviceId + ' - ' + topic);
            };

            stream.onclose = function(e) {
                console.log('echo-protocol Client Closed: ' + deviceId + ' - ' + topic);
            };

            stream.onmessage = function(e) {
                if (typeof e.data === 'string') {
                    console.log("Received: '" + e.data + "'");
                    var value = parseFloat(e.data);
                    value = round(value, 2);

                    if (DATA[lowercaseTopic] !== value) {
                        //Send to server
                        sendUpdatedValueToServer(lowercaseTopic, {
                            // value: value,
                            value: e.data,
                            unit: deviceComponent.unit
                        });
                    }

                    //Set for next check
                    DATA[lowercaseTopic] = value;
                }
            };
        });
};

module.exports = Devices;