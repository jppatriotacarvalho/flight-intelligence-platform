"""
Configuracao comum da suite.

O import de `app.*` puxa `app.database`, que le o .env e monta a URL do MySQL.
Nenhum teste toca o MySQL — o de dashboard sobrescreve `get_db` com SQLite em
memoria e os demais sao de funcao pura — mas as variaveis precisam existir para
o modulo importar sem depender da maquina de quem roda.
"""
import os
import sys
from pathlib import Path

BACKEND = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND))

os.environ.setdefault("DB_HOST", "localhost")
os.environ.setdefault("DB_USER", "test")
os.environ.setdefault("DB_PASSWORD", "test")
os.environ.setdefault("DB_NAME", "flight_intelligence_test")
