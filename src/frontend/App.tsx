import React from 'react';
import { ChakraProvider } from '@chakra-ui/react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Projects } from './pages/Projects';
import { ProjectDetail } from './pages/ProjectDetail';
import { ProposalList } from './components/ProposalList';
import { VotingModule } from './components/VotingModule';
import { Dashboard } from './pages/Dashboard';
import theme from './styles/theme';

export const App: React.FC = () => {
  return (
    <ChakraProvider theme={theme}>
      <AppProvider>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/:id" element={<ProjectDetail />} />
              <Route path="/governance" element={<ProposalList />} />
              <Route path="/governance/:id" element={<VotingModule />} />
              <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
          </Layout>
        </Router>
      </AppProvider>
    </ChakraProvider>
  );
}; 