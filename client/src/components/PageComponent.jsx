import { Button, Card, Col, Container, Spinner, Row, Toast, ToastContainer } from "react-bootstrap";
import Form from 'react-bootstrap/Form';
import { useLocation, useNavigate, useNavigation, useParams } from "react-router-dom";
import React, { useEffect, useState } from 'react';
import { Page, Content } from "../models.js";
import API from './../API.js';
import Loading from "./LoadingComponent.jsx";
import eyes from './../imgs/eyes.jpg'
import office from './../imgs/office.jpg'
import kappa from './../imgs/kappa.jpg'
import forest from './../imgs/forest.jpg'
import dayjs from "dayjs";
import { useContext } from "react";
import { AuthContext } from "../App.jsx";
import ErrorToast from "./ErrorToastComponent.jsx";



export default function PageComponent() {
    const images = { eyes, office, kappa, forest };
    const location = useLocation();
    const navigate = useNavigate();

    const loggedInUser = useContext(AuthContext);

    const [loading, setLoading] = useState(false);
    const [editingMode, setEditingMode] = useState(false);

    //setting editingContent to true disables all the onClick callbacks to modify any item, 
    //so its value needs to be false if we are editing the page and true if we are not
    const [lockEditContent, setLockEditContent] = useState(true);

    const [pageDetailsEditing, setPageDetailsEditing] = useState(false);

    const [oldPosition, setOldPosition] = useState({ position: null, value: null });

    const [pageId, setPageId] = useState(useParams().pageId);

    const [page, setPage] = useState(null);

    const [contents, setContents] = useState([]);
    const [errorMessage, setErrorMessage] = useState(false);

    const canEditFn = (page)=>{
        const canEdit = location.pathname.startsWith('/edit-pages') && loggedInUser && (loggedInUser.role === 'Admin' || loggedInUser.id === page.userId);
        setEditingMode(canEdit);
        setLockEditContent(!canEdit);
    }

    const getPage = async () => {
        if (location.pathname.slice(-3) == 'new') {
            if (loggedInUser) {
                const page = {
                    title: '',
                    creationDate: dayjs().utc().second(0).millisecond(0),
                    publicationDate: dayjs().utc().second(0).millisecond(0),
                    author: loggedInUser.name,
                    userId: loggedInUser.id,
                    content: []
                };
                setPage(page);
                setPageDetailsEditing("new");
                setEditingMode(true);
                setLockEditContent(false);
                return;
            }
            return;
        }
        else if (pageId) {
            setLoading(true);
            let page = await API.getPage(pageId);
            setLoading(false);
            setContents(page.contents.map(c => {
                c.editing = false;
                return c;
            }).sort((a, b) => a.position - b.position));
            setPage(page);
            canEditFn(page)
        }
    }

    useEffect(() => {
      getPage(pageId);

    }, [pageId, loggedInUser, location.pathname]);



    const handleSetToEdit = (position) => {
        if (lockEditContent) return;
        setLockEditContent(true);
        let newContent = [...contents];
        newContent[position].editing = !newContent[position].editing;
        setContents(newContent);
    }

    const handleSetToEditPageDetails = () =>{
        if(editingMode) {
            if(pageDetailsEditing !=="new"){
                setLockEditContent(true)
            }
            setPageDetailsEditing("edit");
        }
    }
    const handleSavePage = (page) => {
        if(pageDetailsEditing== 'new'){
            let header = false
            let other = false
            for (const c of contents) {
            if (c.type == "header") header = true;
            else other = true;
            }
            if (!(header && other)) {
                setErrorMessage("One header type and at least one not-header type content are required");
                return;
            };

            page.contents = contents;
            setLoading(true);
            API.createPage(page).then((res)=>{
                setLoading(false);
                navigate(`/edit-pages`)
            }).catch((err)=>setErrorMessage(`Error creating page : ${err}`));
        }
        else{
            setLoading(true);
            API.updatePage(page.id, page).then(()=>{
                setLockEditContent(false);
                setPageDetailsEditing(false);
                getPage();
            }).catch((err)=>setErrorMessage(`Error updatig page : ${err}`));
        }

    }

    const handleSaveContent = (value, position) => {
        let newContent = [...contents];
        if (!newContent[position].editing) { 
            newContent[position].value = false;
            newContent[position].editing = false;
            setContents(newContent);
    
            setLockEditContent(false);
            setOldPosition({ position: null, value: null });
        }
        else {
            newContent[position].value = value;
            if(newContent[position].id){
                setLoading(true);
                API.updateContent(pageId, newContent[position], newContent[position].id).then(()=>{
                    setLoading(false);
                    console.log("UPDATING CONTENT")

                    newContent[position].value = value;
                    newContent[position].editing = false;
                    setContents(newContent);
            
                    setLockEditContent(false);
                    setOldPosition({ position: null, value: null });
                    getPage();
                }).catch((err)=>setErrorMessage(`Error updating content : ${err}`));
            } else {
                if(pageDetailsEditing!='new'){
                    console.log("ADDING CONTENT")
                    setLoading(true);
                API.addContent(pageId, newContent[position]).then(()=>{
                    newContent[position].value = value;
                    newContent[position].editing = false;
                    setContents(newContent);
            
                    setLockEditContent(false);
                    setOldPosition({ position: null, value: null });
                    getPage();
                }).catch((err)=>setErrorMessage(`Error adding content : ${err}`));
                } else{
                    console.log("ADDING CONTENT LOCALLY")
                    newContent[position].value = value;
                    newContent[position].editing = false;
                    setContents(newContent);
            
                    setLockEditContent(false);
                    setOldPosition({ position: null, value: null });
                }
            }

        }

    }

    const handleCancelContent = (position) => {
        if (!contents[position].value || (oldPosition.position && !oldPosition.value)) {
            handleDeleteContent(position);
            return;
        }
        let newContent = [...contents];
        newContent[position].editing = false;

        if (oldPosition.position != null) newContent = goToPosition(newContent, position, oldPosition.position - position, oldPosition.value);
        setContents(newContent);
        setLockEditContent(false);
        setOldPosition({ position: null, value: null });

    }

    const handleCancelPageDetails = () => {
        setLockEditContent(false);
        setPageDetailsEditing(false);
    }

    const handleDeleteContent = (position) => {

        let newContent = [...contents];
        newContent.splice(position, 1);

        if (contents[position].id == undefined) {   //handling removal of new added contents
            newContent.map((c, i) => {
                c.position = i;
                return c;
            })
            setContents(newContent);
            setLockEditContent(false);
            setOldPosition({ position: null, value: null });
            return;
        }

        let header = false
        let other = false
        for (const c of newContent) {
          if (c.type == "header") header = true;
          else other = true;
        }
        if (!(header && other)) {
            setErrorMessage("Cannot delete: one header type and at least one not-header type content are required");
            return;
        };
        setLoading(true);
        API.deleteContent(pageId, value.id).then(()=>{
            newContent.map((c, i) => {
                c.position = i;
                return c;
            })
    
            setContents(newContent);
            setLockEditContent(false);
            setOldPosition({ position: null, value: null });
            getPage();
        }).catch((err)=>setErrorMessage(`Error deleting content : ${err}`));
    }

    const handleAddContent = (type) => {
        setLockEditContent(true);
        setContents([...contents, { type: type, position: contents.length, editing: true }])
    }

    const goToPosition = (content, position, shift, value = undefined) => {
        if (shift == 0) return content;

        let oldContent = [...content];
        let tmp = content.splice(position, 1)[0];
        if (value) {
            tmp.value = value;
        }
        if (shift < 0) {
            if (position + shift < 0) return oldContent;
            for (let i = position - 1; i >= position + shift; i--) {
                content[i].position++;
            }
            tmp.position += shift;
            content.splice(position + shift, 0, tmp)

        } else {

            if (position + shift > content.length) return oldContent;

            for (let i = position; i < position + shift; i++) {
                content[i].position--;
            }

            tmp.position += shift;
            content.splice(position + shift, 0, tmp)
        }
        return content;
    }

    const handleMove = (position, up, value) => {
        if (oldPosition.position == null) {
            setOldPosition({ position: position, value: contents[position].value });
        }

        let newContent = goToPosition([...contents], position, up ? -1 : 1, value);
        setContents(newContent);


    }

    return (
        !page ? <Loading></Loading> :
            <Container>
                { editingMode && <Row>                
                    <h1>{pageDetailsEditing=='new'?'New Page':'Edit Page'}</h1>
                    <small>Double click on objects to modify them</small><br /><br /><hr />
                </Row>}
                <Row>
                {pageDetailsEditing? 
                <PageEditor
                    page={page}
                    handleSavePage = {handleSavePage}
                    navigate = {navigate}
                    handleCancelPageDetails = {handleCancelPageDetails}
                    setErrorMessage = {setErrorMessage}
                />:
                    <Container onDoubleClick={() => handleSetToEditPageDetails()}>
                    <Row>
                        <Col className="d-flex justify-content-center text-center"><h1>{page.title}</h1></Col>
                    </Row>
                    <Row >
                        <Col className="d-flex justify-content-center text-center"><p>Uploaded by {page.author} {page.publicationDate? page.publicationDate.local().format('YYYY-MM-DD HH:mm'): 'never'}</p></Col>
                    </Row>
                    </Container>

                }
                </Row>
                {
                    contents.map(content => {
                        if (content.type == "header") {
                            return content.editing ?
                                <Row key={content.position} >
                                    <HeaderEditor content={content}
                                        handleMove={handleMove}
                                        handleCancelButton={handleCancelContent}
                                        handleSaveButton={handleSaveContent}
                                        handleDeleteButton={handleDeleteContent} />
                                </Row>
                                : <Row key={content.position}><Col><h2 onDoubleClick={() => { handleSetToEdit(content.position) }}>{content.value}</h2></Col></Row>
                        }
                        if (content.type == "paragraph") {
                            return content.editing ?
                                <Row key={content.position} >
                                    <ParagraphEditor content={content}
                                        handleMove={handleMove}
                                        handleCancelButton={handleCancelContent}
                                        handleSaveButton={handleSaveContent}
                                        handleDeleteButton={handleDeleteContent} />
                                </Row>
                                : <Row key={content.position}><Col><p onDoubleClick={() => { handleSetToEdit(content.position) }}>{content.value}</p></Col></Row>
                        }

                        if (content.type == "image") {
                            return content.editing ?
                                <Row key={content.position} >
                                    <ImageEditor content={content}
                                        images={images}
                                        handleMove={handleMove}
                                        handleCancelButton={handleCancelContent}
                                        handleSaveButton={handleSaveContent}
                                        handleDeleteButton={handleDeleteContent} />
                                </Row>
                                : <Row key={content.position}><img className='image' src={images[content.value]} onDoubleClick={() => { handleSetToEdit(content.position) }} /></Row>
                        }
                    })
                }
                {editingMode && <Row><Col className="d-flex justify-content-center text-center">
                    <Button className="my-left-button" disabled={lockEditContent} onClick={() => handleAddContent('header')}>Add Header</Button>
                    <Button className="my-left-button" disabled={lockEditContent} onClick={() => handleAddContent('paragraph')}>Add Paragraph</Button>
                    <Button className="my-left-button" disabled={lockEditContent} onClick={() => handleAddContent('image')}>Add Image</Button>
                </Col></Row>}
                <ErrorToast errorMessage={errorMessage} setErrorMessage={setErrorMessage}/>
            </Container>
    );
}


function PageEditor(props){
    const [loading, setLoading] = useState(false);
    const loggedInUser = useContext(AuthContext);
    const [title, setTitle] = useState(props.page.title);
    const [user, setUser] = useState({name : props.page.author, id : props.page.userId});
    const [noPublicationDate, setNoPublicationDate] = useState(!props.page.publicationDate);
    const [publicationDate, setPublicationDate] = useState(props.page.publicationDate? props.page.publicationDate.local().format('YYYY-MM-DD HH:mm'):null);
    const [users, setUsers] = useState([]);


    const handleSubmit = (event) =>{
        event.preventDefault();
        let page = {
            id: props.page.id,
            author: user.author,
            userId: user.id,
            title: title,
        }
        if(!noPublicationDate){
            let pubDate = dayjs(publicationDate).second(0).millisecond(0);


            if(pubDate.isBefore(props.page.creationDate)){
                props.setErrorMessage("Publication date cannot be earlier than creation date")
                return;
            }
            page.publicationDate = pubDate

        }else{
            page.publicationDate = '';
        }
    
        props.handleSavePage(page);
    }

    useEffect(()=>{
        const getUsers = async () =>{
            setLoading(true);
            const users = await API.getUsers();
            setLoading(false);
            setUsers(users);
        }
        if(loggedInUser && loggedInUser.role === 'Admin'){
            getUsers();
        }
    }, [loggedInUser])

    const handleCancelPageDetails = () =>{
        if(!props.page.id){
            setTitle(props.page.title);
            setUser({name : props.page.author, id : props.page.userId});
            setPublicationDate(props.page.publicationDate.format('YYYY-MM-DD'));
        }
        else props.handleCancelPageDetails();
    }

    return(  
        
        <Form onSubmit={handleSubmit}>
        <Form.Group >
            <Form.Label>Title</Form.Label>
            <Form.Control type='text' value={title} onChange={ev => setTitle(ev.target.value)} required={true} placeholder="Insert page title"/>
        </Form.Group>

        <Form.Group >
            <Form.Label>Creation Date</Form.Label>
            <Form.Control type='datetime-local' value={props.page.creationDate.local().format('YYYY-MM-DD HH:mm')} readOnly={true}/>
        </Form.Group>

        <Form.Group >
        <Form.Label>Publication Date</Form.Label>
                <Form.Control
                    type="datetime-local"
                    value={publicationDate}
                    onChange={(ev) => setPublicationDate(ev.target.value)}
                    required={false}
                    disabled={noPublicationDate}
                />
                <Form.Check
                    type="checkbox"
                    label="Draft Page"
                    checked={noPublicationDate}
                    onChange={() => setNoPublicationDate(!noPublicationDate)}
                />
        </Form.Group>


        {loading?
        <Form.Group>
        <Form.Label>User</Form.Label>
        <br /><Spinner animation="border" role="status">
        <span className="visually-hidden">Loading...</span>
        </Spinner></Form.Group>:
        (users.length != 0 && 
        <Form.Group>
            <Form.Label>User</Form.Label>
            <Form.Select
            aria-label="Default select example" onChange={ev =>setUser({id : users[ev.target.value].id, name: users[ev.target.value].id})} >
                {users.map((u, i) => (
                <option value={i} key={i} selected={user.name==u.name}>
                    {u.name}
                </option>
                ))}
            </Form.Select>
        </Form.Group>
        )}
        <Button type="submit" className='my-button-padding'>{props.page.id?'Save Page Details':'Create Page'}</Button>
        <Button className='my-button-padding' variant='secondary'  onClick={()=> handleCancelPageDetails()}>Cancel</Button>
        {!props.page.id && <Button className='my-button-padding' variant='danger'  onClick={()=> props.navigate('/edit-pages')}>Quit Page Creation</Button>}


    </Form>
);


}

function HeaderEditor(props) {
    const [value, setValue] = useState(props.content.value);


    const handleFieldChange = (value) => {
        setValue(value);

    }
    return (
        <Card className="card-margin"><Card.Body>
            <Container>
                <Row>
                    <textarea rows={2}
                        autoFocus
                        className="form-control no-border"
                        placeholder="Insert header"
                        type="text"
                        value={value}
                        onChange={(event) => handleFieldChange(event.target.value)} />
                </Row>
                <Row>
                    <Col className="no-padding">
                        <Button className='my-left-button'  onClick={() => props.handleMove(props.content.position, true, value)}>Move Up</Button>
                        <Button className='my-left-button' onClick={() => props.handleMove(props.content.position, false, value)}>Move Down</Button>
                    </Col>
                    <Col className="no-padding">
                        <Button className='my-button'  disabled={!value} onClick={() => props.handleSaveButton(value, props.content.position)}>Save</Button>
                        <Button className='my-button' variant='secondary' onClick={() => props.handleCancelButton(props.content.position)}>Cancel</Button>
                        <Button className='my-button' variant='danger' onClick={() => props.handleDeleteButton(props.content.position)}>Delete</Button>
                    </Col>
                </Row>
            </Container>
        </Card.Body></Card>);
}

function ParagraphEditor(props) {
    const [value, setValue] = useState(props.content.value);

    const handleFieldChange = (value) => {
        setValue(value);
    }

    return (
        <Card className="card-margin"><Card.Body>
            <Container>
                <Row>
                    <textarea rows={10}
                        autoFocus
                        className="form-control no-border"
                        placeholder="Insert paragraph"
                        size="m" type="text"
                        value={value}
                        onChange={(event) => handleFieldChange(event.target.value)} />
                </Row>
                <Row>
                    <Col className="no-padding">
                        <Button className='my-left-button' onClick={() => props.handleMove(props.content.position, true, value)}>Move Up</Button>
                        <Button className='my-left-button' onClick={() => props.handleMove(props.content.position, false, value)}>Move Down</Button>
                    </Col>
                    <Col className="no-padding">
                        <Button className='my-button' disabled={!value} onClick={() => props.handleSaveButton(value, props.content.position)}>Save</Button>
                        <Button className='my-button' variant='secondary' onClick={() => props.handleCancelButton(props.content.position)}>Cancel</Button>
                        <Button className='my-button' variant='danger' onClick={() => props.handleDeleteButton(props.content.position)}>Delete</Button>
                    </Col>
                </Row>
            </Container>
        </Card.Body></Card>);

}

function ImageEditor(props) {
    const [value, setValue] = useState(props.content.value)

    const handleFieldChange = (value) => {
        setValue(value);
    }
    return (
        <Card className="card-margin"><Card.Body>
            <Container>
                <Row>
                    <img className='image' src={props.images[value]} />
                </Row>
                <Row>
                    <Col className="d-flex justify-content-center text-center">
                        <img src={props.images['office']} className={value == 'office' ? ' thumbnail_chosen' : 'thumbnail'} onClick={() => handleFieldChange('office')} />
                        <img src={props.images['eyes']} className={value == 'eyes' ? ' thumbnail_chosen' : 'thumbnail'} onClick={() => handleFieldChange('eyes')} />
                        <img src={props.images['forest']} className={value == 'forest' ? ' thumbnail_chosen' : 'thumbnail'} onClick={() => handleFieldChange('forest')} />
                        <img src={props.images['kappa']} className={value == 'kappa' ? ' thumbnail_chosen' : 'thumbnail'} onClick={() => handleFieldChange('kappa')} />
                    </Col>
                </Row>
                <Row>
                    <Col>
                        <Button className='my-left-button' onClick={() => props.handleMove(props.content.position, true, value)}>Move Up</Button>
                        <Button className='my-left-button' onClick={() => props.handleMove(props.content.position, false, value)}>Move Down</Button>
                    </Col>
                    <Col>
                        <Button className='my-button' disabled={!value} onClick={() => props.handleSaveButton(value, props.content.position)}>Save</Button>
                        <Button className='my-button' variant='secondary' onClick={() => props.handleCancelButton(props.content.position)}>Cancel</Button>
                        <Button className='my-button' variant='danger' onClick={() => props.handleDeleteButton(props.content.position)}>Delete</Button>
                    </Col></Row>
            </Container>
        </Card.Body></Card>
    );
}
