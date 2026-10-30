import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import SchemesPage from './pages/SchemesPage';
import SchemeDetailsPage from './pages/SchemeDetailsPage';
import AssistantPage from './pages/AssistantPage';
import { checkBackendHealth } from './services/api';

export default function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedSchemeId, setSelectedSchemeId] = useState(1);
  const [activeFarmerId, setActiveFarmerId] = useState(1);
  const [initialVoicePrompt, setInitialVoicePrompt] = useState('');
  const [backendStatus, setBackendStatus] = useState({
    checking: true,
    connected: false,
    message: 'Port 8000 ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ...'
  });

  useEffect(() => {
    verifyBackend();
  }, []);

  const verifyBackend = async () => {
    setBackendStatus(prev => ({ ...prev, checking: true, message: 'Connecting to port 8000...' }));
    const res = await checkBackendHealth();
    if (res.success && res.data?.status === 'healthy') {
      const dbEngine = res.data.database?.engine || 'Active';
      setBackendStatus({
        checking: false,
        connected: true,
        message: `FastAPI Online (${dbEngine})`
      });
    } else {
      setBackendStatus({
        checking: false,
        connected: false,
        message: 'Backend Offline (Start port 8000)'
      });
    }
  };

  const handleNavigate = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectScheme = (schemeId) => {
    setSelectedSchemeId(schemeId);
    handleNavigate('scheme-details');
  };

  const handleFarmerRegistered = (newFarmer) => {
    if (newFarmer?.id) {
      setActiveFarmerId(newFarmer.id);
    }
  };

  const handleStartVoiceScenario = (promptText) => {
    setInitialVoicePrompt(promptText);
    handleNavigate('assistant');
  };

  return (
    <div className="min-h-screen flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
      {/* Top Fixed Header */}
      <Navbar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        backendStatus={backendStatus}
        onRefreshHealth={verifyBackend}
        activeFarmerId={activeFarmerId}
      />

      {/* Main Body View */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        {currentPage === 'home' && (
          <HomePage
            onNavigate={handleNavigate}
            onStartVoiceScenario={handleStartVoiceScenario}
          />
        )}

        {currentPage === 'register' && (
          <RegisterPage
            onNavigate={handleNavigate}
            onFarmerRegistered={handleFarmerRegistered}
          />
        )}

        {currentPage === 'dashboard' && (
          <DashboardPage
            activeFarmerId={activeFarmerId}
            onNavigate={handleNavigate}
            onSelectScheme={handleSelectScheme}
          />
        )}

        {currentPage === 'profile' && (
          <ProfilePage
            activeFarmerId={activeFarmerId}
            onNavigate={handleNavigate}
          />
        )}

        {currentPage === 'schemes' && (
          <SchemesPage
            onSelectScheme={handleSelectScheme}
          />
        )}

        {currentPage === 'scheme-details' && (
          <SchemeDetailsPage
            schemeId={selectedSchemeId}
            onBack={() => handleNavigate('schemes')}
            onNavigate={handleNavigate}
            activeFarmerId={activeFarmerId}
          />
        )}

        {currentPage === 'assistant' && (
          <AssistantPage
            activeFarmerId={activeFarmerId}
            onSelectScheme={handleSelectScheme}
            initialPrompt={initialVoicePrompt}
          />
        )}
      </main>

      {/* Footer */}
      <Footer onNavigate={handleNavigate} />
    </div>
  );
}
