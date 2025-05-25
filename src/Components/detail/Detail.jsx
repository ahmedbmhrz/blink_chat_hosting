// Add these imports at the top with other Lucide icons
import { ChevronDown, ChevronUp, Download, Mail, Phone, Twitter } from "lucide-react";
import avatarbase from "../../assets/avatar.png";
import { auth, db } from "../../firebase";
import { useEffect, useState } from "react";
import { useUserStore } from "../../userStore";
import { useChatStore } from "../../chatStore";
import {
  doc,
  getDoc,
  deleteDoc,
  updateDoc,
  arrayRemove,
  arrayUnion,
} from "firebase/firestore";
import { toast } from "react-toastify";

const Detail = () => {
  
  const { currentUser } = useUserStore();
    // Fix the typo in the destructured property name
    const {
      chatId,
      resetChat,
      user,
      isCurrentUserBlocked,
      isReceiverBlocked,  // Fix: isReciverBlocked -> isReceiverBlocked
      changeBlock,
    } = useChatStore();
    
  const [userData, setUserData] = useState(null);
  const [messageCount, setMessageCount] = useState(0);
  const [sharedPhotos, setSharedPhotos] = useState([]);
  const [isPhotosOpen, setIsPhotosOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    message: "",
  });
  const handleBlock = async () => {
    if (!user) return;
  
    const userDocRef = doc(db, "users", currentUser.id);
    try {
      await updateDoc(userDocRef, {
        blocked: isReceiverBlocked  // Fix: isReciverBlocked -> isReceiverBlocked
          ? arrayRemove(user.id)
          : arrayUnion(user.id),
      });
      changeBlock();
    } catch (error) {
      console.error("Error updating block status:", error);
      toast.error("Failed to block user");
    }
  };
  useEffect(() => {
    const fetchMessageCount = async () => {
      if (chatId) {
        try {
          const chatDoc = await getDoc(doc(db, "chats", chatId));
          if (chatDoc.exists()) {
            const messages = chatDoc.data().messages || [];
            setMessageCount(messages.length);

            // Filter messages with images and extract image URLs
            const photos = messages
              .filter((msg) => msg.img)
              .map((msg) => ({
                url: msg.img,
                date: new Date(msg.createAt).toLocaleDateString(),
              }));
            setSharedPhotos(photos);
          }
        } catch (error) {
          console.error("Error fetching message count:", error);
        }
      }
    };

    fetchMessageCount();
  }, [chatId]);

  const handleDownload = (url) => {
    window.open(url, "_blank");
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    // You can implement the contact form submission logic later
    toast.success("Message sent successfully!");
    setContactForm({ name: "", email: "", message: "" });
  };

  const handleDeleteChat = async () => {
    if (!chatId || !currentUser?.id) return;

    try {
      // Delete the chat document
      await deleteDoc(doc(db, "chats", chatId));

      // Remove chat from current user's userchats
      const currentUserChatRef = doc(db, "userchats", currentUser.id);
      const currentUserChatDoc = await getDoc(currentUserChatRef);

      if (currentUserChatDoc.exists()) {
        const updatedChats = currentUserChatDoc
          .data()
          .chats.filter((chat) => chat.chatId !== chatId);
        await updateDoc(currentUserChatRef, {
          chats: updatedChats,
        });
      }

      // Reset chat store
      resetChat();
      toast.success("Chat deleted successfully");
    } catch (error) {
      console.error("Error deleting chat:", error);
      toast.error("Failed to delete chat");
    }
  };

  return (
    <div className="flex-1 text-gray-300 flex flex-col h-full overflow-hidden">
      {/*user*/}
      <div className="py-8 px-6 flex flex-col items-center gap-4 border-white border-b-1">
        <img
          src={userData?.avatar || currentUser?.avatar || avatarbase}
          alt={userData?.username || "User avatar"}
          className="w-32 h-32 object-cover rounded-full"
        />
        <h2 className="text-xl font-semibold">
          {userData?.username || currentUser?.username}
        </h2>
        <p className="text-sm text-center text-gray-400 max-w-[80%]">
          {messageCount > 0
            ? `${messageCount} Messages in Chat`
            : "No messages yet"}
        </p>
      </div>
      {/*info */}
      <div className="p-6 flex flex-col gap-6 overflow-y-auto flex-1">
        {/*option */}
        <div className="hover:bg-gray-800/30 rounded-lg transition-colors">
          {/*title*/}
          <div className="flex items-center justify-between p-3">
            <span className="text-base font-medium">Chat settings</span>
            <ChevronUp
              color="#FFDE71"
              className="w-8 h-8 p-1.5 cursor-pointer"
            />
          </div>
          <div className="p-4">
            <button
              onClick={handleDeleteChat}
              className="w-full p-3 bg-red-600/20 text-red-500 rounded-lg hover:bg-red-600/30 transition-colors"
            >
              Delete Chat
            </button>
          </div>
        </div>
        {/*option */}
        <div className="hover:bg-gray-800/30 rounded-lg transition-colors">
          {/*title*/}
          <div
            className="flex items-center justify-between p-3 cursor-pointer"
            onClick={() => setIsHelpOpen(!isHelpOpen)}
          >
            <span className="text-base font-medium">Help</span>
            {isHelpOpen ? (
              <ChevronUp color="#FFDE71" className="w-8 h-8 p-1.5" />
            ) : (
              <ChevronDown color="#FFDE71" className="w-8 h-8 p-1.5" />
            )}
          </div>
          {isHelpOpen && (
            <div className="p-4 flex flex-col gap-4">
              <div className="flex items-center gap-3 text-gray-300 hover:text-gray-100 transition-colors">
                <Mail className="w-5 h-5" />
                <a href="mailto:support@blinkchat.com">support@blinkchat.com</a>
              </div>
              <div className="flex items-center gap-3 text-gray-300 hover:text-gray-100 transition-colors">
                <Twitter className="w-5 h-5" />
                <a href="https://twitter.com/blinkchat" target="_blank" rel="noopener noreferrer">@blinkchat</a>
              </div>
              <div className="flex items-center gap-3 text-gray-300 hover:text-gray-100 transition-colors">
                <Phone className="w-5 h-5" />
                <a href="tel:+1234567890">+1 (234) 567-890</a>
              </div>
            </div>
          )}


        </div>
        {/*option */}
        <div className="hover:bg-gray-800/30 rounded-lg transition-colors">
          {/*title*/}
          <div
            className="flex items-center justify-between p-3"
            onClick={() => setIsPhotosOpen(!isPhotosOpen)}
          >
            <span className="text-base font-medium">Shared photos</span>
            {isPhotosOpen ? (
              <ChevronUp
                color="#FFDE71"
                className="w-8 h-8 p-1.5 cursor-pointer"
              />
            ) : (
              <ChevronDown
                color="#FFDE71"
                className="w-8 h-8 p-1.5 cursor-pointer"
              />
            )}
          </div>

          {isPhotosOpen && (
            <div className="flex flex-col gap-4 p-4">
              {sharedPhotos.length > 0 ? (
                sharedPhotos.map((photo, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-700/30 p-3 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={photo.url}
                        alt="Shared photo"
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <span className="text-sm text-gray-300 font-light">
                        {photo.date}
                      </span>
                    </div>
                    <Download
                      color="#FFDE71"
                      className="w-8 h-8 p-1.5 cursor-pointer"
                      onClick={() => handleDownload(photo.url)}
                    />
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400 text-center">
                  No shared photos
                </p>
              )}
            </div>
          )}
        </div>
        {/*option */}
        <button
          onClick={handleBlock}
          className="hover:text-amber-50 p-4 bg-red-700/30 backdrop-blur-sm border border-red-700/50 rounded-lg cursor-pointer hover:bg-red-700 transition-colors font-medium"
        >
          {isCurrentUserBlocked
            ? "you are blocked"
            : isReceiverBlocked
            ? "User blocked"
            : "Block User"}
        </button>
        <button
          onClick={() => auth.signOut()}
          className="p-4 bg-[#FFDE71] text-gray-900 font-medium rounded-lg hover:bg-[#FFE591] transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Detail;
