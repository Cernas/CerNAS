var dgram = require('dgram');

function sendAndReceive(params, receiveCallback, recvTimeoutCallback) {
    // Create dgram socket
    var socket = dgram.createSocket('udp4');
    // Counter of receive messages
    var recvCounter = 0;
    // Data receive timer elapsed function
    function recvTimeout(ipAddress) {
        recvTimeoutCallback(ipAddress);
        // Close if all messages process
        recvCounter++;
        if (recvCounter >= params.destinations.length) {
            // Client close
            if (socket.fd !== null) {
                socket.close();
                params.logger.log('UDP: Listenning on port ' + params.port + ' has been stopped');
            }
        }
    }
    // Start listening response
    socket.on('listening', function () {
        params.logger.log('UDP: Listenning on port ' + params.port + '...');

        // Send GetDuty request
        for (var i = 0; i < params.destinations.length; i++) {
            socket.send(Buffer.from(JSON.stringify(params.msg)), params.port, params.destinations[i].ipAddress);
            // Start data receive timer
            params.destinations[i].timer = setTimeout(recvTimeout, params.recvTimeoutMs, params.destinations[i].ipAddress);
        }
    });
    // Message received callback
    socket.on('message', function (msg, remote) {
        // Stop data receive timer
        for (var i = 0; i < params.destinations.length; i++) {
            if (params.destinations[i].ipAddress === remote.address) {
                if (params.destinations[i].timer._idleTimeout !== -1) {
                    clearTimeout(params.destinations[i].timer);
                    params.logger.log('UDP: Received message: ' + msg + ' from ' + remote.address + ':' + remote.port);
                }

                break;
            }
        }
        // Submit received message
        try {
            receiveCallback(JSON.parse(msg.toString()), remote.address);
        } catch (ex) {
            params.logger.error('UDP: Received invalid message: ' + msg + ' from ' + remote.address + ':' + remote.port);
        }

        // Close if all messages process
        recvCounter++;
        if (recvCounter >= params.destinations.length) {
            // Client close
            if (socket.fd !== null) {
                socket.close();
                params.logger.log('UDP: Listenning on port ' + params.port + ' has been stopped');
            }
        }
    });

    // Error callback
    socket.on('error', function (err) {
        params.logger.log('UDP: SendAndReceive dgram socket on port ' + params.port + ' error: ' + err);
    });
    // Bind on device port
    socket.bind(params.port);
}

function send(params) {
    // Create dgram socket
    var socket = dgram.createSocket('udp4');
    // Send message
    socket.send(Buffer.from(JSON.stringify(params.msg)), params.port, params.ipAddress, (err) => {
        // Client close
        socket.close();
    });
}

module.exports = {
    sendAndReceive,
    send
};