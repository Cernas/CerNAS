var Console = require('console').Console;
var fs = require('fs');
var dateFormat = require('dateformat');

class Logger {
    constructor(stdout, stderr) {
        this.stdout = fs.createWriteStream(stdout + '.log', {flags: 'a'});
        this.stderr = fs.createWriteStream(stderr + '.log', {flags: 'a'});
        this.logger = new Console(this.stdout, this. stderr);
    }

    log (text) {
        var log = dateFormat(new Date(), 'yyyy-mm-dd h:MM:ss') + ' INFO: ' + text;
        this.logger.log(log);
        console.log(log);
    }
    
    error (text, code) {
        var log = dateFormat(new Date(), 'yyyy-mm-dd h:MM:ss') + ' ERROR: ' + text + ', code: ' + code;
        this.logger.error(log);
        console.log(log);
    }
}

module.exports = Logger;