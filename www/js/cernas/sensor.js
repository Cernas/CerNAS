(function ($) {
    $.fn.renderSensor = function (sensor) {
        var label_sensor = document.getElementById($(this).attr('id'));
        label_sensor.innerHTML = '';
        var tr_sensor = document.getElementById('tr-' + $(this).attr('id'));
        tr_sensor.innerHTML = '';

        var room = $(this).attr('id').replace('sensor-', '');

        for (var i = 0; i < sensor.length; i++) {
            if (sensor[i].room === room) {
                if (sensor[i].device === 'ble_thermometer_ds18b20') {
                    var labelHtml = "<div id='label-temperature-" + sensor[i].room + "-" + sensor[i].place + "' class='temperature-label'>-- °C</div>" +
                            "<div id='alert-temperature-" + sensor[i].room + "-" + sensor[i].place + "' class='temperature-alert' style='display: none;'><span class='glyphicon glyphicon-alert'></span></div>";
                    label_sensor.innerHTML += labelHtml;

                    var trHtml =
                            "<tr>" +
                            "<td class='temperature-stats' style='width: 50%;' colspan='2'>" +
                            "<div id='label-temperature-" + sensor[i].room + "-" + sensor[i].place + "-min' style='margin-top: 10px;'>Min: -- °C</div>" +
                            "</td>" +
                            "<td class='temperature-stats' style='width: 50%;'>" +
                            "<div id='label-temperature-" + sensor[i].room + "-" + sensor[i].place + "-max' align='right' style='margin-top: 10px;'>Max: -- °C</div>" +
                            "</td>" +
                            "</tr>";
                    tr_sensor.innerHTML += trHtml;
                }
            }
        }
    };

    $.fn.sensorShowValue = function (device) {
        if (device.device === 'ble_thermometer_ds18b20') {
            if (device.connected && device.value !== 'error') {
                document.getElementById('label-temperature-' + device.room + '-' + device.place).innerHTML = device.value.temperature + ' °C';
                document.getElementById('label-temperature-' + device.room + '-' + device.place).style.display = null;
                document.getElementById('alert-temperature-' + device.room + '-' + device.place).style.display = 'none';
            } else {
                document.getElementById('alert-temperature-' + device.room + '-' + device.place).style.display = null;
                document.getElementById('label-temperature-' + device.room + '-' + device.place).style.display = 'none';
            }

            if ('minimum' in device.value && 'maximum' in device.value) {
                document.getElementById('label-temperature-' + device.room + '-' + device.place + '-min').innerHTML = 'Min: ' + device.value.minimum + ' °C';
                document.getElementById('label-temperature-' + device.room + '-' + device.place + '-max').innerHTML = 'Max: ' + device.value.maximum + ' °C';
            }
        }
    };
})(jQuery);