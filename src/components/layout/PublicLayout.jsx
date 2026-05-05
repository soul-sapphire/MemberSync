import { Outlet } from 'react-router-dom';
import Logo from '../ui/Logo';

const PublicLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-brand-400/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-400/20 blur-[120px]" />
      </div>

      <nav className="h-20 px-6 lg:px-10 flex items-center justify-between absolute top-0 w-full z-10">
        <Logo />
      </nav>

      <main className="flex-1 flex flex-col justify-center items-center p-6 mt-20">
        {children || <Outlet />}
      </main>
    </div>
  );
};

export default PublicLayout;
