var express = require('express');

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var app = express();
var server = require('http').createServer(app);
require('./config/express')(app);
var config = require('./config/environment');
var fs = require('fs');

var db = __dirname + '/file.db';
var exists = fs.existsSync(db);
if (exists) {
    fs.unlinkSync(db);
}

var lire = require('../index.js')(db, 'test');

app.use('/api/test/:id', lire);
app.use('/api/test', lire);

// Start server
server.listen(config.port, config.ip, function() {
    console.log('Express server listening on %d, in %s mode', config.port, app.get('env'));
});

exports = module.exports = app;