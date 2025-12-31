import { useState, useEffect } from 'react';
import { alertsApi } from '../services/api';
import { AlertCircle, CheckCircle, Trash2 } from 'lucide-react';

function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlerts();
  }, [filter]);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter === 'unread') params.read = 0;
      if (filter === 'read') params.read = 1;

      const response = await alertsApi.getAll(params);
      setAlerts(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des alertes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await alertsApi.markAsRead(id);
      loadAlerts();
    } catch (error) {
      alert('Erreur: ' + error.message);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await alertsApi.markAllAsRead();
      loadAlerts();
    } catch (error) {
      alert('Erreur: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cette alerte ?')) return;

    try {
      await alertsApi.delete(id);
      loadAlerts();
    } catch (error) {
      alert('Erreur: ' + error.message);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high':
        return 'border-red-500 bg-red-50';
      case 'medium':
        return 'border-yellow-500 bg-yellow-50';
      default:
        return 'border-blue-500 bg-blue-50';
    }
  };

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'high':
        return 'badge-danger';
      case 'medium':
        return 'badge-warning';
      default:
        return 'badge-info';
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Alertes</h1>
          <p className="mt-2 text-gray-600">Consultez vos alertes SEO</p>
        </div>
        <button onClick={handleMarkAllAsRead} className="btn btn-primary">
          Tout marquer comme lu
        </button>
      </div>

      {/* Filtres */}
      <div className="flex space-x-3">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'all'
              ? 'bg-primary-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Toutes
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'unread'
              ? 'bg-primary-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Non lues
        </button>
        <button
          onClick={() => setFilter('read')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'read'
              ? 'bg-primary-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
        >
          Lues
        </button>
      </div>

      {/* Liste des alertes */}
      {alerts.length === 0 ? (
        <div className="card text-center py-12">
          <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune alerte</h3>
          <p className="text-gray-600">
            {filter === 'unread'
              ? 'Vous n\'avez aucune alerte non lue'
              : filter === 'read'
              ? 'Vous n\'avez aucune alerte lue'
              : 'Vous n\'avez aucune alerte'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-6 rounded-lg border-l-4 ${getSeverityColor(alert.severity)} ${
                alert.read === 0 ? 'shadow-md' : 'opacity-75'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center space-x-3">
                  <AlertCircle
                    className={`w-5 h-5 ${
                      alert.severity === 'high'
                        ? 'text-red-600'
                        : alert.severity === 'medium'
                        ? 'text-yellow-600'
                        : 'text-blue-600'
                    }`}
                  />
                  <h3 className="font-semibold text-gray-900">{alert.title}</h3>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`badge ${getSeverityBadge(alert.severity)}`}>
                    {alert.severity === 'high'
                      ? 'Haute'
                      : alert.severity === 'medium'
                      ? 'Moyenne'
                      : 'Faible'}
                  </span>
                  {alert.read === 0 && (
                    <span className="badge badge-info">Non lue</span>
                  )}
                </div>
              </div>

              <p className="text-gray-700 mb-3">{alert.message}</p>

              <div className="flex justify-between items-center text-sm">
                <div className="text-gray-600">
                  <span className="font-medium">{alert.site_name}</span>
                  {' • '}
                  <span>{new Date(alert.created_at).toLocaleString('fr-FR')}</span>
                </div>

                <div className="flex space-x-2">
                  {alert.read === 0 && (
                    <button
                      onClick={() => handleMarkAsRead(alert.id)}
                      className="text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Marquer comme lue
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(alert.id)}
                    className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Métadonnées (si disponibles) */}
              {alert.metadata && (
                <div className="mt-4 p-3 bg-white rounded border border-gray-200">
                  <pre className="text-xs text-gray-600 overflow-x-auto">
                    {JSON.stringify(JSON.parse(alert.metadata), null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Alerts;
