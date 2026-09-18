# Ketua LPM Admin-Editable Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let Admin change the name of Ketua LPM through the web app instead of editing `frontend/src/lib/padukuhan.ts` and redeploying.

**Architecture:** One new singleton-row SQLite table (`lpm`) holds the name. It's read through the existing public `/publik/struktur-organisasi` endpoint (add one field) and written through a new ADMIN-only `PATCH /pengurus/lpm` endpoint on the existing `pengurus` router. LPM stays completely outside the `pengurus` table and the pergantian/persetujuan (approval) system — no login, no approval, Admin's write takes effect immediately. On the frontend, the public org chart (`BaganOrganisasi.tsx`) reads the name from the API instead of the hardcoded `LPM` constant, and the admin "Kelola Akun" table gets one extra row with an "Ubah Nama" action.

**Tech Stack:** FastAPI + `sqlite3` stdlib (backend), React + TanStack Query + React Hook Form + Zod (frontend). No new dependencies.

**Spec:** `docs/superpowers/specs/2026-08-31-ketua-lpm-admin-editable-design.md`

## Global Constraints

- No login, no wilayah, no candidate verification, no approval workflow for LPM — Admin's write is final and immediate.
- Empty string means "belum diisi" (vacant) — reuse the existing empty-state handling in `Kotak` (`BaganOrganisasi.tsx`), don't invent a separate vacant state.
- `nama` max length is **100** — must match exactly between backend `Field(max_length=100)` and frontend zod schema (same convention as the existing password-length comment in `features/pengurus/schemas.ts`).
- Every Admin-facing write in this app is logged via `catat_audit` — the LPM write must be too.
- Backend testing in this repo cannot use `fastapi.testclient`/`httpx` (not in `requirements.txt`). Use `python -m app.data.lpm` self-checks for the data layer, and a real `uvicorn` process + stdlib `urllib` for endpoint-level checks, per `CLAUDE.md` §9.
- Frontend has no test runner. Verify pure logic changes don't apply here (no new pure module), so rely on `npm run typecheck && npm run lint && npm run build`.
- Follow `CLAUDE.md` §4 import direction: `features/pengurus` must not import internals of `features/struktur-organisasi` — when invalidating that feature's query, use the raw key literal `['struktur-organisasi']`, not an imported constant.

---

## Task 1: `lpm` table + `app/data/lpm.py`

**Files:**
- Modify: `backend/app/data/db.py` (inside the `SKEMA` string, after the `kunjungan` table, currently ending around line 169)
- Create: `backend/app/data/lpm.py`

**Interfaces:**
- Produces: `nama() -> str` (current LPM name, `""` if never set), `ubah(nama_baru: str) -> str` (persists and returns the new value). Task 3 and Task 4 call these.

- [ ] **Step 1: Add the `lpm` table to the schema**

In `backend/app/data/db.py`, inside the `SKEMA` triple-quoted string, right after the `kunjungan` table block and before the closing `"""`:

```sql
-- Nama Ketua LPM untuk bagan struktur organisasi publik — satu baris
-- tunggal (id selalu 1). LPM bukan salah satu dari empat peran akun, jadi
-- tidak punya baris di `pengurus` dan tidak ikut sistem ganti-jabatan yang
-- disetujui. Lihat `app/data/lpm.py`.
CREATE TABLE IF NOT EXISTS lpm (
    id   INTEGER PRIMARY KEY CHECK (id = 1),
    nama TEXT NOT NULL DEFAULT ''
);
```

- [ ] **Step 2: Write `app/data/lpm.py`**

```python
"""Nama Ketua LPM untuk bagan struktur organisasi publik — satu baris tunggal.

Bukan bagian dari `pengurus`: LPM bukan salah satu dari empat peran akun, jadi
tidak punya login maupun ikut sistem ganti-jabatan yang disetujui (lihat
CLAUDE.md §7 dan §11). Admin mengubahnya langsung, tanpa persetujuan siapa pun.
"""

from app.core.config import settings
from app.data import db


def nama() -> str:
    """Nama Ketua LPM saat ini. String kosong berarti belum diisi."""
    with db.koneksi(settings.DATABASE_FILE) as conn:
        row = conn.execute("SELECT nama FROM lpm WHERE id = 1").fetchone()
        return row["nama"] if row else ""


def ubah(nama_baru: str) -> str:
    """Ganti nama Ketua LPM, kembalikan nilai barunya."""
    with db.koneksi(settings.DATABASE_FILE) as conn:
        conn.execute(
            """
            INSERT INTO lpm (id, nama) VALUES (1, ?)
            ON CONFLICT(id) DO UPDATE SET nama = excluded.nama
            """,
            (nama_baru,),
        )
        conn.commit()
        return nama_baru


def demo() -> None:
    """Self-check. Jalankan:
    DATABASE_PATH=/tmp/uji-lpm.db .venv/bin/python -m app.data.lpm
    """
    assert nama() == "", "DB uji harus mulai kosong"
    assert ubah("Masjkuri") == "Masjkuri"
    assert nama() == "Masjkuri"
    assert ubah("") == "", "mengosongkan lagi harus tetap boleh"
    assert nama() == ""
    print("OK: app/data/lpm.py")


if __name__ == "__main__":
    demo()
```

- [ ] **Step 3: Run the self-check**

Run: `cd backend && rm -f /tmp/uji-lpm.db && DATABASE_PATH=/tmp/uji-lpm.db .venv/bin/python -m app.data.lpm`
Expected: `OK: app/data/lpm.py` printed, exit code 0.

- [ ] **Step 4: Commit**

```bash
git add backend/app/data/db.py backend/app/data/lpm.py
git commit -m "feat(backend): tambah tabel lpm dan modul app.data.lpm"
```

---

## Task 2: `StrukturOrganisasiPublik` gets `lpm`, `/publik/struktur-organisasi` returns it

**Files:**
- Modify: `backend/app/schemas/pengurus.py`
- Modify: `backend/app/api/routers/publik.py`

**Interfaces:**
- Consumes: `app.data.lpm.nama() -> str` (Task 1).
- Produces: `StrukturOrganisasiPublik.lpm: Optional[str]` — Task 5/6 (frontend) mirror this field name exactly in `features/struktur-organisasi/types.ts`.

- [ ] **Step 1: Update `StrukturOrganisasiPublik` and add `LpmUbah`**

In `backend/app/schemas/pengurus.py`, replace the `StrukturOrganisasiPublik` class (it currently ends the file) with:

```python
class StrukturOrganisasiPublik(BaseModel):
    """Bagan pengurus untuk halaman profil publik.

    TANPA username, id, atau status akun — beda dari `JabatanOut` yang
    dipakai Admin. `dukuh`/`rw` diturunkan dari `pengurus.daftar_jabatan()`,
    sumber yang sama dipakai halaman kelola akun. `lpm` datang dari tabel
    terpisah (`app/data/lpm.py`): Ketua LPM bukan salah satu dari empat peran
    akun (ADMIN/DUKUH/RW/RT), jadi tidak punya baris di tabel `pengurus`.
    """

    dukuh: Optional[str] = None
    rw: list[RwPublik] = []
    lpm: Optional[str] = None


class LpmUbah(BaseModel):
    """Ganti nama Ketua LPM. Tanpa Kode Warga: berbeda dari `PengurusBaru`,
    LPM tidak terhubung ke data warga sama sekali, jadi tidak ada yang bisa
    diperiksa selain panjangnya."""

    nama: str = Field(max_length=100)
```

- [ ] **Step 2: Wire it into the public endpoint**

In `backend/app/api/routers/publik.py`, add the import near the other `app.data` imports:

```python
from app.data import lpm as data_lpm
```

Then change the end of `struktur_organisasi_publik()` from:

```python
    return StrukturOrganisasiPublik(
        dukuh=dukuh.pemegang.nama if dukuh and dukuh.pemegang else None,
        rw=[rw_map[rw] for rw in urutan_rw],
    )
```

to:

```python
    return StrukturOrganisasiPublik(
        dukuh=dukuh.pemegang.nama if dukuh and dukuh.pemegang else None,
        rw=[rw_map[rw] for rw in urutan_rw],
        lpm=data_lpm.nama() or None,
    )
```

- [ ] **Step 3: Verify with a real server**

```bash
cd backend
rm -f /tmp/uji-lpm2.db
DATABASE_PATH=/tmp/uji-lpm2.db ADMIN_USERNAME=admin ADMIN_PASSWORD=rahasia123 \
  .venv/bin/uvicorn app.main:app --port 8010 > /tmp/uji-lpm-server.log 2>&1 &
echo $! > /tmp/uji-lpm-server.pid
sleep 2
.venv/bin/python -c "
import urllib.request, json
data = json.load(urllib.request.urlopen('http://127.0.0.1:8010/publik/struktur-organisasi'))
assert 'lpm' in data, data
assert data['lpm'] is None, data
print('OK: lpm field present and null before anyone sets it')
"
kill "$(cat /tmp/uji-lpm-server.pid)"
```

Expected: `OK: lpm field present and null before anyone sets it`.

- [ ] **Step 4: Commit**

```bash
git add backend/app/schemas/pengurus.py backend/app/api/routers/publik.py
git commit -m "feat(backend): sertakan nama Ketua LPM di /publik/struktur-organisasi"
```

---

## Task 3: `PATCH /pengurus/lpm` + audit action

**Files:**
- Modify: `backend/app/core/audit.py`
- Modify: `backend/app/api/routers/pengurus.py`
- Modify: `frontend/src/features/audit/view-model.ts`

**Interfaces:**
- Consumes: `app.data.lpm.nama()` / `.ubah()` (Task 1).
- Produces: `PATCH /pengurus/lpm` — body `{"nama": string}`, ADMIN-only, returns `{"nama": string}`. Task 6 (frontend `pengurusApi.ubahLpm`) calls this exact path/shape.

- [ ] **Step 1: Add the audit action code**

In `backend/app/core/audit.py`, change:

```python
AKSI_AKUN = ("tambah-pengurus", "reset-password")
```

to:

```python
AKSI_AKUN = ("tambah-pengurus", "reset-password", "ubah-lpm")
```

- [ ] **Step 2: Add the human-readable label on the frontend**

In `frontend/src/features/audit/view-model.ts`, in the `AKSI_LABEL` map, add:

```typescript
  'ubah-lpm': 'Mengubah nama Ketua LPM',
```

(right after the `'reset-password': 'Mereset password',` line)

- [ ] **Step 3: Add the endpoint**

In `backend/app/api/routers/pengurus.py`, change:

```python
from app.schemas.pengurus import (
    CalonOut,
    JabatanOut,
    WargaPilihan,
    PasswordBaru,
    PengurusBaru,
    PengurusOut,
)
```

to:

```python
from app.schemas.pengurus import (
    CalonOut,
    JabatanOut,
    LpmUbah,
    WargaPilihan,
    PasswordBaru,
    PengurusBaru,
    PengurusOut,
)
```

and add this import near the other `app.data` imports:

```python
from app.data import lpm as data_lpm
```

Then add the endpoint right after `tambah_pengurus` (the `POST ""` handler) and before `reset_password`:

```python
@router.patch("/lpm")
def ubah_lpm(
    payload: LpmUbah, admin: AuthUser = Depends(current_admin)
) -> dict[str, str]:
    """Ganti nama Ketua LPM. Bukan jabatan berakun — tanpa login, tanpa
    persetujuan siapa pun, beda dari seluruh jabatan lain di router ini.
    Path statis (`lpm`), tidak pernah tertangkap oleh `/{id}/...` di bawahnya.
    """
    lama = data_lpm.nama()
    baru = data_lpm.ubah(payload.nama.strip())
    catat_audit(
        aktor=admin.username,
        aksi="ubah-lpm",
        sasaran="Ketua LPM",
        perubahan=f"{lama or '(kosong)'} → {baru or '(kosong)'}",
    )
    return {"nama": baru}
```

- [ ] **Step 4: Verify end-to-end with a real server**

```bash
cd backend
rm -f /tmp/uji-lpm3.db
DATABASE_PATH=/tmp/uji-lpm3.db ADMIN_USERNAME=admin ADMIN_PASSWORD=rahasia123 \
  .venv/bin/uvicorn app.main:app --port 8011 > /tmp/uji-lpm3-server.log 2>&1 &
echo $! > /tmp/uji-lpm3-server.pid
sleep 2
.venv/bin/python -c "
import urllib.request, json

def req(method, path, body=None, token=None):
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(
        f'http://127.0.0.1:8011{path}', data=data, method=method,
        headers={'Content-Type': 'application/json',
                 **({'Authorization': f'Bearer {token}'} if token else {})},
    )
    with urllib.request.urlopen(r) as resp:
        return json.load(resp)

token = req('POST', '/auth/login', {'username': 'admin', 'password': 'rahasia123'})['token']
out = req('PATCH', '/pengurus/lpm', {'nama': 'Masjkuri'}, token=token)
assert out == {'nama': 'Masjkuri'}, out
struktur = req('GET', '/publik/struktur-organisasi')
assert struktur['lpm'] == 'Masjkuri', struktur
print('OK: PATCH /pengurus/lpm sets the name and /publik/struktur-organisasi reflects it')
"
kill "$(cat /tmp/uji-lpm3-server.pid)"
```

Expected: `OK: PATCH /pengurus/lpm sets the name and /publik/struktur-organisasi reflects it`.

(Bootstrap admin has `harusGantiPassword` unset for a fresh DB with `ADMIN_USERNAME`/`ADMIN_PASSWORD`, so login succeeds without a forced password change — same as every other manual backend check in this repo, per `CLAUDE.md` §9.)

- [ ] **Step 5: Commit**

```bash
git add backend/app/core/audit.py backend/app/api/routers/pengurus.py frontend/src/features/audit/view-model.ts
git commit -m "feat(backend): PATCH /pengurus/lpm, ADMIN-only, tercatat di audit"
```

---

## Task 4: Frontend read side — `struktur-organisasi` type + public org chart

**Files:**
- Modify: `frontend/src/features/struktur-organisasi/types.ts`
- Modify: `frontend/src/pages/publik/profil/components/BaganOrganisasi.tsx`
- Modify: `frontend/src/lib/padukuhan.ts`

**Interfaces:**
- Consumes: `GET /publik/struktur-organisasi` now returning `lpm: string | null` (Task 2).
- Produces: `StrukturOrganisasiPublik.lpm: string | null` on the frontend type — Task 6 does not need this (it reads the same field via the same hook), but keep the name in sync with the backend schema from Task 2.

- [ ] **Step 1: Add `lpm` to the frontend type**

In `frontend/src/features/struktur-organisasi/types.ts`, change:

```typescript
export interface StrukturOrganisasiPublik {
  dukuh: string | null;
  rw: RwPublik[];
}
```

to:

```typescript
export interface StrukturOrganisasiPublik {
  dukuh: string | null;
  rw: RwPublik[];
  lpm: string | null;
}
```

- [ ] **Step 2: Read `struktur.lpm` in the org chart instead of the hardcoded constant**

In `frontend/src/pages/publik/profil/components/BaganOrganisasi.tsx`, remove this import:

```typescript
import { LPM } from '@/lib/padukuhan';
```

and change:

```tsx
                <div className="w-56">
                  <Kotak label={LPM.jabatan} nama={LPM.nama} putus />
                </div>
```

to:

```tsx
                <div className="w-56">
                  <Kotak label="Ketua LPM" nama={struktur.lpm} putus />
                </div>
```

Also update the component's doc comment. Change:

```
 * Dukuh & RW/RT dari `/publik/struktur-organisasi` — sumber yang sama dipakai
 * halaman kelola akun Admin, jadi pergantian jabatan yang disetujui otomatis
 * terlihat di sini tanpa deploy ulang. LPM tetap konstanta manual
 * (`lib/padukuhan.ts`): ketuanya bukan salah satu dari empat peran akun, jadi
 * tidak ikut sistem ganti-jabatan.
```

to:

```
 * Dukuh, RW/RT, & LPM semuanya dari `/publik/struktur-organisasi` — sumber
 * yang sama dipakai halaman kelola akun Admin, jadi pergantian jabatan yang
 * disetujui dan perubahan nama Ketua LPM otomatis terlihat di sini tanpa
 * deploy ulang. LPM tetap bukan salah satu dari empat peran akun, jadi tidak
 * ikut sistem ganti-jabatan yang disetujui — hanya sumber datanya yang kini
 * sama dengan yang lain.
```

- [ ] **Step 3: Remove the now-unused constant**

In `frontend/src/lib/padukuhan.ts`, delete the `LPM` export and its doc comment block:

```typescript
/**
 * Lembaga Permusyawaratan Masyarakat. Berada di bawah Dukuh tapi TIDAK
 * membawahi RW/RT — di bagan digambar dengan garis putus-putus (koordinasi),
 * bukan garis lurus (komando).
 *
 * Konstanta manual, BUKAN dari `useStrukturOrganisasi()` seperti Dukuh/RW/RT:
 * Ketua LPM bukan salah satu dari empat peran akun (ADMIN/DUKUH/RW/RT), jadi
 * tidak punya baris di tabel `pengurus` dan tidak ikut sistem ganti-jabatan
 * yang disetujui. Ganti nilainya langsung di sini kalau ketuanya berganti.
 */
export const LPM = { jabatan: 'Ketua LPM', nama: 'Masjkuri' } as const;
```

- [ ] **Step 4: Typecheck**

Run: `cd frontend && npm run typecheck`
Expected: no errors (confirms no other file still imports `LPM`).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/struktur-organisasi/types.ts frontend/src/pages/publik/profil/components/BaganOrganisasi.tsx frontend/src/lib/padukuhan.ts
git commit -m "feat(frontend): bagan publik baca nama Ketua LPM dari API"
```

---

## Task 5: Frontend write side — `pengurusApi.ubahLpm` + `useUbahLpm`

**Files:**
- Modify: `frontend/src/features/pengurus/schemas.ts`
- Modify: `frontend/src/features/pengurus/api/pengurus-api.ts`
- Modify: `frontend/src/features/pengurus/hooks/use-pengurus.ts`

**Interfaces:**
- Consumes: `PATCH /pengurus/lpm` (Task 3).
- Produces: `pengurusApi.ubahLpm(nama: string): Promise<{ nama: string }>`, `useUbahLpm()` mutation hook, `namaLpmSchema` / `NamaLpmFormValues`. Task 6 (the dialog) uses all three.

- [ ] **Step 1: Add the zod schema**

In `frontend/src/features/pengurus/schemas.ts`, add at the end:

```typescript
/**
 * Ganti nama Ketua LPM. Batas 100 karakter harus sama dengan
 * `Field(max_length=100)` di `backend/app/schemas/pengurus.py` (`LpmUbah`).
 * Boleh kosong: string kosong berarti jabatan ditandai "Belum diisi", bukan
 * error input.
 */
export const namaLpmSchema = z.object({
  nama: z.string().trim().max(100, 'Maksimal 100 karakter'),
});
export type NamaLpmFormValues = z.infer<typeof namaLpmSchema>;
```

- [ ] **Step 2: Add the API method**

In `frontend/src/features/pengurus/api/pengurus-api.ts`, add `ubahLpm` to the `PengurusApi` interface:

```typescript
export interface PengurusApi {
  daftarJabatan(): Promise<Jabatan[]>;
  tambah(payload: PengurusBaru): Promise<Pengurus>;
  resetPassword(id: string, password: string): Promise<void>;
  /** Ketua LPM bukan jabatan berakun — tidak ada `id`, hanya nama. */
  ubahLpm(nama: string): Promise<{ nama: string }>;
}
```

and the implementation:

```typescript
  async ubahLpm(nama) {
    const { data } = await apiClient.patch<{ nama: string }>('/pengurus/lpm', {
      nama,
    });
    return data;
  },
```

- [ ] **Step 3: Add the mutation hook**

In `frontend/src/features/pengurus/hooks/use-pengurus.ts`, add at the end:

```typescript
/**
 * Menyegarkan `/publik/struktur-organisasi` lewat key literalnya, BUKAN
 * `strukturOrganisasiKeys` yang diekspor `features/struktur-organisasi`:
 * fitur ini tidak boleh mengimpor internal fitur lain (CLAUDE.md §4).
 */
export function useUbahLpm() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (nama: string) => pengurusApi.ubahLpm(nama),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['struktur-organisasi'] });
    },
  });
}
```

- [ ] **Step 4: Typecheck**

Run: `cd frontend && npm run typecheck`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/pengurus/schemas.ts frontend/src/features/pengurus/api/pengurus-api.ts frontend/src/features/pengurus/hooks/use-pengurus.ts
git commit -m "feat(frontend): pengurusApi.ubahLpm + useUbahLpm"
```

---

## Task 6: Kelola Akun — LPM row + `UbahLpmDialog`

**Files:**
- Create: `frontend/src/features/pengurus/components/UbahLpmDialog.tsx`
- Modify: `frontend/src/features/pengurus/components/DaftarJabatanView.tsx`
- Modify: `frontend/src/pages/admin/pengurus/PengurusPage.tsx`

**Interfaces:**
- Consumes: `useUbahLpm()`, `namaLpmSchema`/`NamaLpmFormValues` (Task 5); `useStrukturOrganisasi()` from `features/struktur-organisasi/hooks/use-struktur-organisasi` (already exists, used read-only here — this is a page-level import, not a feature-to-feature import, so it doesn't violate CLAUDE.md §4).

- [ ] **Step 1: Write `UbahLpmDialog.tsx`**

```tsx
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { pesanError } from '@/lib/utils';
import { useUbahLpm } from '../hooks/use-pengurus';
import { namaLpmSchema, type NamaLpmFormValues } from '../schemas';

interface UbahLpmDialogProps {
  open: boolean;
  /** Nama saat ini, buat prefill. `null`/kosong berarti belum diisi. */
  namaSaatIni: string | null;
  onClose: () => void;
}

/**
 * Ganti nama Ketua LPM. Beda dari dialog jabatan lain di fitur ini: tanpa
 * pencarian warga, tanpa username/password — LPM tidak terhubung ke data
 * warga maupun tabel `pengurus` sama sekali (CLAUDE.md §11).
 */
export function UbahLpmDialog({
  open,
  namaSaatIni,
  onClose,
}: UbahLpmDialogProps) {
  const ubah = useUbahLpm();

  const {
    register,
    handleSubmit,
    reset: resetForm,
    formState: { errors },
  } = useForm<NamaLpmFormValues>({
    resolver: zodResolver(namaLpmSchema),
    defaultValues: { nama: namaSaatIni ?? '' },
  });

  useEffect(() => {
    if (open) resetForm({ nama: namaSaatIni ?? '' });
  }, [open, namaSaatIni, resetForm]);

  const onSubmit = handleSubmit((values) => {
    ubah.mutate(values.nama, { onSuccess: onClose });
  });

  return (
    <Modal open={open} onClose={onClose} title="Ubah Nama Ketua LPM">
      <form onSubmit={onSubmit} className="space-y-4">
        <Input
          label="Nama"
          error={errors.nama?.message}
          {...register('nama')}
        />
        {ubah.error && (
          <Alert tone="error">
            {pesanError(ubah.error, 'Gagal mengubah nama Ketua LPM.')}
          </Alert>
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" isLoading={ubah.isPending}>
            Simpan
          </Button>
        </div>
      </form>
    </Modal>
  );
}
```

- [ ] **Step 2: Add the LPM row to `DaftarJabatanView`**

In `frontend/src/features/pengurus/components/DaftarJabatanView.tsx`, add two props to `DaftarJabatanViewProps`:

```typescript
  /** `undefined` selagi struktur organisasi belum selesai dimuat. */
  lpmNama: string | null | undefined;
  onUbahLpm: () => void;
```

and destructure them in the function signature alongside the existing props. Then, right after the closing `))}` of `{daftar.map((j) => (...))}` and before `</tbody>`, add one more static row:

```tsx
                {/* Bukan bagian dari `daftar.map`: LPM tidak punya baris di
                    tabel `pengurus`, jadi bukan `Jabatan` — datanya lewat
                    prop terpisah (`lpmNama`/`onUbahLpm`), bukan array ini. */}
                <tr className="border-t-2 border-slate-200 bg-slate-50/40 transition-colors hover:bg-slate-50/80">
                  <Td className="font-semibold text-slate-900">Ketua LPM</Td>
                  <Td className="font-medium text-slate-800">
                    {lpmNama ? (
                      lpmNama
                    ) : (
                      <span className="font-normal text-slate-400">—</span>
                    )}
                  </Td>
                  <Td className="text-sm text-slate-400">—</Td>
                  <Td className="text-sm text-slate-400">—</Td>
                  <Td>
                    <Button size="sm" variant="secondary" onClick={onUbahLpm}>
                      Ubah Nama
                    </Button>
                  </Td>
                </tr>
```

- [ ] **Step 3: Wire it up in `PengurusPage.tsx`**

In `frontend/src/pages/admin/pengurus/PengurusPage.tsx`, add imports:

```typescript
import { UbahLpmDialog } from '@/features/pengurus/components/UbahLpmDialog';
import { useStrukturOrganisasi } from '@/features/struktur-organisasi/hooks/use-struktur-organisasi';
```

Add state and the query inside the component, alongside the existing `useState` calls:

```typescript
  const struktur = useStrukturOrganisasi();
  const [lpmDialogOpen, setLpmDialogOpen] = useState(false);
```

Pass the two new props to `DaftarJabatanView`:

```tsx
        lpmNama={struktur.data?.lpm}
        onUbahLpm={() => setLpmDialogOpen(true)}
```

And render the dialog alongside the other three:

```tsx
      <UbahLpmDialog
        open={lpmDialogOpen}
        namaSaatIni={struktur.data?.lpm ?? null}
        onClose={() => setLpmDialogOpen(false)}
      />
```

- [ ] **Step 4: Typecheck, lint, build**

Run: `cd frontend && npm run typecheck && npm run lint && npm run build`
Expected: all three succeed with 0 errors.

- [ ] **Step 5: Manual check in the browser**

With the backend running (`.venv/bin/uvicorn app.main:app --reload --port 8000` with a real `.env`) and `npm run dev`:
1. Log in as Admin, open Kelola Akun — confirm a "Ketua LPM" row appears at the bottom of Daftar Akun with an "Ubah Nama" button.
2. Click it, type a name, save — confirm the dialog closes and the row updates without a page reload.
3. Open `/profil` in a new tab (no login) — confirm the LPM box in the org chart shows the same name.
4. Open Riwayat Edit as Admin — confirm an entry "Mengubah nama Ketua LPM" appears.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/features/pengurus/components/UbahLpmDialog.tsx frontend/src/features/pengurus/components/DaftarJabatanView.tsx frontend/src/pages/admin/pengurus/PengurusPage.tsx
git commit -m "feat(frontend): baris Ketua LPM di Kelola Akun dengan dialog ubah nama"
```
