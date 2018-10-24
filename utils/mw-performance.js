const moment = require('moment');
const { info } = require('./logger');



async function logPerfermance(ctx, next) {
    
    let reqTime = new Date();
    await next();
    let resTime = new Date();
    
    let resTimeFormatted = moment(resTime).format('YYYY-MM-DD HH:mm:ss.SSS');
    let redirectLocation = ctx.response.headers.location;
    
    info(
        '*** [%sms] *** %s %s %s %s ||| %s %s\n',
        resTime-reqTime, resTimeFormatted,
        ctx.method, ctx.status,
        ctx.path + ctx.search + ( redirectLocation ? ` -> ${redirectLocation}` : '' ),
        ctx.ip, ctx.protocol, 
    );
}



module.exports = logPerfermance;