//* ****************************** Dependencies ********************************
var propertiesReader = require('properties-reader');
var configs = propertiesReader('./config.ini');
var Logger = require('./cernas/logger');
var wifiControllerRgb = require('./cernas/wifi_controller_rgb');
var bleThermometerDS18B20 = require('./cernas/ble_thermometer_ds18b20');
var wifiSwitchSonofftouchRelay = require('./cernas/wifi_switch_sonofftouch_relay');
var mqtt = require('mqtt');
var mqttLib = require('./cernas/mqtt_lib');
var http = require('http');
var deviceLib = require('./cernas/device_lib');

//* *************************** Read config params *****************************
const APP_PORT = parseInt(configs.get('iot_gateway.port'));   // app port
const APP_LOG_PATH = configs.get('iot_gateway.log_path');   // path to app log file
const APP_LOG_NAME = configs.get('iot_gateway.log_name');   // name of app log file
const MQTT_BROKER_HOST = configs.get('mqtt.broker_host');   // mqtt broker host

var io = require('socket.io')(APP_PORT);

//* ***************************** Global variables *****************************
// logger object
var logger = new Logger('./' + APP_LOG_PATH + '/' + APP_LOG_NAME, './' + APP_LOG_PATH + '/' + APP_LOG_NAME);
// socket.io clients
var clients = [];

//* ******************************* Functions **********************************
function clientsEmit(thread, msg) {
    for (var i = 0; i < clients.length; i++) {
        clients[i].emit(thread, msg);
    }
}

function updateDevice(topic, message, errorCallback) {
    http.request({
        host: 'localhost',
        path: '/api/v1/device',
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        }
    }, function (response) {
        response.on('data', function (response) {
            if (JSON.parse(response).status !== 'success')
                errorCallback();
        });
    }).end(JSON.stringify({
        topic: topic,
        message: JSON.stringify(JSON.parse(message))
    }));
}

//* ********************************** App *************************************
logger.log('App Control: Starting application...');

http.request({
    host: 'localhost',
    path: '/api/v1/device',
    method: 'GET'
}, function (response) {
    response.on('data', function (devices) {
        devices = JSON.parse(devices.toString());

        // MQTT client
        var mqttClient = mqtt.connect('mqtt://' + MQTT_BROKER_HOST);
        mqttClient.on('connect', function () {
            // MQTT client connected
            logger.log('MQTT: Client has been connected');

            // Start subscribing
            mqttClient.subscribe(mqttLib.getSubscribeTopicByDevice(devices), function (error, granted) {
                for (var i = 0; i < granted.length; i++)
                    logger.log('MQTT: Subscribe started on topic: ' + granted[i].topic + ', QOS: ' + granted[i].qos);

                if (error !== null)
                    logger.error('MQTT: Subscribe error: ' + error.toString());
            });

            // MQTT message received
            mqttClient.on('message', function (topic, msgMqtt) {
                logger.log('MQTT: Message received: ' + msgMqtt + ' from topic: ' + topic);

                // To source device
                var srcDevice = mqttLib.getSrcDeviceByTopic(topic, devices);
                switch (srcDevice.device) {
                    case 'wifi_controller_rgb':
                        // Update state of device
                        wifiControllerRgb.setState(srcDevice, msgMqtt, function (msgHmi) {
                            // Init HMI
                            srcDevice.socket.emit('initHMI', msgHmi);
                        }, function (msgHmi) {
                            // Set HMI
                            clientsEmit('setHMI', msgHmi);
                        });
                        break;
                    case 'ble_thermometer_ds18b20':
                        // Set state of device
                        bleThermometerDS18B20.setState(srcDevice, topic, msgMqtt, function (msgHmi) {
                            // Set HMI
                            clientsEmit('setHMI', msgHmi);
                        }, function (errorUpdate) {
                            logger.error('DEVICE: Update state error: ' + errorUpdate + ', message: ' + msgMqtt + ' to topic: ' + topic);
                        });
                        break;

                    case 'wifi_switch_sonofftouch_relay':
                        // Update state of device
                        wifiSwitchSonofftouchRelay.setState(srcDevice, msgMqtt, function (msgHmi) {
                            // Init HMI
                            srcDevice.socket.emit('initHMI', msgHmi);
                        }, function (msgHmi) {
                            // Set HMI
                            clientsEmit('setHMI', msgHmi);
                        });
                        break;
                }

                // Exist destination device?
                var dstDevice = mqttLib.getDstDeviceByTopic(topic, devices);
                if (dstDevice !== null) {
                    // To destination device
                    switch (dstDevice.device) {
                        case 'wifi_controller_rgb':
                            wifiControllerRgb.mqttAction(dstDevice, msgMqtt, function (topic, msgDevice) {
                                mqttClient.publish(topic, msgDevice, function (errorPublish) {
                                    if (!errorPublish)
                                        logger.log('MQTT: Published message: ' + msgDevice + ' to topic: ' + topic);
                                    else
                                        logger.error('MQTT: Publish error: ' + errorPublish + ', message: ' + msgDevice + ' to topic: ' + topic);
                                });
                            }, function (msgHmi) {
                                // Set HMI
                                clientsEmit('setHMI', msgHmi);
                            });
                            break;
                        case 'test_switch':
                            var dstTopic = dstDevice.room + '/' + dstDevice.place + '/' + dstDevice.deviceGroup + '/' + dstDevice.device + '/state';
                            mqttClient.publish(dstTopic, msgMqtt, function (errorPublish) {
                                if (!errorPublish)
                                    logger.log('MQTT: Published message: ' + msgMqtt + ' to topic: ' + dstTopic);
                                else
                                    logger.error('MQTT: Publish error: ' + errorPublish + ', message: ' + msgMqtt + ' to topic: ' + dstTopic);
                            });
                            break;
                    }
                }
            });

            // Socket.IO client connected
            io.on('connection', function (socket) {
                // Client connected
                clients.push(socket);
                logger.log('SOCKET.IO: Client ID: ' + socket.id + ' connected, number of clients: ' + clients.length);

                // Init wifi_controller_rgb devices
                wifiControllerRgb.getState(devices, socket, logger, function (topic, msg) {
                    mqttClient.publish(topic, msg, function (errorPublish) {
                        if (!errorPublish)
                            logger.log('MQTT: Published message: ' + msg + ' to topic: ' + topic);
                        else
                            logger.error('MQTT: Publish error: ' + errorPublish + ', message: ' + msg + ' to topic: ' + topic);
                    });
                }, function (error) {
                    // Set HMI error
                    socket.emit('initHMI', error);
                });
                // Init ble_thermometer_ds18b20 devices
                bleThermometerDS18B20.getState(function (msg) {
                    socket.emit('initHMI', msg);
                }, function (error) {
                    logger.error('DEVICE: Get state error: ' + error);
                });
                // Init wifi_switch_sonofftouch_relay devices
                wifiSwitchSonofftouchRelay.getState(devices, socket, logger, function (topic, msg) {
                    mqttClient.publish(topic, msg, function (errorPublish) {
                        if (!errorPublish)
                            logger.log('MQTT: Published message: ' + msg + ' to topic: ' + topic);
                        else
                            logger.error('MQTT: Publish error: ' + errorPublish + ', message: ' + msg + ' to topic: ' + topic);
                    });
                }, function (error) {
                    // Set HMI error
                    socket.emit('initHMI', error);
                });
                // TODO: Init any other devices

                // Set device listener
                socket.on('setDevice', function (msg) {
                    // Select device by msg
                    switch (msg.device) {
                        // Set wifi_controller_rgb device
                        case 'wifi_controller_rgb':
                            // Set wifi RGB color
                            wifiControllerRgb.setDevice(devices, msg, logger, function (topic, msgMqtt) {
                                mqttClient.publish(topic, msgMqtt, function (errorPublish) {
                                    if (!errorPublish)
                                        logger.log('MQTT: Published message: ' + msgMqtt + ' to topic: ' + topic);
                                    else
                                        logger.error('MQTT: Publish error: ' + errorPublish + ', message: ' + msgMqtt + ' to topic: ' + topic);
                                });
                            }, function (msgError) {
                                // Set HMI
                                clientsEmit('setHMI', msgError);
                            });
                            break;
                            // Set wifi_switch_sonofftouch_relay device
                        case 'wifi_switch_sonofftouch_relay':
                            wifiSwitchSonofftouchRelay.setDevice(devices, msg, logger, function (topic, msgMqtt) {
                                mqttClient.publish(topic, msgMqtt, function (errorPublish) {
                                    if (!errorPublish)
                                        logger.log('MQTT: Published message: ' + msgMqtt + ' to topic: ' + topic);
                                    else
                                        logger.error('MQTT: Publish error: ' + errorPublish + ', message: ' + msgMqtt + ' to topic: ' + topic);
                                });
                            }, function (msgError) {
                                // Set HMI
                                clientsEmit('setHMI', msgError);
                            });
                            break;
                    }
                    // TODO: Set any other device
                });

                // Client disconnected
                socket.on('disconnect', function () {
                    clients.splice(clients.indexOf(socket), 1);
                    logger.log('SOCKET.IO: Client ID: ' + socket.id + ' disconnected, number of clients: ' + clients.length);
                });
            });

            // Check sensor timer
            for (var i = 0; i < devices.length; i++) {
                if (devices[i].sampleTimeSec) {
                    try {
                        setInterval(deviceLib.checkDevice, devices[i].sampleTimeSec * 3 * 1000, {
                            logger: logger,
                            msgHmi: function (msgHmi) {
                                clientsEmit('setHMI', msgHmi);
                            }
                        });

                        logger.log('DEVICE: Check timer has been started for device: ' + mqttLib.getTopicByDevice(devices[i]));
                    } catch (ex) {
                        logger.error('DEVICE: Check timer error: ' + ex + ', device: ' + mqttLib.getTopicByDevice(devices[i]));
                    }
                }
            }
        });
        // MQTT connection closed
        mqttClient.on('close', function (error) {
            logger.error('MQTT: Connection to broker failed: ' + error.toString());
            mqttClient.end();
            process.exit();
        });
    });
}).end(null);