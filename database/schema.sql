-- ============================================================
-- ETAPA 16 — SCHEMA DO BANCO (MySQL)
-- Flight Intelligence Platform
-- ============================================================

CREATE DATABASE IF NOT EXISTS flight_intelligence
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE flight_intelligence;

-- ------------------------------------------------------------
-- gold.airline_performance -> airline_performance
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS airline_performance (
    op_unique_carrier      VARCHAR(5)      NOT NULL,
    total_flights          INT             NOT NULL,
    delayed_flights        INT             NOT NULL,
    average_departure_delay DOUBLE,
    average_arrival_delay   DOUBLE,
    cancelled_flights      INT             NOT NULL,
    diverted_flights       INT             NOT NULL,
    delay_rate             DOUBLE,
    cancellation_rate      DOUBLE,
    PRIMARY KEY (op_unique_carrier)
);

-- ------------------------------------------------------------
-- gold.airport_performance -> airport_performance
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS airport_performance (
    airport                 VARCHAR(5)     NOT NULL,
    -- Nome vindo de silver.dim_airports (origin_city_name do dataset BTS).
    -- A sigla continua sendo a chave: o nome nao e' unico
    -- (ORD e MDW sao ambos "Chicago, IL").
    airport_name            VARCHAR(60),
    airport_city            VARCHAR(50),
    -- 60, nao 40: o maior *_state_nm do dataset e'
    -- "U.S. Pacific Trust Territories and Possessions", com 46 caracteres.
    airport_state           VARCHAR(60),
    airport_label           VARCHAR(70),
    total_flights           INT            NOT NULL,
    delayed_flights         INT            NOT NULL,
    average_departure_delay DOUBLE,
    cancelled_flights       INT            NOT NULL,
    delay_rate              DOUBLE,
    cancellation_rate       DOUBLE,
    PRIMARY KEY (airport)
);

-- ------------------------------------------------------------
-- gold.route_performance -> route_performance
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS route_performance (
    origin                  VARCHAR(5)     NOT NULL,
    origin_name             VARCHAR(60),
    dest                    VARCHAR(5)     NOT NULL,
    dest_name               VARCHAR(60),
    total_flights           INT            NOT NULL,
    average_arrival_delay   DOUBLE,
    average_distance        DOUBLE,
    PRIMARY KEY (origin, dest)
);

-- ------------------------------------------------------------
-- gold.delay_causes -> delay_causes (linha única, agregado geral)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS delay_causes (
    id                          INT AUTO_INCREMENT,
    total_carrier_delay         BIGINT,
    total_weather_delay         BIGINT,
    total_nas_delay             BIGINT,
    total_security_delay        BIGINT,
    total_late_aircraft_delay   BIGINT,
    PRIMARY KEY (id)
);

-- ------------------------------------------------------------
-- gold.flight_trends -> flight_trends
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS flight_trends (
    month                    INT            NOT NULL,
    total_flights            INT            NOT NULL,
    delayed_flights          INT            NOT NULL,
    average_arrival_delay    DOUBLE,
    delay_rate               DOUBLE,
    PRIMARY KEY (month)
);

-- ============================================================
-- ÍNDICES (item 16.4 — baseados em filtros esperados de API/Dashboard/IA)
-- ============================================================

-- route_performance: busca comum por origem OU destino isoladamente
CREATE INDEX idx_route_origin ON route_performance (origin);
CREATE INDEX idx_route_dest   ON route_performance (dest);

-- Ordenações mais comuns no dashboard: maior atraso / maior volume
CREATE INDEX idx_airline_delay_rate ON airline_performance (delay_rate DESC);
CREATE INDEX idx_airport_delay_rate ON airport_performance (delay_rate DESC);

-- Busca por nome/cidade do aeroporto (pagina Aeroportos e agente de IA)
CREATE INDEX idx_airport_name ON airport_performance (airport_name);
CREATE INDEX idx_airport_city ON airport_performance (airport_city);
