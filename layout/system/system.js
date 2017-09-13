(function ($) {
    // Phone resolution limit
    const PHONE_RESOLUTION = 800;

    // Set desktop layout
    if (screen.width > PHONE_RESOLUTION) {
        document.getElementById('table-repository').style.width = '29%';
        document.getElementById('table-backup').style.width = '29%';
        document.getElementById('table-services').style.width = '29%';
    }

    $("#progress-repository").circliful({
        percent: 32.2,
        text: '386.23 GB'
    });

    $("#progress-backup").circliful({
        percent: 71.8,
        text: '141 GB'
    });
})(jQuery);