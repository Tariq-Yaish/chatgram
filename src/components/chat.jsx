import { auth } from "../firebase_config/firebase";
import { signOut } from "firebase/auth";
import burgerIcon from '../assets/burger.svg'
import searchIcon from '../assets/search.svg'
import callIcon from '../assets/call.svg'
import moreIcon from '../assets/more.svg'
import sendIcon from '../assets/send.svg'

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

                <div className="chat_window_header">
                    <div className="chat_header_info">
                        <img src="https://i.pravatar.cc/150?u=david" alt="David Moore" className="chat_header_avatar"/>
                        <div className="chat_header_text">
                            <h3>David Moore</h3>
                            <p>last seen 5 mins ago</p>
                        </div>
                    </div>

                    <div className="chat_header_actions">
                        <img src={`${searchIcon}`} alt="Search" className="header_icon" />
                        <img src={`${callIcon}`} alt="Call" className="header_icon" />
                        <img src={`${moreIcon}`} alt="More" className="header_icon" />
                    </div>
                </div>

                <div className="chat_window_messages">
                    <div className="message_date_badge">Today</div>

                    <div className="message_bubble received">
                        <p>OMG 😲 do you remember what you did last night at the work night out?</p>
                        <span className="message_time">18:12</span>
                    </div>

                    <div className="message_bubble sent">
                        <p>no haha</p>
                        <span className="message_time">18:16 <span className="read_receipt">✓</span></span>
                    </div>

                    <div className="message_bubble sent">
                        <p>i don't remember anything 😅</p>
                        <span className="message_time">18:16 <span className="read_receipt">✓</span></span>
                    </div>
                </div>

                <div className="chat_window_input_area">
                    <span className="input_icon">😊</span>
                    <input type="text" placeholder="Message" className="message_input_field" />
                    <img src={`${sendIcon}`} alt="Send" className="send_icon" />
                </div>
            </div>

        </div>
    );
};