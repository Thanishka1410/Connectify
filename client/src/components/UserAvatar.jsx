import React from 'react';

const sizeClasses = {
  xs: 'w-7 h-7 text-xs',
  sm: 'w-9 h-9 text-xs',
  md: 'w-11 h-11 text-sm',
  lg: 'w-14 h-14 text-base',
  xl: 'w-20 h-20 text-xl',
};

const badgeSizes = {
  xs: 'w-2 h-2',
  sm: 'w-2.5 h-2.5',
  md: 'w-3 h-3',
  lg: 'w-3.5 h-3.5',
  xl: 'w-4 h-4',
};

const UserAvatar = ({
  src,
  name = 'User',
  size = 'md',
  isOnline = false,
  showBadge = true,
  className = '',
}) => {
  const [imageError, setImageError] = React.useState(false);

  const fallbackInitial = name ? name.charAt(0).toUpperCase() : '?';
  const sizeClass = sizeClasses[size] || sizeClasses.md;
  const badgeSize = badgeSizes[size] || badgeSizes.md;

  const defaultAvatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
    name || 'User'
  )}&backgroundColor=6366f1,8b5cf6,ec4899`;

  return (
    <div className={`relative inline-block select-none flex-shrink-0 ${className}`}>
      <div
        className={`${sizeClass} rounded-full overflow-hidden bg-gradient-to-tr from-brand-600 to-indigo-400 flex items-center justify-center text-white font-semibold shadow-sm border border-slate-100`}
      >
        {!imageError && (src || defaultAvatar) ? (
          <img
            src={src || defaultAvatar}
            alt={name}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <span>{fallbackInitial}</span>
        )}
      </div>

      {showBadge && (
        <span
          className={`absolute bottom-0 right-0 ${badgeSize} rounded-full border-2 border-white ${
            isOnline ? 'bg-emerald-500' : 'bg-slate-300'
          }`}
          title={isOnline ? 'Online' : 'Offline'}
        />
      )}
    </div>
  );
};

export default UserAvatar;
