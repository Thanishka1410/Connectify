import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';

export const formatMessageTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return format(date, 'h:mm a');
};

export const formatConversationTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);

  if (isToday(date)) {
    return format(date, 'h:mm a');
  }
  if (isYesterday(date)) {
    return 'Yesterday';
  }
  return format(date, 'MMM d');
};

export const formatLastSeen = (dateString, isOnline) => {
  if (isOnline) return 'Online';
  if (!dateString) return 'Offline';
  try {
    return `Last seen ${formatDistanceToNow(new Date(dateString), { addSuffix: true })}`;
  } catch {
    return 'Offline';
  }
};

export const getOtherMember = (conversation, currentUserId) => {
  if (!conversation || !conversation.members) return null;
  return conversation.members.find(
    (member) => (member._id || member) !== currentUserId
  );
};

export const getConversationTitle = (conversation, currentUserId) => {
  if (!conversation) return '';
  if (conversation.type === 'group') {
    return conversation.name || 'Unnamed Group';
  }
  const other = getOtherMember(conversation, currentUserId);
  return other ? other.name : 'Direct Message';
};

export const getConversationAvatar = (conversation, currentUserId) => {
  if (!conversation) return '';
  if (conversation.type === 'group') {
    return conversation.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(conversation.name || 'Group')}`;
  }
  const other = getOtherMember(conversation, currentUserId);
  return other?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(other?.name || 'User')}`;
};

export const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};
