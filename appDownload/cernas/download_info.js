function timeConvert(seconds) {
    var value = '';
    var days = parseInt(seconds / 86400);
    if (days > 0)
        value += days + ' d ';

    var hours = parseInt((seconds - (days * 86400)) / 3600);
    if (hours > 0)
        value += hours + ' h ';

    var minutes = parseInt((seconds - (days * 86400) - (hours * 3600)) / 60);
    if (minutes > 0)
        value += minutes + ' min ';

    seconds = parseInt(seconds - (days * 86400) - (hours * 3600) - (minutes * 60));
    if (seconds > 0)
        value += seconds + ' s';

    if (value === '')
        value = '0 s';

    return value;
}

function sizeConvert(bytes) {
    var mebibytes = (bytes / 1048576).toFixed(1);

    if (mebibytes >= 1000)
        return (bytes / 1073384580.44164).toFixed(2) + ' GB';
    else
        return mebibytes + ' MB';
}

function getCurrentSize(line) {
    if (line.indexOf('K') > -1) {
        var size = parseInt(line.substring(0, line.indexOf('K')).trim(' '));
        if (!isNaN(size))
            return sizeConvert(size * 1024);
        else
            return null;
    } else {
        return null;
    }
}

function getPercent(line) {
    if (line.indexOf('%') > -1) {
        var percent = parseInt(line.substring(line.indexOf('%') - 3, line.indexOf('%')).trim(' '));
        if (!isNaN(percent))
            return percent;
        else
            return null;
    } else {
        return null;
    }
}

function getTotalSize(line) {
    if (line.indexOf('Length:') > -1) {
        var totalSize = parseInt(line.substring(line.indexOf('Length:') + 8, line.indexOf('(')));
        if (!isNaN(totalSize))
            return sizeConvert(totalSize);
        else
            return null;
    } else {
        return null;
    }
}

function getSpeed(line) {
    if (line.indexOf('%') > -1) {
        var substr = line.substring(line.indexOf('%') + 1, line.length);
        var speed = substr.substring(0, substr.lastIndexOf(' ') + 1).trim(' ');
        return speed;
    } else {
        return null;
    }
}

function getCurrentInfo(status, line) {
    // speed
    var speed = getSpeed(line);
    if (speed !== null)
        status.speed = speed;
    // percent
    var percent = getPercent(line);
    if (percent !== null)
        status.percent = percent;
    // total_size
    var total_size = getTotalSize(line);
    if (total_size !== null)
        status.total_size = total_size;
    // current_size
    var current_size = getCurrentSize(line);
    if (current_size !== null)
        status.current_size = current_size;
}

module.exports = {
    getCurrentInfo,
    timeConvert
};