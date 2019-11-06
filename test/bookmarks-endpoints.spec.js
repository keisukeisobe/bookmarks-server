const { expect } = require('chai');
const knex = require('knex');
const app = require('../src/app');
const { makeBookmarksArray } = require('./bookmarks.fixtures');


describe('Bookmarks Endpoints', function() {
  let db;

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL,
    });
    app.set('db', db);
  });

  after('disconnect from db', () => db.destroy());

  before('clean the table', () => db('bookmarks').truncate());

  afterEach('cleanup', () => db('bookmarks').truncate());


  describe('GET endpoint', () => {
    context('given there are bookmarks in the database', () => {
      const testBookmarks = makeBookmarksArray();
  
      beforeEach('insert bookmarks', () => {
        return db.into('bookmarks').insert(testBookmarks);
      });
  
      it('GET /bookmarks responds with 200 and all bookmarks', () => {
        return supertest(app).get('/bookmarks').set('Authorization', `Bearer ${process.env.API_TOKEN}`).expect(200, testBookmarks);
      });
      
      it('GET /bookmarks/:bookmarkId responds with 200 and the correct bookmark', () => {
        const bookmarkId = 2;
        const expectedBookmark = testBookmarks[bookmarkId - 1];
        return supertest(app).get(`/bookmarks/${bookmarkId}`).set('Authorization', `Bearer ${process.env.API_TOKEN}`).expect(200, expectedBookmark);
      });
    });

    context('given there are no bookmarks in the database', () => {
      it('GET with no bookmarks responds 200 empty array', () => {
        return supertest(app).get('/bookmarks').set('Authorization', `Bearer ${process.env.API_TOKEN}`).expect(200, []);
      });
      it('GET with id with no bookmarks in the database', () => {
        return supertest(app).get('/bookmarks/999').set('Authorization', `Bearer ${process.env.API_TOKEN}`).expect(404);
      });
    });
  });


});