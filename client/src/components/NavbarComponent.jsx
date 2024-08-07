import { Navbar, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { LogoutButton } from './AuthComponents';
import { useContext } from 'react';
import { AuthContext } from '../App';

function NavHeader(props) {
  const loggedInUser = useContext(AuthContext);
  return (
  <Navbar bg="primary" variant="dark">
    <Container fluid>
      <Link to='/' className='navbar-brand'>{props.appName}</Link>
      {loggedInUser ? 
        <LogoutButton logout={props.handleLogout} user={loggedInUser} /> :
        <Link to='/login'className='btn btn-outline-light'>Login</Link>
         }
    </Container>
  </Navbar>
  );
}

export default NavHeader;