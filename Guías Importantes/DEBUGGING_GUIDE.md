# Guía Definitiva de Depuración y Checklist Pre-Deploy (TypeScript/Next.js/Thirdweb)

Este documento sirve como un manual de referencia rápida para identificar y solucionar los errores más comunes de `build` y `deploy` que hemos encontrado en el proyecto.

---

## 1. Errores de Tipado de TypeScript (`error TS...`)

Estos errores ocurren cuando los tipos de datos no coinciden. Son los más críticos de resolver.

### 1.1. Incompatibilidad de Tipos (`Type 'A' is not assignable to type 'B'`)

*   **Error Común:** `Type 'string' is not assignable to type '\`0x\${string}\``
    *   **Causa:** Una función o componente espera una dirección con formato estricto (`0x...`), pero recibe un `string` genérico.
    *   **Solución:** Realizar un "type cast" explícito.
        ```typescript
        myFunction({ owner: "0x123..." as `0x${string}` });
        ```

*   **Error Común:** `Type 'string | undefined' is not assignable to type 'string'`
    *   **Causa:** Una propiedad puede ser `undefined` (ej. `logoURI?`), pero el componente que la recibe espera que siempre sea un `string`.
    *   **Solución 1 (Recomendada):** Hacer que la prop del componente receptor también sea opcional.
        ```typescript
        // En la definición del tipo del componente
        interface MyComponentProps {
          logoURI?: string; // Hacerla opcional
        }
        ```
    *   **Solución 2:** Proporcionar un valor por defecto al pasar la prop.
        ```typescriptreact
        <MyComponent logoURI={token.logoURI ?? "/default-image.png"} />
        ```

*   **Error Común:** `Type 'Token | null' is not assignable to type 'Token | undefined'`
    *   **Causa:** Un estado (`useState`) es `null`, pero un hook o componente espera `undefined`.
    *   **Solución:** Usar el operador de coalescencia nula (`??`) al pasar la prop.
        ```typescriptreact
        <MyComponent token={myTokenState ?? undefined} />
        ```

### 1.2. Propiedades Inexistentes (`Property 'X' does not exist on type 'Y'`)

*   **Causa:** Se intenta acceder a una propiedad en un objeto de tipo unión (ej. `UniswapQuote | BridgeQuote`) sin verificar primero de qué tipo es el objeto.
*   **Solución:** Usar "type guards" (funciones de validación de tipo) o la comprobación `in`.
    ```typescript
    // Type guard
    function isBridgeQuote(quote: any): quote is BridgeQuote {
      return quote && 'destinationAmount' in quote;
    }

    if (isBridgeQuote(currentQuote)) {
      // Acceso seguro
      const amount = currentQuote.destinationAmount;
    }
    ```

### 1.3. Nombres no Encontrados (`Cannot find name 'MyType'`)

*   **Causa:** Falta la importación del tipo, interfaz o constante.
*   **Solución:** Añadir la importación correcta al inicio del archivo.
    ```typescript
    import { MyType, MY_CONSTANT } from "@/path/to/definitions";
    ```

---

## 2. Errores de Linter (ESLint / `@typescript-eslint`)

Estos errores se centran en la calidad y seguridad del código. En entornos estrictos como Vercel, detienen el `build`.

### 2.1. Uso de `any` (`@typescript-eslint/no-explicit-any`)

*   **Causa:** Se usa el tipo `any`, lo que desactiva las comprobaciones de TypeScript.
*   **Solución:** Reemplazar `any` por un tipo más específico o, si el tipo es realmente desconocido, usar `unknown` y realizar una comprobación de tipo antes de usar la variable.
    ```typescript
    // Incorrecto
    function process(data: any) { console.log(data.name); }

    // Correcto y seguro
    function process(data: unknown) {
      if (typeof data === 'object' && data !== null && 'name' in data) {
        console.log((data as { name: string }).name);
      }
    }
    ```

### 2.2. Asignaciones Inseguras (`@typescript-eslint/no-unsafe-*`)

*   **Causa:** Es una consecuencia directa de usar `any` o `unknown` sin una validación previa.
*   **Solución:** Tipar correctamente las variables y funciones, y usar "type guards".

### 2.3. Aserciones Innecesarias (`@typescript-eslint/no-unnecessary-type-assertion`)

*   **Causa:** Se usa `!` o `as Type` cuando TypeScript ya sabe que el valor no es nulo o ya tiene ese tipo.
*   **Solución:** Eliminar el `!` o el `as Type` redundante. Usar "guard clauses" para que TypeScript infiera el tipo correctamente.
    ```typescript
    // Incorrecto
    function process(token?: Token) { const address = token!.address; }

    // Correcto
    function process(token?: Token) {
      if (!token) return;
      const address = token.address; // TypeScript ya sabe que no es nulo aquí
    }
    ```

### 2.4. Promesas en Contextos `void` (`@typescript-eslint/no-misused-promises`)

*   **Causa:** Pasar una función `async` directamente a un callback que no espera una promesa, como `setTimeout`.
*   **Solución:** Envolver la llamada `async` en una función anónima.
    ```typescript
    // Incorrecto
    setTimeout(myAsyncFunction, 1000);

    // Correcto
    setTimeout(() => { void myAsyncFunction(); }, 1000);
    ```

---

## 3. Errores Lógicos y de Runtime

Estos no siempre detienen el `build`, pero causan fallos en la aplicación.

### 3.1. `Cannot convert undefined to a BigInt`

*   **Causa:** Se intenta crear una transacción (`sendTransaction`) con un objeto que tiene un campo `value` o `amount` como `undefined`. Generalmente ocurre con cotizaciones expiradas o mal formadas.
*   **Solución:** Validar el objeto de la transacción *antes* de enviarlo.
    ```typescript
    // Dentro de la función que ejecuta el swap
    const validation = validateBridgeTx(tx); // Usar un helper de validación
    if (!validation.ok) {
      toast.error(validation.error);
      return;
    }
    // Solo si la validación pasa, se envía la tx
    await sendTx(tx);
    ```

### 3.2. `Cannot decode zero data ("0x")` en Uniswap

*   **Causa:** Se está consultando un pool de Uniswap V3 que no existe para el par de tokens y la tarifa (`fee`) seleccionados. La causa más común es usar la dirección de un token nativo (ETH, MATIC) en lugar de su versión "wrapped" (WETH, WMATIC/POL).
*   **Solución:**
    1.  **Normalizar Direcciones:** Usar siempre un helper (`normalizeNativeToWrappedAddress`) para convertir los tokens nativos a sus direcciones ERC20 "wrapped" antes de llamar a `getPool` o `quote`.
    2.  **Listas de Tokens Actualizadas:** Obtener la lista de tokens de una fuente dinámica y confiable (ej. `Bridge.tokens` de thirdweb) y usar un "patcher" (`patchTokenList`) para limpiar datos obsoletos y asegurar la presencia de los tokens principales.