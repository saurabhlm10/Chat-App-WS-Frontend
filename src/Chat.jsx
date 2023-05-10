import { useContext, useEffect, useRef, useState } from "react";
import { UserContext } from "./UserContext";
import { uniqBy } from "lodash";
import axios from "axios";

const Chat = () => {
  const [ws, setWs] = useState(null);
  const [onlinePeople, setOnlinePeople] = useState({});
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [newMessage, setNewMessage] = useState("");

  const [messages, setMessages] = useState([]);

  const [offlinePeople, setOfflinePeople] = useState({});

  const { username, id, setUsername, setId } = useContext(UserContext);

  const divUnderMessagesRef = useRef();

  const fileRef = useRef(null);

  useEffect(() => {
    connectToWs();
  }, []);

  const connectToWs = () => {
    const ws = new WebSocket("ws://localhost:4040");
    setWs(ws);
    ws.addEventListener("message", handleMessage);
    ws.addEventListener("close", () => {
      setTimeout(() => {
        console.log("Disconnected. Trying to reconnect.");
        connectToWs();
      }, 1000);
    });
  };

  const showOnlinePeople = (peopleArray) => {
    const people = {};

    peopleArray.forEach(({ userId, username }) => {
      people[userId] = username;
    });

    setOnlinePeople(people);
  };

  const handleMessage = (ev) => {
    const messageData = JSON.parse(ev.data);

    if ("online" in messageData) {
      showOnlinePeople(messageData.online);
    } else if ("text" in messageData) {
      if (messageData.sender === selectedUserId || messageData.sender === id) {
        setMessages((prev) => [...prev, { ...messageData }]);
      }
    }
  };

  onlinePeople;

  const onlinePeopleExcludingSelf = { ...onlinePeople };

  delete onlinePeopleExcludingSelf[id];

  const sendMessage = (e, file = null) => {
    if (e) e.preventDefault();

    ws.send(
      JSON.stringify({
        message: {
          text: newMessage,
          recipient: selectedUserId,
          file,
        },
      })
    );

    setNewMessage("");
    return;

    if (file) {
      setTimeout(() => {
        axios
          .get("/message/getMessagesByUserId/" + selectedUserId)
          .then((res) => {
            setMessages(res.data);
          });

        fileRef.current.value = null;
      }, 2000);
    } else {
      setNewMessage("");
      setMessages((prev) => [
        ...prev,
        {
          text: newMessage,
          sender: id,
          recipient: selectedUserId,
          _id: Date.now(),
        },
      ]);
    }
  };

  const sendFile = (e) => {
    const reader = new FileReader();
    reader.readAsDataURL(e.target.files[0]);
    // return console.log(reader);
    reader.onload = () => {
      sendMessage(null, {
        name: e.target.files[0].name,
        data: reader.result,
      });
    };
  };

  const logout = () => {
    axios.post("/auth/logout").then(() => {
      setWs(null);
      setId(null);
      setUsername(null);
      window.location.reload();
    });
  };

  // Scroll down on each message
  useEffect(() => {
    const divUnderMessages = divUnderMessagesRef.current;
    if (divUnderMessages) {
      divUnderMessages.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages]);

  useEffect(() => {
    if (selectedUserId) {
      axios
        .get("/message/getMessagesByUserId/" + selectedUserId)
        .then((res) => {
          setMessages(res.data);
        });
    }
  }, [selectedUserId]);

  useEffect(() => {
    axios.get("/profile/getallprofiles").then((res) => {
      const offlinePeopleArr = res.data
        .filter((p) => p._id !== id)
        .filter((p) => !Object.keys(onlinePeople).includes(p._id));
      const offlinePeople = {};
      offlinePeopleArr.forEach((p) => {
        offlinePeople[p._id] = p;
      });
      setOfflinePeople(offlinePeople);
    });
  }, [onlinePeople]);

  const messagesWithoutDupes = uniqBy(messages, "_id");

  return (
    <div className="grid grid-cols-9">
      <div className="col-span-2 border-r-indigo-400 border-r-2 h-screen flex flex-col">
        <div className="mt-2 text-blue-700 ">Online People:</div>
        <div className="flex-grow">
          {Object.keys(onlinePeopleExcludingSelf).map((userId) => (
            <div
              key={userId}
              // id={id}
              className={
                "border-b border-gray-100 py-2 cursor-pointer " +
                `${selectedUserId === userId && "bg-blue-200"}`
              }
              onClick={() => setSelectedUserId(userId)}
            >
              {onlinePeople[userId]}
            </div>
          ))}

          <div className="mt-4 text-blue-700">Offline People:</div>

          {Object.keys(offlinePeople).map((userId) => (
            <div
              key={userId}
              // id={id}
              className={
                "border-b border-gray-100 py-2 cursor-pointer " +
                `${selectedUserId === userId && "bg-blue-200"}`
              }
              onClick={() => setSelectedUserId(userId)}
            >
              {offlinePeople[userId].username}
            </div>
          ))}
        </div>

        <div className="p-2 text-center flex items-center justify-between">
          <span className="mr-2 text-sm text-gray-600 flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-4 h-4"
            >
              <path
                fillRule="evenodd"
                d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z"
                clipRule="evenodd"
              />
            </svg>
            {username}
          </span>
          <button
            onClick={logout}
            className="text-sm bg-blue-100 py-1 px-2 text-gray-500 border rounded-sm"
          >
            logout
          </button>
        </div>
      </div>

      <div className="col-span-7  h-screen flex flex-col ">
        <div className="flex-grow border-2 bg-blue-200">
          {!selectedUserId && (
            <div className="flex h-full flex-grow items-center justify-center">
              <div className=" text-white text-4xl">
                &larr; Select a person from the sidebar
              </div>
            </div>
          )}
          {!!selectedUserId && (
            <div className="relative h-full">
              <div className="overflow-y-scroll absolute top-0 left-0 right-0 bottom-2">
                {messagesWithoutDupes.length > 0 &&
                  messagesWithoutDupes.map((message) => (
                    <div
                      key={message._id}
                      className={
                        message.sender === id ? "text-right" : "text-left"
                      }
                    >
                      <div
                        key={message._id}
                        className={
                          "text-left inline-block p-2 my-2 rounded-md  text-2xl " +
                          (message.sender === id
                            ? "bg-blue-500 text-white"
                            : "bg-white text-gray-500")
                        }
                      >
                        {message.text}
                        {message.file && (
                          <div className="">
                            <a
                              target="_blank"
                              className="flex items-center gap-1 border-b"
                              href={
                                axios.defaults.baseURL.slice(0, -4) +
                                "/uploads/" +
                                message.file
                              }
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                className="w-4 h-4"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M18.97 3.659a2.25 2.25 0 00-3.182 0l-10.94 10.94a3.75 3.75 0 105.304 5.303l7.693-7.693a.75.75 0 011.06 1.06l-7.693 7.693a5.25 5.25 0 11-7.424-7.424l10.939-10.94a3.75 3.75 0 115.303 5.304L9.097 18.835l-.008.008-.007.007-.002.002-.003.002A2.25 2.25 0 015.91 15.66l7.81-7.81a.75.75 0 011.061 1.06l-7.81 7.81a.75.75 0 001.054 1.068L18.97 6.84a2.25 2.25 0 000-3.182z"
                                  clipRule="evenodd"
                                />
                              </svg>
                              {message.file}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                <div ref={divUnderMessagesRef}></div>
              </div>
            </div>
          )}
        </div>
        {!!selectedUserId && (
          <form className="flex gap-2" onSubmit={sendMessage}>
            <input
              type="text"
              className="border-2 w-96 flex-grow"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />
            <label className="cursor-pointer">
              <input
                type="file"
                className="hidden"
                onChange={sendFile}
                ref={fileRef}
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6 bg-white"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13"
                />
              </svg>
            </label>

            <button className="w-40 border-2 bg-blue-400 text-white ">
              Send
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Chat;
