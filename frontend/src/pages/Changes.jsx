import { useState, useEffect } from 'react';
import { changesApi } from '../services/api';
import { TrendingUp, TrendingDown, Link as LinkIcon, Star, MessageCircle } from 'lucide-react';

function Changes() {
  const [changes, setChanges] = useState([]);
  const [stats, setStats] = useState(null);
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, positive, negative

  useEffect(() => {
    loadChanges();
  }, [days]);

  const loadChanges = async () => {
    setLoading(true);
    try {
      const [changesRes, statsRes] = await Promise.all([
        changesApi.getAll({ days }),
        changesApi.getStats({ days }),
      ]);

      setChanges(changesRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Erreur lors du chargement des changements:', error);
    } finally {
      setLoading(false);
    }
  };

  const getChangeIcon = (type) => {
    switch (type) {
      case 'position':
        return TrendingDown;
      case 'backlink_new':
      case 'backlink_lost':
        return LinkIcon;
      case 'gmb_rating':
        return Star;
      case 'gmb_reviews':
        return MessageCircle;
      default:
        return TrendingUp;
    }
  };

  const getChangeColor = (impact) => {
    switch (impact) {
      case 'positive':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'negative':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const filteredChanges = changes.filter((change) => {
    if (filter === 'all') return true;
    if (filter === 'positive') return change.impact === 'positive';
    if (filter === 'negative') return change.impact === 'negative';
    return true;
  });

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
        <h1 className="text-3xl font-bold text-gray-900">Changements récents</h1>
        <p className="mt-2 text-gray-600">Vue rapide de tous les mouvements SEO</p>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Positions gagnées</p>
                <p className="text-2xl font-bold text-green-600">{stats.positions.improved}</p>
                <p className="text-xs text-gray-500">+{stats.positions.avgGain} pos. moy.</p>
              </div>
              <TrendingUp className="w-10 h-10 text-green-500" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Positions perdues</p>
                <p className="text-2xl font-bold text-red-600">{stats.positions.declined}</p>
                <p className="text-xs text-gray-500">-{stats.positions.avgLoss} pos. moy.</p>
              </div>
              <TrendingDown className="w-10 h-10 text-red-500" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Nouveaux backlinks</p>
                <p className="text-2xl font-bold text-blue-600">{stats.backlinks.new}</p>
              </div>
              <LinkIcon className="w-10 h-10 text-blue-500" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Backlinks perdus</p>
                <p className="text-2xl font-bold text-orange-600">{stats.backlinks.lost}</p>
              </div>
              <LinkIcon className="w-10 h-10 text-orange-500" />
            </div>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="flex justify-between items-center">
        <div className="flex space-x-3">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Tous ({changes.length})
          </button>
          <button
            onClick={() => setFilter('positive')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'positive'
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Positifs ({changes.filter((c) => c.impact === 'positive').length})
          </button>
          <button
            onClick={() => setFilter('negative')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'negative'
                ? 'bg-red-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Négatifs ({changes.filter((c) => c.impact === 'negative').length})
          </button>
        </div>

        <select
          value={days}
          onChange={(e) => setDays(parseInt(e.target.value))}
          className="input w-auto"
        >
          <option value="1">Dernières 24h</option>
          <option value="7">7 derniers jours</option>
          <option value="30">30 derniers jours</option>
          <option value="90">90 derniers jours</option>
        </select>
      </div>

      {/* Liste des changements */}
      {filteredChanges.length === 0 ? (
        <div className="card text-center py-12">
          <TrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun changement</h3>
          <p className="text-gray-600">
            Aucun changement détecté sur la période sélectionnée
          </p>
        </div>
      ) : (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Site</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Changement</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Impact</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredChanges.map((change, index) => {
                  const Icon = getChangeIcon(change.type);
                  const colorClass = getChangeColor(change.impact);

                  return (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className={`inline-flex items-center px-3 py-1 rounded-full border ${colorClass}`}>
                          <Icon className="w-4 h-4 mr-2" />
                          <span className="text-xs font-medium">
                            {change.type === 'position' && 'Position'}
                            {change.type === 'backlink_new' && 'Backlink+'}
                            {change.type === 'backlink_lost' && 'Backlink-'}
                            {change.type === 'gmb_rating' && 'Note GMB'}
                            {change.type === 'gmb_reviews' && 'Avis GMB'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-gray-900">{change.site}</span>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900">{change.title}</p>
                          <p className="text-sm text-gray-600">{change.description}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {change.change !== 0 && (
                          <span
                            className={`inline-flex items-center font-bold ${
                              change.impact === 'positive'
                                ? 'text-green-600'
                                : change.impact === 'negative'
                                ? 'text-red-600'
                                : 'text-blue-600'
                            }`}
                          >
                            {change.change > 0 ? '+' : ''}
                            {change.change}
                            {change.type === 'position' && (
                              change.change < 0 ? (
                                <TrendingUp className="w-4 h-4 ml-1" />
                              ) : (
                                <TrendingDown className="w-4 h-4 ml-1" />
                              )
                            )}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right text-sm text-gray-600">
                        {new Date(change.date).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default Changes;
