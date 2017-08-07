(function ($) {
    const IP_ADDRESS = '192.168.1.154';
    const PORT = 8081;

    var colorPickerBedroomBed = new iro.ColorPicker('#color-picker-bedroom-bed', {
        // Canvas dimensions:
        width: 310,
        height: 310,
        // Radius of the markers that show the current color:
        markerRadius: 8,
        // Padding space around the markers:
        padding: 4,
        // Space between the hue/saturation ring and the value slider:
        sliderMargin: 24,
        // Initial color value -- any hex, rgb or hsl color string works:
        color: '#ffffff'
    });

    var socket = io('http://' + IP_ADDRESS + ':' + PORT);
    // Receive messages from control app
    socket.on('setHMI', function (msg) {
        console.log(msg);

        // Color changed listener 
        colorPickerBedroomBed.watch(function (color) {
            var action;
            if (color.rgbString === 'rgb(0, 0, 0)')
                action = 'turnOff';
            else
                action = 'setColor';

            socket.emit('setDevice', {
                device: 'wifi_rgb',
                room: 'bedroom',
                place: 'bed',
                action: action,
                params: {
                    color: color.rgb
                }
            });
        });

        if (msg.action === 'turnOn') {
            // Set button to checked
            $('#button-bedroom-bed').prop('checked', true);
            // Show color picker
            $('#detail-bedroom-bed').show('fast');
        } else {
            // Set button to unchecked
            $('#button-bedroom-bed').prop('checked', false);
            // Hide color picker
            $('#detail-bedroom-bed').hide('fast');
        }
    });

    // bedroom bed button click listener
    $('#button-bedroom-bed').click(function () {
        if ($(this).is(':checked')) {
            // Turn on with default color
            socket.emit('setDevice', {
                device: 'wifi_rgb',
                room: 'bedroom',
                place: 'bed',
                action: 'turnOn',
                params: {
                    color: {
                        r: 255,
                        g: 255,
                        b: 255
                    }
                }
            });

            // Show color picker
            $('#detail-bedroom-bed').show('fast');
        } else {
            // Turn off
            socket.emit('setDevice', {
                device: 'wifi_rgb',
                room: 'bedroom',
                place: 'bed',
                action: 'turnOff',
                params: {
                    color: {
                        r: 0,
                        g: 0,
                        b: 0
                    }
                }
            });

            // Hide color picker
            $('#detail-bedroom-bed').hide('fast');
        }
    });
})(jQuery);