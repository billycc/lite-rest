var should = require('should');
var app = require('./test');
var request = require('supertest');
var fs = require('fs');

describe("lite-rest", function() {
    it('get a specific non-existent item should respond with error', function(done) {
        request(app)
            .get('/api/test/1')
            .expect(500)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) return done(err);
                res.body.should.be.instanceof(Object);
                done();
            });
    });

    it("get list from an uncreated collection, should return an error", function(done) {
        request(app).get('/api/test')
            .expect(500)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) return done(err);
                res.body.should.be.instanceof(Object);
                done();
            });
    });

    it("should create a record", function(done) {
        request(app).post('/api/test')
            .send({
                key: 'val',
                id: 123
            })
            .expect(201)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) return done(err);
                res.body.should.be.instanceof(Object);
                done();
            });
    });

    it("should make another rec", function(done) {

        request(app).put('/api/test/321')
            .send({
                key: 'val2'
            })
            .expect(201)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) return done(err);
                res.body.should.be.instanceof(Object);
                res.body.should.eql({
                    key: 'val2',
                    id: '321'
                });
                done();
            });
    });

    it("get list", function(done) {
        request(app).get('/api/test')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) return done(err);
                res.body.should.be.instanceof(Array);
                done();
            });
    });

    it("get a specific item", function(done) {
        request(app).get('/api/test/123')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) return done(err);
                res.body.should.be.instanceof(Object);
                done();
            });
    });

    it("delete an item", function(done) {
        request(app).del('/api/test/123')
            .expect(204)
            .end(function(err, res) {
                if (err) return done(err);
                done();
            });
    });

    it("get list, v3", function(done) {
        request(app).get('/api/test')
            .expect(200)
            .expect('Content-Type', /json/)
            .end(function(err, res) {
                if (err) return done(err);
                res.body.should.be.instanceof(Array);
                res.body.length.should.eql(1);
                done();
            });
    });

    it("cleanup", function(done) {
        fs.unlinkSync(__dirname + '/file.db');
        done();
    });
});
