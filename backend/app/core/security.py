"""Hash password."""

import bcrypt


def hash_rahasia(plain: str) -> bytes:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt())


def cocok_rahasia(plain: str, hashed: bytes) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed)
