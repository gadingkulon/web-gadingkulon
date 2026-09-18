from fastapi import FastAPI, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.api.routers import (
    audit,
    auth,
    berita,
    infografis,
    lokasi,
    padukuhan,
    penduduk,
    pergantian,
    pengurus,
    publik,
)
from app.core.config import settings
from app.data.berita import migrasi_foto_ke_disk
from app.data.lokasi import seed_bawaan as seed_titik_lokasi
from app.data.pengurus import bootstrap
from app.data.pengurus import daftar as daftar_pengurus
from app.data.store import semua_penduduk

app = FastAPI(title="SIGALON API", description="Data penduduk dari pendataan Excel — lihat CLAUDE.md §11")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=settings.UPLOADS_DIR), name="uploads")
app.mount("/api/uploads", StaticFiles(directory=settings.UPLOADS_DIR), name="api_uploads")


@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc: HTTPException) -> JSONResponse:
    """`{"message": ...}`, bukan default `{"detail": ...}` FastAPI — samakan
    dengan bentuk yang dibaca interceptor axios di `lib/api-client.ts`.

    `headers` ikut diteruskan: tanpa itu `Retry-After` pada 429 hilang, dan
    yang tersisa cuma pesan teks.
    """
    return JSONResponse(
        status_code=exc.status_code,
        content={"message": exc.detail},
        headers=exc.headers,
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc: RequestValidationError) -> JSONResponse:
    """Payload yang tidak lolos skema juga dijawab `{"message": ...}`."""
    galat = exc.errors()[0]
    # `loc` berbentuk ("body", "judul"); yang berguna bagi pembaca kolomnya.
    kolom = ".".join(str(bagian) for bagian in galat["loc"][1:])
    pesan = galat.get("msg", "Data yang dikirim tidak sah")
    return JSONResponse(
        status_code=422,
        content={"message": f"{kolom}: {pesan}" if kolom else pesan},
    )


app.include_router(penduduk.router)
app.include_router(publik.router)
app.include_router(auth.router)
app.include_router(infografis.router)
app.include_router(pengurus.router)
app.include_router(pergantian.router)
app.include_router(audit.router)
app.include_router(berita.router)
app.include_router(padukuhan.router)
app.include_router(lokasi.router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.on_event("startup")
def _startup() -> None:
    """Bootstrap akun ADMIN pertama, lalu ringkasan keadaan data."""
    bootstrap()
    migrasi_foto_ke_disk()
    seed_titik_lokasi()
    print("=== SIGALON backend ===")
    print(f"  Akun pengurus: {len(daftar_pengurus())} akun terdaftar")
    jumlah = len(semua_penduduk())
    if jumlah:
        print(f"  Data penduduk: {jumlah} jiwa terbaca dari DB")
    else:
        print("  Data penduduk: KOSONG — impor dulu dengan ./import-excel.sh")
    print("=====================")
