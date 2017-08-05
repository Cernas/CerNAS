(function ($) {
    // Server IP address
    const IP_ADDRESS = '192.168.1.10';
    // Phone resolution limit
    const PHONE_RESOLUTION = 800;

    // List of backup directories
    var directories = [];

    // Remove directory click callback function
    var directoryRemClick = function () {
        var id = parseInt($(this).attr('id').replace('tr-directories', ''));

        $.ajax({
            url: 'http://' + IP_ADDRESS + '/api/v1/backup/remove',
            type: 'DELETE',
            data: {
                id: id
            },
            success: function (remResp) {
                if (remResp.status === 'success') {
                    // Remove directory from list
                    for (var i = 0; i < directories.length; i++) {
                        if (directories[i].id === id)
                            directories.splice(i, 1);
                    }
                    // Refresh
                    $($('#tr-directories').directories(directories)).click(directoryRemClick);
                } else {
                    toastr.error('Cestu se nepodařilo smazat.', 'Chyba!', {
                        closeButton: true
                    });
                }
            }
        });
    };
    // Get backups status
    $.ajax({
        url: 'http://' + IP_ADDRESS + '/api/v1/backup/status',
        type: 'GET',
        success: function (response) {
            if (response.status.backups.length > 0) {
                if (screen.width < PHONE_RESOLUTION) {
                    $('#tr-backups').backups(response.status.backups, true);
                    document.getElementById('th-started-at').style.display = 'none';
                    document.getElementById('th-time').style.display = 'none';
                } else {
                    $('#tr-backups').backups(response.status.backups, false);
                }
            } else {
                toastr.error('Neznámý stav zálohování.', 'Chyba!', {
                    closeButton: true
                });
            }

            // Set progress bar value
            var progress = document.getElementById('progress');
            progress.style.width = response.status.drive.percent + '%';
            // Set progress bar text
            var td_available = document.getElementById('td-available');
            td_available.innerHTML = 'Volné místo: ' + response.status.drive.available + ' z ' + response.status.drive.size;
            // Set drive info text
            var div_info = document.getElementById('div-info');
            if (screen.width < PHONE_RESOLUTION) {
                if (response.status.drive.percent < 10) {
                    div_info.innerHTML = 'Využité místo: ' + response.status.drive.used + ' ' + response.status.drive.percent + ' %';
                } else if (response.status.drive.percent >= 10 && response.status.drive.percent < 55) {
                    div_info.innerHTML = 'Využité místo: ' + response.status.drive.used;
                    progress.innerHTML = response.status.drive.percent + ' %';
                } else {
                    progress.innerHTML = 'Využité místo: ' + response.status.drive.used + ' ' + response.status.drive.percent + ' %';
                }
            } else {
                if (response.status.drive.percent < 3) {
                    div_info.innerHTML = 'Využité místo: ' + response.status.drive.used + ' ' + response.status.drive.percent + ' %';
                } else if (response.status.drive.percent >= 3 && response.status.drive.percent < 20) {
                    div_info.innerHTML = 'Využité místo: ' + response.status.drive.used;
                    progress.innerHTML = response.status.drive.percent + ' %';
                } else {
                    progress.innerHTML = 'Využité místo: ' + response.status.drive.used + ' ' + response.status.drive.percent + ' %';
                }
            }

            // Copy current list of backup directories
            for (var i = 0; i < response.status.directories.length; i++)
                directories.push(response.status.directories[i]);
            
            // Refresh
            $($('#tr-directories').directories(directories)).click(directoryRemClick);

            // Add directory button click listener
            $('#button-add').click(function () {
                var path = document.getElementById('input-path').value;
                if (path !== '') {
                    document.getElementById('input-path').value = '';

                    $.ajax({
                        url: 'http://' + IP_ADDRESS + '/api/v1/backup/add',
                        type: 'POST',
                        data: {
                            path: path
                        },
                        success: function (respAdd) {
                            if (respAdd.status === 'success') {
                                // Add new backup directory to list
                                directories.push({
                                    id: respAdd.id,
                                    path: path
                                });
                                // Refresh
                                $($('#tr-directories').directories(directories)).click(directoryRemClick);
                            } else {
                                toastr.error('Cestu se nepodařilo přidat.', 'Chyba!', {
                                    closeButton: true
                                });
                            }
                        }
                    });
                } else {
                    toastr.error('Musíte zadat cestu.', 'Chyba!', {
                        closeButton: true
                    });
                }
            });
        }
    });
})(jQuery);