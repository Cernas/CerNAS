(function ($) {
    $.fn.services = function (services) {
        var tr_services = document.getElementById($(this).attr('id'));
        tr_services.innerHTML = '';
        var selectors = '';

        for (var i = 0; i < services.length; i++) {
            var icon, icon_color;
            if (services[i].running === true) {
                icon = 'glyphicon-ok';
                icon_color = '#00FF00';
            } else if (services[i].running === false) {
                icon = 'glyphicon-remove';
                icon_color = '#CC0000';
            }

            var trHtml =
                    "<tr class='service-name'>" +
                    "<td style='width: 5%;'>" +
                    "<div align='center'><span class='glyphicon " + icon + "' style='color: " + icon_color + ";'></span></div>" +
                    "</td>" +
                    "<td style='width: 90%;'>" + services[i].label + "</td>" +
                    "<td>" +
                    "<a id='" + $(this).attr('id') + services[i].name + "' href='#'>" +
                    "<div align='center'><span class='glyphicon glyphicon-off icon-switch'></span></div>" +
                    "</a>" +
                    "</td>" +
                    "</tr>";
            tr_services.innerHTML += trHtml;

            if (i === 0)
                selectors = '#' + $(this).attr('id') + services[i].name;
            else
                selectors += ', #' + $(this).attr('id') + services[i].name;
        }

        return selectors;
    };
})(jQuery);