import React, { useEffect } from 'react';

function LoginPage() {
    console.log('LoginPage');
    useEffect(() => {
        window.location.href = 'http://localhost:8888/auth/login';
    }, []);
    return <p>Redirecting to login...</p>;
}

export default LoginPage;