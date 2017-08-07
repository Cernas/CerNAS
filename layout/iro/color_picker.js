(function ($) {
    const IP_ADDRESS = '10.0.0.5';
    const PORT = 8081;

    var colorPicker = new iro.ColorPicker('#color-picker', {
        // Canvas dimensions:
        width: 320,
        height: 320,
        // Radius of the markers that show the current color:
        markerRadius: 8,
        // Padding space around the markers:
        padding: 4,
        // Space between the hue/saturation ring and the value slider:
        sliderMargin: 24,
        // Initial color value -- any hex, rgb or hsl color string works:
        color: "#fff",
        // CSS rules to update as the selected color changes
        css: {
            "body": {
                "background-color": "rgb"
            },
            "input, button": {
                "border-color": "rgb",
                "color": "rgb"
            }
        }
    });

    var socket = io('http://' + IP_ADDRESS + ':' + PORT);

    /*socket.on('', function (msg) {
        console.log(msg);
    });*/

    colorPicker.watch(function (color) {
        //console.log(color.rgbString);
        socket.emit('colorChanged', color.rgbString);
    });
})(jQuery);