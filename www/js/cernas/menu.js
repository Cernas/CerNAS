(function ($) {
    // Server IP address
    const IP_ADDRESS = '192.168.1.10';

    // Show menu button listener
    $('#open-nav').click(function () {
        document.getElementById("mySidenav").style.width = "250px";
    });

    // Hide menu button listener
    $('#close-nav').click(function () {
        document.getElementById("mySidenav").style.width = "0";
    });

    // Reboot item listener
    $('#item-reboot').click(function () {
        // Reboot system
        $.ajax({
            url: 'http://' + IP_ADDRESS + '/api/v1/system/reboot',
            type: 'POST',
            success: function (response) {
                if (response.status === 'success') {
                    toastr.success('Systém bude restartován.', 'Přijato', {
                        closeButton: true
                    });
                } else {
                    toastr.error('Systém se nepodařilo restartovat.', 'Chyba!', {
                        closeButton: true
                    });
                }
                
                document.getElementById("mySidenav").style.width = "0";
            }
        });
    });

    // Shutdown item listener
    $('#item-shutdown').click(function () {
        // Shutdown system
        $.ajax({
            url: 'http://' + IP_ADDRESS + '/api/v1/system/shutdown',
            type: 'POST',
            success: function (response) {
                if (response.status === 'success') {
                    toastr.success('Systém bude vypnut.', 'Přijato', {
                        closeButton: true
                    });
                } else {
                    toastr.error('Systém se nepodařilo vypnout.', 'Chyba!', {
                        closeButton: true
                    });
                }
                
                document.getElementById("mySidenav").style.width = "0";
            }
        });
    });

    $('*').click(function (event) {
        if (event.pageX > 250)
            document.getElementById("mySidenav").style.width = "0";
    });
})(jQuery);