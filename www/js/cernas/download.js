(function ($) {
    $.fn.downloaded = function (downloaded, phone) {
        var tr_downloaded = document.getElementById($(this).attr('id'));
        tr_downloaded.innerHTML = '';
        var selectors = '';

        for (var i = 0; i < downloaded.length; i++) {
            var icon, icon_color, info;
            if (downloaded[i].status === 'completed') {
                icon = 'glyphicon-ok';
                icon_color = '#00FF00';
                info = "<div class='text-info'>Velikost: " + downloaded[i].size + " - Čas: " + downloaded[i].time + "</div>" +
                        "<div class='text-info'>Ukončeno: " + downloaded[i].finished_at + "</div>" +
                        "<div class='text-info'>Uloženo do: " + downloaded[i].destination.replace('/repository', '') + "</div>";
            } else if (downloaded[i].status === 'failed') {
                icon = 'glyphicon-remove';
                icon_color = '#CC0000';
                info = "<div class='text-info'>Ukončeno: " + downloaded[i].finished_at + "</div>";
            }
            
            if (phone) {
                if (downloaded[i].filename.length > 35)
                    downloaded[i].filename = downloaded[i].filename.substring(0, 34) + '...';
            }

            var trHtml =
                    "<tr>" +
                    "<td style='width: 5%;'>" +
                    "<div align='center'><span class='glyphicon " + icon + "' style='color: " + icon_color + "'></span></div>" +
                    "</td>" +
                    "<td>" +
                    "<div class='text-name'>" + downloaded[i].filename + "</div>" + info +
                    "</td>" +
                    "<td style='width: 1%;'>" +
                    "<a id='" + $(this).attr('id') + downloaded[i].id + "' href='#'>" +
                    "<span class='glyphicon glyphicon-remove icon-delete'></span>" +
                    "</a>" +
                    "</td>" +
                    "</tr>";
            tr_downloaded.innerHTML += trHtml;

            if (i === 0)
                selectors = '#' + $(this).attr('id') + downloaded[i].id;
            else
                selectors += ', #' + $(this).attr('id') + downloaded[i].id;
        }

        return selectors;
    };

    $.fn.waiting = function (waiting, phone) {
        var tr_waiting = document.getElementById($(this).attr('id'));
        tr_waiting.innerHTML = '';
        var selectors = '';

        for (var i = 0; i < waiting.length; i++) {
            if (phone) {
                if (waiting[i].filename.length > 35)
                    waiting[i].filename = waiting[i].filename.substring(0, 34) + '...';
            }

            var trHtml =
                    "<tr>" +
                    "<td style='width: 5%;'>" +
                    "<div align='center'><span class='glyphicon glyphicon-time icon-waiting'></span></div>" +
                    "</td>" +
                    "<td>" +
                    "<div class='text-name'>" + waiting[i].filename + "</div>" +
                    "<div class='text-info'>Uložit do: " + waiting[i].destination + "</div>" +
                    "</td>" +
                    "<td style='width: 1%;'>" +
                    "<a id='" + $(this).attr('id') + waiting[i].id + "' href='#'>" +
                    "<span class='glyphicon glyphicon-remove icon-delete'></span>" +
                    "</a>" +
                    "</td>" +
                    " </tr>";
            tr_waiting.innerHTML += trHtml;

            if (i === 0)
                selectors = '#' + $(this).attr('id') + waiting[i].id;
            else
                selectors += ', #' + $(this).attr('id') + waiting[i].id;
        }

        return selectors;
    };
})(jQuery);