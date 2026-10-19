import React, { useState, useEffect } from 'react';
import { X, Search, UserPlus, Check } from 'lucide-react';
import { userAPI } from '../services/api';
import { useChat } from '../context/ChatContext';
import UserAvatar from './UserAvatar';

const AddMemberModal = ({ isOpen, onClose, conversation }) => {
  const { addMembersToGroup } = useChat();
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const existingMemberIds = React.useMemo(() => {
    if (!conversation || !conversation.members) return [];
    return conversation.members.map((m) => (m._id ? m._id.toString() : m.toString()));
  }, [conversation]);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSelectedUserIds([]);
      setUsers([]);
      return;
    }

    const fetchUsers = async () => {
      try {
        setLoading(true);
        const res = await userAPI.search(searchQuery);
        if (res.data.success) {
          // Filter out users already in group
          const available = (res.data.users || []).filter(
            (u) => !existingMemberIds.includes(u._id.toString())
          );
          setUsers(available);
        }
      } catch (err) {
        console.error('Error fetching users:', err);
      } finally {
        setLoading(false);
      }
    };

    const timeout = setTimeout(fetchUsers, 200);
    return () => clearTimeout(timeout);
  }, [searchQuery, isOpen, existingMemberIds]);

  if (!isOpen || !conversation) return null;

  const toggleSelect = (userId) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleAdd = async () => {
    if (selectedUserIds.length === 0) return;
    try {
      setSubmitting(true);
      await addMembersToGroup(conversation._id, selectedUserIds);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-800">Add Group Members</h3>
              <p className="text-xs text-slate-500">Group: {conversation.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-100">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search people to add..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>
        </div>

        {/* User list */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">
              No new members available to add.
            </div>
          ) : (
            users.map((user) => {
              const isSelected = selectedUserIds.includes(user._id);
              return (
                <div
                  key={user._id}
                  onClick={() => toggleSelect(user._id)}
                  className="flex items-center justify-between p-3.5 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <UserAvatar
                      src={user.avatar}
                      name={user.name}
                      size="sm"
                      isOnline={user.isOnline}
                    />
                    <div className="truncate">
                      <p className="text-xs font-semibold text-slate-800 truncate">{user.name}</p>
                      <p className="text-[11px] text-slate-400">@{user.username}</p>
                    </div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                      isSelected
                        ? 'bg-brand-600 border-brand-600 text-white'
                        : 'border-slate-300'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-100 bg-slate-50/50">
          <span className="text-xs text-slate-500">
            {selectedUserIds.length} member{selectedUserIds.length === 1 ? '' : 's'} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={selectedUserIds.length === 0 || submitting}
              className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-brand-500/20 transition-all"
            >
              {submitting ? 'Adding...' : 'Add to Group'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddMemberModal;
