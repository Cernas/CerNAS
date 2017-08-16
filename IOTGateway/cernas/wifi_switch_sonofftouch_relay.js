var mqttLib = require('./mqtt_lib');
var deviceLib = require('./device_lib');

function getState(devices, logger, msgToDeviceCallback, msgErrorCallback) {
    for (var i = 0; i < devices.length; i++) {
        if (devices[i].device === 'wifi_switch_sonofftouch_relay') {
            // Set init flag
            devices[i].init = true;
            // Message to device
            msgToDeviceCallback(mqttLib.getTopicByDevice(devices[i]) + '/action', JSON.stringify({
                action: 'getState'
            }));
            // Start receive timeout
            devices[i].timer = setTimeout(function (device) {
                // Receive timeout elapsed
                logger.error('Receive timeout on device: ' + mqttLib.getTopicByDevice(device));
                // Message to HMI
                msgErrorCallback({
                    room: device.room,
                    place: device.place,
                    deviceGroup: device.deviceGroup,
                    device: device.device,
                    action: 'error'
                });
            }, 2000, devices[i]);
        }
    }
}

function updateState(device, msgFromDevice, msgInitHmiCallback, msgUpdateHmiCallback) {
    // Stop receive timeout
    if (device.timer._idleTimeout !== -1)
        clearTimeout(device.timer);

    var msgHmi = {
        room: device.room,
        place: device.place,
        deviceGroup: device.deviceGroup,
        device: device.device,
        action: JSON.parse(msgFromDevice).state
    };

    if (device.init === true) {
        // Init message to HMI
        msgInitHmiCallback(msgHmi);
    } else {
        // Set message to HMI
        msgUpdateHmiCallback(msgHmi);
    }

    device.init = false;
}

function setState(devices, msgFromHmi, logger, msgToDeviceCallback, msgErrorCallback) {
    var device = deviceLib.getDeviceByMessage(devices, msgFromHmi);
    // Message to device (topic, message)
    msgToDeviceCallback(mqttLib.getTopicByDevice(device) + '/action', JSON.stringify({
        action: msgFromHmi.action
    }));
    // Start receive timeout
    device.timer = setTimeout(function (device) {
        // Receive timeout elapsed
        logger.error('Receive timeout on device: ' + mqttLib.getTopicByDevice(device));
        // Message to HMI
        msgErrorCallback({
            room: device.room,
            place: device.place,
            deviceGroup: device.deviceGroup,
            device: device.device,
            action: 'error'
        });
    }, 2000, device);
}

module.exports = {
    getState,
    updateState,
    setState
};