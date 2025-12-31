import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { sitesApi, alertsApi, historyApi } from '../services/api';
import { TrendingUp, TrendingDown, AlertCircle, Globe } from 'lucide-react';

function Dashboard() {
  const [sites, setSites] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [executions, setExecutions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [sitesRes, alertsRes, executionsRes] = await Promise.all([
        sitesApi.getAll(),
        alertsApi.getAll({ read: 0, limit: 5 }),
        historyApi.getRecentExecutions({ limit: 5 }),
      ]);

      setSites(sitesRes.data);
      setAlerts(alertsRes.data);
      setExecutions(executionsRes.data);
    } catch (error) {
      console.error('Erreur lors du chargement du dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Vue d'ensemble de vos sites et de leur monitoring SEO
        </p>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Sites monitorés</p>
              <p className="text-3xl font-bold text-gray-900">{sites.length}</p>
            </div>
            <Globe className="w-12 h-12 text-primary-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Alertes non lues</p>
              <p className="text-3xl font-bold text-red-600">{alerts.length}</p>
            </div>
            <AlertCircle className="w-12 h-12 text-red-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Dernière exécution</p>
              <p className="text-sm font-medium text-gray-900">
                {executions.length > 0
                  ? new Date(executions[0].started_at).toLocaleDateString('fr-FR')
                  : 'Jamais'}
              </p>
            </div>
            <TrendingUp className="w-12 h-12 text-green-500" />
          </div>
        </div>
      </div>

      {/* Sites */}
      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Sites</h2>
          <Link to="/sites" className="text-primary-600 hover:text-primary-700 font-medium">
            Voir tous →
          </Link>
        </div>

        {sites.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Globe className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p>Aucun site configuré</p>
            <Link to="/sites" className="btn btn-primary mt-4 inline-block">
              Ajouter un site
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {sites.map((site) => (
              <Link
                key={site.id}
                to={`/sites/${site.id}`}
                className="block p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:shadow-md transition-all"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900">{site.name}</h3>
                    <p className="text-sm text-gray-600">{site.domain}</p>
                  </div>
                  <span className={`badge ${site.active ? 'badge-success' : 'badge-danger'}`}>
                    {site.active ? 'Actif' : 'Inactif'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Alertes récentes */}
      {alerts.length > 0 && (
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Alertes récentes</h2>
            <Link to="/alerts" className="text-primary-600 hover:text-primary-700 font-medium">
              Voir toutes →
            </Link>
          </div>

          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border-l-4 ${
                  alert.severity === 'high'
                    ? 'border-red-500 bg-red-50'
                    : alert.severity === 'medium'
                    ? 'border-yellow-500 bg-yellow-50'
                    : 'border-blue-500 bg-blue-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-900">{alert.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(alert.created_at).toLocaleString('fr-FR')}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500">{alert.site_name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
