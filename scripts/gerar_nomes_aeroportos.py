"""
Gera database/airport_names.sql: os nomes dos aeroportos, tirados do CSV do BTS.

POR QUE ESTE SCRIPT EXISTE
--------------------------
As colunas descritivas da Decisao 03 (airport_name, airport_city,
airport_state, airport_label, origin_name, dest_name) existem no banco, mas
chegaram VAZIAS: o dump foi gerado antes de o pipeline Gold passar a fazer o
join com silver.dim_airports. Reexecutar o Databricks so' para isso e' caro; o
CSV de origem esta' aqui e tem exatamente a mesma informacao.

Este script reproduz a Regra 11 (docs/silver_rules.md, celula 2 de
notebooks/03_silver/silver.ipynb) em pandas, passo a passo, para o nome de
cada aeroporto continuar sendo o MESMO que o pipeline produziria. Nenhum nome
e' digitado a mao — todos saem do dataset.

O dump NAO e' alterado. O arquivo gerado e' carregado DEPOIS dele (veja o
docker-compose.yml e a Opcao 2 do README).

    python scripts/gerar_nomes_aeroportos.py [caminho/do/flight_data_2024.csv]
"""
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

import pandas as pd

RAIZ = Path(__file__).resolve().parent.parent
CSV_PADRAO = RAIZ / "data" / "flight_data_2024.csv"
DUMP = RAIZ / "database" / "flight_intelligence_dump.sql"
SAIDA = RAIZ / "database" / "airport_names.sql"

# So' as 6 colunas necessarias: o CSV completo tem 35 colunas e 1,3 GB.
COLUNAS = [
    "origin", "origin_city_name", "origin_state_nm",
    "dest", "dest_city_name", "dest_state_nm",
]

CHUNK = 500_000

# Largura de airport_state no banco. Ver o comentario no SQL gerado.
LARGURA_STATE = 60


def contar_ocorrencias(caminho_csv: Path) -> Counter:
    """
    Passos 1 a 4 da Regra 11: le em chunks, aplica strip (Regra 07), empilha
    origem e destino, descarta nulos e conta cada (codigo, nome, estado).

    A contagem e' necessaria porque o mesmo codigo aparece com grafias
    diferentes da cidade em alguns registros; o passo 5 fica com a mais
    frequente.
    """
    ocorrencias: Counter = Counter()
    linhas_lidas = 0

    leitor = pd.read_csv(
        caminho_csv,
        usecols=COLUNAS,
        dtype=str,
        chunksize=CHUNK,
    )

    for pedaco in leitor:
        linhas_lidas += len(pedaco)

        for lado in ("origin", "dest"):
            bloco = pedaco[[lado, f"{lado}_city_name", f"{lado}_state_nm"]].copy()
            bloco.columns = ["airport_code", "airport_name", "airport_state"]

            # Regra 07 — padronizacao de texto.
            for coluna in bloco.columns:
                bloco[coluna] = bloco[coluna].str.strip()

            bloco = bloco.dropna(subset=["airport_code", "airport_name"])
            ocorrencias.update(
                bloco.itertuples(index=False, name=None)
            )

        print(f"  {linhas_lidas:,} linhas lidas...".replace(",", "."), end="\r")

    print(f"  {linhas_lidas:,} linhas lidas.".replace(",", ".") + " " * 12)
    return ocorrencias


def montar_dimensao(ocorrencias: Counter) -> dict[str, dict[str, str]]:
    """
    Passos 5 a 8 da Regra 11: uma linha por codigo, ficando com a grafia mais
    frequente. Empate pelo airport_name ascendente — o mesmo criterio do
    row_number() sobre a janela do notebook, para o resultado ser identico.
    """
    candidatos: dict[str, list[tuple[int, str, str]]] = defaultdict(list)

    for (codigo, nome, estado), quantidade in ocorrencias.items():
        candidatos[codigo].append((quantidade, nome, estado or ""))

    dimensao: dict[str, dict[str, str]] = {}

    for codigo, opcoes in candidatos.items():
        # -quantidade para ordenar do mais frequente para o menos; o nome
        # ascendente entra como desempate.
        quantidade, nome, estado = sorted(opcoes, key=lambda o: (-o[0], o[1]))[0]
        dimensao[codigo] = {
            "airport_name": nome,
            # "Atlanta, GA" -> "Atlanta"
            "airport_city": nome.split(",")[0].strip(),
            # Nome completo do estado, como vem de *_state_nm ("Georgia").
            "airport_state": estado,
            "airport_label": f"{codigo} - {nome}",
        }

    return dimensao


def ler_dump() -> tuple[set[str], set[tuple[str, str]]]:
    """
    Siglas de airport_performance e pares de route_performance, lidos do dump.
    Servem so' para VALIDAR a cobertura — o dump nao e' modificado.
    """
    texto = DUMP.read_text(encoding="utf-8", errors="replace")

    def tuplas(tabela: str) -> list[list[str]]:
        linhas = []
        for bloco in re.finditer(
            rf"INSERT INTO `{tabela}` VALUES (.*?);\n", texto, re.S
        ):
            for tupla in re.findall(r"\(([^()]*)\)", bloco.group(1)):
                linhas.append([campo.strip().strip("'") for campo in tupla.split(",")])
        return linhas

    aeroportos = {linha[0] for linha in tuplas("airport_performance")}
    rotas = {(linha[0], linha[1]) for linha in tuplas("route_performance")}
    return aeroportos, rotas


def escapar(valor: str) -> str:
    return valor.replace("\\", "\\\\").replace("'", "''")


def gerar_sql(dimensao: dict[str, dict[str, str]], rotas: set[tuple[str, str]]) -> str:
    linhas = [
        "-- ============================================================",
        "-- NOMES DOS AEROPORTOS — ARQUIVO GERADO, NAO EDITE A MAO",
        "--",
        "-- Gerado por: scripts/gerar_nomes_aeroportos.py",
        "-- Origem:     data/flight_data_2024.csv (BTS TranStats, via Kaggle)",
        "-- Regra:      Regra 11 de docs/silver_rules.md (silver.dim_airports)",
        "--",
        "-- Preenche as colunas descritivas da Decisao 03, que vieram vazias no",
        "-- dump. Deve ser carregado DEPOIS de flight_intelligence_dump.sql.",
        "-- ============================================================",
        "",
        "USE flight_intelligence;",
        "",
        "-- ------------------------------------------------------------",
        "-- airport_state precisa de 46 caracteres: o maior *_state_nm do",
        "-- dataset e' 'U.S. Pacific Trust Territories and Possessions'. O dump",
        "-- cria a coluna com VARCHAR(40) e o UPDATE morria com erro 1406",
        "-- ('Data too long'), abortando a carga no meio.",
        "-- ------------------------------------------------------------",
        f"ALTER TABLE airport_performance MODIFY airport_state VARCHAR({LARGURA_STATE});",
        "",
        "-- ------------------------------------------------------------",
        f"-- airport_performance: {len(dimensao)} aeroportos",
        "-- ------------------------------------------------------------",
    ]

    for codigo in sorted(dimensao):
        dados = dimensao[codigo]
        linhas.append(
            "UPDATE airport_performance SET "
            f"airport_name = '{escapar(dados['airport_name'])}', "
            f"airport_city = '{escapar(dados['airport_city'])}', "
            f"airport_state = '{escapar(dados['airport_state'])}', "
            f"airport_label = '{escapar(dados['airport_label'])}' "
            f"WHERE airport = '{codigo}';"
        )

    # Uma linha por sigla, e nao por rota: 348 UPDATEs com WHERE origin = ...
    # em vez de 6.805 com WHERE origin = ... AND dest = ...
    codigos_em_rotas = {codigo for par in rotas for codigo in par}
    linhas += [
        "",
        "-- ------------------------------------------------------------",
        f"-- route_performance: {len(codigos_em_rotas)} siglas nos dois lados",
        "-- ------------------------------------------------------------",
    ]

    for codigo in sorted(codigos_em_rotas):
        if codigo not in dimensao:
            continue
        nome = escapar(dimensao[codigo]["airport_name"])
        linhas.append(
            f"UPDATE route_performance SET origin_name = '{nome}' "
            f"WHERE origin = '{codigo}';"
        )
        linhas.append(
            f"UPDATE route_performance SET dest_name = '{nome}' "
            f"WHERE dest = '{codigo}';"
        )

    return "\n".join(linhas) + "\n"


def validar(dimensao: dict[str, dict[str, str]], aeroportos: set[str], rotas: set[tuple[str, str]]) -> bool:
    """Mesmo QA da celula 2 do notebook, mais a cobertura do que esta' no banco."""
    ok = True

    print("\n--- Validacao ---")
    print(f"1 linha por codigo: {len(dimensao)} codigos distintos na dimensao.")

    sem_nome = sorted(aeroportos - set(dimensao))
    print(f"Aeroportos em airport_performance: {len(aeroportos)}")
    if sem_nome:
        ok = False
        print(f"  FALHA: {len(sem_nome)} sem nome -> {sem_nome[:10]}")
    else:
        print("  OK: todos receberam nome.")

    codigos_em_rotas = {codigo for par in rotas for codigo in par}
    rotas_sem_nome = sorted(codigos_em_rotas - set(dimensao))
    print(f"Siglas usadas em route_performance: {len(codigos_em_rotas)}")
    if rotas_sem_nome:
        ok = False
        print(f"  FALHA: {len(rotas_sem_nome)} sem nome -> {rotas_sem_nome[:10]}")
    else:
        print("  OK: nenhuma rota fica sem origin_name/dest_name.")

    # A prova de que o nome NAO podia ser a chave (Decisao 03, opcao A).
    por_nome: dict[str, list[str]] = defaultdict(list)
    for codigo, dados in dimensao.items():
        por_nome[dados["airport_name"]].append(codigo)

    repetidos = {nome: sorted(cods) for nome, cods in por_nome.items() if len(cods) > 1}
    print(f"\nCidades atendidas por mais de um aeroporto (nome NAO e' chave): {len(repetidos)}")
    for nome, codigos in sorted(repetidos.items(), key=lambda item: -len(item[1]))[:10]:
        print(f"  {nome}: {', '.join(codigos)}")

    return ok


def main() -> None:
    caminho_csv = Path(sys.argv[1]) if len(sys.argv) > 1 else CSV_PADRAO
    if not caminho_csv.exists():
        raise SystemExit(f"CSV nao encontrado: {caminho_csv}")

    print(f"Lendo {caminho_csv} ({caminho_csv.stat().st_size / 1e9:.2f} GB)...")
    ocorrencias = contar_ocorrencias(caminho_csv)

    dimensao = montar_dimensao(ocorrencias)
    aeroportos, rotas = ler_dump()

    if not validar(dimensao, aeroportos, rotas):
        raise SystemExit("\nValidacao falhou: o arquivo NAO foi gerado.")

    SAIDA.write_text(gerar_sql(dimensao, rotas), encoding="utf-8")
    print(f"\n{SAIDA.relative_to(RAIZ)} gerado.")
    print("Carregue-o DEPOIS do dump:")
    print("  mysql -u root -p flight_intelligence < database/airport_names.sql")


if __name__ == "__main__":
    main()
