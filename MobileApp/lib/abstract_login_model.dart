/// Abstract base class for LoginModel.
/// Useful because it allows different implementations, eg for testing.
abstract class AbstractLoginModel {
  String? getAccessToken();
  Future<void> signInWithAutoCodeExchange();
  Future<void> signOut();
  get loggedIn;
}
