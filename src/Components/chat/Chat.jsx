import { Image, Info, SmilePlus } from "lucide-react";
import avatar from "../../assets/avatar.png";
import cat from "../../assets/cat.png";
import EmojiPicker from "emoji-picker-react";
import { useEffect, useRef, useState } from "react";
import { db } from "../../firebase";
import upload from "../../upload";
import {
  arrayUnion,
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import { useUserStore } from "../../userStore";
import {
  useChatStore,
  // Remove these lines as they are not exported from chatStore
  
} from "../../chatStore";

const Chat = ({ showDetail, setShowDetail }) => {
  // Add new state for upload status
  const [uploadStatus, setUploadStatus] = useState({
    loading: false,
    error: null,
  });
  const [chat, setChat] = useState(null);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const { currentUser } = useUserStore();
  const { chatId, user, isCurrentUserBlocked, isReceiverBlocked } = useChatStore();
  const [img, setImg] = useState({
    file: null,
    url: "",
  });

  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat?.messages]); // Update scroll when messages change

  useEffect(() => {
    if (!chatId) return;

    const unSub = onSnapshot(doc(db, "chats", chatId), (doc) => {
      if (doc.exists()) {
        setChat(doc.data());

        // Mark messages as seen when entering chat
        const userChatRef = doc(db, "userchats", currentUser.id);
        getDoc(userChatRef).then((snapshot) => {
          if (snapshot.exists()) {
            const userData = snapshot.data();
            const chats = userData.chats || [];
            const chatIndex = chats.findIndex((c) => c.chatId === chatId);

            if (chatIndex !== -1 && !chats[chatIndex].isSeen) {
              chats[chatIndex].isSeen = true;
              updateDoc(userChatRef, { chats });
            }
          }
        });
      }
    });

    return () => unSub();
  }, [chatId, currentUser?.id]);

  const handleEmoji = (e) => {
    setText((prev) => prev + e.emoji);
    // Remove the setOpen(false) line to keep picker open
  };

  const handleImage = async (e) => {
    if (!e.target.files[0]) return;

    try {
      setUploadStatus({ loading: true, error: null });

      // Set preview
      setImg({
        file: e.target.files[0],
        url: URL.createObjectURL(e.target.files[0]),
      });

      // Upload image
      const imgUrl = await upload(e.target.files[0]);

      // Send message with image
      const messageData = {
        senderId: currentUser.id,
        text: "",
        createAt: new Date().getTime(),
        img: imgUrl,
      };

      await updateDoc(doc(db, "chats", chatId), {
        messages: arrayUnion(messageData),
      });

      // Update user chats
      const userIDs = [currentUser.id, user.id];

      for (const id of userIDs) {
        const userChatRef = doc(db, "userchats", id);
        const userChatSnapshot = await getDoc(userChatRef);

        if (userChatSnapshot.exists()) {
          const userChatData = userChatSnapshot.data();
          const chats = userChatData.chats || [];
          const chatIndex = chats.findIndex((c) => c.chatId === chatId);

          if (chatIndex !== -1) {
            chats[chatIndex] = {
              ...chats[chatIndex],
              lastMessage: "Image sent",
              isSeen: id === currentUser.id,
              updatedAt: Date.now(),
            };

            await updateDoc(userChatRef, { chats });
          }
        }
      }

      // Clear the image state and upload status
      setImg({
        file: null,
        url: "",
      });
      setUploadStatus({ loading: false, error: null });
    } catch (err) {
      console.log(err);
      setUploadStatus({ loading: false, error: "Failed to send image" });
    }
  };

  // Modify handleSende to handle only text messages
  const handleSende = async () => {
    if (text === "") return;

    try {
      const messageData = {
        senderId: currentUser.id,
        text,
        createAt: new Date().getTime(),
      };

      await updateDoc(doc(db, "chats", chatId), {
        messages: arrayUnion(messageData),
      });

      // Update user chats
      const userIDs = [currentUser.id, user.id];

      for (const id of userIDs) {
        const userChatRef = doc(db, "userchats", id);
        const userChatSnapshot = await getDoc(userChatRef);

        if (userChatSnapshot.exists()) {
          const userChatData = userChatSnapshot.data();
          const chats = userChatData.chats || [];
          const chatIndex = chats.findIndex((c) => c.chatId === chatId);

          if (chatIndex !== -1) {
            chats[chatIndex] = {
              ...chats[chatIndex],
              lastMessage: text,
              isSeen: id === currentUser.id,
              updatedAt: Date.now(),
            };

            await updateDoc(userChatRef, { chats });
          }
        }
      }

      setText("");
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="flex-[2] border-l border-r border-gray-700 h-full flex flex-col">
      <div className="p-5 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center gap-5">
          <img
            src={user?.avatar || avatar}
            alt=""
            className="w-[60px] h-[60px] rounded-full object-cover"
          />
          <div className="flex flex-col gap-1">
            <span className="text-lg font-bold text-gray-300">
              {user?.username}
            </span>
            <p className="text-sm font-light text-gray-300">
            {isCurrentUserBlocked ? "You are blocked by this user" :
               isReceiverBlocked ? "You blocked this user" :
               user?.status || "Online"}
            </p>
          </div>
        </div>
        <div className="flex gap-5">
          <button
            onClick={() => setShowDetail(!showDetail)}
            className="p-1.5 hover:bg-gray-700 rounded-full transition-colors duration-200"
            aria-label="Toggle chat details"
          >
            <Info 
              color="#FFDE71" 
              className={`w-5 h-5 transition-transform duration-200 ${showDetail ? 'rotate-180' : ''}`}
            />
          </button>
        </div>
      </div>
      <div className="p-5 flex-[1] overflow-y-auto flex flex-col gap-5 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
        {chat?.messages?.map((message, index) => (
          <div
            className={`max-w-[70%] flex gap-5 ${
              message.senderId === currentUser.id ? "self-end" : "self-start"
            }`}
            key={`${message.createAt}-${index}`}
          >
            <div className="text-gray-300">
              {message.img && (
                <div className="mb-2">
                  <img
                    src={message.img}
                    alt=""
                    className="w-full h-72 rounded-[10px] object-cover"
                  />
                </div>
              )}
              {message.text && (
                <p
                  className={`rounded-[10px] p-5 ${
                    message.senderId === currentUser.id
                      ? "bg-purple-800"
                      : "bg-gray-700"
                  }`}
                >
                  {message.text}
                </p>
              )}
            </div>
          </div>
        ))}
        {/* Show image preview with upload status */}
        {img.url && (
          <div className="max-w-[70%] self-end">
            <div className="rounded-[10px] overflow-hidden relative">
              <img src={img.url} alt="" className="w-full h-72 object-cover" />
              {uploadStatus.loading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="text-white">Uploading image...</div>
                </div>
              )}
            </div>
            {uploadStatus.error && (
              <div className="text-red-500 text-sm mt-1">
                {uploadStatus.error}
              </div>
            )}
          </div>
        )}
        <div ref={endRef}></div>
      </div>
      <div className="p-5 flex items-center justify-between border-t border-gray-700 gap-5 mt-auto relative">
        <div className="flex gap-5">
          <label htmlFor="file">
            <Image
              color="#FFDE71"
              className="w-5 h-5 cursor-pointer hover:scale-110 transition-transform"
            />
          </label>
          <input
            type="file"
            id="file"
            style={{ display: "none" }}
            onChange={handleImage}
            accept="image/*"
          />
          <div className="relative">
            <SmilePlus
              color="#FFDE71"
              className="w-5 h-5 cursor-pointer hover:scale-110 transition-transform"
              onClick={() => setOpen(!open)}
            />
            {open && (
              <div className="absolute bottom-10 left-0">
                <EmojiPicker
                  onEmojiClick={handleEmoji}
                  theme="dark"
                  width={300}
                  height={400}
                />
              </div>
            )}
          </div>
        </div>
        <input
        disabled={isCurrentUserBlocked || isReceiverBlocked}
          type="text"
          placeholder="Type a message..."
          onChange={(e) => setText(e.target.value)}
          value={text}
          className="flex-1 bg-transparent outline-none text-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-purple-500"
          onKeyPress={(e) => e.key === "Enter" && handleSende()}
        />
        <button
        
          onClick={handleSende}
          disabled={text.trim() === "" || isCurrentUserBlocked || isReceiverBlocked}
          className={`bg-purple-600 text-white px-6 py-2 rounded-lg font-semibold
            ${
              text.trim() === ""
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-purple-700 active:bg-purple-800"
            }
            transition-all duration-200 ease-in-out transform hover:scale-105 active:scale-95`}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;