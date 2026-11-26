# Dictado por voz en el chat de Nexus

> El micrófono del canal directo graba, transcribe y deja el texto en el input
> para revisarlo antes de enviar. La inferencia es **local** (Ollama con un
> modelo de audio). No hay proveedor externo.

## Flujo

```
navegador (MediaRecorder)  →  POST /api/nexus/chat/transcribe  →  Ollama /api/chat
        audio                         (sesión Nexus)                lfm3-audio
          ↑                                                            │
          └──────────────── texto transcrito (revisar y enviar) ───────┘
```

## Variables de entorno

| Variable | Default | Notas |
|---|---|---|
| `TRANSCRIBE_BASE_URL` | `OLLAMA_BASE_URL` → `http://127.0.0.1:11434` | servidor de inferencia |
| `TRANSCRIBE_MODEL` | `lfm3-audio` | modelo de audio de Ollama |
| `TRANSCRIBE_API_KEY` | `OLLAMA_API_KEY` | se manda como `Authorization: Bearer` |
| `TRANSCRIBE_TIMEOUT_MS` | `45000` | un Ollama colgado no deja la petición abierta |

## Cómo se le pasa el audio a Ollama (lo que no está documentado)

Ollama **no tiene API de audio**. El truco, confirmado contra el servidor real:

1. el clip se convierte a **WAV 16 kHz mono PCM 16-bit con cabecera RIFF**,
2. se base64-encodea,
3. se manda en **`images[]` dentro del mensaje** (no en la raíz del payload):

```json
POST /api/chat
{
  "model": "lfm3-audio",
  "stream": false,
  "options": { "temperature": 0 },
  "messages": [{
    "role": "user",
    "content": "Transcribe el audio exactamente como se dice, en español...",
    "images": ["<base64 del WAV>"]
  }]
}
```

Ollama detecta los bytes `RIFF`/`WAVE` y los enruta al encoder de audio del
modelo. Si el campo va en la raíz, se ignora en silencio y el modelo contesta
"el audio está vacío".

**Prueba real** (MacBook, 26 nov 2026, clip de 10 s):

```
audio   : "Hola Marco, esta es una prueba con el modelo de audio de Ollama.
           El puente de Instagram manda WhatsApp con el código de atribución."
modelo  : lfm3-audio · 1.93 s
```

El navegador graba `webm/opus` (Safari `mp4`), así que la conversión a WAV se
hace **en el cliente** con WebAudio (`lib/nexus/wav.ts`): en Vercel no hay
`ffmpeg` ni CPU para remuestrear por petición.

## Por qué `lfm3-audio` y no los "whisper" del registro

Verificado el 2026-11-26:

| Modelo | Qué es en realidad |
|---|---|
| `library/lfm3-audio` | 2B, capacidad **`audio`**, 18 idiomas (incluye español). ✅ |
| `dimavz/whisper-tiny` (44 MB) | GGUF inválido: `error loading model: unknown model architecture: ''` |
| `karanchopda333/whisper` (2.0 GB) | **Llama 3.2 3B** renombrado (la ficha lo dice: contexto 128K, tool calling) |

El catálogo público de **Ollama Cloud** (25 modelos) no incluye ningún modelo de
audio, así que esta función es necesariamente local.

## Dónde correrlo

| Host | Sirve | Por qué |
|---|---|---|
| MacBook (workstation) | sí, pero **se apaga** | sólo para pruebas |
| Mac Mini (i7-8700B, 16 GB) | sí | un modelo de audio de 2B ocupa ~2 GB de RAM; un LLM de 14B no cabe con holgura |

### Exponerlo a Vercel (seguro)

Vercel **no puede** alcanzar `100.95.252.5` (IP de Tailscale, no enrutable desde
la nube). El Mini ya tiene Tailscale Funnel activo
(`https://bullss-mac-mini.taild7a2e2.ts.net`), así que se publica el puerto de
Ollama en un path propio y se protege con API key:

```bash
# en el Mini
ollama pull lfm3-audio
tailscale funnel --bg --set-path /audio 11434      # añade el path sin tocar el resto

# en Vercel (producción)
TRANSCRIBE_BASE_URL=https://bullss-mac-mini.taild7a2e2.ts.net/audio
TRANSCRIBE_MODEL=lfm3-audio
TRANSCRIBE_API_KEY=<clave que exige el proxy>
```

Reglas de seguridad que no se negocian:

1. **API key obligatoria** en el path público: sin ella, cualquiera puede quemar
   CPU del Mini.
2. La ruta de Next exige **sesión Nexus** antes de tocar el servidor.
3. Límite de 25 MB y timeout de 45 s.
4. El audio **no se persiste**; el log sólo registra tamaño y estado.

## Estados de la ruta

| Código | `error` | Significado |
|---|---|---|
| 401 | `UNAUTHORIZED` | sin sesión Nexus |
| 400 | `MISSING_AUDIO` / `EMPTY_AUDIO` | nada grabado |
| 413 | `AUDIO_TOO_LARGE` | > 25 MB |
| 502 | `MODEL_NOT_FOUND` | falta `ollama pull lfm3-audio` |
| 502 | `TRANSCRIPTION_FAILED` | el modelo falló |
| 502 | `EMPTY_TRANSCRIPTION` | no se entendió el audio |
| 504 | `TRANSCRIPTION_TIMEOUT` | el Mini no respondió a tiempo |
| 504 | `PROVIDER_UNREACHABLE` | Mini apagado o Funnel caído |

## Estado de "en la nube"

El catálogo público de **Ollama Cloud** (`GET https://ollama.com/api/tags`)
devuelve 25 modelos y **ninguno tiene audio**: glm-5.3, kimi-k2.7, gpt-oss,
gemma4:31b… todos texto. Verificado el 2026-11-26.

Consecuencias:

- `lfm3-audio` **no** está disponible en la suscripción cloud: es local.
- `gemma4:31b` (el modelo de producción de S'Narai) declara un encoder de audio
  en el spec de Ollama (`gemma4.audio.*`), pero eso no implica que la versión
  servida en la nube acepte audio; hay que probarlo con la API key real.
- Si la nube no lo sirve, la única forma de mantenerlo "siempre encendido" es el
  Mac Mini (16 GB) con el modelo local y el Funnel con API key.
