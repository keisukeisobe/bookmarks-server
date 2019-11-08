const express = require('express');
const bookmarksRouter = express.Router();
const jsonParser = express.json();
const logger = require('./logger');
const xss = require('xss');
const path = require('path');
const BookmarksService = require('./bookmarks-service');

bookmarksRouter.route('/api/bookmarks')
  .get( (req, res, next) => {
    const knexInstance = req.app.get('db');
    BookmarksService.getAllBookmarks(knexInstance)
      .then(bookmarks => {
        res.json(bookmarks.map(bookmark => ({
          id: bookmark.id,
          title: xss(bookmark.title),
          url: xss(bookmark.url),
          description: xss(bookmark.description),
          rating: bookmark.rating
        })));
      })
      .catch(next);
  })
  .post(jsonParser, (req, res, next) => {
    const knexInstance = req.app.get('db');
    const {id, title, url, description, rating} = req.body;
    const newBookmark = {id: xss(id), title: xss(title), url: xss(url), description: xss(description), rating};

    for(const[key, value] of Object.entries(newBookmark)) {
      if(value === null) {
        return res.status(400).json({
          error: {message: `Missing '${key}' in request body` }
        });
      }
    }

    BookmarksService.insertBookmark(knexInstance, newBookmark)
      .then(bookmark => {
        res.status(201)
          .location(path.posix.join(req.originalUrl, `/${bookmark.id}`))
          .json(bookmark);
      })
      .catch(next);
  });

bookmarksRouter.route('/api/bookmarks/:id')
  .all( (req, res, next) => {
    BookmarksService.getById(req.app.get('db'), req.params.id)
      .then(bookmark => {
        if(!bookmark) {
          return res.status(404).json({
            error: {message: `Bookmark with id ${req.params.id} not found.`}
          });
        }
        res.bookmark = {
          id: bookmark.id,
          title: xss(bookmark.title),
          rating: bookmark.rating,
          url: xss(bookmark.url),
          description: xss(bookmark.description)
        };
        next();
      })
      .catch(next);
  })
  .get( (req, res) => {
    return res.json(res.bookmark);
  })
  .delete( (req, res, next) => {
    const {id} = req.params;
    const knexInstance = req.app.get('db');
    BookmarksService.deleteById(knexInstance, id)
      .then(bookmark => {
        if(!bookmark) {
          logger.error(`Bookmark with id ${id} not found`);
          return res.status(404).send('Bookmark not found');
        }
        return res.status(204).end();
      })
      .catch(next);
  })
  .patch(jsonParser, (req, res, next) => {
    const knexInstance = req.app.get('db');
    const {title, url, rating, description } = req.body;
    const newBookmarkData = { title: xss(title), rating: xss(rating), url: xss(url), description: xss(description)};
    BookmarksService.updateBookmark(knexInstance, req.params.id, newBookmarkData)
      .then( () => {
        return res.status(204).end();
      })
      .catch(next);
  });

module.exports = bookmarksRouter;