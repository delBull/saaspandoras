// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title W2EEventLogger - Sistema Centralizado de Eventos y Trazabilidad
 * @notice Contrato modular para registrar y centralizar todos los eventos del protocolo W2E
 * @dev Permite auditoría completa y análisis off-chain de la actividad del protocolo
 */
contract W2EEventLogger is Ownable, ReentrancyGuard {
    // ========== CONFIGURACIÓN ==========
    
    /// @notice Direcciones autorizadas para escribir eventos
    mapping(address => bool) public authorizedLoggers;
    
    /// @notice Categorías de eventos soportadas
    enum EventCategory {
        TASK_MANAGEMENT,
        VOTING,
        REWARDS,
        GOVERNANCE,
        TREASURY,
        LICENSE,
        UTILITY_TOKEN,
        EMERGENCY,
        SYSTEM
    }
    
    /// @notice Niveles de criticidad de eventos
    enum CriticalityLevel {
        LOW,
        MEDIUM,
        HIGH,
        CRITICAL,
        EMERGENCY
    }
    
    // ========== ESTRUCTURAS DE EVENTOS ==========
    
    /// @notice Evento centralizado con metadatos completos
    struct ProtocolEvent {
        uint256 eventId;
        address sourceContract;
        EventCategory category;
        CriticalityLevel criticality;
        string eventType;
        bytes data;
        address actor;
        uint256 timestamp;
        uint256 blockNumber;
        uint256 gasUsed;
        bool processed;
    }
    
    /// @notice Estadísticas de eventos por categoría
    struct CategoryStats {
        uint256 totalEvents;
        uint256 highCriticalityEvents;
        uint256 lastEventTime;
        uint256 averageBlockTime;
    }
    
    // ========== STORAGE ==========
    
    /// @notice Contador de eventos
    uint256 public eventCount;
    
    /// @notice Eventos registrados
    mapping(uint256 => ProtocolEvent) public events;
    
    /// @notice Estadísticas por categoría
    mapping(EventCategory => CategoryStats) public categoryStats;
    
    /// @notice Índice de eventos por dirección (gas optimization)
    mapping(address => uint256[]) public eventsByAddress;
    
    /// @notice Índice de eventos por bloque
    mapping(uint256 => uint256[]) public eventsByBlock;
    
    /// @notice Hash de eventos para verificación de integridad
    mapping(uint256 => bytes32) public eventHashes;
    
    /// @notice Estadísticas globales
    uint256 public totalGasUsed;
    uint256 public averageEventGas;
    uint256 public lastBlockWithEvent;
    
    // ========== EVENTOS ==========
    
    event EventLogged(
        uint256 indexed eventId,
        address indexed sourceContract,
        EventCategory indexed category,
        CriticalityLevel criticality,
        string eventType,
        address actor,
        uint256 timestamp
    );
    
    event EventProcessed(uint256 indexed eventId, address indexed processor);
    event LoggerAuthorized(address indexed logger, bool authorized);
    event StatsUpdated(EventCategory indexed category, uint256 newTotal, uint256 newHighCriticality);
    event EmergencyEventLogged(uint256 indexed eventId, string reason, address indexed reporter);
    
    // ========== CONSTRUCTOR ==========
    
    constructor(address initialOwner) Ownable() {
        // Autorizar contratos principales por defecto
        authorizedLoggers[msg.sender] = true;
        
        // Inicializar estadísticas
        for (uint256 i = 0; i <= uint256(type(EventCategory).max); i++) {
            categoryStats[EventCategory(i)].totalEvents = 0;
            categoryStats[EventCategory(i)].highCriticalityEvents = 0;
        }
    }
    
    // ========== MODIFICADORES ==========
    
    modifier onlyAuthorizedLogger() {
        require(authorizedLoggers[msg.sender], "W2E: Not authorized logger");
        _;
    }
    
    // ========== FUNCIONES PRINCIPALES ==========
    
    /**
     * @notice Registra un evento en el sistema centralizado
     * @param sourceContract Contrato que origina el evento
     * @param category Categoría del evento
     * @param criticality Nivel de criticidad
     * @param eventType Tipo de evento (string descriptivo)
     * @param data Datos adicionales del evento
     * @param actor Dirección que ejecuta la acción
     * @return eventId ID del evento registrado
     */
    function registerEvent(
        address sourceContract,
        EventCategory category,
        CriticalityLevel criticality,
        string calldata eventType,
        bytes calldata data,
        address actor
    ) external onlyAuthorizedLogger nonReentrant returns (uint256) {
        require(sourceContract != address(0), "W2E: Invalid contract");
        require(bytes(eventType).length > 0, "W2E: Invalid event type");
        require(actor != address(0), "W2E: Invalid actor");
        
        eventCount++;
        uint256 currentEventId = eventCount;
        
        // Crear evento
        events[currentEventId] = ProtocolEvent({
            eventId: currentEventId,
            sourceContract: sourceContract,
            category: category,
            criticality: criticality,
            eventType: eventType,
            data: data,
            actor: actor,
            timestamp: block.timestamp,
            blockNumber: block.number,
            gasUsed: gasleft(),
            processed: false
        });
        
        // Generar hash de integridad
        eventHashes[currentEventId] = keccak256(abi.encodePacked(
            currentEventId,
            sourceContract,
            category,
            criticality,
            eventType,
            actor,
            block.timestamp,
            block.number
        ));
        
        // Actualizar índices
        _updateIndexes(currentEventId, actor);
        
        // Actualizar estadísticas
        _updateStats(category, criticality);
        
        // Emitir evento
        emit EventLogged(currentEventId, sourceContract, category, criticality, eventType, actor, block.timestamp);
        
        return currentEventId;
    }
    
    /**
     * @notice Registra evento de emergencia
     */
    function logEmergencyEvent(
        address sourceContract,
        string calldata reason,
        bytes calldata data,
        address reporter
    ) external onlyAuthorizedLogger nonReentrant returns (uint256) {
        require(bytes(reason).length > 0, "W2E: Invalid reason");
        
        uint256 eventId = this.registerEvent(
            sourceContract,
            EventCategory.EMERGENCY,
            CriticalityLevel.EMERGENCY,
            "EMERGENCY_EVENT",
            abi.encode(reason, data),
            reporter
        );
        
        emit EmergencyEventLogged(eventId, reason, reporter);
        
        return eventId;
    }
    
    /**
     * @notice Marca evento como procesado
     */
    function markEventProcessed(uint256 eventId) external onlyAuthorizedLogger {
        require(eventId <= eventCount, "W2E: Event does not exist");
        require(!events[eventId].processed, "W2E: Event already processed");
        
        events[eventId].processed = true;
        emit EventProcessed(eventId, msg.sender);
    }
    
    // ========== FUNCIONES DE ANÁLISIS ==========
    
    /**
     * @notice Obtiene eventos por rango de IDs
     */
    function getEventsByRange(uint256 startId, uint256 endId) external view returns (ProtocolEvent[] memory) {
        require(startId <= endId, "W2E: Invalid range");
        require(endId <= eventCount, "W2E: End ID exceeds total events");
        
        uint256 count = endId - startId + 1;
        ProtocolEvent[] memory result = new ProtocolEvent[](count);
        
        for (uint256 i = 0; i < count; i++) {
            result[i] = events[startId + i];
        }
        
        return result;
    }
    
    /**
     * @notice Obtiene eventos por dirección
     */
    function getEventsByAddress(address targetAddress, uint256 limit) external view returns (ProtocolEvent[] memory) {
        uint256[] storage eventIds = eventsByAddress[targetAddress];
        uint256 actualLimit = limit == 0 ? eventIds.length : (limit < eventIds.length ? limit : eventIds.length);
        
        ProtocolEvent[] memory result = new ProtocolEvent[](actualLimit);
        
        for (uint256 i = 0; i < actualLimit; i++) {
            result[i] = events[eventIds[eventIds.length - 1 - i]]; // Más recientes primero
        }
        
        return result;
    }
    
    /**
     * @notice Obtiene eventos por categoría
     */
    function getEventsByCategory(EventCategory category, uint256 limit) external view returns (ProtocolEvent[] memory) {
        // TODO: Implementar índices por categoría para eficiencia
        // Por ahora, búsqueda secuencial (no eficiente para grandes volúmenes)
        
        uint256 maxResults = limit == 0 ? 100 : limit;
        ProtocolEvent[] memory result = new ProtocolEvent[](maxResults);
        uint256 resultCount = 0;
        
        for (uint256 i = eventCount; i > 0 && resultCount < maxResults; i--) {
            if (events[i].category == category) {
                result[resultCount] = events[i];
                resultCount++;
            }
        }
        
        // Redimensionar array si es necesario
        if (resultCount < maxResults) {
            ProtocolEvent[] memory resized = new ProtocolEvent[](resultCount);
            for (uint256 i = 0; i < resultCount; i++) {
                resized[i] = result[i];
            }
            return resized;
        }
        
        return result;
    }
    
    /**
     * @notice Obtiene estadísticas de eventos
     */
    function getEventStats() external view returns (
        uint256 totalEvents,
        uint256 emergencyEvents,
        uint256 highCriticalityEvents,
        uint256 processedEvents,
        uint256 averageGasPerEvent
    ) {
        totalEvents = eventCount;
        emergencyEvents = categoryStats[EventCategory.EMERGENCY].totalEvents;
        
        uint256 totalHighCriticality = 0;
        for (uint256 i = 0; i <= uint256(type(EventCategory).max); i++) {
            totalHighCriticality += categoryStats[EventCategory(i)].highCriticalityEvents;
        }
        highCriticalityEvents = totalHighCriticality;
        
        uint256 processedCount = 0;
        for (uint256 i = 1; i <= eventCount; i++) {
            if (events[i].processed) {
                processedCount++;
            }
        }
        processedEvents = processedCount;
        
        averageGasPerEvent = eventCount > 0 ? totalGasUsed / eventCount : 0;
    }
    
    /**
     * @notice Obtiene estadísticas por categoría
     */
    function getCategoryStats(EventCategory category) external view returns (CategoryStats memory) {
        return categoryStats[category];
    }
    
    /**
     * @notice Verifica integridad de un evento
     */
    function verifyEventIntegrity(uint256 eventId) external view returns (bool) {
        require(eventId <= eventCount, "W2E: Event does not exist");
        
        ProtocolEvent memory eventData = events[eventId];
        bytes32 computedHash = keccak256(abi.encodePacked(
            eventData.eventId,
            eventData.sourceContract,
            eventData.category,
            eventData.criticality,
            eventData.eventType,
            eventData.actor,
            eventData.timestamp,
            eventData.blockNumber
        ));
        
        return eventHashes[eventId] == computedHash;
    }
    
    // ========== FUNCIONES DE GESTIÓN ==========
    
    /**
     * @notice Autoriza/desautoriza un logger
     */
    function setLoggerAuthorization(address logger, bool authorized) external onlyOwner {
        authorizedLoggers[logger] = authorized;
        emit LoggerAuthorized(logger, authorized);
    }
    
    /**
     * @notice Limpia eventos antiguos (para ahorrar gas en consultas)
     */
    function pruneOldEvents(uint256 keepLastNEvents) external onlyOwner {
        require(keepLastNEvents < eventCount, "W2E: Invalid prune amount");
        
        uint256 eventsToPrune = eventCount - keepLastNEvents;
        
        for (uint256 i = 1; i <= eventsToPrune; i++) {
            // Limpiar índices pero mantener hash para verificación
            delete eventsByAddress[events[i].actor];
            delete eventsByBlock[events[i].blockNumber];
            // Mantener eventHashes[i] para integridad
            delete events[i];
        }
        
        _logEvent("EVENTS_PRUNED", abi.encode(eventsToPrune, keepLastNEvents));
    }
    
    /**
     * @notice Resetea todas las estadísticas (solo para testing)
     */
    function resetStats() external onlyOwner {
        eventCount = 0;
        totalGasUsed = 0;
        averageEventGas = 0;
        lastBlockWithEvent = 0;
        
        for (uint256 i = 0; i <= uint256(type(EventCategory).max); i++) {
            categoryStats[EventCategory(i)].totalEvents = 0;
            categoryStats[EventCategory(i)].highCriticalityEvents = 0;
            categoryStats[EventCategory(i)].lastEventTime = 0;
            categoryStats[EventCategory(i)].averageBlockTime = 0;
        }
    }
    
    // ========== FUNCIONES AUXILIARES ==========
    
    /**
     * @notice Actualiza índices para eficiencia de consultas
     */
    function _updateIndexes(uint256 eventId, address actor) internal {
        eventsByAddress[actor].push(eventId);
        eventsByBlock[block.number].push(eventId);
        lastBlockWithEvent = block.number;
        
        totalGasUsed += gasleft();
        averageEventGas = totalGasUsed / eventCount;
    }
    
    /**
     * @notice Actualiza estadísticas
     */
    function _updateStats(EventCategory category, CriticalityLevel criticality) internal {
        CategoryStats storage stats = categoryStats[category];
        stats.totalEvents++;
        stats.lastEventTime = block.timestamp;
        
        if (uint256(criticality) >= uint256(CriticalityLevel.HIGH)) {
            stats.highCriticalityEvents++;
        }
        
        emit StatsUpdated(category, stats.totalEvents, stats.highCriticalityEvents);
    }
    
    /**
     * @notice Registra evento interno para operaciones del propio EventLogger
     */
    function _logEvent(string memory eventType, bytes memory data) internal {
        // Solo registrar si no estamos ya registrando este evento
        // Evitar recursión infinita - el EventLogger no se autoriza a sí mismo
        if (msg.sender != address(this)) {
            // Emitir evento básico sin pasar por el sistema completo
            emit EventLogged(0, address(this), EventCategory.SYSTEM, CriticalityLevel.LOW, eventType, msg.sender, block.timestamp);
        }
    }
    
    // ========== FUNCIONES DE RECEIVED ==========
    
    /**
     * @notice Permite recibir ETH para operaciones de mantenimiento
     */
    receive() external payable {
        // ETH recibido para mantenimiento del sistema de eventos
    }
    
    /**
     * @notice Retira ETH acumulados
     */
    function withdrawEth(address payable recipient, uint256 amount) external onlyOwner {
        require(recipient != address(0), "W2E: Invalid recipient");
        require(amount <= address(this).balance, "W2E: Insufficient balance");
        
        (bool success,) = recipient.call{value: amount}("");
        require(success, "W2E: Withdrawal failed");
        
        _logEvent("ETH_WITHDRAWN", abi.encode(recipient, amount));
    }
}