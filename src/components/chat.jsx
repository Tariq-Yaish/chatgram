import { auth } from "../firebase_config/firebase";
import { signOut } from "firebase/auth";
import burgerIcon from '../assets/burger.svg'
import searchIcon from '../assets/search.svg'

export const Chat = () =>
{
    const dummyChats = [
        { id: 1, name: "Chatgram", message: "Chatgram Web was updated.", time: "19:48", unread: 1, color: "#79A3D9", isOfficial: true },
        { id: 2, name: "Jessica Drew", message: "Ok, see you later", time: "18:30", unread: 2, image: "https://i.pravatar.cc/150?u=jessica" },
        { id: 3, name: "David Moore", message: "You: i don't remember anything 😅", time: "18:16", unread: 0, image: "https://i.pravatar.cc/150?u=david" },
        { id: 4, name: "Greg James", message: "I got a job at SpaceX 🚀", time: "18:02", unread: 0, image: "https://i.pravatar.cc/150?u=greg" }
    ];

    return (
        <div className="chat_container">
            <div className="chat_sidebar">

                <div className="sidebar_header">
                    <img src={`${burgerIcon}`} alt="Menu" className="burger_menu"/>
                    <div className="search_container">
                        <img src={`${searchIcon}`} alt="Search" className="search_icon"/>
                        <input type="text" placeholder="Search" className="search_input"/>
                    </div>
                </div>

                <div className="chat_list">
                    {dummyChats.map(chat => (
                        <div key={chat.id} className="chat_item">
                            {chat.image ? (
                                <img src={chat.image} alt={chat.name} className="chat_avatar" />
                            ) : (
                                <div className="chat_avatar" style={{ backgroundColor: chat.color }}></div>
                            )}

                            <div className="chat_info">

                                <div className="chat_info_header">
                                    <h4 className="chat_name">
                                        {chat.name}
                                        {chat.isOfficial && <span className="official_badge">✓</span>}
                                    </h4>
                                    <span className="chat_time">{chat.time}</span>
                                </div>

                                <div className="chat_info_footer">
                                    <p className="chat_last_message">{chat.message}</p>
                                    {chat.unread > 0 && <span className="chat_badge">{chat.unread}</span>}
                                </div>

                            </div>
                        </div>
                    ))}
                </div>

                <div className="temp_logout_container">
                    <button className="temp_logout_button" onClick={() => signOut(auth)}>
                        Dip out of here
                    </button>
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