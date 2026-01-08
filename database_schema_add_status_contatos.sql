-- ================================================================================
-- ADICIONAR CAMPO DE STATUS/CATEGORIA PARA ENDEREÇOS E TELEFONES
-- ================================================================================
-- Execute este script no Supabase SQL Editor
-- Este campo permite marcar informações como "visitado", "não existe", "tem whatsapp", etc.

-- Adicionar coluna status em pessoas_fisicas_enderecos
ALTER TABLE pessoas_fisicas_enderecos 
ADD COLUMN IF NOT EXISTS status VARCHAR(100);

COMMENT ON COLUMN pessoas_fisicas_enderecos.status IS 'Status do endereço: visitado, não visitado, não existe, incorreto, etc.';

-- Adicionar coluna status em pessoas_fisicas_telefones
ALTER TABLE pessoas_fisicas_telefones 
ADD COLUMN IF NOT EXISTS status VARCHAR(100);

COMMENT ON COLUMN pessoas_fisicas_telefones.status IS 'Status do telefone: tem whatsapp, não pertence, está errado, não existe, etc.';

-- Opcional: Adicionar também em emails (caso queira no futuro)
ALTER TABLE pessoas_fisicas_emails 
ADD COLUMN IF NOT EXISTS status VARCHAR(100);

COMMENT ON COLUMN pessoas_fisicas_emails.status IS 'Status do email: válido, inválido, não pertence, etc.';

