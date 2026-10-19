import React, { useState } from 'react';
import {
  X,
  Users,
  Calendar,
  Image as ImageIcon,
  UserPlus,
  LogOut,
  Shield,
  Trash2,
  Edit3,
  Check,
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useSocket } from '../context/SocketContext';
import {
  getConversationTitle,
  getConversationAvatar,
  getOtherMember,
} from '../utils/helpers';
import UserAvatar from './UserAvatar';
import AddMemberModal from './AddMemberModal';

const InfoPanel = ({ onClose }) => {
  const { user } = useAuth();
  const { isUserOnline } = useSocket();
  const {
    activeConversation,
    messages,
    removeMemberFromGroup,
    leaveGroup,
    updateGroup,
  } = useChat();

  const [showAddMembers, setShowAddMembers] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(activeConversation?.name || '');
  const [editDesc, setEditDesc] = useState(activeConversation?.description || '');

  if (!activeConversation) return null;

  const isGroup = activeConversation.type === 'group';
  const title = getConversationTitle(activeConversation, user?._id);
  const avatar = getConversationAvatar(activeConversation, user?._id);
  const otherMember = !isGroup ? getOtherMember(activeConversation, user?._id) : null;

  const isAdmin =
    isGroup &&
    activeConversation.admins?.some(
      (a) => (a._id || a).toString() === user?._id?.toString()
    );

  // Collect all media attachments from message history
  const sharedMedia = messages
    .flatMap((m) => m.attachments || [])
    .filter(Boolean);

  const handleSaveEdit = async () => {
    if (!editName.trim()) return;
    await updateGroup(activeConversation._id, {
      name: editName.trim(),
      description: editDesc.trim(),
    });
    setIsEditing(false);
  };

  const handleRemove = (memberId) => {
    if (window.confirm('Remove this member from the group?')) {
      removeMemberFromGroup(activeConversation._id, memberId);
    }
  };

  const handleLeave = () => {
    if (window.confirm('Are you sure you want to leave this group?')) {
      leaveGroup(activeConversation._id);
      onClose();
    }
  };

  return (
    <>
      <aside className="w-full md:w-80 lg:w-88 h-full bg-white border-l border-slate-200/80 flex flex-col overflow-y-auto select-none shadow-lg md:shadow-none z-20">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800">
            {isGroup ? 'Group Information' : 'Contact Details'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Card */}
        <div className="p-6 flex flex-col items-center text-center border-b border-slate-100">
          <UserAvatar
            src={avatar}
            name={title}
            size="xl"
            isOnline={isGroup ? false : isUserOnline(otherMember?._id)}
            showBadge={!isGroup}
            className="mb-3"
          />

          {isEditing ? (
            <div className="w-full space-y-2 mt-2">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 text-center"
              />
              <textarea
                rows={2}
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                placeholder="Group description"
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 resize-none text-center"
              />
              <div className="flex justify-center gap-2">
                <button
                  onClick={handleSaveEdit}
                  className="px-3 py-1 rounded-lg bg-brand-600 text-white text-xs font-medium"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-1.5">
                <h4 className="text-base font-bold text-slate-900">{title}</h4>
                {isAdmin && (
                  <button
                    onClick={() => {
                      setEditName(activeConversation.name || '');
                      setEditDesc(activeConversation.description || '');
                      setIsEditing(true);
                    }}
                    className="p-1 text-slate-400 hover:text-brand-600 rounded"
                    title="Edit Group Info"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                {isGroup
                  ? activeConversation.description || 'No description provided.'
                  : otherMember?.bio || 'Hey there! I am using Connectify.'}
              </p>
            </>
          )}

          <div className="flex items-center gap-4 mt-4 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              Created {format(new Date(activeConversation.createdAt), 'MMM yyyy')}
            </span>
            {isGroup && (
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {activeConversation.members?.length || 0} Members
              </span>
            )}
          </div>
        </div>

        {/* Group Members Section */}
        {isGroup && (
          <div className="p-4 border-b border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Members ({activeConversation.members?.length || 0})
              </h5>
              {isAdmin && (
                <button
                  onClick={() => setShowAddMembers(true)}
                  className="text-xs text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Add
                </button>
              )}
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto">
              {activeConversation.members?.map((member) => {
                const memberId = (member._id || member).toString();
                const isMemberAdmin = activeConversation.admins?.some(
                  (a) => (a._id || a).toString() === memberId
                );
                const isOnline = isUserOnline(memberId);
                const isTargetSelf = memberId === user?._id?.toString();

                return (
                  <div
                    key={memberId}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <UserAvatar
                        src={member.avatar}
                        name={member.name}
                        size="sm"
                        isOnline={isOnline}
                      />
                      <div className="truncate">
                        <div className="flex items-center gap-1">
                          <p className="text-xs font-medium text-slate-800 truncate">
                            {member.name} {isTargetSelf && '(You)'}
                          </p>
                          {isMemberAdmin && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-50 text-amber-600 text-[9px] font-bold border border-amber-200">
                              Admin
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400">@{member.username}</p>
                      </div>
                    </div>

                    {isAdmin && !isTargetSelf && (
                      <button
                        onClick={() => handleRemove(memberId)}
                        className="p-1 rounded text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                        title="Remove member"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Shared Media Gallery */}
        <div className="p-4 border-b border-slate-100 flex-1">
          <div className="flex items-center justify-between mb-3">
            <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-slate-400" /> Shared Photos ({sharedMedia.length})
            </h5>
          </div>

          {sharedMedia.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">No photos shared yet.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
              {sharedMedia.map((m, idx) => (
                <a
                  key={idx}
                  href={m.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="aspect-square rounded-xl overflow-hidden border border-slate-200 hover:opacity-90 transition-opacity"
                >
                  <img src={m.url} alt="Shared" className="w-full h-full object-cover" />
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Group Actions */}
        {isGroup && (
          <div className="p-4 bg-slate-50">
            <button
              onClick={handleLeave}
              className="w-full py-2.5 px-4 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Leave Group
            </button>
          </div>
        )}
      </aside>

      {/* Add Member Modal */}
      {showAddMembers && (
        <AddMemberModal
          isOpen={showAddMembers}
          onClose={() => setShowAddMembers(false)}
          conversation={activeConversation}
        />
      )}
    </>
  );
};

export default InfoPanel;
