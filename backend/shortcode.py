import secrets

ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"
GROUP_SIZE = 3
NUM_GROUPS = 3


def generate_code() -> str:
    raw = "".join(secrets.choice(ALPHABET) for _ in range(GROUP_SIZE * NUM_GROUPS))
    groups = [raw[i:i + GROUP_SIZE] for i in range(0, len(raw), GROUP_SIZE)]
    return "-".join(groups)
