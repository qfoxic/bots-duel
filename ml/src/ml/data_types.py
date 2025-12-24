import enum
from typing import TypedDict, List, Literal


class BotType(enum.StrEnum):
    AUTO = "auto"
    MANUAL = "manual"
    SELF = "self"


class Result(enum.IntEnum):
    WIN = 1
    LOSS = -1
    DRAW = 0


class Status(enum.StrEnum):
    UPCOMING  = "upcoming"
    ACTIVE    = "active"
    COMPLETED = "completed"


class Bot(TypedDict):
    id: str
    type: BotType
    wins: int
    losses: int
    rating: int
    status: Literal["active", "inactive"]


class Tournament(TypedDict):
    id: str
    bot: Bot
    owner: Bot
    participants: List[str]
    status: Status
    dims: List[int]  # [cols, rows]


class PlayerValue(enum.IntEnum):
    NOONE = 0
    ME = 1
    OPPONENT = 2
