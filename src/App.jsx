import { useState, useEffect } from 'react';
import { auth } from './firebase_config/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { Auth } from './componants/auth.jsx';
import './App.css';

function App() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) =>
        {
            setUser(currentUser);
        });

        return () => unsubscribe();
    }, []);

    return (
        <div className="App">
            {user ? (
                <div>
                    <h1>Welcome to the Chatgram Main UI!</h1>
                    <p>Logged in as: {user.email}</p>
                    <button  className="logout_button" onClick={() => signOut(auth)}>Log Out</button>
                </div>
            ) : (
                <Auth />
            )}
        </div>
    );
}

export default App;
