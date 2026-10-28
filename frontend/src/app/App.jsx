import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { fetchCurrentUser } from '../features/auth/authSlice';
import { router } from './router';

export function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    // Attempt to hydrate authenticated user session on app load
    dispatch(fetchCurrentUser());
  }, [dispatch]);

  return <RouterProvider router={router} future={{ v7_startTransition: true }} />;
}

export default App;
