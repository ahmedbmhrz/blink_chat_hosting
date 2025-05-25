import { Search, SquarePlus, SquareMinus } from "lucide-react";
import { useEffect, useState } from "react";
import avatar from "../../../assets/avatar.png";
import AddUsers from "./addUsers/AddUsers";
import { useUserStore } from "../../../userStore";
import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../../../firebase";
import { useChatStore } from "../../../chatStore";
import { toast } from "react-toastify";

const ChatList = () => {
    const [chats, setChats] = useState([]);
    const [addMode, setAddMode] = useState(false);
    const [input, setInput] = useState("");
  
    const { currentUser } = useUserStore();
    const { chatId, changeChat } = useChatStore();
  
    useEffect(() => {
      const unSub = onSnapshot(
        doc(db, "userchats", currentUser.id),
        async (res) => {
          const items = res.data().chats;
  
          const promises = items.map(async (item) => {
            const userDocRef = doc(db, "users", item.receiverId);
            const userDocSnap = await getDoc(userDocRef);
  
            const user = userDocSnap.data();
  
            return { ...item, user };
          });
  
          const chatData = await Promise.all(promises);
  
          setChats(chatData.sort((a, b) => b.updatedAt - a.updatedAt));
        }
      );
  
      return () => {
        unSub();
      };
    }, [currentUser.id]);
  
    const handleSelect = async (chat) => {
      const userChats = chats.map((item) => {
        const { user, ...rest } = item;
        return rest;
      });
  
      const chatIndex = userChats.findIndex(
        (item) => item.chatId === chat.chatId
      );
  
      userChats[chatIndex].isSeen = true;
  
      const userChatsRef = doc(db, "userchats", currentUser.id);
  
      try {
        // First update the seen status
        await updateDoc(userChatsRef, {
          chats: userChats,
        });
        
        // Get the latest user data to ensure we have current block status
        const userDoc = await getDoc(doc(db, "users", chat.user.id));
        const updatedUser = { ...chat.user, ...userDoc.data() };
        
        // Update chat with latest user data
        changeChat(chat.chatId, updatedUser);
      } catch (err) {
        console.log(err);
      }
    };
  
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="flex items-center gap-5 p-5">
          <div className="flex flex-[1] bg-gray-600 items-center gap-5 rounded-[10px] p-1.5">
            <Search color="#FFDE71" className="w-5 h-5" />
            <input
              type="text"
              placeholder="Search"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-white"
            />
          </div>
          {!addMode ? (
            <SquarePlus
              color="#FFDE71"
              className="w-9 h-9 p-0 cursor-pointer"
              onClick={() => setAddMode(true)}
            />
          ) : (
            <SquareMinus
              color="#FFDE71"
              className="w-9 h-9 p-0 cursor-pointer"
              onClick={() => setAddMode(false)}
            />
          )}
        </div>
        {chats
          .filter(
            (chat) =>
              chat.user?.username?.toLowerCase().includes(input.toLowerCase()) ||
              chat.lastMessage?.toLowerCase().includes(input.toLowerCase())
          )
          .map((chat) => (
            <div
              key={chat.chatId}
              className={`flex items-center gap-5 p-5 cursor-pointer hover:bg-gray-700 transition-colors ${
                !chat.isSeen ? "bg-purple-900" : ""
              }`}
              onClick={() => handleSelect(chat)}
            >
              <img
                src={chat.user?.avatar || avatar}
                alt=""
                className="w-[50px] h-[50px] rounded-full object-cover"
              />
              <div>
                <span className="font-medium text-gray-300">
                  {chat.user?.username || "User"}
                </span>
                <p className="text-sm font-light text-gray-300">
                  {chat.lastMessage || "No messages yet"}
                </p>
              </div>
            </div>
          ))}
        {addMode && <AddUsers />}
      </div>
    );
};

export default ChatList;