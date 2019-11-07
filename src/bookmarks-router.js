const express = require('express');
const bookmarksRouter = express.Router();
const bodyParser = express.json();
const uuid = require('uuid/v4');
const logger = require('./logger');
const { bookmarks } = require('./store');
const BookmarksService = require('./bookmarks-service');

bookmarksRouter.route('/bookmarks')
  .get( (req, res, next) => {
    const knexInstance = req.app.get('db');
    BookmarksService.getAllBookmarks(knexInstance)
      .then(bookmarks => {
        res.json(bookmarks.map(bookmark => ({
          id: bookmark.id,
          title: bookmark.title,
          url: bookmark.url,
          description: bookmark.description,
          rating: bookmark.rating
        })));
      })
      .catch(next);
  });
// .post(bodyParser, (req, res) => {
//   const {title, url, description, rating} = req.body;
//   if (!title || !url || !description || !rating) {
//     logger.error('All fields are required');
//     return res.status(400).send('Invalid data');
//   }
//   const id = uuid();
//   const bookmark = {
//     id,
//     title,
//     url,
//     description,
//     rating
//   };
//   logger.info(`Bookmark with id ${id} created`);
//   res.status(201).location(`http://localhost:8000/bookmark/${id}`).json(bookmark);
// });

bookmarksRouter.route('/bookmarks/:id')
  .get( (req, res, next) => {
    const {id} = req.params;
    const knexInstance = req.app.get('db');
    BookmarksService.getById(knexInstance, id)
      .then(bookmark => {
        if (!bookmark) {
          logger.error(`Bookmark with id ${id} not found.`);
          return res.status(404).send('Bookmark not found');
        }    
        return res.json({
          id: bookmark.id,
          title: bookmark.title,
          url: bookmark.url,
          description: bookmark.description,
          rating: bookmark.rating
        });
      })
      .catch(next);
  });
// .delete( (req, res) => {
//   const {id} = req.params;
//   const bookmarkIndex = bookmarks.findIndex(bMark => bMark.id === id);
//   if (bookmarkIndex === -1) {
//     logger.error(`Bookmark with id ${id} not found.`);
//     return res.status(404).send('Bookmark not found');
//   }
//   bookmarks.splice(bookmarkIndex, 1);
//   res.status(204).end();
// });

module.exports = bookmarksRouter;