import { useEffect } from 'react';
import { auth } from './firebase_config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { Auth } from './components/auth.jsx';
import { Chat } from './components/chat.jsx';
import { useUserStore } from './store/userStore.js';
import './App.css';

function App()
{
    const { currentUser, isLoading, fetchUserInfo } = useUserStore();

    useEffect(() =>
    {
        const unsubscribe = onAuthStateChanged(auth, (user) =>
        {
            if (user)
            {
                fetchUserInfo(user.uid).catch(console.error);
            }
            else
            {
                fetchUserInfo(null).catch(console.error);
            }
        });

        return () => unsubscribe();
    }, [fetchUserInfo]);

    if (isLoading)
    {
        return (
            <div className="App">
                <p>Loading...</p>
            </div>
        );
    }

    return (
        <div className="App">
            {currentUser ? <Chat /> : <Auth />}
        </div>
    );
}

export default App;