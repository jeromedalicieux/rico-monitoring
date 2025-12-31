-- Table des sites à monitorer
CREATE TABLE IF NOT EXISTS sites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    domain TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    gmb_business_name TEXT,
    gmb_city TEXT,
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table des mots-clés par site
CREATE TABLE IF NOT EXISTS keywords (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_id INTEGER NOT NULL,
    keyword TEXT NOT NULL,
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
    UNIQUE(site_id, keyword)
);

-- Table des positions Google
CREATE TABLE IF NOT EXISTS position_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_id INTEGER NOT NULL,
    keyword_id INTEGER NOT NULL,
    position INTEGER,
    url TEXT,
    search_query TEXT,
    execution_date DATETIME NOT NULL,
    raw_html TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
    FOREIGN KEY (keyword_id) REFERENCES keywords(id) ON DELETE CASCADE
);

-- Index pour les recherches rapides de positions
CREATE INDEX IF NOT EXISTS idx_position_date ON position_history(execution_date);
CREATE INDEX IF NOT EXISTS idx_position_site_keyword ON position_history(site_id, keyword_id, execution_date);

-- Table Google Business Profile
CREATE TABLE IF NOT EXISTS gmb_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_id INTEGER NOT NULL,
    found INTEGER NOT NULL DEFAULT 0,
    business_name TEXT,
    category TEXT,
    rating REAL,
    reviews_count INTEGER,
    website_url TEXT,
    execution_date DATETIME NOT NULL,
    raw_html TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
);

-- Index pour GMB
CREATE INDEX IF NOT EXISTS idx_gmb_date ON gmb_history(execution_date);
CREATE INDEX IF NOT EXISTS idx_gmb_site ON gmb_history(site_id, execution_date);

-- Table des backlinks
CREATE TABLE IF NOT EXISTS backlinks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_id INTEGER NOT NULL,
    referring_domain TEXT NOT NULL,
    source_url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active', -- active, lost, new
    first_detected_date DATETIME NOT NULL,
    last_seen_date DATETIME NOT NULL,
    lost_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
    UNIQUE(site_id, referring_domain, source_url)
);

-- Index pour les backlinks
CREATE INDEX IF NOT EXISTS idx_backlinks_site ON backlinks(site_id);
CREATE INDEX IF NOT EXISTS idx_backlinks_status ON backlinks(site_id, status);

-- Table des exécutions (pour tracker chaque run)
CREATE TABLE IF NOT EXISTS executions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    execution_type TEXT NOT NULL, -- positions, gmb, backlinks, full
    site_id INTEGER,
    status TEXT NOT NULL DEFAULT 'running', -- running, completed, failed
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    error_message TEXT,
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE SET NULL
);

-- Table des alertes
CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_id INTEGER NOT NULL,
    alert_type TEXT NOT NULL, -- position_drop, gmb_lost, backlink_lost
    severity TEXT NOT NULL DEFAULT 'medium', -- low, medium, high
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    metadata TEXT, -- JSON avec détails supplémentaires
    read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
);

-- Index pour les alertes
CREATE INDEX IF NOT EXISTS idx_alerts_read ON alerts(read, created_at);
CREATE INDEX IF NOT EXISTS idx_alerts_site ON alerts(site_id, created_at);
