import { auth, googleProvider, database } from "../firebase_config/firebase";
import { createUserWithEmailAndPassword, signInWithPopup, signInWithEmailAndPassword } from 'firebase/auth'
import { useState } from "react";
import chatGramLogo from "../assets/Logo/android-chrome-192x192.png";
import { doc, setDoc } from "firebase/firestore"

export const Auth = () =>
{
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [isLogin, setIsLogin] = useState(true)
    const [error, setError] = useState("")

    const handleAuth = async () =>
    {
        setError("");
        try
        {
           if (isLogin)
           {
               await signInWithEmailAndPassword(auth, email, password);
               console.log("Successfully logged in!")
           }
           else
           {
               const userCredential = await createUserWithEmailAndPassword(auth, email, password);
               const user = userCredential.user;

               /** @type {import("firebase/firestore").DocumentData} */
               const userData = {
                   uid: user.uid,
                   email: user.email,
                   displayName: user.email.split('@')[0],
                   photoURL: "",
                   isOnline: true,
               };
               
               await setDoc(doc(database, "users", user.uid), userData);

               console.log("Account created successfully!")
           }
        }
        catch (err)
        {
            if (err.code === 'auth/weak-password')
            {
                setError("Password must be at least 6 characters long.");
            }
            else if (err.code === 'auth/email-already-in-use') {
                setError("An account with this email already exists.");
            }
            else if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password')
            {
                setError("Invalid email or password.");
            }
            else
            {
                setError("Something went wrong. Please try again.");
            }
        }
    };

    const signInWithGoogle = async () =>
    {
        try
        {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            await setDoc(doc(database, "users", user.uid), {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                isOnline: true,
            }, { merge: true });

            console.log("Logged in with Google!")
        }
        catch (err)
        {
            console.error(err.message);
            setError("Failed to sign in with Google.");
        }
    };

    const toggleMode = () =>
    {
        setIsLogin(!isLogin);
        setError("");
    };

    return (
        <div className="auth_card">
            <img className="website_logo" src={`${chatGramLogo}`} alt="ChatGram Logo"/>
            <h2>{isLogin ? "Welcome to ChatGram" : "Create an account"}</h2>
            <p>{isLogin ? "Sign in to continue" : "Register to join the community"}</p>
            {error && <p className="error_message">{error}</p>}

            <div className="authentication_inputs">
                <input
                    className="auth_input"
                    placeholder="Email"
                    onChange={(e) => setEmail(e.target.value)}
                    value={email}
                />

                <input
                    className="auth_input"
                    placeholder="Password"
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    value={password}
                />
            </div>

            <div className="auth_buttons">
                <button className="button_primary" onClick={handleAuth}>
                    {isLogin ? "Sign In" : "Sign Up"}
                </button>

                <button className="button_google" onClick={signInWithGoogle}>
                    Continue with Google
                </button>
            </div>

            <p className="auth_toggle_text" onClick={toggleMode}>
                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Log in"}
            </p>
        </div>
    );
};