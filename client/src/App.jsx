import 'bootstrap/dist/css/bootstrap.min.css';
import { useCallback, useContext, useEffect, useState, createContext } from 'react';
import { BrowserRouter, Routes, Route, Outlet, Navigate, useNavigate } from 'react-router-dom';
import PageTable from './components/PageTableComponent';
import NavHeader from './components/NavbarComponent';
import API from './API.js';
import { Container, Row, Alert } from 'react-bootstrap';
import PageComponent from './components/PageComponent';
import PageTableComponent from './components/PageTableComponent';
import AppName from './components/AppNameComponent'
import './App.css'
import NotFound from './components/NotFoundComponent';
import { LoginForm, LogoutButton } from './components/AuthComponents';
import ErrorToast from './components/ErrorToastComponent';

export const AuthContext = createContext(null);

function App() {

  const [appName, setAppName] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState(false);

  const updateAppName = async ()=>{
    const appName = await API.getAppName();
    setAppName(appName);
  }

  useEffect(() => {
    const checkAuth = async () => {
      const user = await API.getUserInfo(); // we have the user info here
      setLoggedIn(user);
      updateAppName();

    };
    checkAuth();
  }, []);


  const handleLogin = (credentials) => {
    API.logIn(credentials).then((user) =>{
      setLoggedIn(user);
    }).catch((err)=>setErrorMessage(`Error during log in : ${err}`));
  };

  const handleLogout = () => {
    API.logOut().then(()=>setLoggedIn(false)).catch((err)=>setErrorMessage(`Error during log out : ${err}`));
    
  };

  return (
    <>
    <AuthContext.Provider value={loggedIn}>
    <BrowserRouter>
      <Routes>
        <Route element={
          <>
            <NavHeader handleLogout={handleLogout}  appName={appName}/>
            <Container fluid className="mt-3">

              <Outlet />
            </Container>
          </>} >
          <Route index
            element={<PageTableComponent />} />

          <Route path='pages/:pageId'
            element={<PageComponent />} />

          { loggedIn &&
           <><Route path='edit-pages'
              element={<PageTableComponent/>} />
          <Route path='edit-pages/:pageId'
              element={<PageComponent/>} />
          <Route path='edit-pages/new'
              element={<PageComponent />} /></>
              }
          <Route path='appname' element={<AppName appName={appName} update={updateAppName}/>} />
          <Route path='*' element={<NotFound />} />
          <Route path='/login' element={
            loggedIn ? <Navigate replace to='/edit-pages' /> : <LoginForm login={handleLogin} />
          } />
        </Route>
      </Routes>
    </BrowserRouter>
    </AuthContext.Provider>
    <ErrorToast errorMessage={errorMessage} setErrorMessage={setErrorMessage}/></>


  );


}

export default App
