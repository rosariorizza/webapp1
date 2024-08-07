'use strict';

const sqlite = require('sqlite3');


// open the database
exports.db = new sqlite.Database('cmsmall.db', (err) => {
  if (err) {
    console.log(err);
    throw err;
  }
});


