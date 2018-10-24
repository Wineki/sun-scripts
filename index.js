const Koa = require('koa');
const path = require('path');
const koaStatic = require('koa-static');

const { PRODUCT_SERVER, PARTNER_SERVER } = require('./config');

const { RTN_CODE } = require('./utils/constants');
const logger = require('./utils/logger');
const proxyToJava = require('./utils/proxy');
const { handleErr } = require('./utils/errHandler');

const performance = require('./utils/mw-performance');
const filterFavicon = require('./utils/mw-favicon');
const heartbeat = require('./utils/mw-heartbeat');


const app = new Koa();

//设置后ctx.ip是原始ip，否则取到的是nginx服务器的IP
app.proxy = true;

// 设置签名的Cookie密钥
// app.keys = ['nodejs_insurancem_m_cas_cookie_secret_key'];


// 打印代理信息
// console.log('PRODUCT_SERVER==>', PRODUCT_SERVER);
// console.log('PARTNER_SERVER==>', PARTNER_SERVER);


// 抓取全局异常
process.on('uncaughtException', function(err) {
    handleErr(err, 'caught_by_uncaughtException');
    throw err;
});

// 抓取异步异常
process.on('unhandledRejection', function(err, p) {
    handleErr(err, 'caught_by_unhandledRejection');
});


// 捕获中间件异常
app.use(async function errHandleFacade(ctx, next) {
    try {
        await next();
    } catch(err) {
        handleErr(err, 'caught_by_err_handler_middleware');
        
        ctx.body = {
            code: RTN_CODE.ERR_NODEJS,
            msg: err.message,
            data: null,
        };
    }
});


// filter out favicon
app.use(filterFavicon);


// heartbeat
app.use(heartbeat);


// 性能数据
app.use(performance);


// 业务里需要跳转到其他页面
app.use(async (ctx, next) => {
    // 和后端约定，处理来源302之类的逻辑
    // 例
    // 已投放的链接为  
    // https://abc.58.com/index.html?page=page1
    // https://abc.58.com/index.html?page=page2
    // 现在要改为
    // https://abc.58.com/page1.html
    // https://abc.58.com/page2.html
    // 就可以在这里redirect
    await next();
});


// html目录 - 云平台bug，不能使用static做目录名
app.use(koaStatic(`${__dirname}/views`));


// 无效html页面拦截
app.use(async (ctx, next) => {
    const isPage = ctx.path.match(/\.html$/) !== null;
    if(isPage) {
        return ctx.redirect(`/index.html${ctx.search}`);
    }

    await next();
});


// 代理相关异步请求
app.use(async (ctx, next) => {
	
	try {
        var _startProxyTime = new Date();
    
        logger.infoWithCtx(ctx, 'start proxying');
        
        await proxyToJava(ctx, PRODUCT_SERVER);
        
        let _timeSpent = '[' + ((new Date) - _startProxyTime) + 'ms]';
        
        logger.infoWithCtx(ctx, 'finished proxying', ctx.status, _timeSpent);
        
    } catch(e) {
        
        let _timeSpent = '[' + ((new Date) - _startProxyTime) + 'ms]';
        
        logger.errorWithCtx(ctx, 'failed proxying', ctx.status, _timeSpent, e);
        
        ctx.body = {
            code: RTN_CODE.ERR_PROXY,
            msg: 'proxyed server response err: ' + e.message,
            data: null
        };
        
    }
	
})




app.listen(8001).on('clientError', (err, socket) => {
    handleErr(err, 'caught_by_koa_on_client_error');
    socket.end('HTTP/1.1 400 Bad Request Request invalid\r\n\r\n');
});