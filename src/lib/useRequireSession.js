import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSessionUser } from '../api/client';

export function useRequireSession() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const sessionUser = getSessionUser();
    if (!sessionUser) {
      navigate('/');
      return;
    }
    setUser(sessionUser);
  }, [navigate]);

  return user;
}
