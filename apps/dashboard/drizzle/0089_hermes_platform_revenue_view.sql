-- Trazabilidad contable interna: margen (markup) por tenant y periodo.
-- El markup NO se transfiere a otra wallet: se retiene del saldo prepagado del
-- tenant; esta vista cuantifica ese margen para contabilidad.
CREATE OR REPLACE VIEW "hermes_platform_revenue_v" AS
SELECT
  "tenant_id",
  date_trunc('month', "created_at") AS "period",
  SUM("raw_cost_usd")      AS "compute_cost_usd",
  SUM("markup_cost_usd")   AS "platform_markup_usd",
  SUM("total_charged_usd") AS "billed_usd",
  COUNT(*)                 AS "events"
FROM "hermes_compute_usage_events"
WHERE "is_sandbox" = false AND "status" = 'SETTLED'
GROUP BY "tenant_id", date_trunc('month', "created_at");
