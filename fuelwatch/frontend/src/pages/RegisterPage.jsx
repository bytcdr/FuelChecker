import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * Registration is handled automatically through OAuth sign-in.
 * If a user signs in with Google / Facebook / Apple for the first time,
 * an account is created on the fly. Redirect to the login page.
 */
export default function RegisterPage() {
  return <Navigate to="/login" replace />;
}
