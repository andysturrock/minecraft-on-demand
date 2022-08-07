const bool isProduction = true; //bool.fromEnvironment('dart.vm.product');

/// Class to store environment (ie dev, prod) versions of variables.
/// TODO make much more flexible and configurable.
class Env {
  static envName() {
    return isProduction ? 'Production' : 'Test';
  }

  static getServerStatusUri() {
    return isProduction
        ? 'https://api.minecraft.goatsinlace.com/0_0_1/instanceState'
        : 'https://api.minecraft.dev.goatsinlace.com/0_0_1/instanceState';
  }
}
