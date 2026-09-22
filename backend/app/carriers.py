"""
Nomes das companhias aereas (Decisao 04).

Fonte: tabela de consulta `L_UNIQUE_CARRIERS` do BTS TranStats — a mesma base
que origina o dataset do projeto. Sao as 15 companhias que aparecem em
gold.airline_performance, uma linha por codigo, todas rastreaveis a uma
tabela oficial publicada.

Nao existe coluna de nome no MySQL: o codigo continua sendo a chave das
tabelas Gold e o nome entra so' na borda (schemas da API e prompt do agente),
do mesmo jeito que a Decisao 03 trata o nome do aeroporto como atributo.
"""

# codigo -> (nome completo, nome curto para os rotulos dos graficos)
CARRIERS: dict[str, tuple[str, str]] = {
    "9E": ("Endeavor Air", "Endeavor"),
    "AA": ("American Airlines", "American"),
    "AS": ("Alaska Airlines", "Alaska"),
    "B6": ("JetBlue Airways", "JetBlue"),
    "DL": ("Delta Air Lines", "Delta"),
    "F9": ("Frontier Airlines", "Frontier"),
    "G4": ("Allegiant Air", "Allegiant"),
    "HA": ("Hawaiian Airlines", "Hawaiian"),
    "MQ": ("Envoy Air", "Envoy"),
    "NK": ("Spirit Airlines", "Spirit"),
    "OH": ("PSA Airlines", "PSA"),
    "OO": ("SkyWest Airlines", "SkyWest"),
    "UA": ("United Airlines", "United"),
    "WN": ("Southwest Airlines", "Southwest"),
    "YX": ("Republic Airways", "Republic"),
}


def carrier_name(codigo: str | None) -> str | None:
    """Nome completo da companhia, ou None se o codigo nao for conhecido."""
    if not codigo:
        return None
    entrada = CARRIERS.get(codigo.upper())
    return entrada[0] if entrada else None


def carrier_short_name(codigo: str | None) -> str | None:
    """Nome curto, para caber no rotulo de um grafico de barras."""
    if not codigo:
        return None
    entrada = CARRIERS.get(codigo.upper())
    return entrada[1] if entrada else None


def carrier_prompt_list() -> str:
    """Lista codigo -> nome para o system prompt do agente de IA."""
    return "\n".join(f"- {codigo} = {nome}" for codigo, (nome, _) in CARRIERS.items())
