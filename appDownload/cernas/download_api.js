var http = require('http');

function httpRequest(settings, receivedCallback) {
    http.request({
        'host': settings.host,
        'path': settings.path,
        'method': settings.method,
        'headers': {
            'Content-Type': 'application/json'
        }
    }, function (response) {
        response.on('data', receivedCallback);
    }).end(JSON.stringify(settings.params));
}

function updateStatus(params, resultCallback) {
    httpRequest({
        host: 'localhost',
        path: '/api/v1/download/update-status',
        method: 'PUT',
        params
    }, resultCallback);
}

function isExist(id, resultCallback) {
    httpRequest({
        host: 'localhost',
        path: '/api/v1/download/is-exist?id=' + id,
        method: 'GET'
    }, resultCallback);
}

module.exports = {
    updateStatus,
    isExist
};