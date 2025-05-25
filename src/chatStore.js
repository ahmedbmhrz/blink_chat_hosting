import { create } from "zustand";
import { useUserStore } from "./userStore";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "./firebase";

export const useChatStore = create((set) => ({
  chatId: null,
  user: null,
  isCurrentUserBlocked: false,
  isReceiverBlocked: false,
  changeChat: (chatId, user) => {
    const currentState = useChatStore.getState();
    
    // Fetch the latest blocking status from Firestore
    if (chatId) {
      getDoc(doc(db, "chats", chatId)).then((docSnap) => {
        if (docSnap.exists()) {
          const chatData = docSnap.data();
          const currentUser = useUserStore.getState().currentUser;
          
          set({
            chatId,
            user,
            isCurrentUserBlocked: chatData.blockedUsers?.includes(currentUser.id) || false,
            isReceiverBlocked: chatData.blockedUsers?.includes(user.id) || false
          });
        }
      });
    }
  },

  changeBlock: async () => {
    const { chatId, user, isReceiverBlocked } = useChatStore.getState();
    const currentUser = useUserStore.getState().currentUser;

    if (!chatId || !currentUser) return;

    const chatRef = doc(db, "chats", chatId);
    const chatDoc = await getDoc(chatRef);

    if (chatDoc.exists()) {
      const chatData = chatDoc.data();
      let blockedUsers = chatData.blockedUsers || [];

      if (isReceiverBlocked) {
        // Unblock user
        blockedUsers = blockedUsers.filter(id => id !== user.id);
      } else {
        // Block user
        if (!blockedUsers.includes(user.id)) {
          blockedUsers.push(user.id);
        }
      }

      // Update Firestore
      await updateDoc(chatRef, { blockedUsers });

      // Update local state
      set(state => ({ 
        ...state, 
        isReceiverBlocked: !state.isReceiverBlocked 
      }));
    }
  },

  resetChat: () => {
    set({
      chatId: null,
      user: null,
      isCurrentUserBlocked: false,
      isReceiverBlocked: false,
    });
  },
}));