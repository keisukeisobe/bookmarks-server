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
    const newBookmarkData = {};
    if (req.body.title) {
      newBookmarkData.title = xss(req.body.title);
    } else {
      newBookmarkData.title = null;
    }
    if (req.body.url) {
      newBookmarkData.url = xss(req.body.url);
    } else {
      newBookmarkData.url = null;
    }
    if (req.body.rating) {
      newBookmarkData.rating = parseInt(req.body.rating);
    } else {
      newBookmarkData.rating = null;
    }
    if(req.body.description) {
      newBookmarkData.description = xss(req.body.description);
    } else {
      newBookmarkData.description = null;
    }
    for(const[key, value] of Object.entries(newBookmarkData)) {
      if(value === null) {
        return res.status(400).json({
          error: {message: `Missing '${key}' in request body` }
        });
      }
    }

    BookmarksService.insertBookmark(knexInstance, newBookmarkData)
      .then(bookmark => {
        res.status(201)
          .location(path.posix.join(req.originalUrl, `${bookmark.id}`))
          .json(bookmark);
      })
      .catch(next);
  });

bookmarksRouter.route('/api/bookmarks/:id')
  .all( (req, res, next) => {
    const knexInstance = req.app.get('db');
    BookmarksService.getById(knexInstance, req.params.id)
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
        return null;
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
    const newBookmarkData = {};
    if (title) {
      newBookmarkData.title = xss(title);
    }
    if (url) {
      newBookmarkData.url = xss(url);
    }
    if (rating) {
      newBookmarkData.rating = parseInt(rating);
    }
    if(description) {
      newBookmarkData.description = xss(description);
    }
    const numberOfValues = Object.values(newBookmarkData).filter(Boolean).length;
    if (numberOfValues === 0) {
      return res.status(400).json({
        error: {
          message: 'Request body must contain either \'title\', \'url\', and \'id\'.'
        }
      });
    }
    
    BookmarksService.updateBookmark(knexInstance, req.params.id, newBookmarkData)
      .then( () => {
        return res.status(204).end();
      })
      .catch(next);
  });

module.exports = bookmarksRouter;