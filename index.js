/**
 * lite-rest
 var lire = require('lite-rest');
 var middle = new lire( '/path/to/sqlite.db', 'mytable' );
 // 1st param can be either a string, as a path to a lite3 db file, or a pre-created sqlite3 Database instance.
 // 2nd param is the name of a table to be managed by this middler.
 */

var sql = require('sqlite3').verbose();
var _ = require('lodash');

var myget = function(db, tbl, req, res) {
    var qry = 'select * from ' + tbl + ' ';
    if (req.params && req.params.id) {
        // this IF is for grabbing a specific item from the collection,
        // with a url like: /path/to/collection/:id

        qry += " where id = ? ";
        db.all(qry, req.params.id, function(err, rows) {
            if (err) {
                res.status(500).json(err);
            } else {
                if (rows && rows.length === 1) {
                    res.json(rows[0]);
                } else {
                    res.status(404).json(rows);
                }
            }
        });
    } else {
        // for grabbing the whole collection
        db.all(qry, function(err, rows) {
            if (err) {
                res.status(500).json(err);
            } else {
                res.json(rows);
            }
        });
    }
};

var mycreate = function(db, tbl, obj, res) {
    var creater = [];
    var columns = [];
    var values = [];
    var quests = [];
    var keys = [];
    var keyvals = {};
    var kvs = [];

    _.forEach(obj, function(k, j) {
        creater.push(" " + j + " text ");
        columns.push(j);

        keys.push('$' + j);
        keyvals['$' + j] = k;

        if (j !== 'id') {
            kvs.push(j + ' = $' + j);
        }
    });

    db.serialize(function() {
        // if this is the 1st item in the collection
        var qry = "CREATE TABLE IF NOT EXISTS " + tbl + " ( " + creater.join(',') + " )";
        db.run(qry);

        var docreate = true;

        if (obj.id) {
            qry = "SELECT id FROM " + tbl + " WHERE id = ?";
            db.all(qry, obj.id, function(err, rows) {
                if (err) {
                    res.status(500).json(err);
                } else {
                    docreate = rows.length !== 1;
                }
            });

            if (!docreate) {
                // if we have the id, we'll run an update instead of an insert
                qry = "UPDATE " + tbl + " SET " + kvs.join(', ') + " WHERE id = $id";
                db.run(qry, keyvals, function(err) {
                    if (err) {
                        res.status(500).json(err);
                    } else {
                        res.json(obj);
                    }
                });
            }
        }

        if (docreate) {
            // insert into tbl (col1, col2) values(?, ?)
            qry = "INSERT INTO " + tbl + " ( " + columns.join(',') + " ) VALUES ( " + keys.join(',') + " )";
            db.run(qry, keyvals, function(err, rows) {
                if (err) {
                    res.status(500).json(err);
                } else {
                    res.status(201).json(obj);
                }
            });

        }
    });
};

var mydelete = function(db, tbl, id, res) {
    db.serialize(function() {
        var qry = "DELETE FROM " + tbl + " WHERE id = ? ";
        db.run(qry, id, function(err) {
            if (err) {
                res.status(500).json(err);
            } else {
                res.status(204).end();
            }
        });
    });
};

var liteRest = function(db, tbl) {
    if (typeof tbl !== 'string') {
        throw 'bad tbl type. should be string. found: ' + typeof tbl;
    }

    if (typeof db === 'string') {
        db = new sql.Database(db);
    }

    return function(req, res, next) {
        if (req.method === 'GET') {
            myget(db, tbl, req, res);
        } else if (req.method === 'POST') {
            mycreate(db, tbl, req.body, res);
        } else if (req.method === 'PUT') {
            var x = _.extend({}, req.body, {
                id: req.params.id
            });
            mycreate(db, tbl, x, res);
        } else if (req.method === 'DELETE') {
            mydelete(db, tbl, req.params.id, res);
        } else {
            next();
        }
    };
};

module.exports = liteRest;
