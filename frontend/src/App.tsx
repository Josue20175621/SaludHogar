import React from 'react';
import { Outlet } from 'react-router-dom';
import Layout from './components/Layout';

const App: React.FC = () => {
  return (
    // The Layout component now contains the <Outlet>
    // We pass our data down to the child routes using the `context` prop on Outlet
    <Layout>
      <Outlet />
    </Layout>
  );
};

export default App;