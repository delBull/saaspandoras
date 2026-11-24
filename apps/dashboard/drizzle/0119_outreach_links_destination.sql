-- 0119 · Enlaces de captación sin Deal Pod
--
-- Los links de radar (/l/<code>) nacieron atados a un Deal Pod. Para captar
-- tráfico a un tenant que no es un pod (S'Narai y sus publicaciones) se necesita
-- un destino propio y que el pod sea opcional.

ALTER TABLE nexus_outreach_links
  ALTER COLUMN pod_id DROP NOT NULL;

ALTER TABLE nexus_outreach_links
  ADD COLUMN IF NOT EXISTS destination_url varchar(600);

CREATE INDEX IF NOT EXISTS nexus_outreach_links_destination_idx
  ON nexus_outreach_links (code);
