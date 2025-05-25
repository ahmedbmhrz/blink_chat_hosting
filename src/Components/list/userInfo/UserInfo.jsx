import { EllipsisVertical, Camera, User } from "lucide-react";
import avatarbase from "../../../assets/avatar.png";
import { useUserStore } from "../../../userStore";
import { useState, useRef, useEffect } from "react";
import { db, storage } from "../../../firebase";
import { doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { toast } from "react-toastify";

const UserInfo = () => {
  const { currentUser, fetchUserInfo } = useUserStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const dropdownRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAvatarUpdate = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const storageRef = ref(storage, `avatars/${currentUser.id}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      const userRef = doc(db, "users", currentUser.id);
      await updateDoc(userRef, {
        avatar: downloadURL
      });

      await fetchUserInfo(currentUser.id);
      toast.success("Avatar updated successfully!");
    } catch (error) {
      console.error("Error updating avatar:", error);
      toast.error("Failed to update avatar");
    }
    setIsDropdownOpen(false);
  };

  const handleUsernameUpdate = async () => {
    if (!newUsername.trim()) {
      setIsEditingUsername(false);
      return;
    }

    try {
      const userRef = doc(db, "users", currentUser.id);
      await updateDoc(userRef, {
        username: newUsername
      }); 

      await fetchUserInfo(currentUser.id);
      setIsEditingUsername(false);
      setNewUsername("");
      toast.success("Username updated successfully!");
    } catch (error) {
      console.error("Error updating username:", error);
      toast.error("Failed to update username");
    }
  };

  return (
    <div className="p-5 flex items-center justify-between">
      <div className="flex items-center gap-5">
        <img
          src={currentUser?.avatar || avatarbase}
          alt=""
          className="w-[50px] h-[50px] rounded-full object-cover"
        />
        {isEditingUsername ? (
          <input
            type="text"
            className="bg-gray-700 text-gray-300 p-2 rounded outline-none"
            placeholder={currentUser?.username}
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            onBlur={handleUsernameUpdate}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleUsernameUpdate();
              }
            }}
            autoFocus
          />
        ) : (
          <h2 className="text-gray-300">{currentUser?.username}</h2>
        )}
      </div>
      <div className="flex gap-5 pr-2 relative" ref={dropdownRef}>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleAvatarUpdate}
        />
        <EllipsisVertical 
          color="#FFDE71" 
          className="w-5 h-5 cursor-pointer" 
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        />
        {isDropdownOpen && (
          <div className="absolute right-0 top-8 bg-gray-800 rounded-md shadow-lg py-2 min-w-[150px] z-10">
            <button
              className="flex items-center gap-2 w-full px-4 py-2 text-gray-300 hover:bg-gray-700"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera size={16} />
              Update Avatar
            </button>
            <button
              className="flex items-center gap-2 w-full px-4 py-2 text-gray-300 hover:bg-gray-700"
              onClick={() => {
                setIsEditingUsername(true);
                setIsDropdownOpen(false);
              }}
            >
              <User size={16} />
              Update Username
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserInfo;