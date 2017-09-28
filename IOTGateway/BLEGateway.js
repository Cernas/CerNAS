//* ****************************** Dependencies ********************************
var propertiesReader = require('properties-reader');
var configs = propertiesReader('./config.ini');
var Logger = require('./cernas/logger');
var noble = require('noble');
var mqtt = require('mqtt');
var http = require('http');

//* *************************** Read config params *****************************
const APP_LOG_PATH = configs.get('ble_gateway.log_path');   // path to app log file
const APP_LOG_NAME = configs.get('ble_gateway.log_name');   // name of app log file
const MQTT_BROKER_HOST = configs.get('mqtt.broker_host');   // mqtt broker host

//* ***************************** Global variables *****************************
// logger object
var logger = new Logger('./' + APP_LOG_PATH + '/' + APP_LOG_NAME, './' + APP_LOG_PATH + '/' + APP_LOG_NAME);
// Discovered peripherial
var discovered = [];

//* ******************************* Functions **********************************
function haveConnect(localName, devices) {
    var result = false;
    for (var i = 0; i < devices.length; i++) {
        if (devices[i].connection.protocol.split(';').indexOf('BLE') !== -1) {
            if (devices[i].connection.mac === localName)
                result = true;
        }
    }
    return result;
}

function getMacByPeripherialId(peripherialId) {
    return peripherialId.match(/.{1,2}/g).join(':').toUpperCase();
}

function getDeviceByMac(mac, devices) {
    var device;
    for (var i = 0; i < devices.length; i++) {
        if (devices[i].connection.mac === mac) {
            device = devices[i];
            break;
        }
    }
    return device;
}

function getTemperature(data) {
    var temperature = (data[1] << 8) + data[0];
    if (((data[1] & 0xF0) >> 4) === 0x0F) {
        temperature = ((~temperature & 0x00000000000007FF) + 1) * -1;
    }
    return parseFloat(Math.round(temperature * 0.0625 * 100) / 100);
}

//* ********************************** App *************************************
logger.log('BLE Gateway: Starting application...');

// Get all devices
http.request({
    host: 'localhost',
    path: '/api/v1/device',
    method: 'GET'
}, function (response) {
    response.on('data', function (devices) {
        devices = JSON.parse(devices.toString()).devices;

        // MQTT client
        var mqttClient = mqtt.connect('mqtt://' + MQTT_BROKER_HOST);
        mqttClient.on('connect', function () {
            // MQTT client connected
            logger.log('MQTT: Client has been connected');

            // BLE discover listener
            noble.on('discover', function (peripheral) {

                //console.log('Discover: ' + peripheral.advertisement.localName);     // TODO

                if (discovered.indexOf(peripheral.advertisement.localName) < 0) {   // Only once discover
                    // Add discovered peripherial to list
                    discovered.push(peripheral.advertisement.localName);

                    //console.log('Discover filter: ' + peripheral.advertisement.localName);  // TODO

                    if (haveConnect(peripheral.advertisement.localName, devices)) {     // Connect to peripherials on white list
                        peripheral.connect(function (error) {
                            if (error !== null) {
                                logger.error('BLE: Peripherial connect error: ' + error + ', device: ' + peripheral.advertisement.localName);
                            } else {
                                logger.log('BLE: Connected to peripheral: ' + peripheral.advertisement.localName);

                                // Start peripherial connection timeout 5 s
                                var connectionTimeout = setTimeout(function () {
                                    logger.error('Connection timeout elapsed, device: ' + peripheral.advertisement.localName);
                                    // Peripherial disconnect
                                    peripheral.disconnect();
                                    // Remove periaherial from the list
                                    discovered.splice(discovered.indexOf(peripheral.advertisement.localName), 1);
                                }, 5000);

                                peripheral.discoverServices(['ffe0'], function (error, services) {
                                    if (error !== null)
                                        logger.error('BLE: Service discover error: ' + error + ', device: ' + peripheral.advertisement.localName);

                                    services[0].discoverCharacteristics(['ffe1'], function (error, characteristics) {
                                        if (error !== null)
                                            logger.error('BLE: Characteristic discover error: ' + error + ', device: ' + peripheral.advertisement.localName);

                                        // Notify event listener
                                        characteristics[0].on('data', function (data) {
                                            // Stop connection timeout
                                            if (connectionTimeout) {
                                                if (connectionTimeout._idleTimeout !== -1)
                                                    clearTimeout(connectionTimeout);
                                            }

                                            // Peripherial disconnect
                                            peripheral.disconnect(function () {
                                                logger.log('Disconnected: ' + peripheral.advertisement.localName);
                                            });

                                            var mac = getMacByPeripherialId(characteristics[0]._peripheralId);

                                            // Next discover delay timeout
                                            setTimeout(function () {
                                                // Remove periaherial from the list
                                                discovered.splice(discovered.indexOf(mac), 1);
                                            }, 5000);

                                            logger.log('BLE: Received message: ' + data.toString('hex') + ' from: ' + mac);

                                            var device = getDeviceByMac(mac, devices);
                                            switch (device.device) {
                                                case 'ble_thermometer_ds18b20':
                                                    var mqttMsg = JSON.stringify({
                                                        value: {
                                                            temperature: getTemperature(data)
                                                        }
                                                    });

                                                    var topic = device.room + '/' + device.place + '/' + device.deviceGroup + '/' + device.device + '/value';
                                                    mqttClient.publish(topic, mqttMsg, function (errorPublish) {
                                                        if (!errorPublish)
                                                            logger.log('MQTT: Published message: ' + mqttMsg + ' to topic: ' + topic);
                                                        else
                                                            logger.error('MQTT: Publish error: ' + errorPublish + ', message: ' + mqttMsg + ' to topic: ' + topic);
                                                    });
                                                    break;
                                            }
                                        });
                                    });
                                });
                            }

                            // App exit listener
                            process.on('exit', function () {
                                // Peripherial disconnect
                                peripheral.disconnect();
                                // Stop BLE scanning
                                noble.stopScanning();
                            });
                        });
                    }
                }
            });

            // Start BLE scanning...
            noble.startScanning([], true);
            logger.log('BLE: Start scanning');
        });
        // MQTT connection closed
        mqttClient.on('close', function (error) {
            logger.error('MQTT: Connection to broker failed: ' + error.toString());
            mqttClient.end();
            process.exit();
        });
    });
}).end(null);