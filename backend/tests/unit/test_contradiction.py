from app.reliability.contradiction import extract_numbers, numeric_contradiction_hint


def test_extract_numbers():
    assert "7" in extract_numbers("up to 7 days")
    assert "820" in extract_numbers("latency 820ms")


def test_numeric_contradiction_disjoint():
    assert numeric_contradiction_hint("done in 2 hours", ["takes 7 days to process"]) is True


def test_numeric_contradiction_overlap():
    assert numeric_contradiction_hint("7 days refund", ["refund in 7 days"]) is False
