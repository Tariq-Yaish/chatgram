import { auth, database } from "../firebase_config/firebase";
import { signOut } from "firebase/auth";
import { useEffect, useState, useRef,Fragment } from "react";
import { doc, onSnapshot, collection, query, where, getDocs, setDoc, getDoc, serverTimestamp, updateDoc, Timestamp, arrayUnion, increment } from "firebase/firestore";
import { useUserStore } from "../store/userStore.js";
import { useChatStore } from "../store/chatStore.js";
import EmojiPicker from "emoji-picker-react";
import { upload } from "../cloud/upload.js"

import burgerIcon from '../assets/burger.svg'
import searchIcon from '../assets/search.svg'
import callIcon from '../assets/call.svg'
import moreIcon from '../assets/more.svg'
import sendIcon from '../assets/send.svg'
import emojiIcon from '../assets/emoji.svg'
import checkIcon from '../assets/check.svg'
import clip from '../assets/paperclip.svg'
import dismiss from '../assets/dismis.svg'

export const Chat = () =>
{
    const { currentUser } = useUserStore();
    const { chatId, user: chatUser, changeChat } = useChatStore();
    const [ text, setText ] = useState("");
    const [ attachment, setAttachment ] = useState({ file: null, url: "", caption: "" });
    const [ openPicker, setOpenPicker ] = useState(false);
    const [ messages, setMessages ] = useState([]);
    const [ chats, setChats ] = useState([]);
    const [ username, setUsername ] = useState("");
    const [ searchedUser, setSearchedUser ] = useState([]);
    const [ searchError, setSearchError ] = useState(false);
    const [ isChatUserOnline, setIsChatUserOnline ] = useState(false);
    const [ showModal, setShowModal ] = useState(false);
    const [ isSending, setIsSending ] = useState(false);
    const [ isMenuOpen, setIsMenuOpen ] = useState(false);

    const endRef = useRef(null);
    const inputRef = useRef(null);
    const pickerRef = useRef(null);
    const modalRef = useRef(null);
    const menuRef = useRef(null);

    const handleEmoji = (e) =>
    {
        setText((prev) => prev + e.emoji);
        inputRef.current?.focus();
    }

    const handleImage = (e) =>
    {
        if (e.target.files[0])
        {
            setAttachment({ file: e.target.files[0], url: URL.createObjectURL(e.target.files[0]), caption: "" });
            setShowModal(true);
        }
    };

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
                setSearchedUser([]);
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
                    const usersList = [];
                    querySnapshot.forEach((doc) =>
                    {
                        if (doc.data().uid !== currentUser.uid)
                        {
                            usersList.push(doc.data());
                        }
                    });

                    if (usersList.length > 0)
                    {
                        setSearchedUser(usersList);
                        setSearchError(false);
                    }
                    else
                    {
                        setSearchedUser([]);
                        setSearchError(true);
                    }
                }
                else
                {
                    setSearchedUser([]);
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

            if (modalRef.current && !modalRef.current.contains(event.target) && !event.target.closest('label[htmlFor="file"]'))
            {
                setShowModal(false);
            }

            if (menuRef.current && !menuRef.current.contains(event.target))
            {
                setIsMenuOpen(false);
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

    const handleSelect = async (selectedUser) =>
    {
        const combinedId = currentUser.uid > selectedUser.uid ? currentUser.uid + selectedUser.uid : selectedUser.uid + currentUser.uid;

        try
        {
            const tempResult = await getDoc(doc(database, "chats", combinedId));

            if (!tempResult.exists())
            {
                await setDoc(doc(database, "chats", combinedId), {messages: [] });

                await setDoc(doc(database, "userChats", currentUser.uid), {
                    [combinedId]: {
                        userInfo: {
                            uid: selectedUser.uid,
                            displayName: selectedUser.displayName,
                            photoURL: selectedUser.photoURL || ""
                        },
                        updatedAt: serverTimestamp(),
                        lastMessage: ""
                    }
                }, {merge: true});

                await setDoc(doc(database, "userChats", selectedUser.uid), {
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

        changeChat(combinedId, selectedUser);
        setSearchedUser([]);
        setUsername("");

        setAttachment({ file: null, url: "", caption: "" });
        setShowModal(false);
    }

    const handleSend = async () =>
    {
        if (isSending) return;
        if (text.trim() === "" && !attachment.file) return;

        setIsSending(true);
        setOpenPicker(false);

        try
        {

            let imgUrl = null;

            if (attachment.file)
            {
                imgUrl = await upload(attachment.file);
            }

            const messageText = attachment.file ? attachment.caption : text;

            await updateDoc(doc(database, "chats", chatId), {
                messages: arrayUnion({
                    senderId: currentUser.uid,
                    text: messageText,
                    createdAt: Timestamp.now(),
                    isRead: false,
                    ...(imgUrl && { img: imgUrl }),
                }),
            });

            const userIDs = [currentUser.uid, chatUser.uid];

            for (const id of userIDs)
            {
                const userChatsRef = doc(database, "userChats", id);
                const lastMessagePreview = imgUrl ? "📷 Photo" : messageText;
                const unreadCountUpdate = id === currentUser.uid ? 0 : increment(1);

                await updateDoc(userChatsRef, {
                    [`${chatId}.lastMessage`]: lastMessagePreview,
                    [`${chatId}.updatedAt`]: serverTimestamp(),
                    [`${chatId}.unreadCount`]: unreadCountUpdate,
                });
            }

            setText("");
            setAttachment({ file: null, url: "", caption: "" });
            setShowModal(false);
        }
        catch (error)
        {
            console.error("Error Sending Message: ", error)
        }
        finally
        {
            setIsSending(false);
        }
    }

    const formatTime = (timestamp) =>
    {
        if (!timestamp) return "Now";
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const isSameDay = (timeStamp1, timeStamp2) =>
    {
        if (!timeStamp1 || !timeStamp2) return false;

        const d1 = timeStamp1.toDate() ? timeStamp1.toDate() : new Date(timeStamp1);
        const d2 = timeStamp2.toDate() ? timeStamp2.toDate() : new Date(timeStamp2);

        return d1.toDateString() === d2.toDateString();
    }

    const formatDateBadge = (timeStamp) =>
    {
        if (!timeStamp) return "";

        const date = timeStamp.toDate() ? timeStamp.toDate() : new Date(timeStamp);
        const today = new Date();
        const yesterday = new Date();

        yesterday.setDate(yesterday.getDate() - 1);
        if (date.toDateString() === today.toDateString()) return "Today";
        if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

        return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    }

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
                    <div className="burger_menu_container" ref={menuRef}>
                        <img src={`${burgerIcon}`} alt="Menu" className="burger_menu" onClick={() => setIsMenuOpen(!isMenuOpen)}/>
                        {
                            isMenuOpen && (
                                <div className="burger_dropdown">
                                    <button className="dropdown_logout_button" onClick={handleLogout}>
                                        DIP OUT
                                    </button>
                                </div>
                            )
                        }
                    </div>


                    <div className="search_container">
                        <img src={`${searchIcon}`} alt="Search" className="search_icon"/>
                        <input type="text" placeholder="Search" className="search_input" onChange={(e) => setUsername(e.target.value)} value={username}/>
                    </div>
                </div>

                {searchedUser.length > 0 && searchedUser.map((user) => (
                    <div key={user.uid} className="chat_item search_result_item" onClick={() => handleSelect(user)}>

                        {user.photoURL ? (
                            <img src={user.photoURL} alt={user.displayName} className="chat_avatar" />
                        ) : (
                            <div className="chat_avatar fallback_avatar"></div>
                        )}

                        <div className="chat_info">
                            <div className="chat_info_header">
                                <h4 className="chat_name">{user.displayName}</h4>
                            </div>
                        </div>
                    </div>
                ))}

                {searchError && (
                    <div className="search_error_message">
                        User not found!
                    </div>
                )}

                <div className="chat_list">
                    {chats.length > 0 ? chats.map(chat => (
                        <div key={chat.id} className="chat_item" onClick={() =>
                        {
                            changeChat(chat.id, chat.userInfo);
                            setAttachment({ file: null, url: "", caption: "" });
                            setShowModal(false);

                            if (chat.unreadCount > 0)
                            {
                                updateDoc(doc(database, "userChats", currentUser.uid), {
                                    [`${chat.id}.unreadCount`]: 0
                                }).catch(console.error);
                            }
                        }}>
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
                                    {
                                        chat.unreadCount > 0 && (<span className="chat_badge">{chat.unreadCount}</span>)
                                    }
                                </div>
                            </div>
                        </div>
                    )) : (
                        <p className="empty_chats_message">No chats yet. Start a conversation!</p>
                    )}
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
                                <p className={isChatUserOnline ? "status_online" : "status_offline"}>
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

                        {messages.map((message, index) =>
                        {
                            const showDateBadge = index === 0 || !isSameDay(messages[index - 1].createdAt, message.createdAt);

                            return (
                                <Fragment key={index}>
                                    {showDateBadge && (
                                        <div className="message_date_badge">
                                            {formatDateBadge(message.createdAt)}
                                        </div>
                                    )}

                                    <div className={`message_bubble ${message.senderId === currentUser.uid ? "sent" : "received"}`} >
                                        {message.img && (
                                            <img src={message.img} alt="attachment" className="message_attachment" />
                                        )}

                                        {message.text && <p>{message.text}</p>}
                                        <span className="message_time">
                                            {formatTime(message.createdAt)}
                                            {
                                                message.senderId === currentUser.uid && (
                                                    <div className="read_receipts_container">
                                                        <img src={`${checkIcon}`} alt="sent" className="read_receipt_icon" />

                                                        {
                                                            message.isRead && (
                                                                <img src={`${checkIcon}`} alt="read" className="read_receipt_icon read_receipt_second_tick" />
                                                            )}
                                                    </div>
                                                )}
                                        </span>
                                    </div>
                                </Fragment>
                            );
                        })}

                        <div ref={endRef}></div>
                    </div>

                    {showModal && attachment.url && (
                        <div className="image_modal_overlay" ref={modalRef}>
                            <div className="image_modal">
                                <div className="image_modal_header">
                                    <div className="image_modal_title_group">
                                        <img className="close_modal" onClick={() =>
                                        {
                                            setAttachment({file: null, url: "", caption: ""});
                                            setShowModal(false);
                                        }} src={`${dismiss}`} alt="Dismiss" />
                                        <h3>Send Image</h3>
                                    </div>

                                    <button className="send_modal_button" onClick={handleSend} disabled={isSending}>
                                        {isSending ? "Sending..." : "SEND"}
                                    </button>
                                </div>

                                <div className="image_modal_preview_container">
                                    <img src={attachment.url} alt="preview" className="image_modal_preview" />
                                </div>

                                <input
                                    type="text"
                                    placeholder="Caption"
                                    className="image_modal_caption"
                                    value={attachment.caption}
                                    onChange={(e) => setAttachment({...attachment, caption: e.target.value})}
                                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                                />
                            </div>
                        </div>
                    )}

                    <div className="chat_window_input_area">
                        <div className="emoji_picker_wrapper" ref={pickerRef}>
                            <EmojiPicker open={openPicker} onEmojiClick={handleEmoji} theme="light" />
                        </div>

                        <input type="file" id="file" style={{ display: "none" }} onChange={handleImage} accept="image/*" />
                        <label htmlFor={attachment.url ? undefined : "file"} onClick={() => attachment.url && setShowModal(true)}>
                            <img className="input_icon clickable_icon" src={`${clip}`} alt="attach" />
                        </label>

                        <img className="input_icon clickable_icon" src={`${emojiIcon}`} alt="emoji" onClick={() => setOpenPicker((prev) => !prev)} />
                        <input ref={inputRef} type="text" placeholder="Message" className="message_input_field" onChange={(e) => setText(e.target.value)} onKeyDown={(e) =>  e.key === "Enter" && handleSend()} value={text} />
                        <img src={`${sendIcon}`} alt="Send" className="send_icon" onClick={handleSend} />
                    </div>
                </div>
            ) : (
                <div className="chat_window">
                    <span className="chat_placeholder">
                        Select a chat to start messaging
                    </span>
                </div>
            )}

        </div>
    );
};