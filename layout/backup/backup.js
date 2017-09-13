(function ($) {
    // Phone resolution limit
    const PHONE_RESOLUTION = 800;

    // Set desktop layout
    if (screen.width > PHONE_RESOLUTION) {
        document.getElementById('table-backup').style.width = '29%';
        document.getElementById('table-directory').style.width = '69%';
    }

    $("#progress-backup").circliful({
        percent: 71.8,
        text: '141 GB'
    });
})(jQuery);