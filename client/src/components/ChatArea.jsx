import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Paperclip,
  Smile,
  Search,
  Info,
  ChevronLeft,
  X,
  Image as ImageIcon,
  Check,
} from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useSocket } from '../context/SocketContext';
import {
  getConversationTitle,
  getConversationAvatar,
  getOtherMember,
} from '../utils/helpers';
import MessageItem from './MessageItem';
import UserAvatar from './UserAvatar';

const ChatArea = ({ onBack }) => {
  const { user } = useAuth();
  const { socket, isUserOnline } = useSocket();
  const {
    activeConversation,
    messages,
    sendMessage,
    editMessage,
    typingUsers,
    showInfoPanel,
    setShowInfoPanel,
    loadMessages,
  } = useChat();

  const [text, setText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editText, setEditText] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const title = getConversationTitle(activeConversation, user?._id);
  const avatar = getConversationAvatar(activeConversation, user?._id);
  const isGroup = activeConversation?.type === 'group';
  const otherMember = !isGroup ? getOtherMember(activeConversation, user?._id) : null;
  const isDirectOnline = otherMember ? isUserOnline(otherMember._id) : false;

  const activeTyping = typingUsers[activeConversation?._id] || [];

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeTyping]);

  // Handle typing indicator via socket
  const handleTextChange = (e) => {
    setText(e.target.value);

    if (!socket || !activeConversation) return;

    socket.emit('typing_start', { conversationId: activeConversation._id });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing_stop', { conversationId: activeConversation._id });
    }, 2000);
  };

  // Handle file select
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (event) => setFilePreview(event.target.result);
      reader.readAsDataURL(file);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Submit message
  const handleSend = async (e) => {
    e?.preventDefault();
    if ((!text.trim() && !selectedFile) || !activeConversation) return;

    if (socket) {
      socket.emit('typing_stop', { conversationId: activeConversation._id });
    }

    const currentText = text.trim();
    const currentFile = selectedFile;
    const currentReply = replyingTo;

    setText('');
    setSelectedFile(null);
    setFilePreview(null);
    setReplyingTo(null);
    setShowEmojiPicker(false);

    await sendMessage(currentText, currentFile, currentReply);
  };

  // Handle key press
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle Search within conversation
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (activeConversation) {
      loadMessages(activeConversation._id, searchQuery);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setShowSearch(false);
    if (activeConversation) {
      loadMessages(activeConversation._id, '');
    }
  };

  // Save Edit
  const handleSaveEdit = async () => {
    if (editingMessage && editText.trim()) {
      await editMessage(editingMessage._id, editText.trim());
      setEditingMessage(null);
      setEditText('');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 relative overflow-hidden">
      {/* Header */}
      <header className="px-4 py-3 bg-white border-b border-slate-200/80 flex items-center justify-between shadow-2xs z-10">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBack}
            className="md:hidden p-1.5 -ml-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
            title="Back to conversation list"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <UserAvatar
            src={avatar}
            name={title}
            size="md"
            isOnline={isGroup ? false : isDirectOnline}
            showBadge={!isGroup}
          />

          <div className="truncate">
            <h2 className="text-sm font-bold text-slate-900 truncate">{title}</h2>
            <p className="text-[11px] text-slate-500 truncate">
              {isGroup ? (
                `${activeConversation?.members?.length || 0} members`
              ) : isDirectOnline ? (
                <span className="text-emerald-600 font-medium">Online</span>
              ) : (
                'Offline'
              )}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={`p-2 rounded-xl transition-colors ${
              showSearch
                ? 'bg-brand-50 text-brand-600'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
            title="Search in conversation"
          >
            <Search className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowInfoPanel(!showInfoPanel)}
            className={`p-2 rounded-xl transition-colors ${
              showInfoPanel
                ? 'bg-brand-50 text-brand-600'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
            title="Details & settings"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* In-conversation Search Bar */}
      {showSearch && (
        <form
          onSubmit={handleSearchSubmit}
          className="p-2.5 bg-brand-50/70 border-b border-brand-100 flex items-center gap-2 animate-slide-up"
        >
          <Search className="w-4 h-4 text-brand-600 ml-2" />
          <input
            type="text"
            placeholder="Search messages in this conversation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent border-none text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
          />
          <button
            type="submit"
            className="px-2.5 py-1 rounded-lg bg-brand-600 text-white text-[11px] font-semibold"
          >
            Search
          </button>
          <button
            type="button"
            onClick={clearSearch}
            className="p-1 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </form>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mb-2 shadow-2xs">
              <Smile className="w-6 h-6 text-brand-500" />
            </div>
            <p className="text-xs font-medium text-slate-600">No messages yet</p>
            <p className="text-[11px] mt-0.5">Send a friendly greeting to start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageItem
              key={msg._id}
              message={msg}
              isGroup={isGroup}
              onReply={(m) => setReplyingTo(m)}
              onStartEdit={(m) => {
                setEditingMessage(m);
                setEditText(m.text || '');
              }}
            />
          ))
        )}

        {/* Typing indicator */}
        {activeTyping.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-500 animate-pulse">
            <span className="flex gap-1 items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-bounce [animation-delay:0.4s]" />
            </span>
            <span className="text-[11px]">
              {activeTyping.map((u) => u.name).join(', ')}{' '}
              {activeTyping.length === 1 ? 'is' : 'are'} typing...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Floating Emoji Picker */}
      {showEmojiPicker && (
        <div className="absolute bottom-20 left-4 z-40 shadow-2xl rounded-2xl overflow-hidden border border-slate-200">
          <EmojiPicker
            onEmojiClick={(emojiData) => {
              setText((prev) => prev + emojiData.emoji);
            }}
            width={320}
            height={380}
          />
        </div>
      )}

      {/* Reply Preview Bar */}
      {replyingTo && (
        <div className="px-4 py-2 bg-indigo-50/80 border-t border-indigo-100 flex items-center justify-between text-xs animate-slide-up">
          <div className="border-l-3 border-brand-600 pl-2 min-w-0">
            <p className="font-semibold text-brand-700 text-[11px]">
              Replying to {replyingTo.sender?.name || 'User'}
            </p>
            <p className="text-slate-600 truncate text-[11px]">
              {replyingTo.text || 'Attachment'}
            </p>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* File Preview Bar */}
      {filePreview && (
        <div className="px-4 py-2 bg-slate-100 border-t border-slate-200 flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-300">
            <img src={filePreview} alt="Preview" className="w-full h-full object-cover" />
            <button
              onClick={removeSelectedFile}
              className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-slate-900/70 text-white hover:bg-rose-600"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <div className="text-xs">
            <p className="font-medium text-slate-700 truncate max-w-xs">
              {selectedFile?.name}
            </p>
            <p className="text-[10px] text-slate-400">Ready to send</p>
          </div>
        </div>
      )}

      {/* Edit Message Modal/Banner */}
      {editingMessage && (
        <div className="p-3 bg-amber-50 border-t border-amber-200 flex items-center gap-2">
          <input
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="flex-1 px-3 py-1.5 rounded-xl border border-amber-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <button
            onClick={handleSaveEdit}
            className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold"
          >
            Save
          </button>
          <button
            onClick={() => setEditingMessage(null)}
            className="px-2 py-1.5 text-xs text-slate-500 hover:text-slate-700"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Bottom Input Area */}
      <div className="p-3 bg-white border-t border-slate-200/80">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          {/* Emoji Toggle */}
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-2 rounded-xl text-slate-500 hover:text-brand-600 hover:bg-slate-100 transition-colors"
            title="Emoji Picker"
          >
            <Smile className="w-5 h-5" />
          </button>

          {/* Attachment Toggle */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-xl text-slate-500 hover:text-brand-600 hover:bg-slate-100 transition-colors"
            title="Attach Photo"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Text Input */}
          <input
            type="text"
            placeholder="Type your message... (Enter to send)"
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-100/80 border border-transparent text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!text.trim() && !selectedFile}
            className="p-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white shadow-md shadow-brand-500/25 transition-all flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatArea;
