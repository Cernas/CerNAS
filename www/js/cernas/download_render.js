(function ($) {
    // Server IP address
    const IP_ADDRESS = '192.168.1.10';
    // Consumer socket.io server port
    const PORT = 8080;

    // Get DOM elements
    var table_downloading = document.getElementById('table-downloading');
    var table_waiting = document.getElementById('table-waiting');
    var table_downloaded = document.getElementById('table-downloaded');
    var td_filename = document.getElementById('td-filename');
    var td_started_at = document.getElementById('td-started-at');
    var td_info = document.getElementById('td-info');
    var progress = document.getElementById('progress');

    // List of waiting downloads
    var waiting = [];
    // List of downloaded
    var downloaded = [];

    // Is device phone?
    var phone = false;
    if (screen.width < 800)
        phone = true;

    // Remove waiting download callback
    var waitingRemClick = function () {
        var id = parseInt($(this).attr('id').replace('tr-waiting', ''));

        $.ajax({
            url: 'http://' + IP_ADDRESS + '/api/v1/download/delete',
            type: 'DELETE',
            data: {
                id: id
            },
            success: function (respDelete) {
                if (respDelete.status === 'success') {
                    for (var i = 0; i < waiting.length; i++) {
                        if (waiting[i].id === id)
                            waiting.splice(i, 1);
                    }
                } else {
                    toastr.error('Stahování se nepodařilo smazat.', 'Chyba!', {
                        closeButton: true
                    });
                }

                // Refresh
                if (waiting.length > 0) {
                    table_waiting.style.display = null;
                    $($('#tr-waiting').waiting(waiting, phone)).click(waitingRemClick);
                } else {
                    table_waiting.style.display = 'none';
                }
            }
        });
    };

    var downloadedHiddClick = function () {
        var id = parseInt($(this).attr('id').replace('tr-downloaded', ''));

        $.ajax({
            url: 'http://' + IP_ADDRESS + '/api/v1/download/set-hidden',
            type: 'PUT',
            data: {
                id: id
            },
            success: function (respHidd) {
                if (respHidd.status === 'success') {
                    for (var i = 0; i < downloaded.length; i++) {
                        if (downloaded[i].id === id)
                            downloaded.splice(i, 1);
                    }
                } else {
                    toastr.error('Stahování se nepodařilo skrýt.', 'Chyba!', {
                        closeButton: true
                    });
                }

                // Refresh
                if (downloaded.length > 0) {
                    table_downloaded.style.display = null;
                    $($('#tr-downloaded').downloaded(downloaded, phone)).click(downloadedHiddClick);
                } else {
                    table_downloaded.style.display = 'none';
                }
            }
        });
    };

    // Get current lists of downloads            
    $.ajax({
        url: 'http://' + IP_ADDRESS + '/api/v1/download/list',
        type: 'GET',
        success: function (respList) {
            // waiting downloads
            for (var i = 0; i < respList.downloads.length; i++) {
                if (respList.downloads[i].status === 'waiting')
                    waiting.push(respList.downloads[i]);
            }
            // Refresh
            if (waiting.length > 0) {
                table_waiting.style.display = null;
                $($('#tr-waiting').waiting(waiting, phone)).click(waitingRemClick);
            } else {
                table_waiting.style.display = 'none';
            }

            // downloaded
            for (var i = 0; i < respList.downloads.length; i++) {
                if (respList.downloads[i].status === 'completed') {
                    downloaded.push(respList.downloads[i]);
                } else if (respList.downloads[i].status === 'failed') {
                    downloaded.push(respList.downloads[i]);
                }
            }
            // Refresh
            if (downloaded.length > 0) {
                table_downloaded.style.display = null;
                $($('#tr-downloaded').downloaded(downloaded, phone)).click(downloadedHiddClick);
            } else {
                table_downloaded.style.display = 'none';
            }
        }
    });

    // Create socket.io client
    var socket = io('http://' + IP_ADDRESS + ':' + PORT);
    // Receive start of download
    socket.on('started', function (data) {
        console.log(data);
        // Remove first download from list of waiting downloads
        waiting.splice(0, 1);
        // Refresh
        if (waiting.length > 0) {
            table_waiting.style.display = null;
            $($('#tr-waiting').waiting(waiting, phone)).click(waitingRemClick);
        } else {
            table_waiting.style.display = 'none';
        }
    });
    // Receive status change of download
    socket.on('status', function (data) {
        console.log(data);
        // Update download info params
        table_downloading.style.display = null;

        if (phone && data.filename.length > 35)
            td_filename.innerHTML = data.filename.substring(0, 34) + '...';
        else
            td_filename.innerHTML = data.filename;

        td_started_at.innerHTML = 'Spuštěno: ' + data.started_at;

        if (phone) {
            if (data.percent < 15) {
                td_info.innerHTML = data.current_size + ' z ' + data.total_size + ' ' + data.percent + ' %';
                progress.innerHTML = null;
            } else {
                td_info.innerHTML = data.current_size + ' z ' + data.total_size;
                progress.innerHTML = data.percent + ' %';
            }
        } else {
            if (data.percent < 5) {
                td_info.innerHTML = data.current_size + ' z ' + data.total_size + ' ' + data.percent + ' %';
                progress.innerHTML = null;
            } else {
                td_info.innerHTML = data.current_size + ' z ' + data.total_size;
                progress.innerHTML = data.percent + ' %';
            }
        }

        progress.style.width = data.percent + '%';
    });
    // Receive end of download
    socket.on('finished', function (data) {
        console.log(data);
        // Reset and hide downloading
        table_downloading.style.display = 'none';
        data.percent = 0;
        progress.style.width = data.percent + '%';
        progress.innerHTML = data.percent + ' %';
        // Add new download to list of downloaded
        downloaded.push({
            status: data.status,
            id: data.id,
            filename: data.filename,
            destination: data.destination,
            finished_at: data.finished_at,
            size: data.size,
            time: data.time
        });
        // Refresh
        if (downloaded.length > 0) {
            table_downloaded.style.display = null;
            $($('#tr-downloaded').downloaded(downloaded, phone)).click(downloadedHiddClick);
        } else {
            table_downloaded.style.display = 'none';
        }
    });

    // Add download button click listener
    $('#button-add').click(function () {
        var url = document.getElementById('input-url').value;
        if (url !== '') {
            document.getElementById('input-url').value = '';

            var destination, select_destination = document.getElementById('select-destination').value;
            if (select_destination === 'Hudba')
                destination = '/repository/Hudba/Stažené';
            else if (select_destination === 'Video')
                destination = '/repository/Video/Stažené';
            else if (select_destination === 'Ostatní')
                destination = '/repository/Ostatní/Stažené';

            $.ajax({
                url: 'http://' + IP_ADDRESS + '/api/v1/download/add',
                type: 'POST',
                data: {
                    url: url,
                    destination: destination
                },
                success: function (respAdd) {
                    if (respAdd.status === 'success') {
                        // Add new download to list of waiting downloads
                        waiting.push({
                            status: 'waiting',
                            id: respAdd.id,
                            filename: respAdd.filename,
                            destination: respAdd.destination,
                            created_at: respAdd.created_at
                        });
                        // Refresh
                        if (waiting.length > 0) {
                            table_waiting.style.display = null;
                            $($('#tr-waiting').waiting(waiting, phone)).click(waitingRemClick);
                        } else {
                            table_waiting.style.display = 'none';
                        }
                    } else {
                        toastr.error('Stahování se nepodařilo přidat.', 'Chyba!', {
                            closeButton: true
                        });
                    }
                }
            });
        } else {
            toastr.error('Musíte zadat URL.', 'Chyba!', {
                closeButton: true
            });
        }
    });

    // Download cancel button click listener
    $('#button-cancel').click(function () {
        $.ajax({
            url: 'http://' + IP_ADDRESS + '/api/v1/download/cancel',
            type: 'DELETE',
            success: function (respCancel) {
                if (respCancel.status === 'success') {
                    table_downloading.style.display = 'none';
                    progress.style.width = '0%';
                    progress.innerHTML = '0 %';
                } else {
                    toastr.error('Stahování se nepodařilo zrušit.', 'Chyba!', {
                        closeButton: true
                    });
                }
            }
        });
    }
    );
})(jQuery);