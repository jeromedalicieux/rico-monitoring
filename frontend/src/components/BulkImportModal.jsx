import { useState } from 'react';
import { X, Upload, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import api from '../services/api';

export default function BulkImportModal({ isOpen, onClose, onSuccess }) {
  const [urlsText, setUrlsText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleImport = async () => {
    if (!urlsText.trim()) {
      alert('Veuillez entrer au moins une URL');
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      // Convertir le texte en tableau d'URLs (une par ligne)
      const urls = urlsText
        .split('\n')
        .map(url => url.trim())
        .filter(url => url.length > 0);

      const response = await api.post('/sites/bulk', { urls });
      setResult(response.data);

      if (response.data.summary.created > 0) {
        onSuccess();
      }
    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
      alert('Erreur lors de l\'import: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setUrlsText('');
    setResult(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Upload className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">Import en masse</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {!result ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Liste d'URLs (une par ligne)
                </label>
                <textarea
                  value={urlsText}
                  onChange={(e) => setUrlsText(e.target.value)}
                  className="w-full h-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  placeholder="https://example.com&#10;https://site2.com&#10;www.site3.fr&#10;monsite.com"
                  disabled={isLoading}
                />
                <p className="mt-2 text-sm text-gray-500">
                  Formats acceptés: URL complète, avec ou sans protocole, avec ou sans www
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">ℹ️ Informations</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Les domaines déjà existants seront ignorés</li>
                  <li>• Le nom du site sera généré automatiquement</li>
                  <li>• Vous pourrez ajouter des mots-clés après l'import</li>
                  <li>• La détection GMB se fera automatiquement lors du premier scan</li>
                </ul>
              </div>
            </>
          ) : (
            <>
              {/* Résumé */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-gray-900">{result.summary.total}</div>
                  <div className="text-sm text-gray-600">Total</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">{result.summary.created}</div>
                  <div className="text-sm text-green-700">Créés</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-yellow-600">{result.summary.skipped}</div>
                  <div className="text-sm text-yellow-700">Ignorés</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-red-600">{result.summary.errors}</div>
                  <div className="text-sm text-red-700">Erreurs</div>
                </div>
              </div>

              {/* Détails */}
              <div className="space-y-4">
                {/* Sites créés */}
                {result.details.created.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      Sites créés ({result.details.created.length})
                    </h3>
                    <div className="bg-green-50 rounded-lg p-4 space-y-2">
                      {result.details.created.map((item, idx) => (
                        <div key={idx} className="text-sm text-green-800">
                          ✓ {item.domain} - {item.site.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sites ignorés */}
                {result.details.skipped.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-yellow-600" />
                      Sites ignorés ({result.details.skipped.length})
                    </h3>
                    <div className="bg-yellow-50 rounded-lg p-4 space-y-2">
                      {result.details.skipped.map((item, idx) => (
                        <div key={idx} className="text-sm text-yellow-800">
                          ⊘ {item.domain} - {item.reason}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Erreurs */}
                {result.details.errors.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                      <XCircle className="w-5 h-5 text-red-600" />
                      Erreurs ({result.details.errors.length})
                    </h3>
                    <div className="bg-red-50 rounded-lg p-4 space-y-2">
                      {result.details.errors.map((item, idx) => (
                        <div key={idx} className="text-sm text-red-800">
                          ✗ {item.url} - {item.error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          {!result ? (
            <>
              <button
                onClick={handleClose}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={isLoading}
              >
                Annuler
              </button>
              <button
                onClick={handleImport}
                disabled={isLoading || !urlsText.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Import en cours...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Importer
                  </>
                )}
              </button>
            </>
          ) : (
            <button
              onClick={handleClose}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Fermer
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
