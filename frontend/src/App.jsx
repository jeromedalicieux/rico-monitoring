import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Sites from './pages/Sites';
import SiteDetail from './pages/SiteDetail';
import Alerts from './pages/Alerts';
import Changes from './pages/Changes';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/sites" element={<Sites />} />
        <Route path="/sites/:id" element={<SiteDetail />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/changes" element={<Changes />} />
      </Routes>
    </Layout>
  );
}

export default App;
