const isProduction = true;

export class Env {
  static envName() {
    return isProduction ? 'Production' : 'Test';
  }

  static getServerStatusUri() {
    return isProduction
      ? 'https://api.minecraft.goatsinlace.com/0_0_1/instanceState'
      : 'https://api.minecraft.dev.goatsinlace.com/0_0_1/instanceState';
  }
}