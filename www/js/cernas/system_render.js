(function ($) {
    // Server IP address
    const IP_ADDRESS = '192.168.0.131';
    // Phone resolution limit
    const PHONE_RESOLUTION = 800;

    // Set desktop layout
    if (screen.width > PHONE_RESOLUTION) {
        document.getElementById('table-repository').style.width = '31%';
        document.getElementById('table-backup').style.width = '31%';
        document.getElementById('table-root').style.width = '31%';
        document.getElementById('table-services').style.width = '31%';
    }

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
            // Set repository drive label
            var div_labelDriveRepository = document.getElementById('label-drive-repository');
            div_labelDriveRepository.innerHTML = 'Volné místo: ' + response.status.repository.available + ' z ' + response.status.repository.size;
            // Render repository progress bar
            $("#progress-repository").circliful({
                percent: response.status.repository.percent,
                text: response.status.repository.used
            });
            // Set backup drive label
            var div_labelDriveBackup = document.getElementById('label-drive-backup');
            div_labelDriveBackup.innerHTML = 'Volné místo: ' + response.status.backup.available + ' z ' + response.status.backup.size;
            // Render backup progress bar
            $("#progress-backup").circliful({
                percent: response.status.backup.percent,
                text: response.status.backup.used
            });
            // Set root drive label
            var div_labelDriveRoot = document.getElementById('label-drive-root');
            div_labelDriveRoot.innerHTML = 'Volné místo: ' + response.status.root.available + ' z ' + response.status.root.size;
            // Render root progress bar
            $("#progress-root").circliful({
                percent: response.status.root.percent,
                text: response.status.root.used
            });

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