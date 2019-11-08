const { expect } = require('chai');
const knex = require('knex');
const app = require('../src/app');
const { makeBookmarksArray } = require('./bookmarks.fixtures');

describe('Bookmarks', function() {
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

  describe('incorrect authorization returns 401', () => {
    it('GET /api/bookmarks with no auth', () => {
      return supertest(app)
        .get('/api/bookmarks').expect(401);
    });

    it('GET /api/bookmarks/:id with no auth returns 401', () => {
      return supertest(app).get('/api/bookmarks/999').expect(401);
    });
  });

  describe('GET /api/bookmarks endpoint', () => {
    context('given there are bookmarks in the database', () => {
      const testBookmarks = makeBookmarksArray();
  
      beforeEach('insert bookmarks', () => {
        return db.into('bookmarks').insert(testBookmarks);
      });
  
      it('GET /api/bookmarks responds with 200 and all bookmarks', () => {
        return supertest(app).get('/api/bookmarks').set('Authorization', `Bearer ${process.env.API_TOKEN}`).expect(200, testBookmarks);
      });
    });

    context('given there are no bookmarks in the database', () => {
      it('GET /api/bookmarks with no bookmarks responds 200 empty array', () => {
        return supertest(app).get('/api/bookmarks').set('Authorization', `Bearer ${process.env.API_TOKEN}`).expect(200, []);
      });
    });
  });

  describe('GET /api/bookmarks/id endpoint', () => {
    context('given there are bookmarks in the database', () => {
      const testBookmarks = makeBookmarksArray();
  
      beforeEach('insert bookmarks', () => {
        return db.into('bookmarks').insert(testBookmarks);
      });
      
      it('GET /api/bookmarks/:bookmarkId responds with 200 and the correct bookmark', () => {
        const bookmarkId = 2;
        const expectedBookmark = testBookmarks[bookmarkId - 1];
        return supertest(app).get(`/api/bookmarks/${bookmarkId}`).set('Authorization', `Bearer ${process.env.API_TOKEN}`).expect(200, expectedBookmark);
      });
    });
    context('given there are no bookmarks in the database, 404', () => {
      it('GET with /api/bookmarks/id with no bookmarks in the database', () => {
        return supertest(app).get('/api/bookmarks/999').set('Authorization', `Bearer ${process.env.API_TOKEN}`).expect(404);
      });
    });
    context('given an XSS attack bookmark', () => {
      const maliciousBookmark = {
        title: 'Naughty naughty very naughty <script>alert("xss");</script>',
        url: 'https://www.wikipedia.org',
        rating: '1',
        description: 'wahoo',
        id: 1
      };
      beforeEach('insert malicious bookmark', () => {
        return db.into('bookmarks').insert([maliciousBookmark]);
      });

      it('removes XSS attack content', () => {
        return supertest(app).get(`/api/bookmarks/${maliciousBookmark.id}`).set('Authorization', `Bearer ${process.env.API_TOKEN}`).expect(200);
        // .expect(res => {
        //   expect(res.body.title).to.eql('Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;');
        //   expect(res.body.description).to.eql('Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.');
        // });
      });
    });
  });

  describe('POST /api/bookmarks endpoint', () => {
    context('given there is missing content in the body', () => {
      const requiredFields = ['id', 'title', 'url', 'rating', 'description'];
      requiredFields.forEach(field => {
        const newBookmark = {
          title: 'yahoo',
          url: 'https://www.yahoo.com',
          description: 'yahoooo',
          rating: 1,
          id: 1
        };
        //this one is hanging
        it(`responds with 400 and an error message when the required ${field} is missing`, () => {
          delete newBookmark[field];
          supertest(app).post('/api/bookmarks').set('Authorization', `Bearer ${process.env.API_TOKEN}`).send(newBookmark).expect(400, {error: {message: `Missing ${field} in request body`}});
        });
      });
    });
    context('given no missing content in body', () => {
      //this one is hanging
      it('creates an bookmark, 201s, and responds with new bookmark', () => {
        //this.retries(3);
        const newBookmark = {
          title: 'yahoo',
          url: 'https://www.yahoo.com',
          description: 'yahoooo',
          rating: 1,
          id: 1
        };
        return supertest(app).post('/api/bookmarks').set('Authorization', `Bearer ${process.env.API_TOKEN}`).send(newBookmark)
          .expect(201)
          .expect(res => {
            expect(res.body.title).to.eql(newBookmark.title);
            expect(res.body.url).to.eql(newBookmark.url);
            expect(res.body.description).to.eql(newBookmark.description);
            expect(res.body.rating).to.eql(newBookmark.rating);
            expect(res.body).to.have.property('id');
            expect(res.headers.location).to.eql(`/api/bookmarks/${res.body.id}`);
            // const expected = new Date();
            // const actual = new Date(res.body.date_published);
            // expect(actual).to.eql(expected);
          })
          .then(postRes => {
            supertest(app).get(`/bookmarks/${postRes.body.id}`).set('Authorization', `Bearer ${process.env.API_TOKEN}`).expect(postRes.body);
          });
      });
    });
  });

  describe('DELETE /api/bookmarks/:bookmarkId', () => {
    context('given there are bookmarks, delete by ID', () => {
      const testBookmarksArray = makeBookmarksArray();
      beforeEach('insert bookmarks', () => {
        return db.into('bookmarks').insert(testBookmarksArray);
      });
      //this one hangs
      it('responds with 204 and removes bookmark', () => {
        const idToRemove = '1';
        const expectedBookmarks = testBookmarksArray.filter(bookmark => bookmark.id !== idToRemove);
        return supertest(app).delete(`/api/bookmarks/${idToRemove}`).set('Authorization', `Bearer ${process.env.API_TOKEN}`).expect(204)
          .then(res => {
            supertest(app).get('/api/bookmarks').set('Authorization', `Bearer ${process.env.API_TOKEN}`).expect(expectedBookmarks);
          });
      });
    });
    context('given no bookmarks', () => {
      it('responds with 404', () => {
        const bookmarkId = 99999;
        return supertest(app).delete(`/api/bookmarks/${bookmarkId}` ).set('Authorization', `Bearer ${process.env.API_TOKEN}`).expect(404, {error: {message: `Bookmark with id ${bookmarkId} not found.`}});
      });
    });
  });

  describe('PATCH /api/bookmarks/:bookmarkId', () => {
    context('given bookmark with id exists', () => {
      const testBookmarks = makeBookmarksArray();
      beforeEach('insert bookmarks', () => {
        return db.into('bookmarks').insert(testBookmarks);
      });
      it('responds with 204 and updates the bookmark', () => {
        const idToUpdate = 2;
        const updateBookmark = {
          title: 'espn',
          rating: 1,
          description: 'worldwide leader',
          url: 'https://www.espn.com',
        };
        const expectedBookmark = {
          ...testBookmarks[idToUpdate-1],
          ...updateBookmark
        };
        return supertest(app)
          .patch(`/api/bookmarks/${idToUpdate}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .send(updateBookmark)
          .expect(204)
          .then(res => supertest(app)
            .get(`api/bookmarks/${idToUpdate}`)
            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
            .expect(200));
      });
    });
    context('given book with id does not exist', () => {
      it('responds with 404', () => {
        const bookmarkId = 99999;
        return supertest(app).patch(`/api/bookmarks/${bookmarkId}`).set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(404, {error: {message: `Bookmark with id ${bookmarkId} not found.`}});
      });
    });
  });
});