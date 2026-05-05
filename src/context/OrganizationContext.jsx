import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const OrganizationContext = createContext();

export const useOrganization = () => useContext(OrganizationContext);

export const OrganizationProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [organization, setOrganization] = useState(null);
  const [orgLoading, setOrgLoading] = useState(true);

  useEffect(() => {
    const fetchOrg = async () => {
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const orgId = userDoc.data().organizationId;
            if (orgId) {
              const orgDoc = await getDoc(doc(db, 'organizations', orgId));
              if (orgDoc.exists()) {
                setOrganization({ id: orgId, ...orgDoc.data() });
              } else {
                // Fallback or default org if not found
                setOrganization({ id: orgId, name: 'Default Organization' });
              }
            }
          }
        } catch (error) {
          console.error("Error fetching organization:", error);
        }
      } else {
        setOrganization(null);
      }
      setOrgLoading(false);
    };

    fetchOrg();
  }, [currentUser]);

  const value = {
    organization,
    orgId: organization?.id,
    orgLoading
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
};
