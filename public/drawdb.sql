-- 知识库表
CREATE TABLE IF NOT EXISTS knowledge_bases (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    created_at INTEGER NOT NULL
);

-- 文档表
CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    kb_id TEXT NOT NULL,
    filename TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY(kb_id) REFERENCES knowledge_bases(id) ON DELETE CASCADE
);

-- 向量块表
CREATE TABLE IF NOT EXISTS chunks (
    id TEXT PRIMARY KEY,
    doc_id TEXT NOT NULL,
    kb_id TEXT NOT NULL,
    content TEXT NOT NULL,
    embedding BLOB NOT NULL,
    chunk_index INTEGER NOT NULL,
    FOREIGN KEY(doc_id) REFERENCES documents(id) ON DELETE CASCADE,
    FOREIGN KEY(kb_id) REFERENCES knowledge_bases(id) ON DELETE CASCADE
);

-- Yjs 文档表（用于协同编辑）
CREATE TABLE IF NOT EXISTS y_documents (
    id TEXT PRIMARY KEY,
    y_update TEXT NOT NULL
);
