var mqtt = require('mqtt');
var client = mqtt.connect('mqtt://localhost');

client.on('connect', function () {
    client.subscribe('bedroom/bed/lightening/wifi_switch_sonofftouch/state');
    client.publish('bedroom/bed/lightening/wifi_switch_sonofftouch/action', JSON.stringify({
        action: 'getState'
    }));
});

client.on('message', function (topic, message) {
    switch (JSON.parse(message).state) {
        case 'turnOn':
            client.publish(topic.replace('state', 'action'), JSON.stringify({
                action: 'turnOff'
            }));
            break;
        case 'turnOff':
            client.publish(topic.replace('state', 'action'), JSON.stringify({
                action: 'turnOn'
            }));
            break;
    }
    client.end();
});