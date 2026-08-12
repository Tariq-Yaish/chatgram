import { useState, useEffect } from 'react';
import { auth } from './firebase_config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Auth } from './components/auth.jsx';
import { Chat } from './components/chat.jsx';
import './App.css';

function App()
{
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() =>
    {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) =>
        {
            setUser(currentUser);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    if (isLoading)
    {
        return (
            <div className="App">
                <p>Loading</p>
            </div>
        );
    }

    return (
        <div className="App">
            {user ? <Chat /> : <Auth />}
        </div>
    );
}

export default App;