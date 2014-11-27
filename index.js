/**
 * lite-rest
 var lire = require('lite-rest');
 var middle = new lire( '/path/to/sqlite.db', 'mytable' );
 // 1st param can be either a string, as a path to a lite3 db file, or a pre-created sqlite3 Database instance.
 // 2nd param is the name of a table to be managed by this middler.
 */

var sql = require('sqlite3').verbose();
var _ = require('lodash');

var myget = function(req, res, next) {
    var qry = 'select * from ' + tbl + ' ';
    if (req.params && req.params.id) {
    	// this IF is for grabbing a specific item from the collection,
    	// with a url like: /path/to/collection/:id
        qry += " where id = ? ";
        db.get(qry, req.params.id, function(err, rows) {
            if (err) {
                res.json(500, err);
            } else {
                if (rows && rows.length === 1) {
                    res.json(rows[0]);
                } else {
                    res.json(404, rows);
                }
            }
        });
    } else {
    	// for grabbing the whole collection
    	db.get(qry, function(err, rows) {
    		if (err) {
    			res.json(500, err);
    		} else{
    			res.json(rows);
    		}
    	});
    }
};

var mycreate = function(obj, res, next) {
    var creater = [];
    var columns = [];
    var values = [];
    var quests = [];
    _.forEach(obj, function(k) {
        creater.push(" " + k + " text ");
        columns.push(k);
        values.push(obj[k]);
        quests.push('?');
    });

    db.serialize(function() {
    	// if this is the 1st item in the collection
        var qry = "CREATE TABLE IF NOT EXISTS " + tbl + " ( " + creater.join(',') + " )";
        db.run(qry);

        if (obj.id) {
        	// rather than a more awkward update query generation, we'll drop and then re-add a record.
            qry = "DELETE FROM " + tbl + " WHERE id = ? ";
            db.run(qry, obj.id);
        }

        // insert into tbl (col1, col2) values(?, ?)
        qry = "INSERT INTO " + tbl + " ( " + columns.join(',') + " ) VALUES ( " + quests.join(',') + " )";
        var args = [qry].concat(values);
        args.push(function(err, rows) {
            if (err) {
                res.json(500, err);
            } else {
                res.json(201, obj);
            }
        });

        // the semi-awkwardness of the args var is because db.run() takes a variable # of args, 
        // with the 1st being the string query, the middles are ?-param replacers, last is a callback fn
        db.run.apply(db, args);
    });
};

var restTable = function(db, tbl) {
    if (typeof tbl !== 'string') {
        throw 'bad tbl type. should be string. found: ' + typeof tbl;
    }

    if (typeof db === 'string') {
        db = new sql.Database(db);
    }

    return function(req, res, next) {
        if (req.method === 'get') {
            myget(req, res, next);
        } else if (req.method === 'post') {
            mycreate(req.body, res, next);
        } else if (req.method === 'put') {
        	var x = _.extend({}, req.body, {id: req.params.id});
        	mycreate(x, res, next);
        }
    };
};

module.exports = restTable;