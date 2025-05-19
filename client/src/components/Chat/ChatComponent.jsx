import React, { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import newRequest from "../../utils/newRequest";
import moment from "moment";
import LoadingSpinner from "../LoadingSpinner/LoadingSpinner";
import notification from "../../utils/notification";
import "./Chat.scss";

const ChatComponent = () => {
  const [conversations, setConversations] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [arrivalMessage, setArrivalMessage] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const socket = useRef();
  const scrollRef = useRef();
  const queryClient = useQueryClient();
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  // Helper function to get user display name
  const getUserDisplayName = (user) => {
    if (!user) return "User";
    return user.fullName || user.username || "User";
  };

  // Kết nối Socket.IO
  useEffect(() => {
    try {
      socket.current = io("http://localhost:8800", {
        auth: {
          token:
            localStorage.getItem("accessToken") ||
            localStorage.getItem("token"),
        },
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000,
        transports: ["websocket", "polling"],
      });

      socket.current.on("connect", () => {
        console.log("Connected to socket server from Chat component");
        socket.current.emit("add-user", currentUser?._id || "anonymous");
      });

      socket.current.on("connect_error", (error) => {
        console.error("Socket connection error:", error.message);
      });

      socket.current.on("get-users", (users) => {
        setOnlineUsers(users);
      });

      // Cleanup function
      return () => {
        if (socket.current) {
          console.log("Disconnecting socket from Chat component");
          socket.current.disconnect();
        }
      };
    } catch (error) {
      console.error("Error initializing socket:", error);
    }
  }, [currentUser?._id]);

  // Tách logic nhận tin nhắn và thông báo thành useEffect riêng
  useEffect(() => {
    if (!socket.current) return;

    const handleReceiveMessage = (data) => {
      setArrivalMessage({
        senderId: data.senderId,
        text: data.text,
        createdAt: Date.now(),
        attachments: data.attachments || [],
      });

      // Hiển thị thông báo chỉ khi không xem cuộc hội thoại đó
      if (!currentChat || currentChat._id !== data.conversationId) {
        notification.info(
          `Tin nhắn mới: ${data.text.substring(0, 30)}${
            data.text.length > 30 ? "..." : ""
          }`
        );
      }
    };

    const handleTyping = (data) => {
      if (currentChat?.members.includes(data.senderId)) {
        setIsTyping(true);
      }
    };

    const handleStopTyping = (data) => {
      if (currentChat?.members.includes(data.senderId)) {
        setIsTyping(false);
      }
    };

    socket.current.on("receive-message", handleReceiveMessage);
    socket.current.on("typing", handleTyping);
    socket.current.on("stop-typing", handleStopTyping);

    return () => {
      socket.current.off("receive-message", handleReceiveMessage);
      socket.current.off("typing", handleTyping);
      socket.current.off("stop-typing", handleStopTyping);
    };
  }, [currentChat]);

  // Cập nhật tin nhắn khi có tin nhắn mới đến
  useEffect(() => {
    arrivalMessage &&
      currentChat?.members.includes(arrivalMessage.senderId) &&
      setMessages((prev) => [...prev, arrivalMessage]);
  }, [arrivalMessage, currentChat]);

  // Lấy danh sách hội thoại
  const { isLoading: loadingConversations, error: conversationsError } =
    useQuery({
      queryKey: ["conversations"],
      queryFn: async () => {
        const res = await newRequest.get("/conversations");
        console.log("Conversations data:", res.data);
        // Check what properties otherUser has
        if (res.data && res.data.length > 0) {
          const otherUser = res.data[0].members.find(
            (member) => member._id !== currentUser._id
          );
          console.log("First conversation other user:", otherUser);
        }
        setConversations(res.data);
        return res.data;
      },
    });

  // Lấy tin nhắn cho hội thoại hiện tại
  const { isLoading: loadingMessages, error: messagesError } = useQuery({
    queryKey: ["messages", currentChat?._id],
    queryFn: async () => {
      if (!currentChat) return [];

      try {
        const res = await newRequest.get(`/messages/${currentChat._id}`);
        setMessages(res.data);
        return res.data;
      } catch (err) {
        console.error(err);
        return [];
      }
    },
    enabled: !!currentChat,
  });

  // Đánh dấu tin nhắn đã đọc
  const markAsReadMutation = useMutation({
    mutationFn: async (conversationId) => {
      return await newRequest.put(`/messages/${conversationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["conversations"]);
    },
  });

  // Gửi tin nhắn
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData) => {
      return await newRequest.post("/messages", messageData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["messages", currentChat?._id]);
      queryClient.invalidateQueries(["conversations"]);
      setNewMessage("");
    },
  });

  // Xử lý gửi tin nhắn
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && attachments.length === 0) return;

    const receiverId = currentChat.members.find(
      (member) => member._id !== currentUser._id
    );

    const messageData = {
      conversationId: currentChat._id,
      text: newMessage,
      receiverId,
      attachments,
    };

    socket.current.emit("send-message", {
      senderId: currentUser._id,
      receiverId,
      text: newMessage,
      conversationId: currentChat._id,
      attachments,
    });

    socket.current.emit("stop-typing", {
      senderId: currentUser._id,
      receiverId,
      conversationId: currentChat._id,
    });

    try {
      await sendMessageMutation.mutateAsync(messageData);
      setAttachments([]);
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  // Xử lý thông báo đang nhập
  const handleTyping = () => {
    if (!currentChat) return;

    const receiverId = currentChat.members.find(
      (member) => member._id !== currentUser._id
    );

    if (typingTimeout) clearTimeout(typingTimeout);

    socket.current.emit("typing", {
      senderId: currentUser._id,
      receiverId,
      conversationId: currentChat._id,
    });

    const timeout = setTimeout(() => {
      socket.current.emit("stop-typing", {
        senderId: currentUser._id,
        receiverId,
        conversationId: currentChat._id,
      });
    }, 2000);

    setTypingTimeout(timeout);
  };

  // Xử lý khi chọn một hội thoại
  const handleConversationClick = (conversation) => {
    setCurrentChat(conversation);
    if (conversation._id) {
      markAsReadMutation.mutate(conversation._id);
    }
  };

  // Tự động cuộn đến tin nhắn mới nhất
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Kiểm tra người dùng đang online
  const isUserOnline = (userId) => {
    return onlineUsers.some((user) => user.userId === userId);
  };

  // Xử lý tải file
  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);

        const res = await newRequest.post("/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        if (res.data && res.data.url) {
          return `http://localhost:8800${res.data.url}`;
        } else {
          throw new Error("Invalid response from server");
        }
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      setAttachments([...attachments, ...uploadedUrls]);
    } catch (err) {
      console.error("Error uploading file:", err);
      notification.error("Failed to upload file. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  // Xóa file đã chọn
  const removeAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  return (
    <div className="chat">
      <div className="container">
        <div className="left">
          <div className="conversations">
            <h2>Conversations</h2>
            {loadingConversations ? (
              <p>Loading...</p>
            ) : conversationsError ? (
              <p>Error loading conversations</p>
            ) : (
              <ul>
                {conversations.map((c) => {
                  const otherUser = c.members.find(
                    (member) => member._id !== currentUser._id
                  );
                  const isOnline = isUserOnline(otherUser?._id);

                  return (
                    <li
                      key={c._id}
                      className={currentChat?._id === c._id ? "active" : ""}
                      onClick={() => handleConversationClick(c)}
                    >
                      <div className="user-info">
                        <img
                          src={otherUser?.img || "/img/noavatar.jpg"}
                          alt="avatar"
                        />
                        <div className="details">
                          <span>{getUserDisplayName(otherUser)}</span>
                          <p className="last-message">
                            {c.lastMessage?.text?.substring(
                              0,
                              c.lastMessage?.text.length > 20
                                ? 20
                                : c.lastMessage?.text.length
                            ) + (c.lastMessage?.text?.length > 20 ? "..." : "")}
                          </p>
                        </div>
                      </div>
                      <div className="info">
                        <span className={isOnline ? "online" : ""}>
                          {isOnline
                            ? "online"
                            : moment(c.lastMessageAt).fromNow()}
                        </span>
                        {c.lastMessage &&
                          c.lastMessage.senderId !== currentUser._id &&
                          !c.lastMessage.isRead && (
                            <div className="unread">Mới</div>
                          )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
        <div className="right">
          {!currentChat ? (
            <div className="no-conversation">
              <span>Select a conversation to start</span>
            </div>
          ) : (
            <>
              <div className="chat-header">
                {currentChat && (
                  <div className="user-info">
                    <img
                      src={
                        currentChat.members.find(
                          (member) => member._id !== currentUser._id
                        )?.img || "/img/noavatar.jpg"
                      }
                      alt=""
                    />
                    <div>
                      <span>
                        {getUserDisplayName(
                          currentChat.members.find(
                            (member) => member._id !== currentUser._id
                          )
                        )}
                      </span>
                      <div
                        className={
                          isUserOnline(
                            currentChat.members.find(
                              (member) => member._id !== currentUser._id
                            )?._id
                          )
                            ? "status online"
                            : "status"
                        }
                      >
                        {isUserOnline(
                          currentChat.members.find(
                            (member) => member._id !== currentUser._id
                          )?._id
                        )
                          ? "online"
                          : "offline"}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="chat-messages">
                {loadingMessages ? (
                  <LoadingSpinner />
                ) : messagesError ? (
                  <p>Error loading messages</p>
                ) : (
                  <>
                    {messages.map((m, index) => (
                      <div
                        key={index}
                        className={`message ${
                          (m.senderId._id || m.senderId) === currentUser._id
                            ? "own"
                            : ""
                        }`}
                        ref={index === messages.length - 1 ? scrollRef : null}
                      >
                        <div className="message-content">
                          <p>{m.text}</p>
                          {m.attachments?.length > 0 && (
                            <div className="attachments">
                              {m.attachments.map((url, idx) => (
                                <div key={idx} className="attachment">
                                  {url.match(/\.(jpeg|jpg|gif|png)$/) ? (
                                    <img src={url} alt="attachment" />
                                  ) : (
                                    <a
                                      href={url}
                                      target="_blank"
                                      rel="noreferrer"
                                    >
                                      File
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="message-meta">
                          <span>{moment(m.createdAt).format("HH:mm")}</span>
                          {m.senderId === currentUser._id && (
                            <span className={m.isRead ? "read" : ""}>
                              {m.isRead ? "Đã đọc" : "Đã gửi"}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    {isTyping && (
                      <div className="typing-indicator">
                        <div className="dot"></div>
                        <div className="dot"></div>
                        <div className="dot"></div>
                      </div>
                    )}
                  </>
                )}
              </div>
              <form className="chat-input" onSubmit={handleSubmit}>
                <textarea
                  placeholder="Write a message..."
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    handleTyping();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                />
                <div className="attachment-controls">
                  <label htmlFor="file-upload" className="file-upload-label">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M21 12.5V18C21 19.1046 20.1046 20 19 20H5C3.89543 20 3 19.1046 3 18V6C3 4.89543 3.89543 4 5 4H14.5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M16 8L21 3"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M16 3H21V8"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </label>
                  <input
                    id="file-upload"
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    style={{ display: "none" }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={
                    (!newMessage.trim() && attachments.length === 0) ||
                    sendMessageMutation.isLoading ||
                    isUploading
                  }
                >
                  Send
                </button>
              </form>
              {attachments.length > 0 && (
                <div className="selected-attachments">
                  {attachments.map((url, idx) => (
                    <div key={idx} className="attachment-preview">
                      {url.match(/\.(jpeg|jpg|gif|png)$/) ? (
                        <img src={url} alt="attachment" />
                      ) : (
                        <div className="file-preview">File</div>
                      )}
                      <button
                        className="remove-attachment"
                        onClick={() => removeAttachment(idx)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatComponent;
