import { Toast, ToastContainer } from "react-bootstrap"

export default function ErrorToast(props) {
    
    return (
        <ToastContainer
            className="p-3"
            position={"bottom-start"}
            style={{ zIndex: 1 }}
        >
            <Toast onClose={() => props.setErrorMessage(false)} show={props.errorMessage} delay={5000} autohide bg='danger'>
                <Toast.Header >
                    <strong className="me-auto">Error</strong>
                </Toast.Header>
                <Toast.Body>{props.errorMessage}</Toast.Body>
            </Toast>
        </ToastContainer>
    )
}