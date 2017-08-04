var udpClient = require('./udp_client');

function getDeviceByPlace(devices, room, place) {
    var device;
    for (var i = 0; i < devices.length; i++) {
        if (devices[i].room === room && devices[i].place === place && devices[i].device === 'wifi_controller_rgb') {
            device = devices[i];
            break;
        }
    }
    return device;
}

function getState(devices, logger, getColorCallback, timeoutCallback) {
    // Filter wifi_controller_rgb devices
    var wifiRgbDevices = [];
    for (var i = 0; i < devices.length; i++) {
        if (devices[i].device === 'wifi_controller_rgb')
            wifiRgbDevices.push(devices[i]);
    }

    var destinations = [];
    for (var i = 0; i < wifiRgbDevices.length; i++)
        destinations.push(wifiRgbDevices[i].connection);

    udpClient.sendAndReceive({
        msg: {
            action: 'getState'
        },
        destinations: destinations,
        port: destinations[0].port,
        recvTimeoutMs: 2000,
        logger: logger
    }, function (msg, ipAddress) {
        var device;
        for (var i = 0; i < wifiRgbDevices.length; i++) {
            if (wifiRgbDevices[i].connection.ipAddress === ipAddress) {
                device = wifiRgbDevices[i];
                break;
            }
        }

        getColorCallback({
            room: device.room,
            place: device.place,
            deviceGroup: 'lightening',
            device: 'wifi_controller_rgb',
            action: msg.state,
            settings: {
                color: msg.color
            }
        });
    }, function (ipAddress) {
        var device;
        for (var i = 0; i < wifiRgbDevices.length; i++) {
            if (wifiRgbDevices[i].connection.ipAddress === ipAddress) {
                device = wifiRgbDevices[i];
                break;
            }
        }

        timeoutCallback({
            room: device.room,
            place: device.place,
            deviceGroup: 'lightening',
            device: 'wifi_controller_rgb',
            action: 'error'
        });
    });
}

function setColor(devices, msg) {
    var device = getDeviceByPlace(devices, msg.room, msg.place);

    udpClient.send({
        ipAddress: device.connection.ipAddress,
        port: device.connection.port,
        msg: {
            action: 'setColor',
            color: msg.settings.color
        }
    });

    if (msg.action !== 'setColor') {
        return {
            room: device.room,
            place: device.place,
            deviceGroup: 'lightening',
            device: 'wifi_controller_rgb',
            action: msg.action
        };
    } else {
        return null;
    }
}

function mqttAction(destDevice, msgMqtt, publishCallback, stateChangedCallback) {
    switch (JSON.parse(msgMqtt).action) {
        case 'getState':
            publishCallback(destDevice.room + '/' + destDevice.place + '/' + destDevice.deviceGroup + '/' + destDevice.device + '/action', msgMqtt);
            break;
        case 'turnOn':
            publishCallback(destDevice.room + '/' + destDevice.place + '/' + destDevice.deviceGroup + '/' + destDevice.device + '/action', JSON.stringify({
                action: 'setColor',
                color: destDevice.settings.defaultColor
            }));
            stateChangedCallback({
                room: destDevice.room,
                place: destDevice.place,
                deviceGroup: destDevice.deviceGroup,
                device: destDevice.device,
                action: 'turnOn'
            });
            break;
        case 'turnOff':
            publishCallback(destDevice.room + '/' + destDevice.place + '/' + destDevice.deviceGroup + '/' + destDevice.device + '/action', JSON.stringify({
                action: 'setColor',
                color: {r: 0, g: 0, b: 0}
            }));
            stateChangedCallback({
                room: destDevice.room,
                place: destDevice.place,
                deviceGroup: destDevice.deviceGroup,
                device: destDevice.device,
                action: 'turnOff'
            });
            break;
    }
}

module.exports = {
    getState,
    setColor,
    mqttAction
};