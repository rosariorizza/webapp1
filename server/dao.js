'use strict';

const { db } = require('./db.js');
const { Page, Content } = require('./models')


exports.createPage = (page) => {
  return new Promise((resolve, reject) => {
    const sql = 'INSERT INTO page (title, userId, creationDate, publicationDate) VALUES(?, ?, ?, ?)';
    db.run(sql, [page.title, page.userId, page.creationDate, page.publicationDate], function (err) {
      if (err) {
        reject(err);
      }
      resolve(this.lastID);
    });
  });
};

exports.getAllPages = () => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT p.id, p.title, u.name as author, p.creationDate, p.publicationDate, p.userId FROM page p, user u WHERE u.id = p.userId ';
    db.all(sql, [], (err, rows) => {
      if (err) {
        reject(err);
      }
      const pages = rows.map((page) => new Page(page.id, page.title, page.author, page.creationDate, page.publicationDate, [], page.userId));
      resolve(pages);
    });
  });
}


exports.getPage = (id) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT p.id, p.title, u.name as author, p.creationDate, p.publicationDate, p.userId FROM page p, user u WHERE u.id = p.userId and p.id= ?';
    db.get(sql, [id], (err, row) => {
      if (err)
        reject(err);
      if (row === undefined)
        resolve({ error: 'Page not found.' });
      else {
        const sql2 = 'SELECT * FROM content WHERE pageId = ?'
        db.all(sql2, [id], (err2, rows) => {
          if (err2) reject(err2);
          else {
            const contents = rows.map((content) => new Content(content.id, content.type, content.position, content.value))
            const page = new Page(row.id, row.title, row.author, row.creationDate, row.publicationDate, contents, row.userId)
            resolve(page)
          }
        })
      }
    });
  });
};


exports.getPageUserId = (id) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT userId FROM page WHERE page.id = ?';
    db.get(sql, [id], (err, row) => {
      if (err)
        reject(err);
      if (row === undefined)
        resolve({ error: 'Page not found.' });
      else {
        resolve(row)
      }
    });
  });
};


exports.getContentUserId = (pageId, contentId) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT p.userId FROM page p, content c WHERE p.id = ? and c.id=? and p.id=c.pageId';
    db.get(sql, [pageId, contentId], (err, row) => {
      if (err)
        reject(err);
      if (row === undefined)
        resolve({ error: 'Page not found.' });
      else {
        resolve(row)
      }
    });
  });
};


exports.updatePage = (page, pageId) => {
  return new Promise((resolve, reject) => {
    const sql = 'UPDATE page SET title=?, userId=?, publicationDate=? WHERE id=?';
    db.run(sql, [page.title, page.userId, page.publicationDate, pageId], function (err) {
      if (err) {
        reject(err);
      }
      else resolve(this.lastID);
    });
  });
};


exports.deletePage = (pageId) => {
  return new Promise((resolve, reject) => {
    const sql = 'DELETE FROM page WHERE id = ?'
    db.run(sql, [pageId], (err) => {
      if (err) {
        reject(err);
      } else {
        resolve(null);
      }
    });
  })
}

exports.deletePage = (pageId) => {
  return new Promise((resolve, reject) => {
    const sql = 'DELETE FROM content WHERE pageId = ?'
    const sql2 = 'DELETE FROM page WHERE id = ?'
    db.run(sql, [pageId], (err) => {
      if (err) {
        reject(err);
      } else {
        db.run(sql2, [pageId], (err2) => {
          if (err2) {
            reject(err2);
          } else {
            resolve(null);
          }
        });
      }
    });
  })
}

exports.addContent = (content, pageId) => {
  return new Promise((resolve, reject) => {
    const sql = 'UPDATE content SET position = position+1 WHERE position>=? and pageId=?';
    db.run(sql, [content.position, pageId], function (err) {
      if (err) {
        reject(err);
      }
      else {
        const sql2 = 'INSERT INTO content (pageId, type, position, value) VALUES(?, ?, ?, ?)'
        db.run(sql2, [pageId, content.type, content.position, content.value], function (err) {
          if (err) {
            reject(err);
          }
          resolve(this.lastID);
        });
      }
    });
  });
};

exports.updateContentPosition = (pageId, contentId, content, oldPosition = null) => {
  if (oldPosition != null && content.position != oldPosition) {
    return new Promise((resolve, reject) => {
      const sql = content.position - oldPosition > 0 ?
        'UPDATE content SET position = position-1 WHERE position>? and position<=? and pageId=?' :
        'UPDATE content SET position = position+1 WHERE position<? and position>=? and pageId=?';
      db.run(sql, [oldPosition, content.position, pageId], function (err) {
        if (err) {
          reject(err);
        }
        else {
          const sql2 = 'UPDATE content SET type=?, position=?, value=? WHERE id=? and pageId=?';
          db.run(sql2, [content.type, content.position, content.value, contentId, pageId], function (err) {
            if (err) {
              reject(err);
            }
            else resolve(this.lastID);
          });
        }
      });
    });
  }
  else {
    return new Promise((resolve, reject) => {
      const sql = 'UPDATE content SET type=?, position=?, value=? WHERE id=? and pageId=?';
      db.run(sql, [content.type, content.position, content.value, contentId, pageId], function (err) {
        if (err) {
          reject(err);
        }
        else resolve(this.lastID);
      });
    });
  }
}


exports.getContentsByPageId = (pageId) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM content WHERE pageId = ?';
    db.all(sql, [pageId], (err, rows) => {
      if (err)
        reject(err);
      else {
        const contents = rows.map((content) => new Content(content.id, content.type, content.position, content.value))
        resolve(contents);
      }
    });
  });
}

exports.deleteContent = (contentId, pageId, oldPosition) => {
  return new Promise((resolve, reject) => {
    const sql = 'UPDATE content SET position = position-1 WHERE position>=? and pageId=?';
    db.run(sql, [oldPosition, pageId], function (err) {
      if (err) {
        reject(err);
      }
      else {
        const sql2 = 'DELETE FROM content WHERE id = ? and pageId=?';
        db.run(sql2, [contentId, pageId], (err) => {
          if (err) {
            reject(err);
            //could do rollback
          } else
            resolve(null);
        });
      }
    });
  })
}

exports.setAppName = (name) => {
  return new Promise((resolve, reject) => {
    const sql = 'INSERT INTO app_status (name) VALUES(?)'
    db.run(sql, [name], function (err) {
      if (err) {
        reject(err);
      }
      resolve(this.lastID);
    });
  });
}

exports.getAppName = (name) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT name FROM app_status ORDER BY id DESC LIMIT 1'
    db.get(sql, [name], function (err, row) {
      if (err) {
        reject(err);
      }
      resolve(row.name);
    });
  });
}
