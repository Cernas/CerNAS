(function ($) {
    $.fn.backups = function (backups, phone) {
        var tr_backups = document.getElementById($(this).attr('id'));
        tr_backups.innerHTML = '';

        for (var i = 0; i < backups.length; i++) {
            var icon, icon_color, info;
            if (backups[i].status === 'completed') {
                icon = 'glyphicon-ok';
                icon_color = '#00FF00';
                info = "<td>" + backups[i].directory + "</td>" +
                        "<td>" + backups[i].changed_size + "</td>" +
                        "<td>" + backups[i].total_size + "</td>";
                if (phone === false)
                    info += "<td>" + backups[i].started_at + "</td>";
                info += "<td>" + backups[i].finished_at + "</td>";
                if (phone === false)
                    info += "<td>" + backups[i].time + "</td>";
            } else if (backups[i].status === 'failed') {
                icon = 'glyphicon-remove';
                icon_color = '#CC0000';
                info = "<td>" + backups[i].directory + "</td>" +
                        "<td></td>" +
                        "<td></td>";
                if (phone === false)
                    info += "<td>" + backups[i].started_at + "</td>";
                if (phone === false)
                    info += "<td></td>";
                else
                    info += "<td>" + backups[i].started_at + "</td>";
                if (phone === false)
                    info += "<td></td>";
            }

            var trHtml =
                    "<tr class='text-info'>" +
                    "<td style='width: 5%;'>" +
                    "<div align='center'><span class='glyphicon " + icon + "' style='color: " + icon_color + ";'></span></div>" +
                    "</td>" + info + "</tr>";
            tr_backups.innerHTML += trHtml;
        }
    };

    $.fn.directories = function (directories) {
        var tr_directories = document.getElementById($(this).attr('id'));
        tr_directories.innerHTML = '';
        
        var selectors = '';
        for (var i = 0; i < directories.length; i++) {
            var trHtml =
                    "</tr>" +
                    "<tr class='text-info'>" +
                    "<td style='width: 5%;'></td>" +
                    "<td>" + directories[i].path + "</td>" +
                    "<td style='width: 5%;'>" +
                    "<a id='" + $(this).attr('id') + directories[i].id + "' href='#'>" +
                    "<div align='center'><span class='glyphicon glyphicon-remove icon-delete'></span></div>" +
                    "</a>" +
                    "</td>" +
                    "</tr>";
            tr_directories.innerHTML += trHtml;

            if (i === 0)
                selectors = '#' + $(this).attr('id') + directories[i].id;
            else
                selectors += ', #' + $(this).attr('id') + directories[i].id;
        }

        return selectors;
    };
})(jQuery);