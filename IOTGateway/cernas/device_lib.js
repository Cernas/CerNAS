var http = require('http');
var mqttLib = require('./mqtt_lib');

function getDeviceByMessage(devices, msg) {
    var device = null;
    for (var i = 0; i < devices.length; i++) {
        if (devices[i].room === msg.room && devices[i].place === msg.place && devices[i].deviceGroup === msg.deviceGroup && devices[i].device === msg.device) {
            device = devices[i];
            break;
        }
    }
    return device;
}

function check(args) {
    http.request({
        host: 'localhost',
        path: '/api/v1/device',
        method: 'GET'
    }, function (response) {
        response.on('data', function (response) {
            try {
                var devices = JSON.parse(response.toString());
                for (var i = 0; i < devices.length; i++) {
                    if (devices[i].sampleTimeSec) {
                        args.logger.log('DEVICE: Checking device: ' + mqttLib.getTopicByDevice(devices[i]));

                        if (((new Date() - new Date(devices[i].lastSeen)) / 1000) > devices[i].sampleTimeSec * 3) {
                            // Update connected to false
                            http.request({
                                host: 'localhost',
                                path: '/api/v1/device',
                                method: 'PUT',
                                headers: {
                                    'Content-Type': 'application/json'
                                }
                            }, function (response) {
                                response.on('data', function (response) {
                                    try {
                                        if (JSON.parse(response).status !== 'success') {
                                            args.logger.error('DEVICE: Device connected flag update error, device: ' + mqttLib.getTopicByDevice(devices[i]));
                                        }
                                    } catch (ex) {
                                        args.logger.error('DEVICE: Device connected flag update error: ' + ex + ', device: ' + mqttLib.getTopicByDevice(devices[i]));
                                    }
                                });
                            }).end(JSON.stringify({
                                topic: mqttLib.getTopicByDevice(devices[i]),
                                connected: false
                            }));
                            // Set HMI
                            args.msgHmi({
                                room: devices[i].room,
                                place: devices[i].place,
                                deviceGroup: devices[i].deviceGroup,
                                device: devices[i].device,
                                value: 'error',
                                connected: false
                            });

                            args.logger.error('DEVICE: Device disconnected: ' + mqttLib.getTopicByDevice(devices[i]));
                        }
                    }
                }
            } catch (ex) {
                args.logger.error('DEVICE: Get devices to check error: ' + ex);
            }
        });
    }).end(null);
}

function getState(arg) {
    for (var i = 0; i < arg.devices.length; i++) {
        if (arg.devices[i].device === arg.device) {
            // Set init flag
            arg.devices[i].init = true;
            // Set socket.io socket
            arg.devices[i].socket = arg.socket;
            // Message to device
            arg.msg(mqttLib.getTopicByDevice(arg.devices[i]) + '/action', JSON.stringify({
                action: 'getState'
            }));
            // Start receive timeout
            arg.devices[i].timer = setTimeout(function (device) {
                // Receive timeout elapsed
                arg.logger.error('Receive timeout on device: ' + mqttLib.getTopicByDevice(device));
                // Message to HMI
                arg.error({
                    room: device.room,
                    place: device.place,
                    deviceGroup: device.deviceGroup,
                    device: device.device,
                    action: 'error'
                });
            }, 2000, arg.devices[i]);
        }
    }
}

function setState(arg) {
    // Stop receive timeout
    if (arg.device.timer) {
        if (arg.device.timer._idleTimeout !== -1)
            clearTimeout(arg.device.timer);
    }

    var msgHmi = {
        room: arg.device.room,
        place: arg.device.place,
        deviceGroup: arg.device.deviceGroup,
        device: arg.device.device,
        action: JSON.parse(arg.msg).state
    };

    if (arg.device.init === true) {
        // Init message to HMI
        arg.init(msgHmi);
    } else {
        // Set message to HMI
        arg.set(msgHmi);
    }

    arg.device.init = false;
}

function getDstState(arg) {
    // Message to device
    arg.msg(mqttLib.getTopicByDevice(arg.device) + '/action', JSON.stringify({
        action: 'getState'
    }));
    // Start receive timeout
    arg.device.timer = setTimeout(function (device) {
        // Receive timeout elapsed
        arg.logger.error('Receive timeout on device: ' + mqttLib.getTopicByDevice(device));
        // Message to HMI
        arg.error({
            room: device.room,
            place: device.place,
            deviceGroup: device.deviceGroup,
            device: device.device,
            action: 'error'
        });
    }, 2000, arg.device);
}

module.exports = {
    getDeviceByMessage,
    check,
    getState,
    setState,
    getDstState
};