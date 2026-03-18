CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  username VARCHAR(80) UNIQUE NOT NULL,
  password_hash VARCHAR(200) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS posts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  author_id INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  image TEXT,
  links JSONB DEFAULT '[]'::jsonb,
  files JSONB DEFAULT '[]'::jsonb,
  notified_once BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS expired_posts (
  id SERIAL PRIMARY KEY,
  original_post_id INTEGER,
  title VARCHAR(255),
  description TEXT,
  author_id INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT now(),
  expired_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    target_all BOOLEAN DEFAULT TRUE,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT now(),
    post_id INTEGER,
    repeat_stage VARCHAR(20),
    last_sent DATE
);

DELETE FROM admins WHERE username = 'admin';
