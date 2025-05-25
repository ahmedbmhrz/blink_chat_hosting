import { useState } from "react";
import avatarBase from "../../assets/avatar.png";
import { toast } from "react-toastify";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../firebase"; // Add this import
import { doc, setDoc } from "firebase/firestore";
import upload from "../../upload";

const Login = () => {
  const [avatar, setAvatar] = useState({
    file: null,
    url: "",
  });
  const [isSignIn, setIsSignIn] = useState(true);
  const [loading, setLoading] = useState(false); // Add loading state

  const handleAvatar = (e) => {
    if (e.target.files[0]) {
      setAvatar({
        file: e.target.files[0],
        url: URL.createObjectURL(e.target.files[0]),
      });
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    const {username, email, password} = Object.fromEntries(formData);

    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      
      // Only upload avatar if a file was selected
      let imgUrl = null;
      if (avatar.file) {
        imgUrl = await upload(avatar.file);
      }

      await setDoc(doc(db, "users", res.user.uid), {
        username: username,
        email: email,
        avatar: imgUrl || avatarBase, // Use default avatar if no file was uploaded
        id: res.user.uid,
        blocked: [],
      });

      await setDoc(doc(db, "userchats", res.user.uid), {
        chats: [],
      });

      toast.success("User registered successfully");
    } catch (err) {
      console.log(err);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    const { email, password } = Object.fromEntries(formData);
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Logged in successfully");
    } catch(err) {
      console.log(err);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="text-gray-300 w-full h-full flex items-center justify-center">
      <div className={`transform transition-all duration-500 ${isSignIn ? 'translate-x-0' : '-translate-x-full opacity-0'} absolute`}>
        <h2 className="text-3xl font-bold text-center mb-8 animate-fade-in">Welcome Back to BlinkChat</h2>
        <form className="flex flex-col gap-5 min-w-[400px]" onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            name="email"
            className="p-4 border-none outline-none bg-gray-700 rounded-lg backdrop-blur-sm transition-colors"
          />
          <input
            type="password"
            placeholder="Password"
            name="password"
            className="p-4 border-none outline-none bg-gray-700 rounded-lg backdrop-blur-sm transition-colors"
          />
          <button 
            disabled={loading} 
            className="p-4 border-none outline-none bg-purple-800 rounded-lg cursor-pointer font-medium hover:bg-purple-700 transition-all disabled:cursor-not-allowed disabled:bg-[#C700FF]"
          >
            {loading ? "Loading..." : "Sign Up"}
          </button>
          <p className="text-center mt-4">
            Don't have an account?{" "}
            <button
              type="button"
              onClick={() => setIsSignIn(false)}
              className="text-[#FFDE71] cursor-pointer"
            >
              Sign Up
            </button>
          </p>
        </form>
      </div>

      <div className={`transform transition-all duration-500 ${!isSignIn ? 'translate-x-0' : 'translate-x-full opacity-0'} absolute`}>
        <h2 className="text-3xl font-bold text-center mb-8">Create an Account</h2>
        <form className="flex flex-col gap-5 min-w-[400px]" onSubmit={handleRegister}>
          <div className="flex flex-col items-center gap-3 mb-4">
            <label htmlFor="file" className="cursor-pointer group">
              <img
                src={avatar.url || avatarBase}
                alt="Avatar"
                className="w-24 h-24 rounded-full object-cover group-hover:opacity-80 transition-all"
              />
              <span className="block text-center mt-2 text-[#FFDE71] text-sm group-hover:underline">
                Upload an avatar
              </span>
            </label>
            <input
              type="file"
              id="file"
              className="hidden"
              onChange={handleAvatar}
            />
          </div>
          <input
            type="text"
            placeholder="Username"
            name="username"
            className="p-4 border-none outline-none bg-gray-700 rounded-lg backdrop-blur-sm transition-colors"
          />
          <input
            type="email"
            placeholder="Email"
            name="email"
            className="p-4 border-none outline-none bg-gray-700 rounded-lg backdrop-blur-sm transition-colors"
          />
          <input
            type="password"
            placeholder="Password"
            name="password"
            className="p-4 border-none outline-none bg-gray-700 rounded-lg backdrop-blur-sm transition-colors"
          />
          <button 
            disabled={loading} 
            className="p-4 border-none outline-none bg-purple-800 rounded-lg cursor-pointer font-medium hover:bg-purple-700 transition-all disabled:cursor-not-allowed disabled:bg-[#C700FF]"
          >
            {loading ? "Loading..." : "Sign In"} {/* Changed from "Sign Up" to "Sign In" */}
          </button>
          
          <p className="text-center mt-4 ">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => setIsSignIn(true)}
              className="text-[#FFDE71] cursor-pointer"
            >
              Sign In
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;