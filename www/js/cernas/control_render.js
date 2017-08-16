(function ($) {
// Server ip address
    const IP_ADDRESS = '192.168.0.131';
    // Port of control app
    const PORT = 8081;
    // Phone resolution limit
    const PHONE_RESOLUTION = 800;

    $.ajax({
        url: 'http://' + IP_ADDRESS + '/api/v1/device-render',
        type: 'GET',
        success: function (control) {
            // Set desktop layout
            for (var i = 0; i < control.rooms.length; i++) {
                if (screen.width > PHONE_RESOLUTION) {
                    document.getElementById('table-' + control.rooms[i].name).style.width = '29%';
                }
            }

            // Render lightening table for all rooms
            for (var i = 0; i < control.lightening.rooms.length; i++) {
                // Render lightening table for room[i]
                $('#tr-lightening-' + control.lightening.rooms[i].name).renderLightening(control.lightening.devices);
            }
            for (var i = 0; i < control.sensor.rooms.length; i++) {
                // Render sensors table for room[i]
                $('#sensor-' + control.sensor.rooms[i].name).renderSensor(control.sensor.devices);
            }
            // TODO: Render table for any other device groups...

            // Socket.IO connection
            var socket = io('http://' + IP_ADDRESS + ':' + PORT);
            // Receive initHMI messages from control app
            socket.on('initHMI', function (msg) {
                console.log(msg);

                switch (msg.deviceGroup) {
                    case 'lightening':
                        $().initLightening(msg, control.lightening.devices, function (msgDevice) {
                            socket.emit('setDevice', msgDevice);
                        });
                        break;

                    case 'sensor':
                        $().sensorShowValue(msg);
                        break;

                        // TODO: Init HMI for any other device groups
                }
            });
            // Receive setHMI messages from control app
            socket.on('setHMI', function (msg) {
                console.log(msg);

                switch (msg.deviceGroup) {
                    case 'lightening':
                        $().setHmiLightening(msg);
                        break;

                    case 'sensor':
                        $().sensorShowValue(msg);
                        break;

                        // TODO: Set HMI for any other device groups
                }
            });
        }
    });
})(jQuery);