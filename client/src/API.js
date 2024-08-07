import { Content, Page } from './models.js';
const SERVER_URL = 'http://localhost:3001';

const logIn = async (credentials) => {
  const response = await fetch(SERVER_URL + '/api/sessions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(credentials),
  });
  if(response.ok) {
    const user = await response.json();
    return user;
  }
  else {
    const errDetails = await response.text();
    throw errDetails;
  }
};

const getUserInfo = async () => {
  const response = await fetch(SERVER_URL + '/api/sessions/current', {
    credentials: 'include',
  });
  const user = await response.json();
  if (response.ok) {
    return user;
  } else {
    throw user;  // an object with the error coming from the server
  }
};

const logOut = async() => {
  const response = await fetch(SERVER_URL + '/api/sessions/current', {
    method: 'DELETE',
    credentials: 'include'
  });
  if (response.ok)
    return null;
}

const getUsers = async () => {
  const response = await fetch(SERVER_URL + '/api/users', { credentials: 'include' });
  if(response.ok) {
    const users = await response.json();
    return users.map(user => {return {id: user.id, name: user.name, role: user.role, email: user.email}});
  }
  else
    throw new Error('Internal server error');
}

const getAppName = async () => {
  const response = await fetch(SERVER_URL + '/api/appName');
  if(response.ok) {
    const name = await response.json();
    return name
  }
  else
    throw new Error('Internal server error');
}

const setAppName = async (name) => {
  const response = await fetch(`${SERVER_URL}/api/appName`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({name: name}),
      credentials: 'include'
    });
 
  if(response.ok) {
    return;
  }
  else{
    const pageJson = await response.json();
    throw pageJson;

  }
}

const getAllPages = async () => {
  const response = await fetch(SERVER_URL + '/api/pages');
  if(response.ok) {
    const pages = await response.json();
    return pages.map(page => new Page(page.id, page.title, page.author, page.creationDate, page.publicationDate, [], page.userId));
  }
  else
    throw new Error('Internal server error');
}

const getPage = async (pageId) => {
    const response = await fetch(SERVER_URL + `/api/pages/${pageId}`);
    const page = await response.json();
    if(response.ok) {
      const contents = page.contents.map(c => new Content(c.type, c.position, c.value, c.id))
      return new Page(page.id, page.title, page.author, page.creationDate, page.publicationDate, contents, page.userId);
    }
    else
      throw page;
}

const createPage = async (page) => {
    const response = await fetch(`${SERVER_URL}/api/pages`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({title: page.title, publicationDate: page.publicationDate, userId: page.userId, contents: page.contents}),
        credentials: 'include'
      });
    const pageJson = await response.json();
    if(response.ok) {
      return pageJson;
    }
    else
      throw pageJson;
}
const updatePage = async (pageId, page) => {
  const response = await fetch(`${SERVER_URL}/api/pages/${pageId}`, {
      method: 'PATCH',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({title: page.title, publicationDate: page.publicationDate, userId: page.userId}),
      credentials: 'include'
    });
  
  if(response.ok) {
    return;
  }
  else{
    const pageJson = await response.json();
    throw pageJson;
  }
}

const deletePage = async (pageId) => {
  const response = await fetch(`${SERVER_URL}/api/pages/${pageId}`, {
      method: 'DELETE',
      credentials: 'include'
    });
  const pageJson = await response.json();
  if(response.ok) {
    return pageJson;
  }
  else
    throw pageJson;
}

const addContent = async (pageId, content) => {
  const response = await fetch(`${SERVER_URL}/api/pages/${pageId}/contents/`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(content),
      credentials: 'include'
    });
  const contentJson = await response.json();
  if(response.ok) {
    return contentJson;
  }
  else
    throw contentJson;
}

const updateContent = async (pageId, content, contentId) => {
  const response = await fetch(`${SERVER_URL}/api/pages/${pageId}/contents/${contentId}`, {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({type: content.type, position: content.position, value: content.value}),
      credentials: 'include'
    });
  if(response.ok) {
    return;
  }
  else{
    const contentJson = await response.json();
    throw contentJson;

  }
}

const deleteContent = async (pageId, contentId) => {
  const response = await fetch(`${SERVER_URL}/api/pages/${pageId}/contents/${contentId}`, {
    method: 'DELETE',
    credentials: 'include'
    });
  const contentJson = await response.json();
  if(response.ok) {
    return contentJson;
  }
  else
    throw contentJson;
}

const API = {getAllPages, getPage, createPage, logIn, logOut, getUserInfo, deleteContent, updateContent, addContent, deletePage, updatePage, getUsers, getAppName, setAppName};
export default API;