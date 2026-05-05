const Avatar = ({ src, name, size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm rounded-lg',
    md: 'w-12 h-12 text-xl rounded-2xl',
    lg: 'w-14 h-14 text-2xl rounded-2xl',
    xl: 'w-40 h-40 text-5xl rounded-[2.5rem]',
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className={`bg-brand-50 flex items-center justify-center text-brand-600 font-black overflow-hidden shadow-inner flex-shrink-0 ${sizeClasses[size] || sizeClasses.md} ${className}`}>
      {src ? (
        <img 
          src={src} 
          alt={name} 
          className="w-full h-full object-cover" 
          onError={(e) => {
            // If image fails to load, fallback to initials
            e.target.style.display = 'none';
            e.target.parentElement.innerText = getInitials(name);
          }}
        />
      ) : (
        getInitials(name)
      )}
    </div>
  );
};

export default Avatar;
