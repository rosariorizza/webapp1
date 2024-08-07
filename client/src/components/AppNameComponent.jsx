import React from 'react';
import { Container, Form, Button } from 'react-bootstrap';
import { useState, useContext } from 'react';
import API from '../API';
import { useNavigate } from 'react-router-dom';
import ErrorToast from './ErrorToastComponent';

function AppName(props) {

    const [name, setName] = useState(props.appName);
    const [errorMessage, setErrorMessage] = useState(false);


    const navigate = useNavigate();

    const handleSubmit = (event) => {
        event.preventDefault();
        API.setAppName(name).then(()=>{
            props.update();
            navigate('/');
        }).catch((err)=>setErrorMessage(`Error changing name : ${err}`));
    };
  
    return (
    <><h2>Change application name</h2>
    <Form onSubmit={handleSubmit}>
        <Form.Group >
            <Form.Label>Name</Form.Label>
            <Form.Control type='text' value={name} onChange={ev => setName(ev.target.value)} required={true} />
        </Form.Group>
  
        <Button type="submit" className='login-button'>Submit</Button>
    </Form>
    <ErrorToast errorMessage={errorMessage} setErrorMessage={setErrorMessage}/>

    </>
    );
}

export default AppName;