import axios from "axios";
import { UserContextProvider } from "./UserContext";
import AppRoutes from "./AppRoutes";

function App() {
  axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL
  axios.defaults.withCredentials = true;

  return (
    <UserContextProvider>
      <AppRoutes />
    </UserContextProvider>
  );
}

export default App;
