const sqlite3 = require('sqlite3').verbose();
const SQLiteTag = require('sqlite-tag');

const db = new sqlite3.Database(':memory:');

module.exports = {
  tags: SQLiteTag(db)
};
