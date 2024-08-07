'use strict'

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);

function Page(id, title, author, creationDate, publicationDate, contents = [], userId = undefined) {
  this.id = id;
  this.title = title;
  this.author = author;
  this.creationDate = dayjs(creationDate).utc();
  this.publicationDate = publicationDate?dayjs(publicationDate).utc():'';
  this.contents = contents;
  this.userId = userId;
}

function Content(type, position, value, id = undefined) {
  this.id = id
  this.type = type;
  this.position = position;
  this.value = value;
}

export {Page, Content};