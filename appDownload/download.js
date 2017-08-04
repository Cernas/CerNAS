//* ****************************** Dependencies ********************************
var propertiesReader = require('properties-reader');
var configs = propertiesReader('./config.ini');
var fs = require('fs');
var amqp = require('amqplib');
var spawn = require('child_process').spawn;
var dwlInfo = require('./cernas/download_info');
var dwlApi = require('./cernas/download_api');
var Logger = require('./cernas/logger');

//* *************************** Read config params *****************************
const APP_PORT = parseInt(configs.get('app.port'));   // app port
const APP_LOG_PATH = configs.get('app.log_path');   // path to app log file
const APP_LOG_NAME = configs.get('app.log_name');   // name of app log file
const DOWNLOAD_LOG_PATH = configs.get('download.log_path');     // path to download log file
const RABBITMQ_HOST = configs.get('rabbit_mq.host');    // rabbit mq host
const RABBITMQ_USER = configs.get('rabbit_mq.user');    // rabbit mq username
const RABBITMQ_PASSWORD = configs.get('rabbit_mq.password');    // rabbit mq password

var io = require('socket.io')(APP_PORT);

//* ***************************** Global variables *****************************
// logger object
var logger = new Logger('./' + APP_LOG_PATH + '/' + APP_LOG_NAME, './' + APP_LOG_PATH + '/' + APP_LOG_NAME);
// socket.io clients
var clients = [];
// download status
var status = {
    filename: '',
    started_at: '',
    speed: '',
    percent: 0,
    total_size: '',
    current_size: ''
};

//* ******************************* Socket.IO **********************************
function clientsEmit(thread, msg) {
    for (var i = 0; i < clients.length; i++) {
        clients[i].emit(thread, msg);
    }
}

io.on('connection', function (socket) {
    clients.push(socket);
    logger.log('Client ID: ' + socket.id + ' connected, number of clients: ' + clients.length);

    // client disconnected
    socket.on('disconnect', function () {
        clients.splice(clients.indexOf(socket), 1);
        logger.log('Client ID: ' + socket.id + ' disconnected, number of clients: ' + clients.length);
    });
});
  
//* ****************************** RabbitMQ ******************************
amqp.connect('amqp://' + RABBITMQ_USER + ':' + RABBITMQ_PASSWORD + '@' + RABBITMQ_HOST).then(function (conn) {
    logger.log('RabbitMQ client has been connected');

    process.once('SIGINT', function () {
        conn.close();
        logger.log('RabbitMQ client has been closed');
    });

    return conn.createChannel().then(function (ch) {
        logger.log('RabbitMQ channel has been created');

        var ok = ch.assertQueue('download', {durable: true});
        ok = ok.then(function () {
            // proccess one message without ack
            ch.prefetch(1);
            return ch.consume('download', onMessage);
        });

        return ok.then(function () {
            logger.log('RabbitMQ consumer waiting for messages...');
        });

        function onMessage(msg) {
            logger.log('RabbitMQ consumer received: ' + msg.content.toString());

            // download params
            var msgJson = JSON.parse(msg.content.toString());

            // download is exist?
            dwlApi.isExist(msgJson.id, function (isExistResult) {
                isExistResult = JSON.parse(isExistResult.toString());

                if (isExistResult.exist === true) {
                    logger.log('Download id ' + msgJson.id + ' is exist');
                    logger.log('Update download id ' + msgJson.id + ' status to running');
                    dwlApi.updateStatus({
                        id: msgJson.id,
                        status: 'running'
                    }, function (updateStatusResult) {
                        updateStatusResult = JSON.parse(updateStatusResult.toString());
                        if (updateStatusResult.status === 'success') {
                            logger.log('Download id ' + msgJson.id + ' status has been updated');

                            // send message download started
                            clientsEmit('started', {
                                id: msgJson.id
                            });

                            // set static download params
                            status.filename = msgJson.filename;
                            status.started_at = updateStatusResult.current_time;

                            // start time measuring
                            var start = new Date().getTime();

                            // start wget child proccess
                            var wget = spawn('wget', [msgJson.url, '-P', msgJson.destination]);

                            // Wget proccess output callback :-)
                            var buffer = '';
                            wget.stderr.on('data', (data) => {
                                var output = data.toString();
                                buffer += output;
                                if (buffer.indexOf('\n') > -1) {
                                    var line = buffer.substr(0, buffer.indexOf('\n'));
                                    fs.appendFile(DOWNLOAD_LOG_PATH + 'download_' + msgJson.id + '.log', line + '\n');

                                    // get and set dynamic download params
                                    dwlInfo.getCurrentInfo(status, line);
                                    // send current download status to clients browsers
                                    clientsEmit('status', status);

                                    buffer = buffer.substring(buffer.indexOf('\n') + 1, buffer.lenght);
                                }
                            });

                            // Wget proccess close callback
                            wget.on('close', (code) => {
                                // stop time measuring
                                var time = dwlInfo.timeConvert(parseInt((new Date().getTime() - start) / 1000));
                                var size = status.total_size;

                                if (code === 0 && status.percent === 100) {
                                    // update download status to 'completed'
                                    logger.log('Update download id ' + msgJson.id + ' status to completed');
                                    dwlApi.updateStatus({
                                        id: msgJson.id,
                                        status: 'completed',
                                        size: size,
                                        time: time
                                    }, function (updateStatusResult) {
                                        updateStatusResult = JSON.parse(updateStatusResult.toString());
                                        if (updateStatusResult.status === 'success')
                                            logger.log('Download id ' + msgJson.id + ' status has been updated');
                                        else
                                            logger.error('Download id ' + msgJson.id + ' status update failed', code);

                                        // send message download finished (completed)
                                        clientsEmit('finished', {
                                            status: 'completed',
                                            id: msgJson.id,
                                            filename: msgJson.filename,
                                            destination: msgJson.destination,
                                            finished_at: updateStatusResult.current_time,
                                            size: size,
                                            time: time
                                        });
                                    });
                                } else {
                                    // update download status to 'failed'
                                    logger.log('Update download id ' + msgJson.id + ' status to failed');
                                    dwlApi.updateStatus({
                                        id: msgJson.id,
                                        status: 'failed'
                                    }, function (updateStatusResult) {
                                        updateStatusResult = JSON.parse(updateStatusResult.toString());
                                        if (updateStatusResult.status === 'success')
                                            logger.log('Download id ' + msgJson.id + ' status has been updated');
                                        else
                                            logger.error('Download id ' + msgJson.id + ' status update failed', code);

                                        // send message download finished (failed)
                                        clientsEmit('finished', {
                                            status: 'failed',
                                            id: msgJson.id,
                                            filename: msgJson.filename,
                                            destination: msgJson.destination,
                                            finished_at: updateStatusResult.current_time
                                        });
                                    });
                                }
                                // download message ack
                                ch.ack(msg);
                            });
                        } else {
                            logger.error('Download id ' + msgJson.id + ' status update failed');
                            // download message ack
                            ch.ack(msg);
                        }
                    });
                } else {
                    logger.log('Download id ' + msgJson.id + ' is not exist');
                    // download message ack
                    ch.ack(msg);
                }
            });
        }
    });
}).catch(function (ex) {
    // log exteption
    logger.error(ex);
    // exit proccess
    process.exit();
});