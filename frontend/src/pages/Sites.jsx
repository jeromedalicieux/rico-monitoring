import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { sitesApi } from '../services/api';
import { Plus, Trash2, Edit, Globe, Upload } from 'lucide-react';
import BulkImportModal from '../components/BulkImportModal';

function Sites() {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    gmb_business_name: '',
    gmb_city: '',
  });

  useEffect(() => {
    loadSites();
  }, []);

  const loadSites = async () => {
    setLoading(true);
    try {
      const response = await sitesApi.getAll();
      setSites(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des sites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await sitesApi.create(formData);
      setShowForm(false);
      setFormData({ name: '', domain: '', gmb_business_name: '', gmb_city: '' });
      loadSites();
    } catch (error) {
      alert('Erreur lors de la création du site: ' + error.message);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Supprimer le site "${name}" ? Cette action est irréversible.`)) {
      return;
    }

    try {
      await sitesApi.delete(id);
      loadSites();
    } catch (error) {
      alert('Erreur lors de la suppression: ' + error.message);
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
          <h1 className="text-3xl font-bold text-gray-900">Sites</h1>
          <p className="mt-2 text-gray-600">Gérez vos sites et leurs mots-clés</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowBulkImport(true)}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Import en masse
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn btn-primary flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un site
          </button>
        </div>
      </div>

      {/* Formulaire d'ajout */}
      {showForm && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Nouveau site</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom du site *
              </label>
              <input
                type="text"
                required
                className="input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Mon site web"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Domaine *
              </label>
              <input
                type="text"
                required
                className="input"
                value={formData.domain}
                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                placeholder="example.com"
              />
              <p className="mt-2 text-sm text-gray-500">
                ℹ️ La fiche Google Business Profile sera détectée automatiquement
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn btn-secondary"
              >
                Annuler
              </button>
              <button type="submit" className="btn btn-primary">
                Créer le site
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Liste des sites */}
      {sites.length === 0 ? (
        <div className="card text-center py-12">
          <Globe className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun site</h3>
          <p className="text-gray-600 mb-6">Commencez par ajouter votre premier site</p>
          <button onClick={() => setShowForm(true)} className="btn btn-primary">
            <Plus className="w-4 h-4 mr-2 inline" />
            Ajouter un site
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sites.map((site) => (
            <div key={site.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{site.name}</h3>
                  <p className="text-sm text-gray-600">{site.domain}</p>
                </div>
                <span
                  className={`badge ${site.active ? 'badge-success' : 'badge-danger'}`}
                >
                  {site.active ? 'Actif' : 'Inactif'}
                </span>
              </div>

              {site.gmb_business_name && (
                <div className="mb-4 text-sm text-gray-600">
                  <p>GMB: {site.gmb_business_name}</p>
                  {site.gmb_city && <p>Ville: {site.gmb_city}</p>}
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                <Link
                  to={`/sites/${site.id}`}
                  className="text-primary-600 hover:text-primary-700 font-medium text-sm"
                >
                  Voir détails →
                </Link>
                <button
                  onClick={() => handleDelete(site.id, site.name)}
                  className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal d'import en masse */}
      <BulkImportModal
        isOpen={showBulkImport}
        onClose={() => setShowBulkImport(false)}
        onSuccess={loadSites}
      />
    </div>
  );
}

export default Sites;
