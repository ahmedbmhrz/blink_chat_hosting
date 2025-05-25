import { useEffect, useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import List from "./Components/list/List";
import Chat from "./Components/chat/Chat";
import Detail from "./Components/detail/Detail";
import Login from "./Components/login/Login";
import Notification from "./Components/notification/Notification";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import { useUserStore } from "./userStore";
import { useChatStore } from "./chatStore";

function App() {
  const { currentUser, isLoading, fetchUserInfo } = useUserStore()
  const { chatId, resetChat } = useChatStore()
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    const unSub = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchUserInfo(user.uid);
      } else {
        fetchUserInfo(null);
        resetChat();
      }
    });
    return () => {
      unSub();
    };
  }, [fetchUserInfo, resetChat]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-500 to-purple-950 flex justify-center items-center">
        <div className="flex flex-col items-center gap-4 p-8 rounded-xl bg-[rgba(17,25,40,0.75)] backdrop-blur-[19px] border border-[#FFDE71]">
          <div className="w-16 h-16 border-4 border-[#FFDE71] border-t-transparent rounded-full animate-spin"></div>
          <h2 className="text-2xl font-bold text-white">Loading BlinkChat</h2>
          <p className="text-gray-300">Please wait while we set things up...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-purple-600 to-purple-950 flex justify-center items-center p-4">
        <div className="bg-eg container w-[80vw] h-[90vh] bg-[rgba(17,25,40,0.75)] backdrop-blur-[19px] saturate-[180%] rounded-xl border-2 border-[#FFDE71] flex">
          {currentUser ? (
            <>
              <List />
              {chatId && <Chat showDetail={showDetail} setShowDetail={setShowDetail} />}
              {chatId && showDetail && <Detail />}
            </>
          ) : (
            <Login />
          )}
          <Notification />
        </div>
      </div>
    </>
  );
}

export default App;