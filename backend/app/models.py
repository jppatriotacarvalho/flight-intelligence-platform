from sqlalchemy import Column, String, Integer, Float, BigInteger
from app.database import Base


class AirlinePerformance(Base):
    __tablename__ = "airline_performance"

    op_unique_carrier = Column(String(5), primary_key=True)
    total_flights = Column(Integer, nullable=False)
    delayed_flights = Column(Integer, nullable=False)
    average_departure_delay = Column(Float)
    average_arrival_delay = Column(Float)
    cancelled_flights = Column(Integer, nullable=False)
    diverted_flights = Column(Integer, nullable=False)
    delay_rate = Column(Float)
    cancellation_rate = Column(Float)


class AirportPerformance(Base):
    __tablename__ = "airport_performance"

    airport = Column(String(5), primary_key=True)
    total_flights = Column(Integer, nullable=False)
    delayed_flights = Column(Integer, nullable=False)
    average_departure_delay = Column(Float)
    cancelled_flights = Column(Integer, nullable=False)
    delay_rate = Column(Float)
    cancellation_rate = Column(Float)


class RoutePerformance(Base):
    __tablename__ = "route_performance"

    origin = Column(String(5), primary_key=True)
    dest = Column(String(5), primary_key=True)
    total_flights = Column(Integer, nullable=False)
    average_arrival_delay = Column(Float)
    average_distance = Column(Float)


class DelayCauses(Base):
    __tablename__ = "delay_causes"

    id = Column(Integer, primary_key=True, autoincrement=True)
    total_carrier_delay = Column(BigInteger)
    total_weather_delay = Column(BigInteger)
    total_nas_delay = Column(BigInteger)
    total_security_delay = Column(BigInteger)
    total_late_aircraft_delay = Column(BigInteger)


class FlightTrends(Base):
    __tablename__ = "flight_trends"

    month = Column(Integer, primary_key=True)
    total_flights = Column(Integer, nullable=False)
    delayed_flights = Column(Integer, nullable=False)
    average_arrival_delay = Column(Float)
    delay_rate = Column(Float)
