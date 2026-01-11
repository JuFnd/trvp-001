CREATE TABLE complexity_level (
    id TEXT PRIMARY KEY,      
    name TEXT NOT NULL,       
    value INTEGER NOT NULL    
);

CREATE TABLE technician (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL
);

CREATE TABLE ticket (
    id TEXT PRIMARY KEY,
    address TEXT NOT NULL,
    complexity_level_id TEXT NOT NULL,
    technician_id TEXT NOT NULL
);

INSERT INTO complexity_level (id, name, value) VALUES
  ('simple', 'Простая', 1),
  ('medium', 'Средняя', 3),
  ('hard', 'Сложная', 5);