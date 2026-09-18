"""Batas percobaan login: 5 gagal per username dalam 15 menit.

Per username saja, BUKAN per IP — satu jaringan balai desa dipakai
banyak pengurus, jadi per-IP bisa mengunci seluruh ruangan.

ponytail: hitungan di memori proses, hilang tiap restart. Pindahkan ke
tabel kalau backend jalan lebih dari satu proses.
"""

import time

JENDELA_DETIK = 15 * 60
BATAS_GAGAL = 5

# username -> daftar waktu gagal (monotonic). Hanya percobaan GAGAL yang dicatat.
_gagal: dict[str, list[float]] = {}


def _bersihkan(username: str, sekarang: float) -> list[float]:
    tersisa = [w for w in _gagal.get(username, []) if sekarang - w < JENDELA_DETIK]
    if tersisa:
        _gagal[username] = tersisa
    else:
        _gagal.pop(username, None)
    return tersisa


def sisa_tunggu(username: str) -> int:
    """Detik yang harus ditunggu sebelum boleh mencoba lagi; 0 kalau boleh."""
    sekarang = time.monotonic()
    waktu = _bersihkan(username, sekarang)
    if len(waktu) < BATAS_GAGAL:
        return 0
    # Terbuka lagi begitu percobaan tertua keluar dari jendela.
    return int(JENDELA_DETIK - (sekarang - waktu[0])) + 1


def catat_gagal(username: str) -> None:
    sekarang = time.monotonic()
    # Sapu SELURUH isi, bukan cuma username ini: yang dicoba sekali lalu tidak
    # pernah lagi (penebakan yang berpindah-pindah username) tidak punya
    # kesempatan lain untuk dibersihkan, dan tinggal di memori sampai restart.
    # Isinya paling banyak sejumlah username yang pernah gagal dalam 15 menit,
    # jadi menyapunya tiap kegagalan tidak terasa.
    for nama in list(_gagal):
        _bersihkan(nama, sekarang)
    _gagal.setdefault(username, []).append(sekarang)


def reset(username: str) -> None:
    """Login berhasil: hitungannya dinolkan."""
    _gagal.pop(username, None)


def demo() -> None:
    """Self-check. Jalankan: .venv/bin/python -m app.core.ratelimit"""
    # Username yang gagal sekali lalu ditinggalkan tidak boleh menumpuk.
    _gagal.clear()
    _gagal["ditinggalkan"] = [time.monotonic() - JENDELA_DETIK - 1]
    catat_gagal("orang_lain")
    assert "ditinggalkan" not in _gagal, _gagal
    _gagal.clear()
    _gagal.clear()
    assert sisa_tunggu("budi") == 0

    for _ in range(BATAS_GAGAL - 1):
        catat_gagal("budi")
    assert sisa_tunggu("budi") == 0, "belum sampai batas"

    catat_gagal("budi")
    tunggu = sisa_tunggu("budi")
    assert 0 < tunggu <= JENDELA_DETIK + 1, tunggu

    # Akun lain tidak ikut terkunci — itulah alasan hitungannya per username.
    assert sisa_tunggu("siti") == 0, "akun lain ikut terkunci"

    reset("budi")
    assert sisa_tunggu("budi") == 0, "login berhasil harus menolkan"

    # Percobaan lama keluar dari jendela dengan sendirinya.
    _gagal.clear()
    _gagal["lama"] = [time.monotonic() - JENDELA_DETIK - 1] * BATAS_GAGAL
    assert sisa_tunggu("lama") == 0, "jendela tidak bergeser"

    _gagal.clear()
    print("OK: app/core/ratelimit.py")


if __name__ == "__main__":
    demo()
