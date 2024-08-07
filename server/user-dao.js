'use strict';

const { db } = require('./db.js');
const crypto = require('crypto');

exports.getUser = (email, password) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM user WHERE email = ?';
    db.get(sql, [email], (err, row) => {
      if (err) { 
        reject(err); 
      }
      else if (row === undefined) { 
        resolve(false); 
      }
      else {
        const user = {id: row.id, email: row.email, name: row.name, role: row.role};
        
        crypto.scrypt(password, row.salt, 32, function(err, hashedPassword) {
          if (err) reject(err);
          if(!crypto.timingSafeEqual(Buffer.from(row.password, 'hex'), hashedPassword))
            resolve(false);
          else
            resolve(user);
        });
      }
    });
  });
};

exports.getUserById = (id) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM user WHERE id = ?';
    db.get(sql, [id], (err, row) => {
      if (err) { 
        reject(err); 
      }
      else if (row === undefined) { 
        resolve({error: 'User not found!'}); 
      }
      else {
        const user = {id: row.id, email: row.email, name: row.name, role: row.role};
        resolve(user);
      }
    });
  });
};

exports.getUsers = () => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT * FROM user';
    db.all(sql, [], (err, rows) => {
      if (err) { 
        reject(err); 
      }
      else {
        const users = rows.map(row => {return {id: row.id, email: row.email, name: row.name, role: row.role}});
        resolve(users);
      }
    });
  });
};