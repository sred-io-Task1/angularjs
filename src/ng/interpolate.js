'use strict';

var $interpolateMinErr = minErr('$interpolate');

/**
 * @ngdoc provider
 * @name $interpolateProvider
 * @function
 *
 * @description
 *
 * Used for configuring the interpolation markup. Defaults to `{{` and `}}`.
 *
 * @example
<example module="customInterpolationApp">
<file name="index.html">
<script>
  var customInterpolationApp = angular.module('customInterpolationApp', []);

  customInterpolationApp.config(function($interpolateProvider) {
    $interpolateProvider.startSymbol('//');
    $interpolateProvider.endSymbol('//');
  });


  customInterpolationApp.controller('DemoController', function DemoController() {
      this.label = "This binding is brought you by // interpolation symbols.";
  });
</script>
<div ng-app="App" ng-controller="DemoController as demo">
    //demo.label//
</div>
</file>
<file name="protractor.js" type="protractor">
  it('should interpolate binding with custom symbols', function() {
    expect(element(by.binding('demo.label')).getText()).toBe('This binding is brought you by // interpolation symbols.');
  });
</file>
</example>
 */
function $InterpolateProvider() {
  var startSymbol = '{{';
  var endSymbol = '}}';
  var escapedStartSymbol = '{{{{';
  var escapedEndSymbol = '}}}}';

  /**
   * @ngdoc method
   * @name $interpolateProvider#startSymbol
   * @description
   * Symbol to denote start of expression in the interpolated string. Defaults to `{{`.
   *
   * @param {string=} value new value to set the starting symbol to.
   * @param {string=} escaped the new value to set the escaped starting symbol to.
   * @returns {string|self} Returns the symbol when used as getter and self if used as setter.
   */
  this.startSymbol = function(value, escaped){
    if (value) {
      startSymbol = value;
      if (escaped && escaped !== value) {
        escapedStartSymbol = '' + escaped;
      }
      return this;
    } else {
      return startSymbol;
    }
  };

  /**
   * @ngdoc method
   * @name $interpolateProvider#endSymbol
   * @description
   * Symbol to denote the end of expression in the interpolated string. Defaults to `}}`.
   *
   * @param {string=} value new value to set the ending symbol to.
   * @param {string=} escaped the new value to set the escaped ending symbol to.
   * @returns {string|self} Returns the symbol when used as getter and self if used as setter.
   */
  this.endSymbol = function(value, escaped){
    if (value) {
      endSymbol = value;
      if (escaped && escaped !== value) {
        escapedEndSymbol = '' + escaped;
      }
      return this;
    } else {
      return endSymbol;
    }
  };


  this.$get = ['$parse', '$exceptionHandler', '$sce', function($parse, $exceptionHandler, $sce) {
    var startSymbolLength = startSymbol.length,
        endSymbolLength = endSymbol.length,
        escapedStartLength = escapedStartSymbol.length,
        escapedEndLength = escapedEndSymbol.length,
        similarStartSymbols = escapedStartSymbol.indexOf(startSymbol) === 0;

    /**
     * @ngdoc service
     * @name $interpolate
     * @function
     *
     * @requires $parse
     * @requires $sce
     *
     * @description
     *
     * Compiles a string with markup into an interpolation function. This service is used by the
     * HTML {@link ng.$compile $compile} service for data binding. See
     * {@link ng.$interpolateProvider $interpolateProvider} for configuring the
     * interpolation markup.
     *
     *
     * ```js
     *   var $interpolate = ...; // injected
     *   var exp = $interpolate('Hello {{name | uppercase}}!');
     *   expect(exp({name:'Angular'}).toEqual('Hello ANGULAR!');
     * ```
     *
     * `$interpolate` takes an optional fourth argument, `allOrNothing`. If `allOrNothing` is
     * `true`, the interpolation function will return `undefined` unless all embedded expressions
     * evaluate to a value other than `undefined`.
     *
     * ```js
     *   var $interpolate = ...; // injected
     *   var context = {greeting: 'Hello', name: undefined };
     *
     *   // default "forgiving" mode
     *   var exp = $interpolate('{{greeting}} {{name}}!');
     *   expect(exp(context)).toEqual('Hello !');
     *
     *   // "allOrNothing" mode
     *   exp = $interpolate('{{greeting}} {{name}}!', false, null, true);
     *   expect(exp(context, true)).toBeUndefined();
     *   context.name = 'Angular';
     *   expect(exp(context, true)).toEqual('Hello Angular!');
     * ```
     *
     * `allOrNothing` is useful for interpolating URLs. `ngSrc` and `ngSrcset` use this behavior.
     *
     * @param {string} text The text with markup to interpolate.
     * @param {boolean=} mustHaveExpression if set to true then the interpolation string must have
     *    embedded expression in order to return an interpolation function. Strings with no
     *    embedded expression will return null for the interpolation function.
     * @param {string=} trustedContext when provided, the returned function passes the interpolated
     *    result through {@link ng.$sce#getTrusted $sce.getTrusted(interpolatedResult,
     *    trustedContext)} before returning it.  Refer to the {@link ng.$sce $sce} service that
     *    provides Strict Contextual Escaping for details.
     * @param {boolean=} allOrNothing if `true`, then the returned function returns undefined
     *    unless all embedded expressions evaluate to a value other than `undefined`.
     * @returns {function(context)} an interpolation function which is used to compute the
     *    interpolated string. The function has these parameters:
     *
     * - `context`: evaluation context for all expressions embedded in the interpolated text
     */
    function $interpolate(text, mustHaveExpression, trustedContext, allOrNothing) {
      allOrNothing = !!allOrNothing;
      var startIndex,
          endIndex,
          index = 0,
          separators = [],
          expressions = [],
          parseFns = [],
          textLength = text.length,
          hasInterpolation = false,
          hasText = false,
          exp,
          concat = [],
          lastValuesCache = { values: {}, results: {}},
          escapedStart = -1,
          escapedEnd = -1,
          escaped = true,
          i = -1;

      while(index < textLength) {
        if (i < 0) {
          i = index;
        }

        if (escaped) {
          if ((escapedStart = text.indexOf(escapedStartSymbol, i)) != -1) {
            if ((escapedEnd = text.indexOf(escapedEndSymbol, escapedStart + escapedStartLength))
               != -1) {
              escapedEnd += escapedEndLength;
            } else {
              escaped = false;
            }
          } else {
            escaped = false;
          }
        }

        if (((startIndex = text.indexOf(startSymbol, i)) != -1) &&
             ((endIndex = text.indexOf(endSymbol, startIndex + startSymbolLength)) != -1) &&
             (!escaped || escapedEnd < startIndex || escapedStart > endIndex + endSymbolLength) ) {
          if (escapedEnd < 0 && similarStartSymbols) {
            while (escapedStart >= 0 && startIndex === escapedStart &&
                 text.indexOf(startSymbol, startIndex) === startIndex) {
              startIndex = escapedStart + startSymbolLength;
              escapedStart = text.indexOf(escapedStartSymbol, startIndex + startSymbolLength);
            }
          }
          if (index !== startIndex) hasText = true;
          separators.push(unescape(text.substring(index, startIndex)));
          exp = text.substring(startIndex + startSymbolLength, endIndex);
          expressions.push(exp);
          parseFns.push($parse(exp));
          index = endIndex + endSymbolLength;
          hasInterpolation = true;
          i = -1;
        } else if (escaped && startIndex >= 0 && escapedStart < (endIndex + endSymbolLength)) {
          i = escapedEnd;
        } else {
          // we did not find an interpolation, so we have to add the remainder to the separators array
          if (index !== textLength) {
            hasText = true;
            separators.push(unescape(text.substring(index)));
          }
          break;
        }
      }

      if (separators.length === expressions.length) {
        separators.push('');
      }

      // Concatenating expressions makes it hard to reason about whether some combination of
      // concatenated values are unsafe to use and could easily lead to XSS.  By requiring that a
      // single expression be used for iframe[src], object[src], etc., we ensure that the value
      // that's used is assigned or constructed by some JS code somewhere that is more testable or
      // make it obvious that you bound the value to some user controlled value.  This helps reduce
      // the load when auditing for XSS issues.
      if (trustedContext && hasInterpolation && (hasText || expressions.length > 1)) {
          throw $interpolateMinErr('noconcat',
              "Error while interpolating: {0}\nStrict Contextual Escaping disallows " +
              "interpolations that concatenate multiple expressions when a trusted value is " +
              "required.  See http://docs.angularjs.org/api/ng.$sce", text);
      }

      if (!mustHaveExpression || hasInterpolation) {
        concat.length = separators.length + expressions.length;

        var compute = function(values) {
          for(var i = 0, ii = expressions.length; i < ii; i++) {
            concat[2*i] = separators[i];
            concat[(2*i)+1] = values[i];
          }
          concat[2*ii] = separators[ii];
          return concat.join('');
        };

        var getValue = function (value) {
          if (trustedContext) {
            value = $sce.getTrusted(trustedContext, value);
          } else {
            value = $sce.valueOf(value);
          }

          return value;
        };

        var stringify = function (value) {
          if (value == null) { // null || undefined
            return '';
          }
          switch (typeof value) {
            case 'string': {
              break;
            }
            case 'number': {
              value = '' + value;
              break;
            }
            default: {
              value = toJson(value);
            }
          }

          return value;
        };

        return extend(function interpolationFn(context) {
            var scopeId = (context && context.$id) || 'notAScope';
            var lastValues = lastValuesCache.values[scopeId];
            var lastResult = lastValuesCache.results[scopeId];
            var i = 0;
            var ii = expressions.length;
            var values = new Array(ii);
            var val;
            var inputsChanged = lastResult === undefined ? true: false;


            // if we haven't seen this context before, initialize the cache and try to setup
            // a cleanup routine that purges the cache when the scope goes away.
            if (!lastValues) {
              lastValues = [];
              inputsChanged = true;
              if (context && context.$on) {
                context.$on('$destroy', function() {
                  lastValuesCache.values[scopeId] = null;
                  lastValuesCache.results[scopeId] = null;
                });
              }
            }


            try {
              for (; i < ii; i++) {
                val = getValue(parseFns[i](context));
                if (allOrNothing && isUndefined(val)) {
                  return;
                }
                val = stringify(val);
                if (val !== lastValues[i]) {
                  inputsChanged = true;
                }
                values[i] = val;
              }

              if (inputsChanged) {
                lastValuesCache.values[scopeId] = values;
                lastValuesCache.results[scopeId] = lastResult = compute(values);
              }
            } catch(err) {
              var newErr = $interpolateMinErr('interr', "Can't interpolate: {0}\n{1}", text,
                  err.toString());
              $exceptionHandler(newErr);
            }

            return lastResult;
          }, {
          // all of these properties are undocumented for now
          exp: text, //just for compatibility with regular watchers created via $watch
          separators: separators,
          expressions: expressions
        });
      }
    }


    /**
     * @ngdoc method
     * @name $interpolate#startSymbol
     * @description
     * Symbol to denote the start of expression in the interpolated string. Defaults to `{{`.
     *
     * Use {@link ng.$interpolateProvider#startSymbol $interpolateProvider#startSymbol} to change
     * the symbol.
     *
     * @returns {string} start symbol.
     */
    $interpolate.startSymbol = function() {
      return startSymbol;
    };


    /**
     * @ngdoc method
     * @name $interpolate#endSymbol
     * @description
     * Symbol to denote the end of expression in the interpolated string. Defaults to `}}`.
     *
     * Use {@link ng.$interpolateProvider#endSymbol $interpolateProvider#endSymbol} to change
     * the symbol.
     *
     * @returns {string} end symbol.
     */
    $interpolate.endSymbol = function() {
      return endSymbol;
    };

    function unescape(text) {
      var i = 0, start, end, unescaped = "";
      while (i < text.length) {
        if (((start = text.indexOf(escapedStartSymbol, i)) != -1 &&
            ((end = text.indexOf(escapedEndSymbol, start + escapedStartLength)) != -1))) {
          end = end + escapedEndLength;
          unescaped += text.substring(i, end).
            replace(escapedStartSymbol, startSymbol).
            replace(escapedEndSymbol, endSymbol);
          i = end;
        } else {
          unescaped += text.substring(i);
          break;
        }
      }
      return unescaped;
    }

    return $interpolate;
  }];
}

