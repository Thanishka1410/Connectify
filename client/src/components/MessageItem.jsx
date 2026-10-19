import React, { useState, useRef, useEffect } from 'react';
import {
  MoreVertical,
  Reply,
  Copy,
  Edit2,
  Trash2,
  Smile,
  Check,
  CheckCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { formatMessageTime } from '../utils/helpers';
import UserAvatar from './UserAvatar';
import toast from 'react-hot-toast';

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

const MessageItem = ({ message, isGroup, onReply, onStartEdit }) => {
  const { user } = useAuth();
  const { deleteMessage, reactToMessage, activeConversation } = useChat();

  const [showMenu, setShowMenu] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const menuRef = useRef(null);

  const isMe = message.sender?._id === user?._id;
  const isDeleted = Boolean(message.deletedAt);
  const isSystem = Boolean(message.isSystem);

  const isGroupAdmin =
    activeConversation?.type === 'group' &&
    activeConversation.admins?.some(
      (a) => (a._id || a).toString() === user?._id?.toString()
    );

  const canDelete = isMe || isGroupAdmin;
  const canEdit = isMe && !isDeleted && !isSystem;

  // Close menus on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
        setShowReactionPicker(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleCopy = () => {
    if (message.text) {
      navigator.clipboard.writeText(message.text);
      toast.success('Copied to clipboard');
      setShowMenu(false);
    }
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      deleteMessage(message._id);
      setShowMenu(false);
    }
  };

  const handleReact = (emoji) => {
    reactToMessage(message._id, emoji);
    setShowReactionPicker(false);
    setShowMenu(false);
  };

  // Render System Message
  if (isSystem) {
    return (
      <div className="flex justify-center my-3">
        <span className="px-3 py-1 rounded-full bg-slate-100/90 text-slate-500 text-[11px] font-medium shadow-2xs border border-slate-200/50">
          {message.text}
        </span>
      </div>
    );
  }

  // Count reactions
  const reactionCounts = (message.reactions || []).reduce((acc, curr) => {
    acc[curr.emoji] = (acc[curr.emoji] || 0) + 1;
    return acc;
  }, {});

  const hasMyReaction = (emoji) =>
    (message.reactions || []).some(
      (r) => (r.user?._id || r.user).toString() === user?._id?.toString() && r.emoji === emoji
    );

  return (
    <div
      ref={menuRef}
      className={`group relative flex gap-2.5 my-1.5 px-3 py-1 rounded-xl transition-colors hover:bg-slate-50/70 ${
        isMe ? 'flex-row-reverse' : 'flex-row'
      }`}
    >
      {/* Sender Avatar for incoming group messages */}
      {!isMe && (
        <UserAvatar
          src={message.sender?.avatar}
          name={message.sender?.name}
          size="sm"
          showBadge={false}
          className="mt-1"
        />
      )}

      {/* Bubble Container */}
      <div className={`max-w-[75%] sm:max-w-[65%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
        {/* Sender Name in group */}
        {!isMe && isGroup && (
          <span className="text-[11px] font-semibold text-brand-600 mb-0.5 ml-1">
            {message.sender?.name || 'Unknown'}
          </span>
        )}

        {/* Reply Preview */}
        {message.replyTo && (
          <div
            className={`w-full text-xs p-2 rounded-t-xl mb-0.5 border-l-3 bg-slate-100/90 text-slate-600 ${
              isMe ? 'border-brand-500' : 'border-indigo-400'
            }`}
          >
            <p className="font-semibold text-[10px] text-brand-700">
              {message.replyTo.sender?.name || 'User'}
            </p>
            <p className="truncate text-[11px]">
              {message.replyTo.deletedAt
                ? 'Original message was deleted'
                : message.replyTo.text || 'Attachment'}
            </p>
          </div>
        )}

        {/* Message Bubble */}
        <div
          className={`relative px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-2xs break-words ${
            isDeleted
              ? 'bg-slate-100 text-slate-400 italic border border-slate-200/60'
              : isMe
              ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-tr-xs'
              : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-xs'
          }`}
        >
          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="space-y-1.5 mb-2">
              {message.attachments.map((att, idx) => (
                <div key={idx} className="rounded-xl overflow-hidden max-w-sm border border-black/10">
                  <a href={att.url} target="_blank" rel="noopener noreferrer">
                    <img
                      src={att.url}
                      alt={att.name || 'Attachment'}
                      className="max-h-64 w-full object-cover hover:scale-[1.01] transition-transform"
                    />
                  </a>
                </div>
              ))}
            </div>
          )}

          {/* Text */}
          <p className="whitespace-pre-wrap">{message.text}</p>

          {/* Footer inside bubble */}
          <div
            className={`flex items-center gap-1.5 justify-end mt-1 text-[10px] select-none ${
              isMe ? 'text-indigo-100' : 'text-slate-400'
            }`}
          >
            {message.editedAt && !isDeleted && <span>(edited)</span>}
            <span>{formatMessageTime(message.createdAt)}</span>
            {isMe && !isDeleted && (
              <span>
                {message.readBy && message.readBy.length > 1 ? (
                  <CheckCheck className="w-3.5 h-3.5 text-sky-200" title="Read" />
                ) : (
                  <Check className="w-3.5 h-3.5" title="Sent" />
                )}
              </span>
            )}
          </div>
        </div>

        {/* Reaction badges */}
        {Object.keys(reactionCounts).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1 px-1">
            {Object.entries(reactionCounts).map(([emoji, count]) => {
              const active = hasMyReaction(emoji);
              return (
                <button
                  key={emoji}
                  onClick={() => handleReact(emoji)}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] border shadow-2xs transition-all ${
                    active
                      ? 'bg-brand-50 border-brand-300 text-brand-700 font-semibold scale-105'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{emoji}</span>
                  <span>{count}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Hover Action Bar */}
      {!isDeleted && (
        <div
          className={`opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 self-center bg-white border border-slate-200 shadow-md rounded-xl p-1 z-10 ${
            isMe ? 'mr-1' : 'ml-1'
          }`}
        >
          {/* Quick Reaction Button */}
          <button
            onClick={() => setShowReactionPicker(!showReactionPicker)}
            className="p-1 rounded-lg text-slate-500 hover:text-amber-500 hover:bg-slate-100 transition-colors"
            title="React"
          >
            <Smile className="w-3.5 h-3.5" />
          </button>

          {/* Reply Button */}
          <button
            onClick={() => onReply(message)}
            className="p-1 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-slate-100 transition-colors"
            title="Reply"
          >
            <Reply className="w-3.5 h-3.5" />
          </button>

          {/* More options toggle */}
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Floating Reaction Picker */}
      {showReactionPicker && (
        <div
          className={`absolute bottom-full mb-1 bg-white border border-slate-200 shadow-xl rounded-2xl p-1.5 flex items-center gap-1 z-30 animate-scale-in ${
            isMe ? 'right-12' : 'left-12'
          }`}
        >
          {QUICK_REACTIONS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleReact(emoji)}
              className="text-base p-1.5 hover:bg-slate-100 rounded-xl hover:scale-125 transition-transform"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Dropdown Menu */}
      {showMenu && (
        <div
          className={`absolute top-full mt-1 bg-white border border-slate-200 shadow-xl rounded-xl py-1 w-32 z-30 ${
            isMe ? 'right-4' : 'left-4'
          }`}
        >
          <button
            onClick={handleCopy}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
          >
            <Copy className="w-3.5 h-3.5 text-slate-400" /> Copy
          </button>
          {canEdit && (
            <button
              onClick={() => {
                setShowMenu(false);
                onStartEdit(message);
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
            >
              <Edit2 className="w-3.5 h-3.5 text-slate-400" /> Edit
            </button>
          )}
          {canDelete && (
            <button
              onClick={handleDelete}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default MessageItem;
