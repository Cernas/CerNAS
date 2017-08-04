var http = require('http');
var mqttLib = require('./mqtt_lib');

function checkDevice(args) {
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

module.exports = {
    checkDevice
};