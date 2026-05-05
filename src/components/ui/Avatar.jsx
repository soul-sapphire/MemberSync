const Avatar = ({ src, name, size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm rounded-lg',
    md: 'w-12 h-12 text-xl rounded-2xl',
    lg: 'w-14 h-14 text-2xl rounded-2xl',
    xl: 'w-40 h-40 text-5xl rounded-[2.5rem]',
  };


  return (
    <div className={`bg-brand-50 flex items-center justify-center text-brand-600 font-black overflow-hidden shadow-inner flex-shrink-0 ${sizeClasses[size]} ${className}`}>
      {src ? (
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        getInitials(name)
      )}
    </div>
  );
};

export default Avatar;
