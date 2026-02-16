import re
from sqlalchemy import and_, func, not_, or_, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.log import LogEntry
from app.schemas.log import FilterItem, LogSearchRequest

TOKEN_RE = re.compile(r'\(|\)|\bAND\b|\bOR\b|\bNOT\b|[^\s()]+', re.IGNORECASE)


def _token_to_clause(token: str):
    if ":" in token:
        field, value = token.split(":", 1)
        return LogEntry.parsed_fields[field].astext.ilike(f"%{value}%")
    return LogEntry.raw_message.ilike(f"%{token}%")


def parse_query(query: str):
    if not query.strip():
        return None

    output = []
    ops = []
    precedence = {"NOT": 3, "AND": 2, "OR": 1}

    for token in TOKEN_RE.findall(query):
        upper = token.upper()
        if upper in precedence:
            while ops and ops[-1] != "(" and precedence.get(ops[-1], 0) >= precedence[upper]:
                output.append(ops.pop())
            ops.append(upper)
        elif token == "(":
            ops.append(token)
        elif token == ")":
            while ops and ops[-1] != "(":
                output.append(ops.pop())
            if ops and ops[-1] == "(":
                ops.pop()
        else:
            output.append(token)

    while ops:
        output.append(ops.pop())

    stack = []
    for item in output:
        if item in ("AND", "OR"):
            right = stack.pop()
            left = stack.pop()
            stack.append(and_(left, right) if item == "AND" else or_(left, right))
        elif item == "NOT":
            expr = stack.pop()
            stack.append(not_(expr))
        else:
            stack.append(_token_to_clause(item))

    return stack[0] if stack else None


def apply_filters(base_query, filters: list[FilterItem]):
    for flt in filters:
        clause = LogEntry.parsed_fields[flt.field].astext == flt.value
        base_query = base_query.where(clause if flt.type == "include" else not_(clause))
    return base_query


async def run_search(session: AsyncSession, dataset_id, payload: LogSearchRequest):
    base = select(LogEntry).where(LogEntry.dataset_id == dataset_id)

    expr = parse_query(payload.query)
    if expr is not None:
        base = base.where(expr)

    base = apply_filters(base, payload.filters)

    if payload.time_from:
        base = base.where(LogEntry.timestamp.is_not(None), LogEntry.timestamp >= payload.time_from)
    if payload.time_to:
        base = base.where(LogEntry.timestamp.is_not(None), LogEntry.timestamp <= payload.time_to)

    count_query = select(func.count()).select_from(base.subquery())
    total = await session.scalar(count_query)

    sort_field = payload.sort_field or "timestamp"
    if sort_field == "timestamp":
        order_col = LogEntry.timestamp
    elif sort_field == "line_number":
        order_col = LogEntry.line_number
    else:
        # JSON dynamic key sort fallback
        order_col = text(f"parsed_fields ->> '{sort_field}'")

    order_col = order_col.asc() if payload.sort_order == "asc" else order_col.desc()
    page = max(payload.page, 1)
    size = min(max(payload.page_size, 1), 500)

    query = base.order_by(order_col).offset((page - 1) * size).limit(size)
    rows = (await session.execute(query)).scalars().all()

    return {
        "total": total or 0,
        "page": page,
        "page_size": size,
        "items": rows,
    }
