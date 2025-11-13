// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IW2ELicense - Interfaz para contratos de licencias W2E
 * @notice Define el contrato mínimo para desacoplamiento de dependencias
 */
interface IW2ELicense {
    /**
     * @notice Obtiene el balance de licencias de una dirección
     * @param account Dirección a consultar
     * @return Cantidad de licencias
     */
    function balanceOf(address account) external view returns (uint256);
    
    /**
     * @notice Obtiene el poder de voto (igual al balance de licencias)
     * @param account Dirección a consultar
     * @return Número de votos
     */
    function getVotes(address account) external view returns (uint256);
    
    /**
     * @notice Obtiene el total de licencias minteadas
     * @return Total minteado
     */
    function totalMinted() external view returns (uint256);
    
    /**
     * @notice Registra el uso de una licencia
     * @param tokenId ID de la licencia
     */
    function recordLicenseUsage(uint256 tokenId) external;
    
    /**
     * @notice Obtiene la fase actual
     * @return Fase actual
     */
    function phaseId() external view returns (uint256);
    
    /**
     * @notice Obtiene estadísticas de fases
     * @return currentPhase Fase actual, totalPhases Total de fases
     */
    function getPhaseStats() external view returns (uint256 currentPhase, uint256 totalPhases);
}