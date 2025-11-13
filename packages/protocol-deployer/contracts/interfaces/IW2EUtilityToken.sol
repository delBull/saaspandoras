// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IW2EUtilityToken - Interfaz para token de utilidad W2E
 * @notice Define el contrato mínimo para desacoplamiento de dependencias
 */
interface IW2EUtilityToken {
    /**
     * @notice Acuña nuevos tokens
     * @param to Dirección destinataria
     * @param amount Cantidad a acuñar
     */
    function mint(address to, uint256 amount) external;
    
    /**
     * @notice Quema tokens
     * @param amount Cantidad a quemar
     */
    function burn(uint256 amount) external;
    
    /**
     * @notice Quema tokens de un usuario específico
     * @param from Dirección desde donde quemar
     * @param amount Cantidad a quemar
     */
    function burnFrom(address from, uint256 amount) external;
    
    /**
     * @notice Quema tokens con validación adicional
     * @param from Dirección desde donde quemar
     * @param amount Cantidad a quemar
     */
    function burnFromWithValidation(address from, uint256 amount) external;
    
    /**
     * @notice Obtiene el balance de una dirección
     * @param account Dirección a consultar
     * @return Cantidad de tokens
     */
    function balanceOf(address account) external view returns (uint256);
    
    /**
     * @notice Transfiere tokens
     * @param to Dirección destinataria
     * @param amount Cantidad a transferir
     * @return True si exitoso
     */
    function transfer(address to, uint256 amount) external returns (bool);
    
    /**
     * @notice Transfiere tokens desde una dirección
     * @param from Dirección origen
     * @param to Dirección destino
     * @param amount Cantidad a transferir
     * @return True si exitoso
     */
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    
    /**
     * @notice Obtiene información de staking de un usuario
     * @param user Dirección del usuario
     * @return amount Monto staked, startTime Inicio del stake, lockPeriod Periodo de lock, active Si está activo
     */
    function getStakeInfo(address user) external view returns (uint256 amount, uint256 startTime, uint256 lockPeriod, bool active);
    
    /**
     * @notice Stake tokens para participar en validación/votación
     * @param amount Cantidad a stakear
     * @param lockPeriod Periodo de lock en segundos
     */
    function stake(uint256 amount, uint256 lockPeriod) external;
    
    /**
     * @notice Unstake tokens después del periodo de lock
     */
    function unstake() external;
    
    /**
     * @notice Verifica si un usuario puede hacer unstake
     * @param user Dirección del usuario
     * @return True si puede hacer unstake
     */
    function canUnstake(address user) external view returns (bool);
}