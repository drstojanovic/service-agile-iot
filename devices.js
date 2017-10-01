var Firebase = require('./firebase');
var request = require('request');

var Devices = {};

var devicePollInterval = null;

var devicesFound = [];
var DATA = {};

var round = function(value, precision) {
    var multiplier = Math.pow(10, precision || 0);
    return Math.round(value * multiplier) / multiplier;
};

Devices.devicePool = function devicePoll(agile) {
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
};

Devices.startDiscovery = function startDiscovery(agile, cb) {
    return agile.protocolManager.discovery.start()
        .then(function() {
            console.log('All protocols are running discovery is on');
            // devicePoll(agile);
            cb();
        }).catch(function(err) {
            console.log(err);
            // keep trying to turn on discovery
            setTimeout(function() {
                console.log('retrying');
                Devices.startDiscovery(agile, cb);
            }, 1000);
        });
};

Devices.stopDiscovery = function(agile) {
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
            Devices.stopDiscovery(agile);
        }, 1000);
    });
};

Devices.registerNewDevice = function(agile, id, type) {
    //Find this device in array by id
    var device = null;
    for (var i = 0; i < devicesFound.length; i++) {
        if (devicesFound[i].id == id) {
            device = devicesFound[i];
            break;
        }
    }

    Devices.register(agile, device, type, function(newDevice) {

        //Send this to firebase
        Firebase.readOnce(global.HOUSE_ID + '/registered', function(registered) {

            registered = registered || [];
            registered.push(newDevice);

            Firebase.sendMessage(global.HOUSE_ID + '/registered', registered);
        });
    });
};

var maxRegisterTryCount = 5;
Devices.register = function(agile, device, type, cb) {

    if (!device) {
        console.log('reguested device not found');
        return;
    }

    console.log('Register device: ');
    console.log(device);
    console.log(type);

    /* const deviceOverview = {
     *   "name": "CC2650 SensorTag",
     *   "protocol": "iot.agile.protocol.BLE",
     *   "id": "B0:B4:48:BD:10:85",
     *   "status": "CONNECTED"
     * };
     * const type = "TI SensorTag";
     */
    var createDevice = {
        name: device.name,
        protocol: device.protocol,
        id: device.id,
        status: 'CONNECTED'
    };

    request({
        method: 'POST',
        uri: global.api + '/api/devices/register/',
        json: {
            type: type,
            overview: createDevice
        }
    }, function(err, response, data) {
        if (err) {
            console.log(err);
            maxRegisterTryCount--;
            if (maxRegisterTryCount < 1) {
                return;
            }
            // keep running trying discovery is turned on
            setTimeout(function() {
                console.log('retrying');
                Devices.register(agile, device, type);

            }, 1000);
            return;
        }

        console.log(response);

        console.log('New device registered');
        newDevice = data;
        console.log(newDevice);
        newDevice.type = type;

        if (cb) {
            cb(newDevice);
        }
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

    console.log('Trying to connect device: ' + id);

    agile.device.connect(id)
        .then(function(newDevice) {
            console.log('Device ' + id + ' connected!');
            if (!streams) {
                return;
            }

            //Subscribe to all streams
            console.log('Subscribe to all streams of device');
            for (var j = 0; j < streams.length; j++) {
                Devices.subscribeToDeviceTopic(id, streams[j].id);
            }
        }).catch(function(err) {
            console.log(err);
            // console.log(err.response.data);
            // keep running trying discovery is turned on
            setTimeout(function() {
                console.log('retrying to connect ' + id);
                Devices.connect(agile, id, streams);
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
                    var deviceComponent = {
                        value: 0,
                        unit: '_'
                    };
                    try {
                        deviceComponent = JSON.parse(e.data);
                    } catch (e) {
                        console.log('failed parsing read value');
                        return;
                    }

                    var value = parseFloat(deviceComponent.value);
                    value = round(value, 2);

                    if (DATA[lowercaseTopic] !== value) {
                        //Send to server
                        sendUpdatedValueToServer(lowercaseTopic, {
                            // value: value,
                            value: value,
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