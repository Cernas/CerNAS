function getSubscribeTopicByDevice(devices) {
    var topic = [];
    for (var i = 0; i < devices.length; i++) {
        if (devices[i].connection.protocol.split(';').indexOf('MQTT') !== -1) {
            switch (devices[i].device) {
                case 'wifi_controller_rgb':
                    topic.push(devices[i].room + '/' + devices[i].place + '/' + devices[i].deviceGroup + '/' + devices[i].device + '/state');
                    break;
                case 'ble_thermometer_ds18b20':
                    topic.push(devices[i].room + '/' + devices[i].place + '/' + devices[i].deviceGroup + '/' + devices[i].device + '/value');
                    break;
                case 'wifi_switch_sonofftouch_relay':
                    topic.push(devices[i].room + '/' + devices[i].place + '/' + devices[i].deviceGroup + '/' + devices[i].device + '/state');
                    break;
                case 'wifi_switch_sonofftouch':
                    topic.push(devices[i].room + '/' + devices[i].place + '/' + devices[i].deviceGroup + '/' + devices[i].device + '/action');
                    break;
                case 'wifi_relay_sonoff':
                    topic.push(devices[i].room + '/' + devices[i].place + '/' + devices[i].deviceGroup + '/' + devices[i].device + '/state');
                    break;
            }
        }
    }
    return topic;
}

function getTopicByDevice(device) {
    return device.room + '/' + device.place + '/' + device.deviceGroup + '/' + device.device;
}

function getDstDeviceByTopic(topic, devices) {
    var device = null;
    var topicArray = topic.split('/');

    for (var i = 0; i < devices.length; i++) {
        if (devices[i].room === topicArray[0] && devices[i].place === topicArray[1] && devices[i].deviceGroup === topicArray[2] && devices[i].device !== topicArray[3]) {
            device = devices[i];
            break;
        }
    }
    return device;
}

function getSrcDeviceByTopic(topic, devices) {
    var device = null;
    var topicArray = topic.split('/');

    for (var i = 0; i < devices.length; i++) {
        if (devices[i].room === topicArray[0] && devices[i].place === topicArray[1] && devices[i].deviceGroup === topicArray[2] && devices[i].device === topicArray[3]) {
            device = devices[i];
            break;
        }
    }
    return device;
}

module.exports = {
    getSubscribeTopicByDevice,
    getTopicByDevice,
    getDstDeviceByTopic,
    getSrcDeviceByTopic
};