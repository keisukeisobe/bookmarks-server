const BookmarksService = {
  getAllBookmarks(knex) {
    return knex('bookmarks').select('*');
  },
  insertBookmark(knex, newBookmark) {
    return knex.insert(newBookmark)
      .into('bookmarks')
      .returning('*')
      .then(rows => rows[0]);
  },
  getById(knex, id){
    return knex('bookmarks').select('*').where('id', id).first();
  },
  deleteById(knex, id){
    return knex('bookmarks').where('id', id).delete();
  },
  updateBookmark(knex, id, newBookmarkData){
    return knex('bookmarks').where('id', id).update(newBookmarkData);
  }
};

module.exports = BookmarksService;