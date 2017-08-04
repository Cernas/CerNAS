(function ($) {
    $.fn.render = function (devices) {
        var tr_wifiRGB = document.getElementById($(this).attr('id'));
        tr_wifiRGB.innerHTML = '';

        var room = $(this).attr('id').replace('tr-lightening-', '');

        for (var i = 0; i < devices.length; i++) {
            if (devices[i].room === room) {
                var trHtml =
                        "<tr>" +
                        "<td class='light-device-name' style='width: 60%;'>" +
                        "<div style='margin-top: 10px;'>" + devices[i].name + "</div>" +
                        "</td>" +
                        "<td style='width: 40%; vertical-align: bottom;'>" +
                        "<div align='right' style='margin-top: 20px;'>" +
                        "<label class='switch'>" +
                        "<input id='button-" + devices[i].room + "-" + devices[i].place + "' type='checkbox' disabled>" +
                        "<div class='slider round'></div>" +
                        "</label>" +
                        "</div>" +
                        "</td>" +
                        "</tr>" +
                        "<tr id='detail-" + devices[i].room + "-" + devices[i].place + "' style='display: none;'>" +
                        "<td colspan='2'>" +
                        "<div id='color-picker-" + devices[i].room + "-" + devices[i].place + "'></div>" +
                        "</td>" +
                        "</tr>";
                tr_wifiRGB.innerHTML += trHtml;

                var colorPicker = new iro.ColorPicker('#color-picker-' + devices[i].room + '-' + devices[i].place, {
                    width: 310,
                    height: 310,
                    markerRadius: 8,
                    padding: 4,
                    sliderMargin: 24,
                    color: 'rgb(' + devices[i].params.defaultColor.r + ', ' + devices[i].params.defaultColor.g + ', ' + devices[i].params.defaultColor.b + ')'
                });
                devices[i].colorPicker = colorPicker;
            }
        }
    };

    $.fn.colorPickerWatch = function (devices, msg, colorChangedCallback) {
        for (var i = 0; i < devices.length; i++) {
            if (devices[i].room === msg.room && devices[i].place === msg.place) {
                var init = false;   // filter first color change
                devices[i].colorPicker.watch(function (color) {
                    if (init) {
                        var action;
                        if (color.rgbString === 'rgb(0, 0, 0)')
                            action = 'turnOff';
                        else
                            action = 'setColor';
                        colorChangedCallback({
                            device: 'wifi_rgb',
                            room: devices[i].room,
                            place: devices[i].place,
                            action: action,
                            params: {
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

    $.fn.colorPickerDetail = function (msg, visible) {
        if (visible) {
            $('#button-' + msg.room + '-' + msg.place).prop('checked', true);
            $('#detail-' + msg.room + '-' + msg.place).show('fast');
        } else {
            $('#button-' + msg.room + '-' + msg.place).prop('checked', false);
            $('#detail-' + msg.room + '-' + msg.place).hide('fast');
        }
    };

    $.fn.getNameByLocation = function (devices, msg) {
        for (var i = 0; i < devices.length; i++) {
            if (devices[i].room === msg.room && devices[i].place === msg.place) {
                return devices[i].name;
                break;
            }
        }
    };

    $.fn.buttonClick = function (devices, msg, buttonClickCallback) {
        for (var i = 0; i < devices.length; i++) {
            if (devices[i].room === msg.room && devices[i].place === msg.place) {
                $('#button-' + devices[i].room + '-' + devices[i].place).prop('disabled', false);
                $('#button-' + devices[i].room + '-' + devices[i].place).click(function () {
                    if ($(this).is(':checked')) {
                        // Turn on
                        buttonClickCallback({
                            device: 'wifi_rgb',
                            room: devices[i].room,
                            place: devices[i].place,
                            action: 'turnOn',
                            params: {
                                color: devices[i].params.defaultColor
                            }
                        });
                        // Show color picker
                        $('#detail-' + devices[i].room + '-' + devices[i].place).show('fast');
                    } else {
                        buttonClickCallback({
                            device: 'wifi_rgb',
                            room: devices[i].room,
                            place: devices[i].place,
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
                        $('#detail-' + devices[i].room + '-' + devices[i].place).hide('fast');
                    }
                });
                break;
            }
        }
    };
})(jQuery);