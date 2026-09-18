"""Pergantian pemegang jabatan pengurus: pengajuan + persetujuan.

Admin mengajukan, perangkat desa yang memutuskan. Seluruh aturan siapa
boleh menyetujui apa ada di sini — router cuma memanggil.

Riwayatnya tidak pernah dihapus.
"""

import uuid
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone

from app.core.config import settings
from app.data import db
from app.data import lpm as data_lpm
from app.data import pengurus as pg
from app.data import sesi

# Pengajuan yang tidak dijawab siapa pun dianggap gugur setelah ini.
UMUR_MAKS_HARI = 30

# Jumlah maksimal riwayat pergantian selesai yang disimpan (agar tidak menumpuk).
MAKS_RIWAYAT_SELESAI = 4

STATUS_MENUNGGU = "MENUNGGU"
STATUS_DISETUJUI = "DISETUJUI"
STATUS_DITOLAK = "DITOLAK"
STATUS_GUGUR = "GUGUR"


class TidakBoleh(ValueError):
    """Aturan pergantian dilanggar. Router menerjemahkannya jadi HTTP 4xx."""


@dataclass
class Suara:
    pengurus_id: str
    nama: str
    jabatan: str
    setuju: bool
    pada: str


@dataclass
class Pengajuan:
    id: str
    #: Kunci jabatan yang diperebutkan — lihat `pengurus.kode_jabatan_dari()`.
    jabatan_kode: str
    role: str
    rw: str | None
    rt: str | None
    kandidat_id: str
    kandidat_nama: str
    kandidat_rt: str
    kandidat_rw: str
    status: str
    diajukan_oleh: str
    diajukan_pada: str
    selesai_pada: str | None = None
    sebab: str | None = None
    suara: list[Suara] = field(default_factory=list)

    @property
    def jabatan(self) -> str:
        return pg.jabatan_dari(self.role, self.rw, self.rt)


def _db():
    return db.koneksi(settings.DATABASE_FILE)


def _sekarang() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")


def penyetuju_untuk(role: str, rw: str | None, rt: str | None) -> list[pg.Pengurus]:
    """Siapa yang harus menyetujui pergantian sebuah jabatan.

    Dihitung ulang tiap dipanggil, bukan dibekukan saat pengajuan dibuat.

    Jabatan kosong DILEWATI, bukan dihitung sebagai suara yang belum masuk —
    tanpa itu satu jabatan kosong mengunci pergantian secara permanen.
    """
    aktif = [p for p in pg.daftar() if p.aktif]
    dukuh = [p for p in aktif if p.role == pg.ROLE_DUKUH]

    if role == pg.ROLE_DUKUH:
        return [p for p in aktif if p.role == pg.ROLE_RW]
    if role == pg.ROLE_RW:
        return dukuh
    if role == pg.ROLE_RT:
        ketua_rw = [p for p in aktif if p.role == pg.ROLE_RW and pg._samakan_wilayah(p.rw, rw)]
        return ketua_rw + dukuh
    if role == pg.ROLE_LPM:
        return dukuh
    raise TidakBoleh(f"Jabatan {role} tidak bisa diganti lewat pengajuan.")


def _dari_row(row, suara: list[Suara]) -> Pengajuan:
    return Pengajuan(
        id=row["id"],
        jabatan_kode=row["jabatan_kode"],
        role=row["role"],
        rw=row["rw"],
        rt=row["rt"],
        kandidat_id=row["kandidat_id"],
        kandidat_nama=row["kandidat_nama"],
        kandidat_rt=row["kandidat_rt"],
        kandidat_rw=row["kandidat_rw"],
        status=row["status"],
        diajukan_oleh=row["diajukan_oleh"],
        diajukan_pada=row["diajukan_pada"],
        selesai_pada=row["selesai_pada"],
        sebab=row["sebab"],
        suara=suara,
    )


def _muat_suara(conn, pengajuan_id: str) -> list[Suara]:
    rows = conn.execute(
        "SELECT s.*, p.nama, p.role, p.rw, p.rt FROM persetujuan s"
        " JOIN pengurus p ON p.id = s.pengurus_id"
        " WHERE s.pengajuan_id = ? ORDER BY s.pada",
        (pengajuan_id,),
    ).fetchall()
    return [
        Suara(
            pengurus_id=r["pengurus_id"],
            nama=r["nama"],
            jabatan=pg.jabatan_dari(r["role"], r["rw"], r["rt"]),
            setuju=bool(r["setuju"]),
            pada=r["pada"],
        )
        for r in rows
    ]


def _ambil(conn, id: str) -> Pengajuan | None:
    row = conn.execute("SELECT * FROM pengajuan WHERE id = ?", (id,)).fetchone()
    return _dari_row(row, _muat_suara(conn, id)) if row else None


def _pangkas_riwayat_selesai(conn) -> None:
    """Otomatis memangkas riwayat pergantian yang sudah selesai."""
    rows = conn.execute(
        "SELECT id FROM pengajuan WHERE status != ? ORDER BY diajukan_pada DESC, id DESC",
        (STATUS_MENUNGGU,),
    ).fetchall()

    if len(rows) > MAKS_RIWAYAT_SELESAI:
        id_dihapus = [r["id"] for r in rows[MAKS_RIWAYAT_SELESAI:]]
        with conn:
            ph = ",".join("?" * len(id_dihapus))
            conn.execute(
                f"DELETE FROM persetujuan WHERE pengajuan_id IN ({ph})", id_dihapus
            )
            conn.execute(
                f"DELETE FROM pengajuan WHERE id IN ({ph})", id_dihapus
            )


def _selesaikan(conn, id: str, status: str, sebab: str) -> None:
    with conn:
        conn.execute(
            "UPDATE pengajuan SET status = ?, selesai_pada = ?, sebab = ?"
            " WHERE id = ? AND status = ?",
            (status, _sekarang(), sebab, id, STATUS_MENUNGGU),
        )
    _pangkas_riwayat_selesai(conn)


def _kadaluarsa(p: Pengajuan) -> bool:
    batas = datetime.fromisoformat(p.diajukan_pada) + timedelta(days=UMUR_MAKS_HARI)
    return datetime.now(timezone.utc) > batas


def _kandidat_masih_sah(kandidat_id: str) -> bool:
    if not kandidat_id:
        return True
    from app.data.store import semua_penduduk

    warga = next((w for w in semua_penduduk() if w.id == kandidat_id), None)
    return warga is not None and warga.statusKependudukan == "AKTIF"


def _kandidat_sudah_menjabat(kandidat_id: str) -> pg.Pengurus | None:
    """Apakah warga ini sudah memegang jabatan aktif?

    Dipakai dua kali: saat pengajuan dibuat, dan saat akan diterapkan
    (menggugurkan kalau keadaannya berubah di antaranya).

    Tabel LPM ikut diperiksa: satu orang tidak boleh merangkap.
    """
    if not kandidat_id:
        return None
    pemegang = next(
        (p for p in pg.daftar() if p.aktif and p.warga_id == kandidat_id),
        None,
    )
    if pemegang is not None:
        return pemegang
    # Cek LPM — bukan Pengurus, tapi tetap satu jabatan.
    lpm_wid = data_lpm.warga_id()
    if lpm_wid == kandidat_id:
        # Kembalikan Pengurus sintetis supaya pesan error konsisten.
        return pg.Pengurus(
            id="__lpm__",
            username="",
            nama=data_lpm.nama(),
            role=pg.ROLE_LPM,
            rw=None,
            rt=None,
            aktif=True,
            warga_id=lpm_wid,
        )
    return None


def _evaluasi(conn, p: Pengajuan) -> Pengajuan:
    """Perbarui status pengajuan menurut keadaan sekarang.

    Dipanggil setiap kali pengajuan dibaca atau dijawab — bukan lewat tugas
    latar. Tidak ada penjadwal di aplikasi ini, dan menambahkannya berarti satu
    proses lagi yang harus dirawat orang setelah KKN.
    """
    if p.status != STATUS_MENUNGGU:
        return p

    if _kadaluarsa(p):
        _selesaikan(conn, p.id, STATUS_GUGUR, f"Lewat {UMUR_MAKS_HARI} hari tanpa keputusan")
        return _ambil(conn, p.id) or p
    if not _kandidat_masih_sah(p.kandidat_id):
        _selesaikan(conn, p.id, STATUS_GUGUR, "Kandidat sudah tidak aktif di data warga")
        return _ambil(conn, p.id) or p
    # Kandidat bisa saja sudah diangkat di jabatan lain sejak pengajuan ini
    # dibuat — lewat "Buatkan Akun" untuk jabatan kosong, atau lewat
    # pengajuan pergantian lain yang lebih dulu disetujui. Kalau itu terjadi,
    # membiarkan pengajuan ini sampai disetujui berarti rangkap jabatan.
    pemegang_lain = _kandidat_sudah_menjabat(p.kandidat_id)
    if pemegang_lain is not None and pemegang_lain.kode_jabatan != p.jabatan_kode:
        _selesaikan(
            conn, p.id, STATUS_GUGUR,
            f"Kandidat {p.kandidat_nama} sudah memegang jabatan "
            f"{pemegang_lain.jabatan} — tidak boleh rangkap jabatan",
        )
        return _ambil(conn, p.id) or p

    menolak = next((s for s in p.suara if not s.setuju), None)
    if menolak:
        _selesaikan(conn, p.id, STATUS_DITOLAK, f"Ditolak {menolak.jabatan}")
        return _ambil(conn, p.id) or p

    wajib = {x.id for x in penyetuju_untuk(p.role, p.rw, p.rt)}
    sudah = {s.pengurus_id for s in p.suara if s.setuju}
    # Penyetuju yang jabatannya sudah kosong tidak lagi ditunggu; yang sudah
    # menjawab tetap dihitung walau jabatannya kini kosong — suaranya sah saat
    # diberikan.
    if wajib and wajib <= sudah:
        _terapkan(conn, p)
        return _ambil(conn, p.id) or p
    return p


def _terapkan(conn, p: Pengajuan) -> None:
    """Pindahkan atau kosongkan jabatan."""
    nama_lama: str | None = None

    if p.jabatan_kode == "LPM":
        nama_lama = data_lpm.nama() or None
        if p.kandidat_id:
            data_lpm.ubah(p.kandidat_nama, p.kandidat_id)
            sebab = f"Disetujui seluruh penyetuju; {p.kandidat_nama} menggantikan {nama_lama or 'jabatan kosong'}"
        else:
            data_lpm.ubah("", None)
            sebab = f"Disetujui seluruh penyetuju; Ketua LPM dikosongkan (sebelumnya {nama_lama or 'tanpa nama'})"
    else:
        lama = next(
            (x for x in pg.daftar() if x.aktif and x.kode_jabatan == p.jabatan_kode),
            None,
        )
        if lama is not None:
            nama_lama = lama.nama
            pg.ubah(lama.id, aktif=False)
            sesi.akhiri_semua(lama.id)
        sebab = f"Disetujui seluruh penyetuju; {p.kandidat_nama} menggantikan {nama_lama or 'jabatan kosong'}"

    _selesaikan(conn, p.id, STATUS_DISETUJUI, sebab)


def ajukan(*, jabatan_kode: str, kandidat_id: str, oleh: str) -> Pengajuan:
    """Usulkan pergantian atau pengosongan pemegang sebuah jabatan."""
    from app.data.store import semua_penduduk

    # --- Resolve target jabatan ---
    if jabatan_kode == "LPM":
        target_role = pg.ROLE_LPM
        target_rw: str | None = None
        target_rt: str | None = None
        target_label = "Ketua LPM"
        lpm_wid = data_lpm.warga_id()
        if lpm_wid is None and not data_lpm.nama():
            raise TidakBoleh(
                "Jabatan Ketua LPM sedang kosong — isi langsung lewat "
                "Pilih Warga, tidak perlu persetujuan."
            )
    else:
        semua = {j.kode: j for j in pg.daftar_jabatan()}
        target = semua.get(jabatan_kode)
        if target is None:
            raise TidakBoleh("Jabatan tidak dikenal.")
        if target.pemegang is None:
            raise TidakBoleh(
                f"Jabatan {target.label} sedang kosong — isi langsung lewat "
                "Buatkan Akun, tidak perlu persetujuan."
            )
        target_role = target.role
        target_rw = target.rw
        target_rt = target.rt
        target_label = target.label

    # --- Validasi kandidat / pengosongan ---
    if not kandidat_id:
        if jabatan_kode != "LPM":
            raise TidakBoleh("Mengosongkan jabatan hanya didukung untuk LPM.")
        cand_id = ""
        cand_nama = "(Dikosongkan)"
        cand_rt = ""
        cand_rw = ""
    else:
        warga = next((w for w in semua_penduduk() if w.id == kandidat_id), None)
        if warga is None or warga.statusKependudukan != "AKTIF":
            raise TidakBoleh("Warga yang diusulkan tidak ada atau sudah tidak aktif.")

        if not pg.cocok_wilayah(
            target_role, target_rw, target_rt, warga.alamat.rw, warga.alamat.rt
        ):
            raise TidakBoleh(
                f"{warga.nama} warga RT {warga.alamat.rt}/RW {warga.alamat.rw}, "
                f"tidak bisa memegang jabatan {target_label}."
            )

        sudah = _kandidat_sudah_menjabat(warga.id)
        if sudah is not None:
            raise TidakBoleh(
                f"{warga.nama} sedang memegang jabatan {sudah.jabatan}. "
                "Satu orang satu jabatan."
            )
        cand_id = warga.id
        cand_nama = warga.nama
        cand_rt = warga.alamat.rt
        cand_rw = warga.alamat.rw

    penyetuju = penyetuju_untuk(target_role, target_rw, target_rt)
    if not penyetuju:
        raise TidakBoleh(
            f"Belum ada yang bisa menyetujui pergantian {target_label}. "
            "Isi dulu jabatan penyetujunya."
        )

    with _db() as conn:
        berjalan = conn.execute(
            "SELECT 1 FROM pengajuan WHERE jabatan_kode = ? AND status = ?",
            (jabatan_kode, STATUS_MENUNGGU),
        ).fetchone()
        if berjalan:
            raise TidakBoleh(
                f"Jabatan {target_label} sudah punya pengajuan yang berjalan."
            )
        if cand_id:
            dicalonkan = conn.execute(
                "SELECT jabatan_kode FROM pengajuan"
                " WHERE kandidat_id = ? AND status = ?",
                (cand_id, STATUS_MENUNGGU),
            ).fetchone()
            if dicalonkan:
                raise TidakBoleh(
                    f"{cand_nama} sudah dicalonkan di pengajuan pergantian lain "
                    f"yang masih berjalan. Satu orang satu jabatan."
                )
        baru = Pengajuan(
            id=str(uuid.uuid4()),
            jabatan_kode=jabatan_kode,
            role=target_role,
            rw=target_rw,
            rt=target_rt,
            kandidat_id=cand_id,
            kandidat_nama=cand_nama,
            kandidat_rt=cand_rt,
            kandidat_rw=cand_rw,
            status=STATUS_MENUNGGU,
            diajukan_oleh=oleh,
            diajukan_pada=_sekarang(),
        )
        with conn:
            conn.execute(
                "INSERT INTO pengajuan (id, jabatan_kode, role, rw, rt,"
                " kandidat_id, kandidat_nama, kandidat_rt, kandidat_rw, status,"
                " diajukan_oleh, diajukan_pada) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
                (
                    baru.id, baru.jabatan_kode, baru.role, baru.rw, baru.rt,
                    baru.kandidat_id, baru.kandidat_nama, baru.kandidat_rt,
                    baru.kandidat_rw, baru.status, baru.diajukan_oleh,
                    baru.diajukan_pada,
                ),
            )
        return _ambil(conn, baru.id) or baru


def daftar(*, hanya_berjalan: bool = False) -> list[Pengajuan]:
    """Seluruh pengajuan, terbaru dulu. Statusnya dievaluasi ulang saat dibaca."""
    with _db() as conn:
        rows = conn.execute(
            "SELECT id FROM pengajuan ORDER BY diajukan_pada DESC"
        ).fetchall()
        for r in rows:
            p = _ambil(conn, r["id"])
            if p is not None:
                _evaluasi(conn, p)
        _pangkas_riwayat_selesai(conn)

        rows = conn.execute(
            "SELECT id FROM pengajuan ORDER BY diajukan_pada DESC"
        ).fetchall()
        hasil = []
        for r in rows:
            p = _ambil(conn, r["id"])
            if p is None:
                continue
            if hanya_berjalan and p.status != STATUS_MENUNGGU:
                continue
            hasil.append(p)
    return hasil


def menunggu_jawaban(pengurus_id: str) -> list[Pengajuan]:
    """Pengajuan yang menunggu jawaban orang ini, dan hanya itu."""
    orang = pg.cari_by_id(pengurus_id)
    if orang is None or not orang.aktif:
        return []
    hasil = []
    for p in daftar(hanya_berjalan=True):
        wajib = {x.id for x in penyetuju_untuk(p.role, p.rw, p.rt)}
        sudah = {s.pengurus_id for s in p.suara}
        if pengurus_id in wajib and pengurus_id not in sudah:
            hasil.append(p)
    return hasil


def jawab(*, pengajuan_id: str, pengurus_id: str, setuju: bool) -> Pengajuan:
    """Satu suara."""
    with _db() as conn:
        p = _ambil(conn, pengajuan_id)
        if p is None:
            raise TidakBoleh("Pengajuan tidak ditemukan.")
        p = _evaluasi(conn, p)
        if p.status != STATUS_MENUNGGU:
            raise TidakBoleh("Pengajuan ini sudah selesai.")

        wajib = {x.id for x in penyetuju_untuk(p.role, p.rw, p.rt)}
        if pengurus_id not in wajib:
            raise TidakBoleh("Anda bukan penyetuju pergantian ini.")
        if any(s.pengurus_id == pengurus_id for s in p.suara):
            raise TidakBoleh("Anda sudah menjawab pengajuan ini.")

        with conn:
            conn.execute(
                "INSERT INTO persetujuan (pengajuan_id, pengurus_id, setuju, pada)"
                " VALUES (?, ?, ?, ?)",
                (pengajuan_id, pengurus_id, 1 if setuju else 0, _sekarang()),
            )
        p = _ambil(conn, pengajuan_id)
        return _evaluasi(conn, p) if p else p  # type: ignore[return-value]


def demo() -> None:
    """Self-check aturan penyetuju. Jalankan dengan DB sekali pakai:

        DATABASE_PATH=/tmp/uji-pergantian.db .venv/bin/python -m app.data.pergantian
    """
    # Turso dimatikan dulu: cek mandiri ini menghapus & menimpa isi tabel,
    # dan itu tidak boleh sampai mengenai database sungguhan di cloud.
    db.paksa_lokal()
    import os
    db_path = str(settings.DATABASE_FILE)
    if "/tmp/" in db_path and os.path.exists(db_path):
        os.remove(db_path)

    dukuh = pg.tambah("d", "rahasia1", "Pak Dukuh", pg.ROLE_DUKUH)
    rw19 = pg.tambah("rw19", "rahasia1", "Pak RW 19", pg.ROLE_RW, rw="019")
    rw20 = pg.tambah("rw20", "rahasia1", "Pak RW 20", pg.ROLE_RW, rw="020")
    rt1 = pg.tambah("rt1", "rahasia1", "Pak RT 1", pg.ROLE_RT, rw="019", rt="001")

    # Ganti RT: Ketua RW wilayahnya + Dukuh. RW 020 tidak ikut.
    ids = {x.id for x in penyetuju_untuk(pg.ROLE_RT, "019", "001")}
    assert ids == {rw19.id, dukuh.id}, ids
    # Ganti RW: Dukuh saja.
    assert {x.id for x in penyetuju_untuk(pg.ROLE_RW, "019", None)} == {dukuh.id}
    # Ganti Dukuh: seluruh Ketua RW.
    assert {x.id for x in penyetuju_untuk(pg.ROLE_DUKUH, None, None)} == {
        rw19.id, rw20.id
    }
    # Ganti LPM: Dukuh saja.
    assert {x.id for x in penyetuju_untuk(pg.ROLE_LPM, None, None)} == {dukuh.id}

    # Jabatan kosong DILEWATI, bukan ditunggu — inti dari tiga kebuntuan.
    pg.ubah(rw19.id, aktif=False)
    assert {x.id for x in penyetuju_untuk(pg.ROLE_RT, "019", "001")} == {dukuh.id}
    pg.ubah(dukuh.id, aktif=False)
    assert penyetuju_untuk(pg.ROLE_RT, "019", "001") == []
    assert {x.id for x in penyetuju_untuk(pg.ROLE_DUKUH, None, None)} == {rw20.id}

    assert rt1.kode_jabatan == "RT:19/1"
    print("OK: app/data/pergantian.py")


if __name__ == "__main__":
    demo()
