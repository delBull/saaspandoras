-- DAO Communication System (Global Chat/Forum)

CREATE TABLE IF NOT EXISTS dao_threads (
    id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    author_address VARCHAR(42) NOT NULL,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(50) DEFAULT 'general', -- 'general', 'proposal', 'announcement', 'tech'
    is_pinned BOOLEAN DEFAULT FALSE,
    is_locked BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dao_posts (
    id SERIAL PRIMARY KEY,
    thread_id INTEGER NOT NULL REFERENCES dao_threads(id) ON DELETE CASCADE,
    author_address VARCHAR(42) NOT NULL,
    content TEXT NOT NULL,
    is_solution BOOLEAN DEFAULT FALSE, -- For Q&A style
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast retrieval by project
CREATE INDEX IF NOT EXISTS idx_dao_threads_project_id ON dao_threads(project_id);
CREATE INDEX IF NOT EXISTS idx_dao_posts_thread_id ON dao_posts(thread_id);
