'use strict'

const dayjs = require('dayjs');

function Page(id, title, author, creationDate, publicationDate, contents = [], userId = undefined) {
  this.id = id;
  this.title = title;
  this.author = author;
  this.creationDate = dayjs(creationDate);
  this.publicationDate = dayjs(publicationDate);
  this.contents = contents;
  this.userId = userId;
}

function Content(id, type, position, value) {
  this.id = id;
  this.type = type;
  this.position = position;
  this.value = value;
}

module.exports = { Page, Content };