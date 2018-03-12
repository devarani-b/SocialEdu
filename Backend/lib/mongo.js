var Nedb = require('nedb');
var path = require('path');
var db = {};
Nedb.globalDb = db;
var dbPath;
if (global.socialedu_settings.nedbPath === undefined || global.socialedu_settings.nedbPath === '') {
    dbPath = __dirname;
} else {
    dbPath = global.socialedu_settings.nedbPath;
}
db.user = new Nedb({ filename: path.join(dbPath, '../user.db'), autoload: true });
