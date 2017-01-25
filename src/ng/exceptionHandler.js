'use strict';

/**
 * @ngdoc service
 * @name $exceptionHandler
 * @requires ng.$log
 * @this
 *
 * @description
 * Any uncaught Error in angular expressions is delegated to this service.
 * The default implementation simply delegates to `$log.error` which logs it into
 * the browser console.
 *
 * In unit tests, if `angular-mocks.js` is loaded, this service is overridden by
 * {@link ngMock.$exceptionHandler mock $exceptionHandler} which aids in testing.
 *
 * ## Example:
 *
 * The example below will overwrite the default `$exceptionHandler` in order to (a) log uncaught
 * errors to the backend for later inspection by the developers and (b) to use `$log.warn()` instead
 * of `$log.error()`.
 *
 * ```js
 *   angular.
 *     module('errorOverwrite', []).
 *     factory('$exceptionHandler', ['$log', 'logErrorsToBackend', function($log, logErrorsToBackend) {
 *       return function myErrorHandler(exception, cause) {
 *         logErrorsToBackend(error, cause);
 *         $log.warn(error, cause);
 *       };
 *     }]);
 * ```
 *
 * <hr />
 * Note, that code executed in event-listeners (even those registered using jqLite's `on`/`bind`
 * methods) does not delegate errors to the {@link ng.$exceptionHandler $exceptionHandler}
 * (unless executed during a digest).
 * 
 * Also note, that the service is misnamed '$exceptionHandler' for legacy reasons, because JavaScript
 * has no exceptions: only Errors.
 * If you wish, you can manually delegate exceptions, e.g.
 * `try { ... } catch(e) { $exceptionHandler(e); }`
 *
 * @param {Error} error Error associated with the error.
 * @param {string=} cause Optional information about the context in which
 *       the error was thrown.
 *
 */
function $ExceptionHandlerProvider() {
  this.$get = ['$log', function($log) {
    return function(error, cause) {
      $log.error.apply($log, arguments);
    };
  }];
}
