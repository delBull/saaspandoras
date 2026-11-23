# Firma de la sala y vista de operador

Fecha: 23 nov 2026.

## 1. Bug encontrado antes de que firmara un cliente

El cliente armaba el mensaje de firma con la **empresa del firmante** como "Parte":

```ts
buildSignMessage({ ..., counterparty: companyVal || dynamicPartyName })
```

El servidor lo reconstruye con `room.counterparty`. Si el firmante escribía su empresa
(lo normal en B2B), los dos mensajes diferían y `verifySignature` devolvía **falso**:
la firma se rechazaba con "Firma inválida".

Además, si el firmante dejaba la empresa vacía, `companyVal` caía en `room.company`
(el **emisor** del documento: AZTECAZ o Marco), así que el mensaje y el registro de
firma atribuían al cliente la empresa del prestador.

**Corrección**

- El mensaje se arma con `counterparty: room.counterparty` y
  `dealCounterparty: room.counterparty`, igual que el servidor.
- Si el firmante no escribe empresa, se usa `room.counterparty` (nunca `room.company`).

**Verificación**

```
mensaje cliente === mensaje servidor (simple y combinado): true
firma con cuenta de prueba + verifyMessage: true
```

El mensaje firmado queda así:

```
Pandora's Nexus · Aceptación Verificada
Room: PDR-EDITORIAL
Documento: CONTRACT
Parte: Keeper Consulting and Management
Firmante: luispguardado@gmail.com
Nombre: Luis P. Guardado, en representación de Keeper Consulting and Management, S.A. de C.V. (Representante Legal)
```

## 2. Riesgos que quedan (verificar en producción)

| Punto | Estado |
|---|---|
| `verifySignature` de thirdweb (servidor) | Verificado con viem localmente; en producción usa thirdweb con `NEXT_PUBLIC_THIRDWEB_CLIENT_ID` (presente) |
| Login del cliente | `inAppWallet` habilitado: puede entrar con correo (OTP) sin instalar wallet |
| Firma del NDA (Village) | Mensaje propio (`buildNdaSignMessage`) con los mismos 4 campos en cliente y servidor |
| Magic link | Token de 7 días, un solo uso; requiere `NEXUS_DEAL_TOKEN_SECRET` (presente) |
| Firma real de Luis | **No ejercitada**: requiere su correo y su wallet. Primera prueba real |

## 3. Vista de operador (solo lectura)

Antes: no había forma de que el operador viera una sala sin quedar registrado como
firmante (y por tanto obligado a firmar). `?preview=true` dependía de una sesión de
servidor que no se establece al navegar.

Ahora, desde **OPS HUB → DEAL PODS**, cada sala tiene el botón **"Ver PDR-…"**:

```
POST /api/nexus/pods/[id]/preview  { publicId }
  → requiere propietario/SUPER_ADMIN y que la sala pertenezca al pod
  → JWT tipo "deal_preview", 10 minutos
  → https://…/deal/<publicId>?pv=<token>
```

En la sala:

- se desbloquea el contenido,
- **no** aparece el panel de firma,
- **no** se muestran comentarios ni anexos,
- aviso visible: "Vista de operador · solo lectura".

Seguridad:

- el token tiene 10 minutos y tipo propio: `verifyDealToken()` lo rechaza, así que no
  sirve para firmar ni para pedir magic links;
- un token alterado no verifica;
- no escribe nada en la base.
