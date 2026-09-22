#!/bin/bash
# ============================================================
# Usuario MySQL somente leitura para a API (Pendencia 3)
#
# Roda pelo entrypoint do container mysql, que executa os arquivos de
# /docker-entrypoint-initdb.d em ORDEM ALFABETICA. Por isso o prefixo "03":
# o GRANT precisa das tabelas ja' criadas, senao o MySQL devolve erro 1146
# ("table doesn't exist"). A ordem e':
#
#   01_dump.sql          cria e popula as 5 tabelas Gold
#   02_airport_names.sql preenche os nomes (opcional)
#   03_readonly_user.sh  este arquivo
#
# Ate' aqui a garantia de somente-leitura era so' o validador de SQL do
# agente (docs/ai_agent_security.md, 1.9). Com este usuario, a aplicacao nao
# consegue escrever MESMO QUE o validador falhe.
# ============================================================
set -euo pipefail

if [ -z "${MYSQL_READONLY_PASSWORD:-}" ]; then
  echo "[03_readonly_user] MYSQL_READONLY_PASSWORD nao definida; usuario nao criado." >&2
  exit 1
fi

# As 5 tabelas Gold, uma a uma. GRANT SELECT ON flight_intelligence.* daria
# acesso automatico a qualquer tabela criada depois — inclusive uma que nao
# deveria ser exposta ao agente de IA.
TABELAS="airline_performance airport_performance route_performance delay_causes flight_trends"

{
  echo "CREATE USER IF NOT EXISTS 'flight_reader'@'%' IDENTIFIED BY '${MYSQL_READONLY_PASSWORD}';"
  for tabela in $TABELAS; do
    echo "GRANT SELECT ON flight_intelligence.${tabela} TO 'flight_reader'@'%';"
  done
  echo "FLUSH PRIVILEGES;"
} | mysql --protocol=socket -u root -p"${MYSQL_ROOT_PASSWORD}"

echo "[03_readonly_user] flight_reader criado com SELECT em 5 tabelas Gold."
