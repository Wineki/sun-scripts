const winston = require('winston');
const dailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');
const moment = require('moment');
const _ = require('lodash');

const format = winston.format;
const { LOG_DIR } = require('../config');



(function assureLogDir() {
    try {
        fs.statSync(LOG_DIR).isDirectory();
    } catch (err) {
        fs.mkdirSync(LOG_DIR)
    }
})();



const infoLogger = winston.createLogger({
    level: 'info',
    format: format.combine(
        format.splat(),
        format.simple()
    ),
    transports: [
        new (winston.transports.Console)(),
        new (dailyRotateFile)({
            dirname: LOG_DIR,
            filename: 'app.log',
            datePattern: 'YYYY-MM-DD',
        }),
        new (dailyRotateFile)({
            dirname: LOG_DIR,
            filename: 'app.error.log',
            datePattern: 'YYYY-MM-DD',
            level: 'error',
        }),
    ]
});


const info = function(...args) {
    infoLogger.log('info', ...args)
}

const error = function(...args) {
    infoLogger.log('error', ...args)
}


/**
 * Log info trace
 * @param {Object} ctx
 * @param {array-like} messages, each item can be a string/object/array
 */
const infoWithCtx = function(ctx, ...messages) {
    let currTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    
    info(
        '%s %s %s ||| %s ||| %s\n',
        currTime, ctx.method, ctx.path + ctx.search,
        stringIt(messages),
        ctx.ip,
    );
}

/**
 * Log error trace
 * @param {Object} ctx
 * @param {array-like} messages, each item can be a string/object/array/Error
 * best to place Error to the last
 */
const errorWithCtx = function(ctx, ...messages) {
    let currTime = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
    
    error(
        '%s %s %s ||| %s ||| %s\n',
        currTime, ctx.method, ctx.path + ctx.search,
        stringIt(messages),
        ctx.ip,
    );
}



function stringIt(messages) {
    return _.chain(messages)
            .map(function(msg){
                if ( _.isString(msg) ) {
                    return msg;
                } else if  ( _.isError(msg) ) {
                    return '\n' + msg.stack || msg.message || msg.toString() + '\n' ;
                } else {
                    return JSON.stringify(msg);
                }
            })
            .value()
            .join('|');
}





module.exports = {
    info,
    error,
    infoWithCtx,
    errorWithCtx
}
