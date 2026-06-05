# Protocolo de Liquidación Híbrida (Pandoras Growth OS)

## 1. El Problema del Doble Gasto (Real World Assets)
En la digitalización de activos reales, existe un riesgo inherente al permitir pagos "Off-Chain" (Transferencias Bancarias) y "On-Chain" (Criptoactivos). Sin un sistema de sincronización, dos inversores podrían adquirir el mismo título simultáneamente, uno mediante el banco y otro mediante USDT.

## 2. Solución: Arquitectura de Reserva y Liquidación
Pandoras implementa un protocolo de tres capas para garantizar la integridad del inventario:

### 2.1 Capa de Reserva (Virtual Soft-Lock)
Cuando un inversor inicia el proceso "Fast Lane" mediante transferencia bancaria (CLABE), el sistema genera un **Soft-Lock** en la base de datos de Pandoras.
- **Efecto**: Las unidades seleccionadas se restan del inventario público inmediatamente.
- **Fórmula de Disponibilidad**: `Disponible = Límite_Fase - Ventas_Blockchain - Reservas_Pendientes_Banco`.
- **Expiración**: El Soft-Lock tiene una vigencia de 7 días naturales. Si el pago no es conciliado en este periodo, las unidades regresan automáticamente al pool público.

### 2.2 Capa de Identidad Automática (Social Login)
Gracias a la integración con **Thirdweb**, los inversores que utilizan su correo o redes sociales reciben una wallet inmutable (EOA).
- El sistema asocia la intención de compra directamente a esta identidad digital.
- El inversor no requiere conocimientos técnicos ni manejo de llaves privadas para asegurar su posición.

### 2.3 Capa de Liquidación (Hard-Settlement)
Una vez que el dueño del proyecto confirma la recepción de fondos en su cuenta bancaria, se procede a la liquidación:
1. **Validación**: El administrador aprueba la transacción en el Dashboard de Fundador.
2. **Sello Digital**: Se genera un Hash SHA-256 (Integridad tipo NOM-151) que vincula legalmente la transacción fiat con el título digital.
3. **Sincronización Blockchain**: El administrador firma una transacción que emite (mint) o transfiere los títulos directamente a la wallet del inversor.

## 3. Transparencia y Auditoría
Cualquier usuario puede verificar el estado de la oferta total consultando el API de Estado del Proyecto, el cual consolida la "Verdad de la Blockchain" con la "Verdad de la Reserva Bancaria", eliminando cualquier ambigüedad sobre la escasez del activo.
