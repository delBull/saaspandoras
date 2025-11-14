function readPackage(pkg, context) {
  // Solo para el paquete protocol-deployer, forzamos ethers v6
  if (pkg.name === '@pandoras/protocol-deployer') {
    // Aseguramos que ethers v6 esté disponible
    pkg.dependencies = pkg.dependencies || {};
    pkg.dependencies.ethers = '6.8.1';

    // Mantenemos @types/node v20 para compatibilidad del deployer
    pkg.devDependencies = pkg.devDependencies || {};
    pkg.devDependencies['@types/node'] = '^20.8.10';

    // Removemos cualquier referencia a ethers v5
    if (pkg.dependencies['ethers'] && pkg.dependencies['ethers'].startsWith('5.')) {
      delete pkg.dependencies['ethers'];
    }
  }

  return pkg;
}

module.exports = {
  hooks: {
    readPackage
  }
};
