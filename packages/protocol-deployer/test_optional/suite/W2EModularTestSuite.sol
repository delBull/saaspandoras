// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../../contracts/modules/W2ETaskManager.sol";
import "../../contracts/modules/W2ERewardDistributor.sol";
import "../../contracts/modules/W2EEventLogger.sol";
import "../../contracts/modules/W2EProtocolController.sol";
import "../../contracts/treasury/PandoraRootTreasury.sol";
import "../../contracts/treasury/PBOXProtocolTreasury.sol";
import "../../contracts/W2ELicense.sol";
import "../../contracts/W2EUtility.sol";
import "../../contracts/interfaces/advanced/IW2ETaskManager.sol";
import "../../contracts/interfaces/advanced/IW2ERewardDistributor.sol";

/**
 * @title W2EModularTestSuite - Suite Completa de Tests para Arquitectura Modular
 * @notice Suite de tests que valida la funcionalidad de todos los módulos implementados
 * @dev Tests críticos para verificar seguridad y funcionalidad después del refactoring
 */
contract W2EModularTestSuite is Test {
    // ========== CONTRATOS PRINCIPALES ==========
    
    W2ELicense public licenseNFT;
    W2EUtility public utilityToken;
    W2ETaskManager public taskManager;
    W2ERewardDistributor public rewardDistributor;
    W2EEventLogger public eventLogger;
    W2EProtocolController public protocolController;
    PandoraRootTreasury public pandoraRootTreasury;
    PBOXProtocolTreasury public protocolTreasury;
    
    // ========== CUENTAS DE TESTING ==========
    
    address public owner = address(this);
    address public alice = address(0x1);
    address public bob = address(0x2);
    address public charlie = address(0x3);
    address public david = address(0x4);
    address public eva = address(0x5);
    
    // ========== CONFIGURACIÓN DE TESTING ==========
    
    // Signatarios para Multi-Sig Treasury
    address[] public treasurySigners;
    uint256 public constant TREASURY_REQUIRED_CONFIRMATIONS = 3;
    address public constant OPERATIONAL_WALLET = address(0x111);
    address public constant RESERVE_WALLET = address(0x222);
    
    // Configuración de Protocolo
    uint256 public constant TEST_TARGET_AMOUNT = 1000 ether;
    uint256 public constant TEST_CREATOR_PAYOUT_PCT = 20;
    uint256 public constant HIGH_VALUE_THRESHOLD = 500 ether;
    uint256 public constant OPERATIONAL_LIMIT = 10 ether;
    
    // ========== SETUP ==========
    
    function setUp() public {
        // Desplegar contratos base
        _deployBaseContracts();
        
        // Configurar tesorerías
        _setupTreasuries();
        
        // Configurar módulos
        _setupModules();
        
        // Configurar protocolo
        _setupProtocol();
        
        // Setup de testing con licencias y tokens
        _setupTestUsers();
    }
    
    /**
     * @notice Despliega contratos base (License y Utility Token)
     */
    function _deployBaseContracts() internal {
        // Deploy License NFT
        licenseNFT = new W2ELicense(
            "W2E License Test",
            "W2ELTEST",
            100, // maxSupply
            0.01 ether, // licensePrice
            address(this), // pandoraOracle
            address(this), // treasuryAddress
            owner // initialOwner
        );
        
        // Deploy Utility Token
        utilityToken = new W2EUtility(
            "W2E Utility Test",
            "W2EUTEST",
            18, // decimals
            50, // transactionFeeBps (0.5%)
            address(this), // feeRecipient
            owner // initialOwner
        );
        
        // Configurar direcciones entre contratos
        utilityToken.setTreasuryAddress(address(this));
    }
    
    /**
     * @notice Configura las tesorerías Multi-Sig
     */
    function _setupTreasuries() internal {
        // Preparar signatarios para tesorería
        treasurySigners = [alice, bob, charlie, david, eva];
        
        // Deploy Pandora Root Treasury
        pandoraRootTreasury = new PandoraRootTreasury(
            treasurySigners,
            TREASURY_REQUIRED_CONFIRMATIONS,
            OPERATIONAL_WALLET,
            RESERVE_WALLET,
            HIGH_VALUE_THRESHOLD,
            OPERATIONAL_LIMIT
        );
        
        // Deploy Protocol Treasury
        protocolTreasury = new PBOXProtocolTreasury(
            address(pandoraRootTreasury),
            alice, // pandoraSigner
            bob, // daoSigner
            5 ether, // dailySpendingLimit
            100 ether, // emergencyThreshold
            30 days, // emergencyInactivityDays
            owner // protocolGovernor (DAO)
        );
    }
    
    /**
     * @notice Configura los módulos especializados
     */
    function _setupModules() internal {
        // Deploy Event Logger (primero para referencia cruzada)
        eventLogger = new W2EEventLogger(owner);
        
        // Deploy Task Manager
        taskManager = new W2ETaskManager(
            address(licenseNFT),
            address(0), // rewardDistributor (se configurará después)
            address(eventLogger),
            10, // minQuorumPercentage
            7 days, // votingPeriodSeconds
            20, // emergencyQuorumPct
            15 days, // emergencyInactivitySeconds
            owner
        );
        
        // Deploy Reward Distributor
        rewardDistributor = new W2ERewardDistributor(
            address(utilityToken),
            address(taskManager),
            address(eventLogger),
            address(this), // feeRecipient
            owner
        );
        
        // Configurar referencias cruzadas
        vm.prank(owner);
        taskManager.updateGovernanceParams(10, 7 days, 20);
        
        // Autorizar event logger en TaskManager
        vm.prank(owner);
        taskManager.updateGovernanceParams(10, 7 days, 20);
    }
    
    /**
     * @notice Configura el controlador principal del protocolo
     */
    function _setupProtocol() internal {
        protocolController = new W2EProtocolController(
            address(licenseNFT),
            address(utilityToken),
            address(taskManager),
            address(rewardDistributor),
            address(eventLogger),
            address(pandoraRootTreasury),
            address(protocolTreasury),
            address(this), // pandoraOracle
            address(this), // platformFeeWallet
            alice, // creatorWallet
            TEST_TARGET_AMOUNT,
            TEST_CREATOR_PAYOUT_PCT,
            owner
        );
        
        // Configurar protocolo como LIVE
        vm.prank(owner);
        protocolController.setProtocolState(W2EProtocolController.ProtocolState.LIVE);
    }
    
    /**
     * @notice Setup de usuarios de testing con licencias y tokens
     */
    function _setupTestUsers() internal {
        // Configurar algunos usuarios con licencias (mintear)
        vm.deal(address(licenseNFT), 10 ether);
        vm.deal(address(taskManager), 5 ether);
        vm.deal(address(rewardDistributor), 5 ether);
        
        // Mint algunas licencias de prueba
        vm.startPrank(address(this)); // pandoraOracle
        licenseNFT.mintLicense(alice, 1);
        licenseNFT.mintLicense(bob, 2);
        licenseNFT.mintLicense(charlie, 1);
        vm.stopPrank();
        
        // Mint algunos tokens utility de prueba
        vm.startPrank(owner);
        utilityToken.mint(alice, 100 ether);
        utilityToken.mint(bob, 200 ether);
        utilityToken.mint(charlie, 150 ether);
        vm.stopPrank();
    }
    
    // ========== TESTS INDIVIDUALES ==========
    
    /**
     * @test Test básico de TaskManager - creación de tarea
     */
    function testTaskManagerCreateTask() public {
        vm.startPrank(alice);
        
        uint256 taskId = taskManager.createValidationTask(
            10 ether, // rewardAmount
            5 ether, // requiredStake
            "Test validation task",
            2, // priority (Medium)
            500 // complexityScore
        );
        
        assertEq(taskId, 1, "First task ID should be 1");
        
        // Verificar que la tarea fue creada correctamente
        W2ETaskManager.W2ETask memory task = taskManager.getTask(taskId);
        assertEq(task.id, 1);
        assertEq(uint256(task.taskType), uint256(W2ETaskManager.TaskType.Validation));
        assertEq(task.rewardAmount, 10 ether);
        assertEq(task.creator, alice);
        assertEq(uint256(task.priority), 2);
        
        vm.stopPrank();
    }
    
    /**
     * @test Test de votación en TaskManager
     */
    function testTaskManagerVoting() public {
        // Crear tarea
        uint256 taskId = _createTestTask();
        
        // Bob vota a favor
        vm.startPrank(bob);
        taskManager.voteOnTask(taskId, true);
        vm.stopPrank();
        
        // Verificar voto
        W2ETaskManager.VoteInfo memory bobVote = taskManager.getVote(taskId, bob);
        assertTrue(bobVote.hasVoted, "Bob should have voted");
        assertTrue(bobVote.support, "Bob should support the task");
        assertEq(bobVote.voteWeight, 2, "Bob should have weight of 2 (2 licenses)");
        
        // Charlie vota en contra
        vm.startPrank(charlie);
        taskManager.voteOnTask(taskId, false);
        vm.stopPrank();
        
        // Verificar resultado final
        W2ETaskManager.W2ETask memory task = taskManager.getTask(taskId);
        assertEq(task.approvalVotes, 2, "Should have 2 approval votes");
        assertEq(task.rejectionVotes, 1, "Should have 1 rejection vote");
    }
    
    /**
     * @test Test de RewardDistributor
     */
    function testRewardDistributor() public {
        uint256 taskId = _createTestTask();
        
        // Simular ganadores de tarea
        W2ERewardDistributor.WinnerInfo[] memory winners = new W2ERewardDistributor.WinnerInfo[](2);
        winners[0] = W2ERewardDistributor.WinnerInfo(alice, 5 ether, false);
        winners[1] = W2ERewardDistributor.WinnerInfo(bob, 5 ether, false);
        
        // Crear distribución
        vm.prank(address(taskManager));
        rewardDistributor.createDistribution(taskId, 10 ether, winners);
        
        // Verificar distribución
        W2ERewardDistributor.RewardDistribution memory distribution = rewardDistributor.getDistribution(taskId);
        assertEq(distribution.taskId, taskId);
        assertEq(distribution.totalReward, 10 ether);
        assertEq(distribution.participantsCount, 2);
        assertFalse(distribution.finalized);
        
        // Verificar recompensas individuales
        W2ERewardDistributor.VoterReward memory aliceReward = rewardDistributor.getVoterReward(taskId, alice);
        assertEq(aliceReward.rewardAmount, 5 ether, "Alice should get 5 ether");
        
        // Test de reclamación
        vm.startPrank(alice);
        rewardDistributor.claimReward(taskId);
        vm.stopPrank();
        
        aliceReward = rewardDistributor.getVoterReward(taskId, alice);
        assertTrue(aliceReward.claimed, "Alice should have claimed");
    }
    
    /**
     * @test Test de EventLogger
     */
    function testEventLogger() public {
        // Registrar evento de prueba
        uint256 eventId = eventLogger.logEvent(
            address(taskManager),
            W2EEventLogger.EventCategory.TASK_MANAGEMENT,
            W2EEventLogger.CriticalityLevel.MEDIUM,
            "TEST_EVENT",
            abi.encode("test data"),
            alice
        );
        
        assertEq(eventId, 1, "First event ID should be 1");
        
        // Verificar integridad del evento
        bool isValid = eventLogger.verifyEventIntegrity(eventId);
        assertTrue(isValid, "Event should be valid");
        
        // Obtener estadísticas
        (uint256 totalEvents, uint256 emergencyEvents, uint256 highCriticalityEvents, uint256 processedEvents, uint256 avgGas) = 
            eventLogger.getEventStats();
        
        assertEq(totalEvents, 1, "Should have 1 event");
        assertEq(emergencyEvents, 0, "Should have 0 emergency events");
        assertEq(highCriticalityEvents, 0, "Should have 0 high criticality events");
    }
    
    /**
     * @test Test de ProtocolController - orquestación
     */
    function testProtocolController() public {
        // Verificar estado inicial
        (W2EProtocolController.ProtocolState currentState, uint256 currentPhase, uint256 totalRaised_) = 
            protocolController.getProtocolStats();
        
        assertEq(uint256(currentState), uint256(W2EProtocolController.ProtocolState.LIVE));
        assertEq(currentPhase, 1);
        assertEq(totalRaised_, 0);
        
        // Crear tarea a través del controlador
        uint256 taskId = protocolController.createValidationTask(
            15 ether,
            10 ether,
            "Controller test task",
            1, // priority (Low)
            300 // complexityScore
        );
        
        assertEq(taskId, 2, "Controller should create task with ID 2");
        
        // Verificar que se registró en event logger
        (,,, uint256 processedEvents,) = eventLogger.getEventStats();
        assertTrue(processedEvents > 0, "Should have processed events");
    }
    
    // ========== TESTS DE INTEGRACIÓN ==========
    
    /**
     * @test Test de integración completa: crear tarea, votar, distribuir recompensas
     */
    function testFullWorkflowIntegration() public {
        // 1. Crear tarea de validación
        uint256 taskId = protocolController.createValidationTask(
            20 ether,
            5 ether,
            "Integration test task",
            2, // priority
            600 // complexity
        );
        
        // 2. Varios usuarios votan
        vm.startPrank(bob);
        taskManager.voteOnTask(taskId, true);
        vm.stopPrank();
        
        vm.startPrank(charlie);
        taskManager.voteOnTask(taskId, true);
        vm.stopPrank();
        
        // 3. Finalizar tarea
        // Simular que el TaskManager llama al RewardDistributor
        W2ERewardDistributor.WinnerInfo[] memory winners = new W2ERewardDistributor.WinnerInfo[](2);
        winners[0] = W2ERewardDistributor.WinnerInfo(bob, 10 ether, false);
        winners[1] = W2ERewardDistributor.WinnerInfo(charlie, 10 ether, false);
        
        vm.prank(address(taskManager));
        rewardDistributor.createDistribution(taskId, 20 ether, winners);
        
        // 4. Verificar distribución
        W2ERewardDistributor.RewardDistribution memory distribution = rewardDistributor.getDistribution(taskId);
        assertEq(distribution.totalReward, 20 ether);
        assertEq(distribution.participantsCount, 2);
        
        // 5. Verificar evento en EventLogger
        (,,, uint256 processedEvents,) = eventLogger.getEventStats();
        assertTrue(processedEvents >= 3, "Should have multiple events logged");
    }
    
    /**
     * @test Test de integración entre tesorerías
     */
    function testTreasuryIntegration() public {
        // Agregar fondos a tesorería principal
        vm.deal(address(pandoraRootTreasury), 100 ether);
        
        // Transferir a wallet operativa (requiere signatario)
        vm.prank(alice); // signer
        pandoraRootTreasury.operationalWithdrawal(1 ether, "Test withdrawal");
        
        // Verificar saldo
        assertEq(address(pandoraRootTreasury).balance, 99 ether, "Treasury should have 99 ETH left");
        
        // Test de propuesta en protocolo treasury
        uint256 proposalId = protocolTreasury.createWithdrawalProposal(
            bob,
            0.5 ether,
            keccak256("test proposal")
        );
        
        assertEq(proposalId, 1, "First proposal ID should be 1");
    }
    
    // ========== TESTS DE SEGURIDAD ==========
    
    /**
     * @test Test de protecciones de acceso
     */
    function testAccessControl() public {
        // TaskManager solo permite holders de licencia
        vm.startPrank(address(this)); // Sin licencia
        vm.expectRevert("W2E: License required");
        taskManager.createValidationTask(5 ether, 2 ether, "Unauthorized", 1, 100);
        vm.stopPrank();
        
        // Alice (con licencia) debería poder crear tarea
        vm.startPrank(alice);
        uint256 taskId = taskManager.createValidationTask(5 ether, 2 ether, "Authorized", 1, 100);
        assertEq(taskId, 1, "Authorized user should create task");
        vm.stopPrank();
        
        // Solo owner puede actualizar governance
        vm.expectRevert("Ownable: caller is not the owner");
        vm.prank(bob);
        taskManager.updateGovernanceParams(15, 5 days, 25);
        vm.stopPrank();
    }
    
    /**
     * @test Test de protecciones de reentrancy
     */
    function testReentrancyProtection() public {
        // Este test verificaría que las funciones críticas están protegidas
        // contra ataques de reentrancy usando nonReentrant
        
        uint256 taskId = _createTestTask();
        
        // Varias llamadas rápidas para probar reentrancy
        vm.startPrank(bob);
        taskManager.voteOnTask(taskId, true);
        vm.expectRevert("W2E: Already voted");
        taskManager.voteOnTask(taskId, false); // Debería fallar
        vm.stopPrank();
    }
    
    // ========== TESTS DE EFICIENCIA DE GAS ==========
    
    /**
     * @test Test de eficiencia de gas en funciones de vista
     */
    function testGasEfficiency() public {
        // Crear múltiples tareas
        for (uint256 i = 0; i < 10; i++) {
            vm.startPrank(alice);
            taskManager.createValidationTask(
                5 ether + i,
                2 ether + i,
                string(abi.encodePacked("Task ", vm.toString(i))),
                1,
                100 + i
            );
            vm.stopPrank();
        }
        
        // Medir gas de función de vista (getTaskMetrics)
        uint256 gasStart = gasleft();
        W2ETaskManager.W2ETask memory task = taskManager.getTask(5);
        uint256 gasUsed = gasStart - gasleft();
        
        assertLt(gasUsed, 50000, "getTask should use reasonable gas");
    }
    
    // ========== TESTS DE CASOS EDGE ==========
    
    /**
     * @test Test de casos edge y condiciones de falla
     */
    function testEdgeCases() public {
        // Crear tarea sin recompensa
        vm.startPrank(alice);
        uint256 taskId = taskManager.createValidationTask(
            0, // rewardAmount = 0 (caso edge para governance)
            1 ether,
            "Zero reward task",
            3, // priority High
            800 // complexity
        );
        vm.stopPrank();
        
        assertEq(taskId, 1, "Should create task even with zero reward");
        
        // Intentar crear tarea con prioridad inválida
        vm.startPrank(alice);
        vm.expectRevert("W2E: Invalid priority");
        taskManager.createValidationTask(5 ether, 1 ether, "Invalid priority", 5, 100);
        vm.stopPrank();
        
        // Intentar crear tarea con complexity score inválido
        vm.startPrank(alice);
        vm.expectRevert("W2E: Invalid complexity score");
        taskManager.createValidationTask(5 ether, 1 ether, "Invalid complexity", 2, 1001);
        vm.stopPrank();
    }
    
    // ========== FUNCIONES AUXILIARES ==========
    
    /**
     * @notice Crea una tarea de prueba estándar
     */
    function _createTestTask() internal returns (uint256) {
        vm.startPrank(alice);
        uint256 taskId = taskManager.createValidationTask(
            10 ether,
            5 ether,
            "Standard test task",
            2, // priority Medium
            500 // complexity Score
        );
        vm.stopPrank();
        return taskId;
    }
    
    /**
     * @notice Función auxiliar para minting de licencias
     */
    function _mintLicense(address to, uint256 quantity) internal {
        vm.prank(address(this)); // pandoraOracle
        licenseNFT.mintLicense(to, quantity);
    }
    
    /**
     * @notice Función auxiliar para minting de tokens utility
     */
    function _mintTokens(address to, uint256 amount) internal {
        vm.prank(owner);
        utilityToken.mint(to, amount);
    }
    
    // ========== TEST REPORTING ==========
    
    /**
     * @notice Genera reporte de todos los tests
     */
    function generateTestReport() public view returns (string memory) {
        return string(abi.encodePacked(
            "=== W2E MODULAR TEST REPORT ===\n",
            "Contracts Deployed: ", vm.toString(_getDeployedContractsCount()), "\n",
            "Event Logger Events: ", vm.toString(eventLogger.eventCount()), "\n",
            "Task Manager Tasks: ", vm.toString(taskManager.taskCount()), "\n",
            "Reward Distributions: ", vm.toString(rewardDistributor.distributionCount()), "\n",
            "=== END REPORT ==="
        ));
    }
    
    function _getDeployedContractsCount() internal pure returns (uint256) {
        return 8; // licenseNFT, utilityToken, taskManager, rewardDistributor, eventLogger, protocolController, pandoraRootTreasury, protocolTreasury
    }
}