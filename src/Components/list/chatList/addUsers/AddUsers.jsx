import avatar from "../../../../assets/avatar.png";
import { useState } from "react";
import { useUserStore } from "../../../../userStore";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  arrayUnion,
  where,
} from "firebase/firestore";
import { db } from "../../../../firebase";
import { toast } from "react-toastify";

const AddUsers = () => {
  const [user, setUser] = useState(null);
  const { currentUser } = useUserStore();

  const handleSearch = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const username = formData.get("username");

    // Prevent searching for current user
    if (username === currentUser.username) {
      toast.error("You cannot add yourself to chat");
      setUser(null);
      return;
    }

    try {
      const userRef = collection(db, "users");
      const q = query(userRef, where("username", "==", username));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        const userId = querySnapshot.docs[0].id;
        
        // Double check to prevent adding self using ID
        if (userId === currentUser.id) {
          toast.error("You cannot add yourself to chat");
          setUser(null);
          return;
        }
        
        setUser({ ...userData, id: userId });
      } else {
        setUser(null);
        toast.error("User not found");
      }
    } catch (err) {
      console.error("Error searching user:", err);
      toast.error("Error searching for user");
    }
};

  const handleAdd = async () => {
    if (!user) return;

    try {
      // First check if chat already exists
      const currentUserRef = doc(db, "userchats", currentUser.id);
      const currentUserDoc = await getDoc(currentUserRef);

      if (currentUserDoc.exists()) {
        const existingChats = currentUserDoc.data().chats || [];
        const chatExists = existingChats.some(
          (chat) => chat.receiverId === user.id
        );

        if (chatExists) {
          toast.info("Chat already exists with this user");
          return;
        }
      }

      const chatRef = collection(db, "chats");
      const newChatRef = doc(chatRef);
      await setDoc(newChatRef, {
        createdAt: serverTimestamp(),
        messages: [],
      });

      // Create or update receiver's userChats document
      const receiverRef = doc(db, "userchats", user.id);
      const receiverDoc = await getDoc(receiverRef);

      if (!receiverDoc.exists()) {
        await setDoc(receiverRef, { chats: [] });
      }
      await updateDoc(receiverRef, {
        chats: arrayUnion({
          chatId: newChatRef.id,
          lastMessage: "",
          receiverId: currentUser.id,
          updatedAt: Date.now(),
        }),
      });

      // Create or update current user's userChats document
      if (!currentUserDoc.exists()) {
        await setDoc(currentUserRef, { chats: [] });
      }
      await updateDoc(currentUserRef, {
        chats: arrayUnion({
          chatId: newChatRef.id,
          lastMessage: "",
          receiverId: user.id,
          updatedAt: Date.now(),
        }),
      });

      toast.success(`Added ${user.username} to your chats!`);
      setUser(null); // Clear search results after adding
    } catch (err) {
      console.error("Error adding user:", err);
      toast.error("Failed to add user. Please try again.");
    }
  };

  return (
    <div className="text-gray-300 p-7 bg-[rgba(9,16,32,0.75)] rounded-[10px] absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-max h-max">
      <form className="flex gap-5" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Username"
          name="username"
          className="p-3 rounded-[10px] border-none outline-none bg-gray-600"
        />
        <button className="px-4 py-3 rounded-[10px] bg-purple-800 cursor-pointer hover:bg-purple-700 transition-colors">
          Search
        </button>
      </form>
      {user && (
        <div className="mt-8 flex items-center justify-between gap-8">
          <div className="flex items-center gap-5">
            <img
              src={user.avatar || avatar}
              alt=""
              className="w-12 h-12 rounded-[50%] object-cover"
            />
            <span>{user.username}</span>
          </div>
          <button
            onClick={handleAdd}
            className="px-4 py-3 rounded-[10px] bg-purple-800 cursor-pointer hover:bg-purple-700 transition-colors"
          >
            Add User
          </button>
        </div>
      )}
    </div>
  );
};

export default AddUsers;
