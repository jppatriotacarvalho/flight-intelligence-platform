from pydantic import BaseModel, ConfigDict, computed_field

from app.carriers import carrier_name, carrier_short_name


class AirlinePerformanceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    op_unique_carrier: str
    total_flights: int
    delayed_flights: int
    average_departure_delay: float | None
    average_arrival_delay: float | None
    cancelled_flights: int
    diverted_flights: int
    delay_rate: float | None
    cancellation_rate: float | None

    # Decisao 04: o nome nao vem do MySQL, e' derivado do codigo na borda da
    # API. "9E" e "OO" nao dizem nada para quem le o dashboard.
    @computed_field
    @property
    def airline_name(self) -> str | None:
        return carrier_name(self.op_unique_carrier)

    @computed_field
    @property
    def airline_short_name(self) -> str | None:
        return carrier_short_name(self.op_unique_carrier)


class AirportPerformanceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    airport: str
    airport_name: str | None = None
    airport_city: str | None = None
    airport_state: str | None = None
    airport_label: str | None = None
    total_flights: int
    delayed_flights: int
    average_departure_delay: float | None
    cancelled_flights: int
    delay_rate: float | None
    cancellation_rate: float | None


class RoutePerformanceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    origin: str
    origin_name: str | None = None
    dest: str
    dest_name: str | None = None
    total_flights: int
    average_arrival_delay: float | None
    average_distance: float | None


class DelayCausesOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    total_carrier_delay: int | None
    total_weather_delay: int | None
    total_nas_delay: int | None
    total_security_delay: int | None
    total_late_aircraft_delay: int | None


class FlightTrendsOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    month: int
    total_flights: int
    delayed_flights: int
    average_arrival_delay: float | None
    delay_rate: float | None


class DashboardOut(BaseModel):
    total_flights: int
    # "delay_rate" e "cancellation_rate" sem o prefixo "average": sao Soma /
    # Soma sobre as 15 companhias, nao a media das taxas de cada uma.
    delay_rate: float | None
    average_arrival_delay: float | None
    cancellation_rate: float | None
    most_punctual_airline: str | None
    most_punctual_airline_name: str | None = None
    most_punctual_airline_delay_rate: float | None = None
    most_delayed_airport: str | None
    most_delayed_airport_name: str | None = None
    # Minutos, para o card mostrar o valor alem da sigla.
    most_delayed_airport_delay: float | None = None
