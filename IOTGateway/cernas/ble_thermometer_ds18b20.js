var http = require('http');

function getState(msgToHmiCallback, errorCallback) {
    http.request({
        host: 'localhost',
        path: '/api/v1/device?device=ble_thermometer_ds18b20',
        method: 'GET'
    }, function (response) {
        response.on('data', function (response) {
            try {
                var devices = JSON.parse(response);
                for (var i = 0; i < devices.length; i++) {
                    if (devices[i].other) {
                        devices[i].lastMsg.value.minimum = devices[i].other.statistics.minimum;
                        devices[i].lastMsg.value.maximum = devices[i].other.statistics.maximum;
                    }
                    // HMI message
                    msgToHmiCallback({
                        room: devices[i].room,
                        place: devices[i].place,
                        deviceGroup: devices[i].deviceGroup,
                        device: devices[i].device,
                        value: devices[i].lastMsg.value,
                        connected: devices[i].connected,
                        lastSeen: devices[i].lastSeen
                    });
                }
            } catch (ex) {
                errorCallback(JSON.stringify({
                    error: ex.toString()
                }));
            }
        });
    }).end(null);
}

function setState(device, topic, msgMqtt, msgToHmiCallback, errorCallback) {
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
                var json = JSON.parse(response);
                if (json.status !== 'success') {
                    errorCallback();
                } else {
                    var msg = JSON.parse(msgMqtt);
                    if (json.minimum && json.maximum) {
                        msg.value.minimum = json.minimum;
                        msg.value.maximum = json.maximum;
                    }
                    // HMI message
                    msgToHmiCallback({
                        room: device.room,
                        place: device.place,
                        deviceGroup: device.deviceGroup,
                        device: device.device,
                        value: msg.value,
                        connected: json.connected
                    });
                }
            } catch (ex) {
                errorCallback(JSON.stringify({
                    error: ex.toString()
                }));
            }
        });
    }).end(JSON.stringify({
        topic: topic,
        message: JSON.stringify(JSON.parse(msgMqtt))
    }));
}

module.exports = {
    getState,
    setState
};