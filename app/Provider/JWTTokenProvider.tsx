'use client';

import React, { createContext, useState, ReactNode } from "react";

interface JwtTokenContextProps {
  jwtToken: string | null;
  setJwtToken: React.Dispatch<React.SetStateAction<string | null>>;
  userRole: string | null;
  setUserRole: React.Dispatch<React.SetStateAction<string | null>>;
  userId: number | null;
  setUserId: React.Dispatch<React.SetStateAction<number | null>>;
}

// This is just an initial placeholder value
export const JwtTokenContext = createContext<JwtTokenContextProps>({
  jwtToken: null,
  setJwtToken: () => null,
  userRole: null,
  setUserRole: () => null,
  userId: null,
  setUserId: () => null,
});

interface JwtTokenProviderProps {
  children: ReactNode;
}

export const JwtTokenProvider: React.FC<JwtTokenProviderProps> = ({ children }) => {
  const [jwtToken, setJwtToken] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);

  return (
    <JwtTokenContext.Provider value={{ jwtToken, setJwtToken, userRole, setUserRole, userId, setUserId }}>
      {children}
    </JwtTokenContext.Provider>
  );
};