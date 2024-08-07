import { useState, useEffect, useContext } from 'react';
import { Row, Col, Table, Card, Container, Button } from 'react-bootstrap';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import API from '../API';
import { AuthContext } from '../App';
import dayjs from 'dayjs';
import Loading from './LoadingComponent';
import ErrorToast from "./ErrorToastComponent.jsx";




export default function PageTableComponent() {

  const loggedInUser = useContext(AuthContext);

  const [loading, setLoading] = useState(false);
  const [pages, setPages] = useState([]);
  const [config, setConfig] = useState(0); //0 unauthenticated, -1 admin, >0 regular
  const [errorMessage, setErrorMessage] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const getPages = async () => {
    setLoading(true);
    const pages = await API.getAllPages();
    setPages(pages);
    setLoading(false);
  }

  const handleDelete = (pageId) => {
    setLoading(true);
    API.deletePage(pageId).then(() =>{
      getPages();
    }).catch((err)=>setErrorMessage(`Error deleting page : ${err}`));

  }

  useEffect(() => {
    if (!loggedInUser) setConfig(0);
    else {
      if (location.pathname !== '/edit-pages') {
        setConfig(0);
      }
      else {
        if (loggedInUser.role == 'Admin') {
          setConfig(-1);
        }
        else {
          setConfig(loggedInUser.id);
        }
      }
    }
    getPages();
  }, [loggedInUser, location])

  if (!loading) return (
    <Container>
      <Row>
      <Col><h1>Pages</h1></Col>
      {config != 0 && <Col><Button variant='success' className="my-button-padding" onClick={() => navigate('/edit-pages/new')}>Add New Page</Button></Col>}
      </Row>
      <Table bordered hover >
        <thead>
          <tr>
            <th>Title</th>
            <th>Author</th>
            {config != 0 && <th>Creation Date</th>}
            <th>Publication Date</th>
            {config != 0 && <th>Status</th>}
            <th>
              <div className="text-center">Visit Page</div>
            </th>
            {config !== 0 && (
              <>
                <th>
                  <div className="text-center">Edit Page</div>
                </th>
                <th>
                  <div className="text-center">Delete Page</div>
                </th>
              </>
            )}

          </tr>
        </thead>
        <tbody>
          {pages.sort((a, b) => {
            if (config == 0) {
              if (!a.publicationDate) return 1;
              if (!b.publicationDate) return -1;
              return a.publicationDate.isAfter(b.publicationDate) ? 1 : -1;
            }
            else return a.creationDate.isAfter(b.creationDate) ? 1 : -1
          }).map((p) => <PageRow page={p} key={p.id} config={config} navigate={navigate} handleDelete={handleDelete} />)}
        </tbody>
      </Table>
      <ErrorToast errorMessage={errorMessage} setErrorMessage={setErrorMessage}/>

    </Container>
  );
  return (<Loading></Loading>)
}


function PageRow(props) {
  const getStatus = (pub) => {
    if (!pub) return "Draft"
    if (pub.isAfter(dayjs().utc())) return "Scheduled"
    else return "Published"

  }
  if ((getStatus(props.page.publicationDate) === "Draft" || getStatus(props.page.publicationDate) === "Scheduled") && props.config == 0) return;
  return (
    <tr>
      <td>{props.page.title}</td>
      <td>{props.page.author}</td>
      {props.config != 0 && <td>{props.page.creationDate.local().format('YYYY-MM-DD HH:mm')}</td>}
      <td>{props.page.publicationDate ? props.page.publicationDate.local().format('YYYY-MM-DD HH:mm') : "Not defined"}</td>
      {props.config != 0 && <td>{getStatus(props.page.publicationDate)}</td>}
      <td>
        <div className="d-flex justify-content-center">
          <Button className="my-left-button" onClick={() => props.navigate(`/pages/${props.page.id}`)}>
            Visit Page
          </Button>
        </div>
      </td>
      {
        (props.config < 0 || props.config === props.page.userId) ? (
          <>
            <td>
              <div className="d-flex justify-content-center">
                <Button className="my-left-button"  onClick={() => props.navigate(`/edit-pages/${props.page.id}`)}>
                  Edit Page
                </Button>
              </div>
            </td>
            <td>
              <div className="d-flex justify-content-center">
                <Button className="my-left-button" variant='danger' onClick={() => props.handleDelete(props.page.id)}>
                  Delete Page
                </Button>
              </div>
            </td>
          </>
        ) : (props.config !== 0 && (
          <>
            <td></td>
            <td></td>
          </>
        ))
      }

    </tr>
  );
}

