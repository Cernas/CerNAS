(function ($) {
    $.fn.renderLightening = function (lightening) {
        var tr_lightening = document.getElementById($(this).attr('id'));
        tr_lightening.innerHTML = '';

        var room = $(this).attr('id').replace('tr-lightening-', '');

        for (var i = 0; i < lightening.length; i++) {
            if (lightening[i].room === room) {
                var trHtml =
                        "<tr>" +
                        "<td class='light-device-name' style='width: 60%;'>" +
                        "<div style='margin-top: 10px;'>" + lightening[i].label + "</div>" +
                        "</td>" +
                        "<td style='width: 40%; vertical-align: bottom;'>" +
                        "<div id='switch-button-lightening-" + lightening[i].room + "-" + lightening[i].place + "' align='right' style='margin-top: 20px;'>" +
                        "<label class='switch'>" +
                        "<input id='button-lightening-" + lightening[i].room + "-" + lightening[i].place + "' type='checkbox' disabled>" +
                        "<div class='slider round'></div>" +
                        "</label>" +
                        "</div>" +
                        "<div id='alert-button-lightening-" + lightening[i].room + "-" + lightening[i].place + "' class='light-alert' style='display: none;'><span class='glyphicon glyphicon-alert'></span></div>" +
                        "</td>" +
                        "</tr>";

                // Detail for wifi_controller_rgb
                if (lightening[i].device === 'wifi_controller_rgb') {
                    trHtml += "<tr id='detail-lightening-" + lightening[i].room + "-" + lightening[i].place + "' style='display: none;'>" +
                            "<td colspan='2'>" +
                            "<div id='color-picker-lightening-" + lightening[i].room + "-" + lightening[i].place + "'></div>" +
                            "</td>" +
                            "</tr>";
                    tr_lightening.innerHTML += trHtml;
                    // Create color picker object
                    var colorPicker = new iro.ColorPicker('#color-picker-lightening-' + lightening[i].room + '-' + lightening[i].place, {
                        width: 310,
                        height: 310,
                        markerRadius: 8,
                        padding: 4,
                        sliderMargin: 24,
                        color: 'rgb(' + lightening[i].settings.defaultColor.r + ', ' + lightening[i].settings.defaultColor.g + ', ' + lightening[i].settings.defaultColor.b + ')'
                    });
                    lightening[i].colorPicker = colorPicker;
                } else {
                    tr_lightening.innerHTML += trHtml;
                }
            }
        }
    };

    $.fn.initLightening = function (msg, devices, setDeviceCallback) {
        switch (msg.device) {
            case 'wifi_controller_rgb':
                if (msg.action === 'error') {
                    // Show device error
                    showDeviceOffline(msg);
                } else {
                    // Register color changed listener for msg device 
                    colorPickerWatch(devices, msg, function (colorMsg) {
                        // Send new color to device
                        setDeviceCallback(colorMsg);
                    });
                    // Register button click listener for msg device
                    buttonClick(devices, msg, function (msgClick) {
                        setDeviceCallback(msgClick);
                    });
                    // SetHMI by current device state
                    setControllerState(msg);
                }
                break;
            case 'wifi_switch_sonofftouch_relay':
                if (msg.action === 'error') {
                    // Show device error
                    showDeviceOffline(msg);
                } else {
                    // Init inputs listeners
                    buttonClick(devices, msg, function (msgClick) {
                        setDeviceCallback(msgClick);
                    });
                    // SetHMI by current device state
                    setSwitchState(msg);
                }
                break;
        }
    };

    $.fn.setHmiLightening = function (msg) {
        switch (msg.device) {
            case 'wifi_controller_rgb':
                // SetHMI by current device state
                setControllerState(msg);
                break;
            case 'wifi_switch_sonofftouch_relay':
                // SetHMI by current device state
                setSwitchState(msg);
                break;
        }
    };

    var buttonClick = function (lightening, msg, buttonClickCallback) {
        for (var i = 0; i < lightening.length; i++) {
            if (lightening[i].room === msg.room && lightening[i].place === msg.place) {
                $('#button-lightening-' + lightening[i].room + '-' + lightening[i].place).prop('disabled', false);
                $('#button-lightening-' + lightening[i].room + '-' + lightening[i].place).click(function () {
                    switch (lightening[i].device) {
                        case 'wifi_controller_rgb':
                            if ($(this).is(':checked')) {
                                // Turn on
                                buttonClickCallback({
                                    deviceGroup: 'lightening',
                                    device: lightening[i].device,
                                    room: lightening[i].room,
                                    place: lightening[i].place,
                                    action: 'turnOn',
                                    settings: {
                                        color: lightening[i].settings.defaultColor
                                    }
                                });
                            } else {
                                buttonClickCallback({
                                    deviceGroup: 'lightening',
                                    device: lightening[i].device,
                                    room: lightening[i].room,
                                    place: lightening[i].place,
                                    action: 'turnOff',
                                    settings: {
                                        color: {
                                            r: 0,
                                            g: 0,
                                            b: 0
                                        }
                                    }
                                });
                            }
                            break;
                        case 'wifi_switch_sonofftouch_relay':
                            if ($(this).is(':checked')) {
                                // Turn on
                                buttonClickCallback({
                                    deviceGroup: 'lightening',
                                    device: lightening[i].device,
                                    room: lightening[i].room,
                                    place: lightening[i].place,
                                    action: 'turnOn'
                                });
                            } else {
                                buttonClickCallback({
                                    deviceGroup: 'lightening',
                                    device: lightening[i].device,
                                    room: lightening[i].room,
                                    place: lightening[i].place,
                                    action: 'turnOff'
                                });
                            }
                            break;
                    }
                });
                break;
            }
        }
    };

    var colorPickerWatch = function (lightening, msg, colorChangedCallback) {
        for (var i = 0; i < lightening.length; i++) {
            if (lightening[i].room === msg.room && lightening[i].place === msg.place) {
                var init = false;   // filter first color change
                lightening[i].colorPicker.watch(function (color) {
                    if (init) {
                        var action;
                        if (color.rgbString === 'rgb(0, 0, 0)')
                            action = 'turnOff';
                        else
                            action = 'setColor';

                        colorChangedCallback({
                            deviceGroup: 'lightening',
                            device: lightening[i].device,
                            room: lightening[i].room,
                            place: lightening[i].place,
                            action: action,
                            settings: {
                                color: color.rgb
                            }
                        });
                    }
                    init = true;
                });
                break;
            }
        }
    };

    var setSwitchState = function (msg) {
        switch (msg.action) {
            case 'turnOn':
                $('#button-lightening-' + msg.room + '-' + msg.place).prop('checked', true);
                break;
            case 'turnOff':
                $('#button-lightening-' + msg.room + '-' + msg.place).prop('checked', false);
                break;
            case 'connected':
                showDeviceOnline(msg);
                break;
            case 'error':
                showDeviceOffline(msg);
                break;
        }
    };

    var setControllerState = function (msg) {
        switch (msg.action) {
            case 'turnOn':
                $('#button-lightening-' + msg.room + '-' + msg.place).prop('checked', true);
                $('#detail-lightening-' + msg.room + '-' + msg.place).show('fast');
                break;
            case 'turnOff':
                $('#button-lightening-' + msg.room + '-' + msg.place).prop('checked', false);
                $('#detail-lightening-' + msg.room + '-' + msg.place).hide('fast');
                break;
            case 'connected':
                showDeviceOnline(msg);
                $('#detail-lightening-' + msg.room + '-' + msg.place).hide('fast');
                break;
            case 'error':
                showDeviceOffline(msg);
                $('#detail-lightening-' + msg.room + '-' + msg.place).hide('fast');
                break;
        }
    };

    var showDeviceOffline = function (msg) {
        $('#switch-button-lightening-' + msg.room + '-' + msg.place).hide();
        $('#alert-button-lightening-' + msg.room + '-' + msg.place).show();
    };

    var showDeviceOnline = function (msg) {
        $('#button-lightening-' + msg.room + '-' + msg.place).prop('checked', false);
        $('#switch-button-lightening-' + msg.room + '-' + msg.place).show();
        $('#alert-button-lightening-' + msg.room + '-' + msg.place).hide();
    };
})(jQuery);