import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import newRequest from "../../utils/newRequest";
import { io } from "socket.io-client";
import moment from "moment";
import LoadingSpinner from "../../components/loadingSpinner/LoadingSpinner";
import "./Message.scss";

function Message() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [socket, setSocket] = useState(null);
  const [arrivalMessage, setArrivalMessage] = useState(null);
  const messagesEndRef = useRef(null);
  const [attachments, setAttachments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  // Khởi tạo kết nối Socket.IO
  useEffect(() => {
    try {
      const newSocket = io("http://localhost:8800", {
        auth: {
          token:
            localStorage.getItem("accessToken") ||
            localStorage.getItem("token"),
        },
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        forceNew: true,
        timeout: 10000,
        transports: ["websocket", "polling"],
      });

      newSocket.on("connect_error", (error) => {
        console.log("Socket connection error:", error.message);
      });

      setSocket(newSocket);

      return () => {
        if (newSocket) {
          console.log("Disconnecting socket from Message component");
          newSocket.disconnect();
        }
      };
    } catch (error) {
      console.error("Error initializing socket:", error);
    }
  }, []);

  // Lắng nghe tin nhắn đến
  useEffect(() => {
    if (socket) {
      socket.on("receive-message", (data) => {
        if (data.conversationId === id) {
          setArrivalMessage({
            senderId: data.senderId,
            text: data.text,
            createdAt: Date.now(),
            attachments: data.attachments || [],
          });
        }
      });
    }
  }, [socket, id]);

  // Thêm tin nhắn mới vào danh sách tin nhắn
  useEffect(() => {
    arrivalMessage && setMessages((prev) => [...prev, arrivalMessage]);
  }, [arrivalMessage]);

  // Cuộn xuống tin nhắn mới nhất
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Lấy dữ liệu hội thoại
  const { data: conversation, isLoading: loadingConversation } = useQuery({
    queryKey: ["conversation", id],
    queryFn: async () => {
      try {
        const res = await newRequest.get(`/conversations/${id}`);
        return res.data;
      } catch (err) {
        navigate("/messages");
        return null;
      }
    },
  });

  // Lấy tin nhắn
  const { isLoading: loadingMessages } = useQuery({
    queryKey: ["messages", id],
    queryFn: async () => {
      try {
        const res = await newRequest.get(`/messages/${id}`);
        setMessages(res.data);
        return res.data;
      } catch (err) {
        console.error(err);
        return [];
      }
    },
  });

  // Đánh dấu tin nhắn đã đọc
  const markAsReadMutation = useMutation({
    mutationFn: async () => {
      return await newRequest.put(`/messages/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["conversations"]);
    },
  });

  // Sử dụng useEffect để gọi mutation
  useEffect(() => {
    if (id && messages.length > 0) {
      markAsReadMutation.mutate();
    }
  }, [id, messages.length]);

  // Gửi tin nhắn
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData) => {
      return await newRequest.post("/messages", messageData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["messages", id]);
      setNewMessage("");
    },
  });

  // Xử lý gửi tin nhắn
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && attachments.length === 0) return;

    // Derive receiverId from conversation members
    const members = conversation?.members || [];
    let receiverId = null;
    // members may be array of objects or strings
    for (const m of members) {
      const idVal = m._id || m;
      if (idVal !== currentUser._id) {
        receiverId = idVal;
        break;
      }
    }
    if (!receiverId) return;

    const messageData = {
      conversationId: id,
      text: newMessage,
      receiverId,
      attachments,
    };

    // Phát sự kiện socket
    socket?.emit("send-message", {
      senderId: currentUser._id,
      receiverId,
      text: newMessage,
      conversationId: id,
      attachments,
    });

    try {
      await sendMessageMutation.mutateAsync(messageData);
      setAttachments([]);
    } catch (err) {
      console.error("Error sending message:", err);
    }
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
      alert("Failed to upload file. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  // Xóa file đã chọn
  const removeAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  if (loadingConversation || loadingMessages) {
    return <LoadingSpinner fullPage text="Loading conversation..." />;
  }

  return (
    <div className="message">
      <div className="container">
        <div className="header">
          <button onClick={() => navigate("/messages")}>Back</button>
          {conversation && (
            <div className="user-info">
              {conversation.members.map((member) => {
                if ((member._id || member) !== currentUser._id) {
                  return (
                    <span key={member._id || member}>
                      {member.fullName || "User"}
                    </span>
                  );
                }
                return null;
              })}
            </div>
          )}
        </div>
        <div className="messages-container">
          {messages.map((m) => {
            // Log để kiểm tra ID
            console.log("Message ID check:", {
              messageSenderId: m.senderId._id || m.senderId,
              currentUserId: currentUser._id,
              isOwn: (m.senderId._id || m.senderId) === currentUser._id,
            });

            return (
              <div
                className={
                  (m.senderId._id || m.senderId) === currentUser._id
                    ? "item owner"
                    : "item"
                }
                key={m._id}
              >
                <div className="content">
                  <p>{m.text}</p>
                  {m.attachments?.length > 0 && (
                    <div className="attachments">
                      {m.attachments.map((url, idx) => (
                        <div key={idx} className="attachment">
                          {url.match(/\.(jpeg|jpg|gif|png)$/) ? (
                            <img src={url} alt="attachment" />
                          ) : (
                            <a href={url} target="_blank" rel="noreferrer">
                              File
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <p className="time">{moment(m.createdAt).format("HH:mm")}</p>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
        <form className="write" onSubmit={handleSubmit}>
          <textarea
            type="text"
            placeholder="Write your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <div className="input-actions">
            <div className="upload-control">
              <label htmlFor="file-upload">
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
                (!newMessage.trim() && attachments.length === 0) || isUploading
              }
            >
              Send
            </button>
          </div>
        </form>
        {attachments.length > 0 && (
          <div className="selected-files">
            {attachments.map((url, idx) => (
              <div key={idx} className="file-preview">
                {url.match(/\.(jpeg|jpg|gif|png)$/) ? (
                  <img src={url} alt="attachment" />
                ) : (
                  <div className="file-icon">File</div>
                )}
                <button
                  className="remove-file"
                  onClick={() => removeAttachment(idx)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Message;
