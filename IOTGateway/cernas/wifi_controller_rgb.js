var udpClient = require('./udp_client');
var mqttLib = require('./mqtt_lib');
var deviceLib = require('./device_lib');

function getState(devices, socket, logger, msgToDeviceCallback, msgErrorCallback) {
    deviceLib.getState({
        device: 'wifi_controller_rgb',
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
    if (msgFromHmi.action === 'setColor') {
        udpClient.send({
            ipAddress: device.connection.ipAddress,
            port: device.connection.port,
            msg: {
                action: 'setColor',
                color: msgFromHmi.settings.color
            }
        });
    } else {
        var msg = {
            action: 'setColor'
        };

        switch (msgFromHmi.action) {
            case 'turnOn':
                msg.color = msgFromHmi.settings.color;
                break;
            case 'turnOff':
                msg.color = {r: 0, g: 0, b: 0};
                break;
        }
        // Message to device (topic, message)
        msgToDeviceCallback(mqttLib.getTopicByDevice(device) + '/action', JSON.stringify(msg));
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
}

function setDestination(dstDevice, msgFromSrcDevice, logger, msgToDstDeviceCallback, msgErrorCallback) {
    if (JSON.parse(msgFromSrcDevice).action === 'getState') {
        // State message to destination device
        deviceLib.getDstState({
            device: dstDevice,
            logger: logger,
            msg: msgToDstDeviceCallback,
            error: msgErrorCallback
        });
    } else {
        // Action message to destination device
        setDevice([dstDevice], {
            room: dstDevice.room,
            place: dstDevice.place,
            deviceGroup: dstDevice.deviceGroup,
            device: dstDevice.device,
            action: JSON.parse(msgFromSrcDevice).action,
            settings: {
                color: dstDevice.settings.defaultColor
            }
        }, logger, msgToDstDeviceCallback, msgErrorCallback);
    }
}

module.exports = {
    getState,
    setState,
    setDevice,
    setDestination
};