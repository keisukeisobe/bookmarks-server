const express = require('express');
const bookmarksRouter = express.Router();
const bodyParser = express.json();
const uuid = require('uuid/v4');
const logger = require('./logger');
const { bookmarks } = require('./store');

bookmarksRouter.route('/bookmarks')
  .get( (req, res) => {
    res.json(bookmarks);
  })
  .post(bodyParser, (req, res) => {
    const {title, url, description, rating} = req.body;
    if (!title || !url || !description || !rating) {
      logger.error('All fields are required');
      return res.status(400).send('Invalid data');
    }
    const id = uuid();
    const bookmark = {
      id,
      title,
      url,
      description,
      rating
    };
    //bookmarks.push(bookmark);
    logger.info(`Bookmark with id ${id} created`);
    res.status(201).location(`http://localhost:8000/bookmark/${id}`).json(bookmark);
  });

bookmarksRouter.route('/bookmarks/:id')
  .get( (req, res) => {
    const {id} = req.params;
    const bookmark = bookmarks.find(bMark => bMark.id === id);
    if (!bookmark) {
      logger.error(`Bookmark with id ${id} not found.`);
      return res.status(404).send('Bookmark not found');
    }
    res.json(bookmark);
  })
  .delete( (req, res) => {
    const {id} = req.params;
    const bookmarkIndex = bookmarks.findIndex(bMark => bMark.id === id);
    if (bookmarkIndex === -1) {
      logger.error(`Bookmark with id ${id} not found.`);
      return res.status(404).send('Bookmark not found');
    }
    bookmarks.splice(bookmarkIndex, 1);
    res.status(204).end();
  });

module.exports = bookmarksRouter;