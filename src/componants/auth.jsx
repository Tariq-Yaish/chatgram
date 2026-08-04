import { auth, googleProvider } from "../firebase_config/firebase";
import { createUserWithEmailAndPassword, signInWithPopup, signInWithEmailAndPassword } from 'firebase/auth'
import { useState } from "react";
import chatGramLogo from "../assets/Logo/android-chrome-192x192.png";

export const Auth = () =>
{
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [isLogin, setIsLogin] = useState(true)

    const handleAuth = async () =>
    {
        try
        {
           if (isLogin)
           {
               await signInWithEmailAndPassword(auth, email, password);
               console.log("Successfully logged in!")
           }
           else
           {
               await createUserWithEmailAndPassword(auth, email, password);
               console.log("Account created successfully!")
           }
        }
        catch (error)
        {
            console.log("Authentication Error: ", error.message)
        }
    };

    const signInWithGoogle = async () =>
    {
        try
        {
            await signInWithPopup(auth, googleProvider)
            console.log("Account created successfully!")
        }
        catch (error)
        {
            console.log("Authentication Error: ", error.message)
        }
    };

    return (
        <div className="auth_card">
            <img className="website_logo" src={chatGramLogo} alt="ChatGram Logo"/>
            <h2>{isLogin ? "Welcome to ChatGram" : "Create an account"}</h2>
            <p>{isLogin ? "Sign in to continue" : "Register to join the community"}</p>

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

            <p className="auth_toggle_text"  onClick={() => setIsLogin(!isLogin)}>
                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Log in"}
            </p>
        </div>
    );
};