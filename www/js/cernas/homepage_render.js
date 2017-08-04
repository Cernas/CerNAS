(function ($) {
    // Server IP address
    const IP_ADDRESS = '192.168.0.140';
    // Phone resolution limit
    const PHONE_RESOLUTION = 800;

    // List of services
    var services = [];

    // Service switch button click callback function
    var serviceSwitchClick = function () {
        var name = $(this).attr('id').replace('tr-services', '');
        // Set command
        var command;
        for (var i = 0; i < services.length; i++) {
            if (services[i].name === name) {
                if (services[i].running === true)
                    command = 'stop';
                else
                    command = 'start';
            }
        }

        // Set service status
        $.ajax({
            url: 'http://' + IP_ADDRESS + '/api/v1/system/service-command',
            type: 'PUT',
            data: {
                name: name,
                command: command
            },
            success: function (respCmd) {
                if (respCmd.status === 'success') {
                    for (var i = 0; i < services.length; i++) {
                        if (services[i].name === name) {
                            if (command === 'start')
                                services[i].running = true;
                            else
                                services[i].running = false;
                        }
                    }
                    // Refresh
                    $($('#tr-services').services(services)).click(serviceSwitchClick);
                } else {
                    toastr.error(command + ' služby ' + name + ' se nezdařil', 'Chyba!', {
                        closeButton: true
                    });
                }
            }
        });
    };

    // Get current status of system
    $.ajax({
        url: 'http://' + IP_ADDRESS + '/api/v1/system/status',
        type: 'GET',
        success: function (response) {
            // Set progress bar value
            var progress = document.getElementById('progress');
            progress.style.width = response.status.repository.percent + '%';
            // Set progress bar text
            var td_available = document.getElementById('td-available');
            td_available.innerHTML = 'Volné místo: ' + response.status.repository.available + ' z ' + response.status.repository.size;
            // Set drive info text
            var div_info = document.getElementById('div-info');
            if (screen.width < PHONE_RESOLUTION) {
                if (response.status.repository.percent < 10) {
                    div_info.innerHTML = 'Využité místo: ' + response.status.repository.used + ' ' + response.status.repository.percent + ' %';
                } else if (response.status.repository.percent >= 10 && response.status.repository.percent < 55) {
                    div_info.innerHTML = 'Využité místo: ' + response.status.repository.used;
                    progress.innerHTML = response.status.repository.percent + ' %';
                } else {
                    progress.innerHTML = 'Využité místo: ' + response.status.repository.used + ' ' + response.status.repository.percent + ' %';
                }
            } else {
                if (response.status.repository.percent < 3) {
                    div_info.innerHTML = 'Využité místo: ' + response.status.repository.used + ' ' + response.status.repository.percent + ' %';
                } else if (response.status.repository.percent >= 3 && response.status.repository.percent < 20) {
                    div_info.innerHTML = 'Využité místo: ' + response.status.repository.used;
                    progress.innerHTML = response.status.repository.percent + ' %';
                } else {
                    progress.innerHTML = 'Využité místo: ' + response.status.repository.used + ' ' + response.status.repository.percent + ' %';
                }
            }

            // Render list of services 
            if (response.status.services.length > 0) {
                // Add services to list
                for (var i = 0; i < response.status.services.length; i++)
                    services.push(response.status.services[i]);
                // Refresh
                $($('#tr-services').services(services)).click(serviceSwitchClick);
            } else {
                toastr.error('Neznámý stav služeb.', 'Chyba!', {
                    closeButton: true
                });
            }
        }
    });
})(jQuery);