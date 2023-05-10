import React, { useContext } from "react";
import RegisterAndLogin from "./RegisterAndLogin";
import Chat from "./Chat";
import { Routes, Route } from "react-router-dom";
import { UserContext } from "./UserContext";

const AppRoutes = () => {
  const {username, id} = useContext(UserContext)

  if(username){
    return <Chat/>
  }

  return (
    <RegisterAndLogin/>
    // <Routes>
    //   <Route path="/register" element={<RegisterAndLogin />} />
    //   <Route path="/" element={<Chat />} />
    // </Routes>
  );
};

export default AppRoutes;
