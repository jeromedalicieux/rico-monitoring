import { Link, useLocation } from 'react-router-dom';
import { Home, Globe, Bell, Play, TrendingUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import { alertsApi, monitoringApi } from '../services/api';

function Layout({ children }) {
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 30000); // Rafraîchir toutes les 30s
    return () => clearInterval(interval);
  }, []);

  const loadUnreadCount = async () => {
    try {
      const response = await alertsApi.getUnreadCount();
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('Erreur lors du chargement du nombre d\'alertes:', error);
    }
  };

  const handleRunMonitoring = async () => {
    if (isRunning) return;

    if (!confirm('Lancer un monitoring complet ? Cela peut prendre plusieurs minutes.')) {
      return;
    }

    setIsRunning(true);
    try {
      await monitoringApi.runFull();
      alert('Monitoring terminé avec succès !');
      loadUnreadCount();
    } catch (error) {
      alert('Erreur lors du monitoring: ' + error.message);
    } finally {
      setIsRunning(false);
    }
  };

  const navItems = [
    { path: '/', label: 'Dashboard', icon: Home },
    { path: '/changes', label: 'Changements', icon: TrendingUp },
    { path: '/sites', label: 'Sites', icon: Globe },
    { path: '/alerts', label: 'Alertes', icon: Bell, badge: unreadCount },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-primary-600">
                  Monitoring SEO
                </h1>
              </div>
              <div className="hidden sm:ml-8 sm:flex sm:space-x-4">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        isActive
                          ? 'text-primary-600 bg-primary-50'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {item.label}
                      {item.badge > 0 && (
                        <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Bouton de lancement du monitoring */}
            <div className="flex items-center">
              <button
                onClick={handleRunMonitoring}
                disabled={isRunning}
                className={`btn btn-primary flex items-center ${
                  isRunning ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Play className="w-4 h-4 mr-2" />
                {isRunning ? 'En cours...' : 'Lancer monitoring'}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Contenu principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

export default Layout;
