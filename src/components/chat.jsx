import { auth, database } from "../firebase_config/firebase";
import { signOut } from "firebase/auth";
import { useEffect, useState, useRef } from "react";
import { doc, onSnapshot, collection, query, where, getDocs, setDoc, getDoc, serverTimestamp, updateDoc, Timestamp, arrayUnion } from "firebase/firestore";
import { useUserStore } from "../store/userStore.js";
import { useChatStore } from "../store/chatStore.js";
import EmojiPicker from "emoji-picker-react";

import burgerIcon from '../assets/burger.svg'
import searchIcon from '../assets/search.svg'
import callIcon from '../assets/call.svg'
import moreIcon from '../assets/more.svg'
import sendIcon from '../assets/send.svg'
import emojiIcon from '../assets/emoji.svg'
import checkIcon from '../assets/check.svg'

export const Chat = () =>
{
    const { currentUser } = useUserStore();
    const { chatId, user: chatUser, changeChat } = useChatStore();
    const [ text, setText ] = useState("");
    const [ openPicker, setOpenPicker ] = useState(false);
    const [ messages, setMessages ] = useState([]);
    const [ chats, setChats ] = useState([]);
    const [ username, setUsername ] = useState("");
    const [ searchedUser, setSearchedUser ] = useState(null);
    const [ searchError, setSearchError ] = useState(false);
    const endRef = useRef(null);
    const inputRef = useRef(null);
    const pickerRef = useRef(null);
    const [ isChatUserOnline, setIsChatUserOnline ] = useState(false);

    const handleEmoji = (e) =>
    {
        setText((prev) => prev + e.emoji);
        inputRef.current?.focus();
    }

    useEffect(() =>
    {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() =>
    {
        if (!chatUser?.uid) return;

        const unSub = onSnapshot(doc(database, "users", chatUser.uid), (res) =>
        {
            if (res.exists()) {
                setIsChatUserOnline(res.data().isOnline);
            }
        });

        return () =>
        {
            unSub();
        };
    }, [chatUser?.uid]);

    useEffect(() =>
    {
        let isCancelled = false;

        const searchUser = async () =>
        {
            if (username.trim() === "")
            {
                setSearchedUser(null);
                setSearchError(false);
                return;
            }

            try
            {
                const q = query(collection(database, "users"), where("displayName", ">=", username), where("displayName", "<=", username + "\uf8ff"));
                const querySnapshot = await getDocs(q)
                if (isCancelled) return;

                if (!querySnapshot.empty)
                {
                    querySnapshot.forEach((doc) =>
                    {
                        setSearchedUser(doc.data());
                    });

                    setSearchError(false);
                }
                else
                {
                    setSearchedUser(null);
                    setSearchError(true);
                }
            }
            catch (err)
            {
                if (isCancelled) return;
                setSearchError(true);
                console.error("Search Failed", err);
            }
        }

        searchUser().catch(console.error);

        return () =>
        {
            isCancelled = true;
        }
    }, [username]);

    useEffect(() =>
    {
        if (!chatId) return;

        const unSub = onSnapshot(doc(database, "chats", chatId), (res) =>
        {
            if (res.exists())
            {
                setMessages(res.data().messages);
            }
        });

        return () =>
        {
            unSub();
        };
    }, [chatId]);

    useEffect(() =>
    {
        const markAsRead = async () =>
        {
            if (!messages.length || !chatId) return;

            const lastMessage = messages[messages.length - 1];

            if (lastMessage.senderId !== currentUser.uid && !lastMessage.isRead) {
                try
                {
                    const updatedMessages = messages.map(msg =>
                        msg.senderId !== currentUser.uid ? { ...msg, isRead: true } : msg
                    );

                    await updateDoc(doc(database, "chats", chatId), {
                        messages: updatedMessages
                    });
                }
                catch (err)
                {
                    console.error("Error marking as read:", err);
                }
            }
        };

        markAsRead().catch(console.error);
    }, [messages, chatId, currentUser.uid]);

    useEffect(() =>
    {
        const handleClickOutSide = (event) =>
        {
            if (pickerRef.current && !pickerRef.current.contains(event.target) && !event.target.classList.contains('input_icon'))
            {
                setOpenPicker(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutSide);
        return () =>
        {
            document.removeEventListener("mousedown", handleClickOutSide);
        };
    }, []);

    const handleLogout = async () =>
    {
        try
        {
            if (currentUser?.uid)
            {
                await updateDoc(doc(database, "users", currentUser.uid), {
                    isOnline: false,
                    lastSeen: serverTimestamp(),
                });
            }

            useChatStore.setState({ chatId: null, user: null });
            await signOut(auth);
        }
        catch (error)
        {
            console.error("Error Logging out: ", error)
        }
    }

    const handleSelect = async () =>
    {
        const combinedId = currentUser.uid > searchedUser.uid ? currentUser.uid + searchedUser.uid : searchedUser.uid + currentUser.uid;

        try
        {
            const tempResult = await getDoc(doc(database, "chats", combinedId));

            if (!tempResult.exists())
            {
                await setDoc(doc(database, "chats", combinedId), {messages: [] });

                await setDoc(doc(database, "userChats", currentUser.uid), {
                    [combinedId]: {
                        userInfo: {
                            uid: searchedUser.uid,
                            displayName: searchedUser.displayName,
                            photoURL: searchedUser.photoURL || ""
                        },
                        updatedAt: serverTimestamp(),
                        lastMessage: ""
                    }
                }, {merge: true});

                await setDoc(doc(database, "userChats", searchedUser.uid), {
                    [combinedId]: {
                        userInfo: {
                            uid: currentUser.uid,
                            displayName: currentUser.displayName,
                            photoURL: currentUser.photoURL || ""
                        },
                        updatedAt: serverTimestamp(),
                        lastMessage: ""
                    }
                }, { merge: true });
            }
        }
        catch (error)
        {
            console.error("Error establishing chat: ", error)
        }

        changeChat(combinedId, searchedUser);
        setSearchedUser(null);
        setUsername("")
    }

    const handleSend = async () =>
    {
        if (text.trim() === "") return;

        setOpenPicker(false);

        try
        {
            await updateDoc(doc(database, "chats", chatId), {
                messages: arrayUnion({
                    senderId: currentUser.uid,
                    text,
                    createdAt: Timestamp.now(),
                    isRead: false,
                }),
            });

            const userIDs = [currentUser.uid, chatUser.uid];

            for (const id of userIDs)
            {
                const userChatsRef = doc(database, "userChats", id);

                await updateDoc(userChatsRef, {
                    [`${chatId}.lastMessage`]: text,
                    [`${chatId}.updatedAt`]: serverTimestamp(),
                });
            }

            setText("");
        }
        catch (error)
        {
            console.error("Error Sending Message: ", error)
        }
    }

    const formatTime = (timestamp) =>
    {
        if (!timestamp) return "Now";
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    useEffect(() =>
    {
        if (!currentUser?.uid) return;

        const unsubscribe = onSnapshot(doc(database, "userChats", currentUser.uid), (doc) =>
        {
            if (doc.exists())
            {
                const chatData = doc.data();
                const chatArray = Object.entries(chatData)
                    .map((item) => ({ id: item[0], ...item[1] }))
                    .sort((a, b) => b.updatedAt - a.updatedAt);

                setChats(chatArray);
            }
            else
            {
                setChats([]);
            }
        });

        return () => unsubscribe();
    }, [currentUser?.uid]);

    return (
        <div className="chat_container">
            <div className="chat_sidebar">

                <div className="sidebar_header">
                    <img src={`${burgerIcon}`} alt="Menu" className="burger_menu"/>
                    <div className="search_container">
                        <img src={`${searchIcon}`} alt="Search" className="search_icon"/>
                        <input type="text" placeholder="Search" className="search_input" onChange={(e) => setUsername(e.target.value)} value={username}/>
                    </div>
                </div>

                {searchedUser && (
                    <div className="chat_item search_result_item" onClick={handleSelect}>
                        {searchedUser.photoURL ? (
                            <img src={searchedUser.photoURL} alt={searchedUser.displayName} className="chat_avatar" />
                        ) : (
                            <div className="chat_avatar fallback_avatar"></div>
                        )}

                        <div className="chat_info">
                            <div className="chat_info_header">
                                <h4 className="chat_name">{searchedUser.displayName}</h4>
                            </div>
                        </div>
                    </div>
                )}

                {searchError && (
                    <div className="search_error_message">
                        User not found!
                    </div>
                )}

                <div className="chat_list">
                    {chats.length > 0 ? chats.map(chat => (
                        <div key={chat.id} className="chat_item" onClick={() => changeChat(chat.id, chat.userInfo)}>
                            {chat.userInfo?.photoURL ? (
                                <img src={chat.userInfo.photoURL} alt={chat.userInfo.displayName} className="chat_avatar" />
                            ) : (
                                <div className="chat_avatar" style={{ backgroundColor: "#79A3D9" }}></div>
                            )}

                            <div className="chat_info">
                                <div className="chat_info_header">
                                    <h4 className="chat_name">
                                        {chat.userInfo?.displayName || "Unknown User"}
                                    </h4>
                                    <span className="chat_time">{formatTime(chat.updatedAt)}</span>
                                </div>

                                <div className="chat_info_footer">
                                    <p className="chat_last_message">{chat.lastMessage}</p>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <p className="empty_chats_message">No chats yet. Start a conversation!</p>
                    )}
                </div>

                <div className="temp_logout_container">
                    <button className="temp_logout_button" onClick={handleLogout}>
                        Dip out of here
                    </button>
                </div>

            </div>

            {chatId ? (
                <div className="chat_window">
                    <div className="chat_window_header">
                        <div className="chat_header_info">
                            {chatUser?.photoURL ? (
                                <img src={chatUser.photoURL} alt={chatUser.displayName} className="chat_header_avatar"/>
                            ) : (
                                <div className="chat_header_avatar fallback_avatar"></div>
                            )}

                            <div className="chat_header_text">
                                <h3>{chatUser?.displayName || "Unknown User"}</h3>
                                <p style={{ color: isChatUserOnline ? "#4ade80" : "#94a3b8" }}>
                                    {isChatUserOnline ? "Active" : "Offline"}
                                </p>
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

                        {messages.map((message, index) => (
                            <div key={index} className={`message_bubble ${message.senderId === currentUser.uid ? "sent" : "received"}`} >
                                <p>{message.text}</p>
                                <span className="message_time">
                                    {formatTime(message.createdAt)}
                                    {
                                        message.senderId === currentUser.uid && (
                                        <div style={{ display: 'flex', marginLeft: '4px' }}>
                                            <img src={`${checkIcon}`} alt="sent" className="read_receipt_icon" />

                                            {
                                                message.isRead && (
                                                <img src={`${checkIcon}`} alt="read" className="read_receipt_icon" style={{ marginLeft: '-8px' }} />
                                            )}
                                        </div>
                                    )}
                                </span>
                            </div>
                        ))}

                        <div ref={endRef}></div>
                    </div>

                    <div className="chat_window_input_area">
                        <div className="emoji_picker_wrapper" ref={pickerRef}>
                            <EmojiPicker open={openPicker} onEmojiClick={handleEmoji} theme="light" />
                        </div>
                        <img className="input_icon clickable_icon" src={`${emojiIcon}`} alt="emoji" onClick={() => setOpenPicker((prev) => !prev)} />
                        <input ref={inputRef} type="text" placeholder="Message" className="message_input_field" onChange={(e) => setText(e.target.value)} onKeyDown={(e) =>  e.key === "Enter" && handleSend()} value={text} />
                        <img src={`${sendIcon}`} alt="Send" className="send_icon" onClick={handleSend} />
                    </div>
                </div>
            ) : (
                <div className="chat_window">
                    <span className="chat_placeholder" style={{ margin: "auto" }}>
                        Select a chat to start messaging
                    </span>
                </div>
            )}

        </div>
    );
};