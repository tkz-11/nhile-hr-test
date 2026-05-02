# Logic tính risk score
def calculate_risk_score(stuck_days: int, engage_score: float) -> str:
    if stuck_days > 14 or engage_score < 4.0:
        return "high"
    elif stuck_days > 7 or engage_score < 6.0:
        return "medium"
    return "low"
