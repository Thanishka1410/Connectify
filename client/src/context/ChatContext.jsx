import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { conversationAPI, messageAPI } from '../services/api';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import toast from 'react-hot-toast';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [typingUsers, setTypingUsers] = useState({});
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'direct', 'group'
  const [searchFilter, setSearchFilter] = useState('');

  const activeConvRef = useRef(activeConversation);
  activeConvRef.current = activeConversation;

  // Load user's conversations
  const fetchConversations = useCallback(async () => {
    if (!user) return;
    try {
      setLoadingConversations(true);
      const res = await conversationAPI.getAll();
      if (res.data.success) {
        setConversations(res.data.conversations || []);
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setLoadingConversations(false);
    }
  }, [user]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Load messages when active conversation changes
  const loadMessages = useCallback(async (conversationId, searchQuery = '') => {
    if (!conversationId) return;
    try {
      setLoadingMessages(true);
      const res = await messageAPI.getByConversation(conversationId, {
        q: searchQuery,
      });
      if (res.data.success) {
        setMessages(res.data.messages || []);
      }
    } catch (err) {
      console.error('Error loading messages:', err);
      toast.error('Failed to load message history.');
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  // Select a conversation
  const selectConversation = useCallback(
    (conv) => {
      if (!conv) {
        setActiveConversation(null);
        setMessages([]);
        return;
      }

      // Leave previous socket room if any
      if (socket && activeConvRef.current && activeConvRef.current._id !== conv._id) {
        socket.emit('leave_conversation', { conversationId: activeConvRef.current._id });
      }

      setActiveConversation(conv);

      // Clear unread count for this conversation
      setUnreadCounts((prev) => ({ ...prev, [conv._id]: 0 }));

      // Join socket room
      if (socket) {
        socket.emit('join_conversation', { conversationId: conv._id });
      }

      loadMessages(conv._id);
    },
    [socket, loadMessages]
  );

  // Setup real-time socket listeners
  useEffect(() => {
    if (!socket) return;

    // Receive message
    const handleReceiveMessage = (newMsg) => {
      const activeConv = activeConvRef.current;

      // If message belongs to active chat, add to messages list
      if (activeConv && newMsg.conversation === activeConv._id) {
        setMessages((prev) => {
          // Avoid duplicate
          if (prev.some((m) => m._id === newMsg._id)) return prev;
          return [...prev, newMsg];
        });

        // Emit read receipt
        socket.emit('message_read', {
          conversationId: activeConv._id,
          messageId: newMsg._id,
        });
      } else {
        // Increment unread count
        setUnreadCounts((prev) => ({
          ...prev,
          [newMsg.conversation]: (prev[newMsg.conversation] || 0) + 1,
        }));

        // Show toast notification if message is from someone else
        if (newMsg.sender && newMsg.sender._id !== user?._id) {
          toast(
            `${newMsg.sender.name}: ${newMsg.text || 'Sent an attachment'}`,
            { icon: '💬', position: 'top-right' }
          );
        }
      }

      // Update last message in conversations list
      setConversations((prev) =>
        prev.map((c) =>
          c._id === newMsg.conversation
            ? { ...c, lastMessage: newMsg, updatedAt: newMsg.createdAt }
            : c
        ).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      );
    };

    // Typing indicators
    const handleTypingStart = ({ conversationId, user: typingUser }) => {
      setTypingUsers((prev) => {
        const currentList = prev[conversationId] || [];
        if (currentList.some((u) => u._id === typingUser._id)) return prev;
        return {
          ...prev,
          [conversationId]: [...currentList, typingUser],
        };
      });
    };

    const handleTypingStop = ({ conversationId, userId }) => {
      setTypingUsers((prev) => {
        const currentList = prev[conversationId] || [];
        return {
          ...prev,
          [conversationId]: currentList.filter((u) => u._id !== userId),
        };
      });
    };

    // Message edited
    const handleMessageEdited = ({ conversationId, message: updatedMsg }) => {
      if (activeConvRef.current?._id === conversationId) {
        setMessages((prev) =>
          prev.map((m) => (m._id === updatedMsg._id ? updatedMsg : m))
        );
      }
    };

    // Message deleted
    const handleMessageDeleted = ({ conversationId, messageId, deletedAt }) => {
      if (activeConvRef.current?._id === conversationId) {
        setMessages((prev) =>
          prev.map((m) =>
            m._id === messageId
              ? { ...m, deletedAt, text: 'This message was deleted', attachments: [] }
              : m
          )
        );
      }
    };

    // Message reaction updated
    const handleReactionUpdated = ({ conversationId, messageId, reactions }) => {
      if (activeConvRef.current?._id === conversationId) {
        setMessages((prev) =>
          prev.map((m) =>
            m._id === messageId ? { ...m, reactions } : m
          )
        );
      }
    };

    // Conversation membership or data changed
    const handleConversationChanged = () => {
      fetchConversations();
    };

    socket.on('receive_message', handleReceiveMessage);
    socket.on('typing_start', handleTypingStart);
    socket.on('typing_stop', handleTypingStop);
    socket.on('message_edited', handleMessageEdited);
    socket.on('message_deleted', handleMessageDeleted);
    socket.on('message_reaction_updated', handleReactionUpdated);
    socket.on('conversation_changed', handleConversationChanged);

    return () => {
      socket.off('receive_message', handleReceiveMessage);
      socket.off('typing_start', handleTypingStart);
      socket.off('typing_stop', handleTypingStop);
      socket.off('message_edited', handleMessageEdited);
      socket.off('message_deleted', handleMessageDeleted);
      socket.off('message_reaction_updated', handleReactionUpdated);
      socket.off('conversation_changed', handleConversationChanged);
    };
  }, [socket, user, fetchConversations]);

  // Send message
  const sendMessage = async (text, file = null, replyTo = null) => {
    if (!activeConversation) return;

    try {
      let res;
      if (file) {
        const formData = new FormData();
        formData.append('conversationId', activeConversation._id);
        if (text) formData.append('text', text);
        if (replyTo) formData.append('replyTo', replyTo._id);
        formData.append('file', file);
        res = await messageAPI.send(formData);
      } else {
        res = await messageAPI.send({
          conversationId: activeConversation._id,
          text,
          replyTo: replyTo ? replyTo._id : null,
        });
      }

      if (res.data.success && res.data.message) {
        const newMsg = res.data.message;
        setMessages((prev) => {
          if (prev.some((m) => m._id === newMsg._id)) return prev;
          return [...prev, newMsg];
        });

        // Broadcast to socket room if active
        if (socket) {
          socket.emit('receive_message', newMsg);
        }

        // Update conversation list
        setConversations((prev) =>
          prev.map((c) =>
            c._id === activeConversation._id
              ? { ...c, lastMessage: newMsg, updatedAt: newMsg.createdAt }
              : c
          ).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        );
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      toast.error('Failed to send message. Please try again.');
    }
  };

  // Edit message
  const editMessage = async (messageId, newText) => {
    try {
      const res = await messageAPI.edit(messageId, newText);
      if (res.data.success && res.data.message) {
        const updated = res.data.message;
        setMessages((prev) =>
          prev.map((m) => (m._id === messageId ? updated : m))
        );
        if (socket && activeConversation) {
          socket.emit('message_edited', {
            conversationId: activeConversation._id,
            message: updated,
          });
        }
        toast.success('Message updated.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to edit message.');
    }
  };

  // Delete message
  const deleteMessage = async (messageId) => {
    try {
      const res = await messageAPI.delete(messageId);
      if (res.data.success) {
        setMessages((prev) =>
          prev.map((m) =>
            m._id === messageId
              ? { ...m, deletedAt: res.data.deletedAt, text: 'This message was deleted', attachments: [] }
              : m
          )
        );
        if (socket && activeConversation) {
          socket.emit('message_deleted', {
            conversationId: activeConversation._id,
            messageId,
            deletedAt: res.data.deletedAt,
          });
        }
        toast.success('Message deleted.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete message.');
    }
  };

  // React to message
  const reactToMessage = async (messageId, emoji) => {
    try {
      const res = await messageAPI.react(messageId, emoji);
      if (res.data.success) {
        setMessages((prev) =>
          prev.map((m) =>
            m._id === messageId ? { ...m, reactions: res.data.reactions } : m
          )
        );
        if (socket && activeConversation) {
          socket.emit('message_reaction', {
            conversationId: activeConversation._id,
            messageId,
            emoji,
          });
        }
      }
    } catch (err) {
      console.error('Failed to react:', err);
    }
  };

  // Create or open direct conversation
  const startDirectChat = async (recipientId) => {
    try {
      const res = await conversationAPI.create({
        type: 'direct',
        recipientId,
      });
      if (res.data.success) {
        const conv = res.data.conversation;
        // Check if already in list
        setConversations((prev) => {
          if (prev.some((c) => c._id === conv._id)) return prev;
          return [conv, ...prev];
        });
        selectConversation(conv);
        return conv;
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start direct conversation.');
    }
  };

  // Create new group
  const createGroupChat = async (groupData) => {
    try {
      const res = await conversationAPI.create({
        type: 'group',
        ...groupData,
      });
      if (res.data.success) {
        const newGroup = res.data.conversation;
        setConversations((prev) => [newGroup, ...prev]);
        selectConversation(newGroup);
        toast.success(`Group "${newGroup.name}" created!`);
        return newGroup;
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create group.');
    }
  };

  // Update group details
  const updateGroup = async (conversationId, updateData) => {
    try {
      const res = await conversationAPI.update(conversationId, updateData);
      if (res.data.success) {
        const updated = res.data.conversation;
        setConversations((prev) =>
          prev.map((c) => (c._id === conversationId ? updated : c))
        );
        if (activeConversation?._id === conversationId) {
          setActiveConversation(updated);
        }
        if (socket) {
          socket.emit('conversation_changed', {
            conversationId,
            action: 'updated',
            data: updated,
          });
        }
        toast.success('Group information updated.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update group.');
    }
  };

  // Add members
  const addMembersToGroup = async (conversationId, userIds) => {
    try {
      const res = await conversationAPI.addMembers(conversationId, userIds);
      if (res.data.success) {
        const updated = res.data.conversation;
        setConversations((prev) =>
          prev.map((c) => (c._id === conversationId ? updated : c))
        );
        if (activeConversation?._id === conversationId) {
          setActiveConversation(updated);
        }
        if (socket) {
          socket.emit('conversation_changed', {
            conversationId,
            action: 'members_added',
          });
        }
        toast.success('Members added successfully.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add members.');
    }
  };

  // Remove member
  const removeMemberFromGroup = async (conversationId, userId) => {
    try {
      const res = await conversationAPI.removeMember(conversationId, userId);
      if (res.data.success) {
        const updated = res.data.conversation;
        setConversations((prev) =>
          prev.map((c) => (c._id === conversationId ? updated : c))
        );
        if (activeConversation?._id === conversationId) {
          setActiveConversation(updated);
        }
        if (socket) {
          socket.emit('conversation_changed', {
            conversationId,
            action: 'member_removed',
          });
        }
        toast.success('Member removed.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove member.');
    }
  };

  // Leave group
  const leaveGroup = async (conversationId) => {
    try {
      const res = await conversationAPI.leave(conversationId);
      if (res.data.success) {
        setConversations((prev) => prev.filter((c) => c._id !== conversationId));
        if (activeConversation?._id === conversationId) {
          setActiveConversation(null);
          setMessages([]);
        }
        if (socket) {
          socket.emit('leave_conversation', { conversationId });
          socket.emit('conversation_changed', {
            conversationId,
            action: 'member_left',
          });
        }
        toast.success('You have left the group.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to leave group.');
    }
  };

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeConversation,
        messages,
        loadingConversations,
        loadingMessages,
        unreadCounts,
        typingUsers,
        showInfoPanel,
        setShowInfoPanel,
        activeFilter,
        setActiveFilter,
        searchFilter,
        setSearchFilter,
        fetchConversations,
        selectConversation,
        loadMessages,
        sendMessage,
        editMessage,
        deleteMessage,
        reactToMessage,
        startDirectChat,
        createGroupChat,
        updateGroup,
        addMembersToGroup,
        removeMemberFromGroup,
        leaveGroup,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);
