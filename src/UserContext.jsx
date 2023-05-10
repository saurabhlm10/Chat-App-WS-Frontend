import axios from "axios";
import { createContext, useEffect, useState } from "react";

export const UserContext = createContext({});

export function UserContextProvider({ children }) {
  const [username, setUsername] = useState(null);
  const [password, setPassword] = useState(null);
  const [id, setId] = useState(null);

  useEffect(() => {
    axios.get("/profile/getprofile").then((response) => {
      if (response.status === 200) {
        setId(response.data.userId);
        setUsername(response.data.username);
      }
    });
  }, []);

  return (
    <UserContext.Provider
      value={{
        username,
        setUsername,
        id,
        setId,
        password,
        setPassword,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}
