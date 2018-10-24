const moment = require('moment');

const { error } = require('./logger');


/**
 * TODO: add mail notify later
 */
async function handleErr (err, caugthBy) {
    let currTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    
    error(
        '\n%s %s %s\n',
        currTime, caugthBy, err.stack||err.message||err,
    );
}


module.exports = { handleErr };