import { auth } from "../firebase_config/firebase";
import { signOut } from "firebase/auth";

export const Chat = () =>
{
    return (
        <div className="chat_container">
            <div className="chat_sidebar">
                <div className="sidebar_header">
                    <h2>Chats</h2>
                    <button onClick={() => signOut(auth)} className="button_logout">
                        Log Out
                    </button>
                </div>

                <div className="chat_list">
                    <p className="chat_list_placeholder">
                        Chat list goes here
                    </p>
                </div>
            </div>

            <div className="chat_window">
                <div className="chat_placeholder">
                    Select a chat to start messaging
                </div>
            </div>
        </div>
    );
};