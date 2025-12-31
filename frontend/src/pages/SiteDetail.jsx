import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { sitesApi, historyApi, monitoringApi } from '../services/api';
import { Plus, Trash2, TrendingUp, TrendingDown, Minus, ArrowLeft, Play } from 'lucide-react';

function SiteDetail() {
  const { id } = useParams();
  const [site, setSite] = useState(null);
  const [keywords, setKeywords] = useState([]);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showKeywordForm, setShowKeywordForm] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');

  useEffect(() => {
    loadSiteData();
  }, [id]);

  const loadSiteData = async () => {
    setLoading(true);
    try {
      const [siteRes, keywordsRes, dashboardRes] = await Promise.all([
        sitesApi.getById(id),
        sitesApi.getKeywords(id),
        historyApi.getDashboard(id),
      ]);

      setSite(siteRes.data);
      setKeywords(keywordsRes.data);
      setDashboard(dashboardRes.data);
    } catch (error) {
      console.error('Erreur lors du chargement du site:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddKeyword = async (e) => {
    e.preventDefault();
    if (!newKeyword.trim()) return;

    try {
      await sitesApi.createKeyword(id, newKeyword);
      setNewKeyword('');
      setShowKeywordForm(false);
      loadSiteData();
    } catch (error) {
      alert('Erreur lors de l\'ajout du mot-clé: ' + error.message);
    }
  };

  const handleDeleteKeyword = async (keywordId, keyword) => {
    if (!confirm(`Supprimer le mot-clé "${keyword}" ?`)) return;

    try {
      await sitesApi.deleteKeyword(id, keywordId);
      loadSiteData();
    } catch (error) {
      alert('Erreur lors de la suppression: ' + error.message);
    }
  };

  const handleRunMonitoring = async (type) => {
    try {
      switch (type) {
        case 'positions':
          await monitoringApi.runPositions(id);
          break;
        case 'gmb':
          await monitoringApi.runGMB(id);
          break;
        case 'backlinks':
          await monitoringApi.runBacklinks(id);
          break;
      }
      alert('Monitoring terminé !');
      loadSiteData();
    } catch (error) {
      alert('Erreur: ' + error.message);
    }
  };

  const renderTrend = (change) => {
    if (!change) return <Minus className="w-4 h-4 text-gray-400" />;
    if (change < 0)
      return <TrendingUp className="w-4 h-4 text-green-500" title="Amélioration" />;
    if (change > 0)
      return <TrendingDown className="w-4 h-4 text-red-500" title="Détérioration" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Chargement...</div>
      </div>
    );
  }

  if (!site) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Site non trouvé</p>
        <Link to="/sites" className="btn btn-primary mt-4">
          Retour aux sites
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <Link to="/sites" className="text-primary-600 hover:text-primary-700 flex items-center mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour aux sites
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{site.name}</h1>
            <p className="mt-2 text-gray-600">{site.domain}</p>
          </div>
          <span className={`badge ${site.active ? 'badge-success' : 'badge-danger'}`}>
            {site.active ? 'Actif' : 'Inactif'}
          </span>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="flex space-x-3">
        <button
          onClick={() => handleRunMonitoring('positions')}
          className="btn btn-primary flex items-center text-sm"
        >
          <Play className="w-4 h-4 mr-2" />
          Positions
        </button>
        {site.gmb_business_name && (
          <button
            onClick={() => handleRunMonitoring('gmb')}
            className="btn btn-primary flex items-center text-sm"
          >
            <Play className="w-4 h-4 mr-2" />
            GMB
          </button>
        )}
        <button
          onClick={() => handleRunMonitoring('backlinks')}
          className="btn btn-primary flex items-center text-sm"
        >
          <Play className="w-4 h-4 mr-2" />
          Backlinks
        </button>
      </div>

      {/* Statistiques GMB */}
      {dashboard?.gmb && dashboard.gmb.found && (
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Google Business Profile</h2>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600">Note</p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboard.gmb.rating} ⭐
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Avis</p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboard.gmb.reviews_count}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Catégorie</p>
              <p className="text-sm font-medium text-gray-900">
                {dashboard.gmb.category}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Statistiques Backlinks */}
      {dashboard?.backlinks && (
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Backlinks</h2>
          <div className="grid grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboard.backlinks.stats.total}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Actifs</p>
              <p className="text-2xl font-bold text-green-600">
                {dashboard.backlinks.stats.active}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Perdus</p>
              <p className="text-2xl font-bold text-red-600">
                {dashboard.backlinks.stats.lost}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Nouveaux (30j)</p>
              <p className="text-2xl font-bold text-blue-600">
                {dashboard.backlinks.stats.newThisMonth}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Mots-clés et positions */}
      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Mots-clés et positions</h2>
          <button
            onClick={() => setShowKeywordForm(!showKeywordForm)}
            className="btn btn-primary flex items-center text-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un mot-clé
          </button>
        </div>

        {/* Formulaire d'ajout */}
        {showKeywordForm && (
          <form onSubmit={handleAddKeyword} className="mb-6 flex space-x-3">
            <input
              type="text"
              className="input flex-1"
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              placeholder="Nouveau mot-clé"
              required
            />
            <button type="submit" className="btn btn-primary">
              Ajouter
            </button>
            <button
              type="button"
              onClick={() => setShowKeywordForm(false)}
              className="btn btn-secondary"
            >
              Annuler
            </button>
          </form>
        )}

        {/* Liste des mots-clés */}
        {keywords.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>Aucun mot-clé configuré</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Mot-clé</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Position actuelle</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">J-1</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">J-7</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">J-30</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {keywords.map((keyword) => {
                  const positionData = dashboard?.positions?.find(
                    (p) => p.keyword === keyword.keyword
                  );

                  return (
                    <tr key={keyword.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">
                        {keyword.keyword}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {positionData?.current.position ? (
                          <span className="font-bold text-primary-600">
                            #{positionData.current.position}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          {positionData?.day1 ? (
                            <>
                              <span className="text-gray-600">
                                #{positionData.day1.position}
                              </span>
                              {renderTrend(positionData.day1.change)}
                            </>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          {positionData?.day7 ? (
                            <>
                              <span className="text-gray-600">
                                #{positionData.day7.position}
                              </span>
                              {renderTrend(positionData.day7.change)}
                            </>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          {positionData?.day30 ? (
                            <>
                              <span className="text-gray-600">
                                #{positionData.day30.position}
                              </span>
                              {renderTrend(positionData.day30.change)}
                            </>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDeleteKeyword(keyword.id, keyword.keyword)}
                          className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default SiteDetail;
