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
    setState,
    setDevice,
    mqttAction
};