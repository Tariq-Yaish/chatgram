import { useState, useEffect } from 'react';
import { auth } from './firebase_config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Auth } from './components/auth.jsx';
import { Chat } from './components/chat.jsx';
import './App.css';

function App() {
    const [user, setUser] = useState(null);

    useEffect(() =>
    {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) =>
        {
            setUser(currentUser);
        });

        return () => unsubscribe();
    }, []);

    return (
        <div className="App">
            {user ? <Chat /> : <Auth />}
        </div>
    );
}

export default App;
