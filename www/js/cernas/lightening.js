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
                        "<div align='right' style='margin-top: 20px;'>" +
                        "<label class='switch'>" +
                        "<input id='button-lightening-" + lightening[i].room + "-" + lightening[i].place + "' type='checkbox' disabled>" +
                        "<div class='slider round'></div>" +
                        "</label>" +
                        "</div>" +
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
        // Init HMI for wifi_controller_rgb device
        if (msg.device === 'wifi_controller_rgb') {
            // Init inputs listeners
            if (msg.action !== 'error') {
                // Register color changed listener for msg device 
                colorPickerWatch(devices, msg, function (colorMsg) {
                    // Send new color to device
                    setDeviceCallback(colorMsg);
                });
                // Register button click listener for msg device
                buttonClick(devices, msg, function (clickMsg) {
                    setDeviceCallback(clickMsg);
                });
            }
            // SetHMI by current device state
            if (msg.action === 'turnOn') {
                // Show color picker detail
                colorPickerDetail(msg, true);
            } else if (msg.action === 'turnOff') {
                // Hide color picker detail
                colorPickerDetail(msg, false);
            } else if (msg.action === 'error') {
                // Show error                
                toastr.error(getNameByLocation(devices, msg), 'Chyba Wifi RGB!', {
                    closeButton: true
                });
            }
        }
    };

    $.fn.setHmiLightening = function (msg) {
        if (msg.device === 'wifi_controller_rgb') {
            // SetHMI by current device state
            if (msg.action === 'turnOn') {
                // Show color picker detail
                colorPickerDetail(msg, true);
            } else if (msg.action === 'turnOff') {
                // Hide color picker detail
                colorPickerDetail(msg, false);
            }
        }
    };

    var buttonClick = function (lightening, msg, buttonClickCallback) {
        for (var i = 0; i < lightening.length; i++) {
            if (lightening[i].room === msg.room && lightening[i].place === msg.place) {
                $('#button-lightening-' + lightening[i].room + '-' + lightening[i].place).prop('disabled', false);
                $('#button-lightening-' + lightening[i].room + '-' + lightening[i].place).click(function () {
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
                        // Show color picker
                        $('#detail-lightening-' + lightening[i].room + '-' + lightening[i].place).show('fast');
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
                        // Hide color picker
                        $('#detail-lightening-' + lightening[i].room + '-' + lightening[i].place).hide('fast');
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

    var colorPickerDetail = function (msg, visible) {
        if (visible) {
            $('#button-lightening-' + msg.room + '-' + msg.place).prop('checked', true);
            $('#detail-lightening-' + msg.room + '-' + msg.place).show('fast');
        } else {
            $('#button-lightening-' + msg.room + '-' + msg.place).prop('checked', false);
            $('#detail-lightening-' + msg.room + '-' + msg.place).hide('fast');
        }
    };

    var getNameByLocation = function (lightening, msg) {
        for (var i = 0; i < lightening.length; i++) {
            if (lightening[i].room === msg.room && lightening[i].place === msg.place) {
                return lightening[i].label;
                break;
            }
        }
    };
})(jQuery);