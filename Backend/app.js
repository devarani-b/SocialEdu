/*jslint unparam: true*/
var express = require('express');
var path = require('path');
var fs = require('fs');
var favicon = require('serve-favicon');
var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var compress = require('compression');
var StatsD = require('statsd-client');
var session = require('express-session');
var NedbSession = require('connect-nedb-session-two')(session);
var StatsD = require('statsd-client');

try {
    global.socailedu_settings = require('./settings');
} catch (err) {
    global.socailedu_settings = {};
}


/** Main application entry point
* @return {Object}
*/

/** Return the module */
module.exports = function ret(sett) {
    var app = express();

    global.socailedu_settings.nedbPath = sett.nedbPath || global.socailedu_settings.nedbPath || '';
    global.socailedu_settings.uploadPath = sett.uploadPath || global.socailedu_settings.uploadPath || '';
    global.socailedu_settings.mediaPath = sett.mediaPath || global.socailedu_settings.mediaPath || '';
    global.socailedu_settings.ffmpegPath = sett.ffmpegPath || global.socailedu_settings.ffmpegPath;
    global.socailedu_settings.ffprobePath = sett.ffprobePath || global.socailedu_settings.ffprobePath;
    global.socailedu_settings.flvMetaPath = sett.flvMetaPath || global.socailedu_settings.flvMetaPath;
    global.socailedu_settings.maxFFmpegInsatances = sett.maxFFmpegInsatances || global.socailedu_settings.maxFFmpegInsatances;
    global.socailedu_settings.statsDServer = sett.statsDServer;
    global.socailedu_settings.statsDDebug = sett.statsDDebug;
    global.socailedu_settings.statsDPrefix = sett.statsDPrefix;
    global.socailedu_settings.gmailUsername = sett.gmailUsername;
    global.socailedu_settings.gmailPassword = sett.gmailPassword;
    global.socailedu_settings.mailgunKey = sett.mailgunKey;
    global.socailedu_settings.mailgunDomain = sett.mailgunDomain;
    global.socailedu_settings.mailFrom = sett.mailFrom || global.socailedu_settings.mailFrom;
    global.socailedu_settings.usersCanCreateAccount = sett.usersCanCreateAccount;
    global.socailedu_settings.css = sett.css || global.socailedu_settings.css;
    global.socailedu_settings.env = sett.env || process.env.NODE_ENV;
    global.socailedu_settings.googleAnalyticsId = sett.googleAnalyticsId;
    global.socailedu_settings.baseURL = sett.baseURL;
    global.socailedu_settings.databaseType = sett.databaseType || global.socailedu_settings.databaseType;
    global.socailedu_settings.sqlServerServer = sett.sqlServerServer;
    global.socailedu_settings.sqlServerUsername = sett.sqlServerUsername;
    global.socailedu_settings.sqlServerPassword = sett.sqlServerPassword;
    global.socailedu_settings.sqlServerDatabaseName = sett.sqlServerDatabaseName;
    global.socailedu_settings.showErrorsInConsole = sett.showErrorsInConsole || global.socailedu_settings.showErrorsInConsole;

    
    if (global.socailedu_settings.databaseType === 'mongo') {
        require('./lib/mongo.js');
    }
    app.use(require('./lib/restarting'));
    /// Setup statsD and attach it to the statsD module for global use. 
    if (global.socailedu_settings.statsDServer !== undefined) {
        var statsDParams = {
            host: global.socailedu_settings.statsDServer,
            prefix: global.socailedu_settings.statsDPrefix,
            debug: global.socailedu_settings.statsDDebug
        };

        statsD = new StatsD(statsDParams);
        StatsD.globalStatsD = statsD;

        /// Add a listener to the end of the request to log the duration
        app.use(function (req, res, next) {
            var start = new Date();
            res.on('finish', function () {
                statsD.timing('page_load', start);
            });
            next();
        });
    }
    var utils = require('./lib/utils');
    var runOnce = require('./lib/runOnce');
    var logger = require('./lib/logger');
    var routes = require('./routes/index');
    var upload = require('./routes/upload');
    var toolbox = require('./routes/toolbox');
    var script = require('./routes/script');
    var api = require('./routes/api');
    var security = require('./lib/security');

    global.newFlickNotificationRecipients = [];

    app.enable('strict routing');//???


    ///// NOTE::: Enocde currently unreliable when called this way.
    utils.cleanMedia();
    utils.encode();
    utils.pingNewFlick();

    // view engine setup
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'hbs');


    app.use(compress());
    /** Set the cache header on static files  */
    app.get('/*', function (req, res, next) {
        if ((global.socailedu_settings.env === 'production') && (req.url.indexOf("/img/") === 0 || req.url.indexOf("/css/") === 0 || req.url.indexOf("/js/") === 0  || req.url.indexOf("/video.js") === 0)) {
            res.setHeader("Cache-Control", "public, max-age=2592000");
            res.setHeader("Expires", new Date(Date.now() + 2592000000).toUTCString());
        }
        next();
    });
    // uncomment after placing your favicon in /public
   
    app.use(morgan('dev'));
    if (sett.cssPath) {
        app.use('/css/index.css', express.static(sett.cssPath));
        app.use('/css/index.min.css', express.static(sett.cssPath));
    }
    app.use(express.static(path.join(__dirname, 'public')));
    app.use(session({ secret: sett.sessionSecret,
        key: 'iflicks_cookie',
        resave: false,
        saveUninitialized: false,
        cookie: { path: '/',
            httpOnly: true,
            maxAge: 1.2 * 24 * 3600 * 1000   // One day for example 
            },
        store: new NedbSession({ filename: 'sessiondb', clearInterval: 24 * 3600 * 1000 })
        }));
   

    if (global.socailedu_settings.runOnce === true) {
        try {
            fs.statSync(path.join(__dirname, '/views/runOnce.hbs'));
            app.use(runOnce);
        } catch (ex) {
            global.socailedu_settings.runOnce = false;
        }
    }
    app.use('/signin', security);
    app.use('/script', script);
    app.use('/upload', security.ensureAuthenticated, upload);
    app.use('/', routes);

    // catch 404 and forward to error handler
    app.use(function (req, res, next) {
        var err = new Error('Not Found');
        err.status = 404;
        next(err);
    });

    // error handlers

    // development error handler
    // will print stacktrace
    if (global.socailedu_settings.env === 'development') {
        app.use(function (err, req, res, next) {
            err.code = err.code || 'F01001';
            logger.error(req, 'app.errorHandler', err.code, err, 2);
            res.status(err.status || 500);
            //console.log(req.headers);
            if (req.headers.accept === 'application/json' || req.headers['x-requested-with'] === 'XMLHttpRequest') {
                res.send({error: err.message});
            } else {
                res.render('error', {
                    message: err.message + ' ' + err.code,
                    error: err,
                    css: global.socailedu_settings.css
                });
            }
        });
    }

    // production error handler
    // no stacktraces leaked to user
    app.use(function (err, req, res, next) {
        err.code = err.code || 'F01002';
        logger.error(req, 'app.errorHandler', err.code, err, 2);
        res.status(err.status || 500);
        if (req.headers.accept === 'application/json' || req.headers['x-requested-with'] === 'XMLHttpRequest') {
            res.send({error: err.message});
        } else {
            res.render('error', {
                message: err.message,
                error: {},
                css: global.socailedu_settings.css
            });
        }
    });

    return app;
};
