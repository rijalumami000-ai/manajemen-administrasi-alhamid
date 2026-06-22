CREATE TABLE IF NOT EXISTS chat_messages (
  id SERIAL PRIMARY KEY,
  kelas_id INTEGER NOT NULL REFERENCES kelas(id) ON DELETE CASCADE,
  tahun_ajaran_id INTEGER NOT NULL REFERENCES tahun_ajaran(id) ON DELETE CASCADE,
  sender_id INTEGER NOT NULL REFERENCES guru(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  deleted_by_guru_ids INTEGER[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_room ON chat_messages(kelas_id, tahun_ajaran_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at ASC);
