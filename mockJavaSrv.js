const path = require('path');
const fs = require('fs');
const http = require('http');
const Koa = require('koa');
const staticServer = require('koa-static');
const app = new Koa();


app.use(async function(ctx, next) {
    //console.log(ctx.request.socket.remoteAddress+':'+ctx.request.socket.remotePort)
    console.log(ctx.request.path)
    ctx.body = 123;
});

app.listen(8088);


