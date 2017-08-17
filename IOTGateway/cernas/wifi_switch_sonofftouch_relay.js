var mqttLib = require('./mqtt_lib');
var deviceLib = require('./device_lib');

function getState(devices, socket, logger, msgToDeviceCallback, msgErrorCallback) {
    deviceLib.getState({
        device: 'wifi_switch_sonofftouch_relay',
        devices: devices,
        socket: socket,
        logger: logger,
        msg: msgToDeviceCallback,
        error: msgErrorCallback
    });
}

function setState(device, msgFromDevice, msgInitHmiCallback, msgSetHmiCallback) {
    deviceLib.setState({
        device: device,
        msg: msgFromDevice,
        init: msgInitHmiCallback,
        set: msgSetHmiCallback
    });
}

function setDevice(devices, msgFromHmi, logger, msgToDeviceCallback, msgErrorCallback) {
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
    setState,
    setDevice
};