import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/config';
import { getUserData } from '../services/authService';
import { getMemberByUid } from '../services/memberService';
import { ROLES } from '../utils/roleCheck';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [organizationId, setOrganizationId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // 1. IMMEDIATELY CLEAR STALE STATE ON ANY CHANGE
      setCurrentUser(user);
      setUserRole(null);
      setOrganizationId(null);
      setLoading(true);

      if (user) {
        console.log("AuthContext - New User Detected:", user.uid);
        try {
          // 2. Fetch profile from members collection (source of truth)
          const profile = await getMemberByUid(user.uid);
          
          console.log("AuthContext - Loaded profile:", profile);
          console.log("AuthContext - Loaded role:", profile?.role);

          if (profile) {
            setUserRole(profile.role || ROLES.MEMBER);
            setOrganizationId(profile.organizationId || 'default');
          } else {
            // Fallback to basic user data if no member doc exists yet
            const userData = await getUserData(user.uid);
            setUserRole(userData?.role || ROLES.MEMBER);
            setOrganizationId(userData?.organizationId || 'default');
          }
        } catch (e) {
          console.error("AuthContext Error during profile load:", e);
          setUserRole(ROLES.MEMBER);
          setOrganizationId('default');
        }
      } else {
        console.log("AuthContext - User Logged Out");
        setCurrentUser(null);
        setUserRole(null);
        setOrganizationId(null);
      }
      
      // 3. FINAL LOADING STATE RESOLUTION
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole,
    organizationId,
    isAdmin: userRole === ROLES.ADMIN,
    isManager: userRole === ROLES.MANAGER,
    isStaff: userRole === ROLES.STAFF,
    isMember: userRole === ROLES.MEMBER,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {/* 
        PREVENT UI FLASH: 
        We do not render children until the auth state is fully determined.
      */}
      {!loading ? children : (
        <div className="flex h-screen w-screen items-center justify-center bg-white">
          <div className="flex flex-col items-center gap-6">
            <div className="w-12 h-12 border-4 border-slate-100 border-t-brand-600 rounded-full animate-spin"></div>
            <p className="text-slate-400 font-bold tracking-[0.2em] text-[10px] uppercase">Initializing MemberSync</p>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};
