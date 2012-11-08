'use strict';

describe('ngShow / ngHide', function() {
  var element;


  afterEach(function() {
    dealoc(element);
  });

  describe('ngShow', function() {
    it('should show and hide an element', inject(function($rootScope, $compile) {
      element = jqLite('<div ng-show="exp"></div>');
      element = $compile(element)($rootScope);
      $rootScope.$digest();
      expect(isCssVisible(element)).toEqual(false);
      $rootScope.exp = true;
      $rootScope.$digest();
      expect(isCssVisible(element)).toEqual(true);
    }));


    it('should make hidden element visible', inject(function($rootScope, $compile) {
      element = jqLite('<div style="display: none" ng-show="exp"></div>');
      element = $compile(element)($rootScope);
      expect(isCssVisible(element)).toBe(false);
      $rootScope.exp = true;
      $rootScope.$digest();
      expect(isCssVisible(element)).toBe(true);
    }));

    it('should preserve the display type', inject(function($rootScope, $compile) {
      element = jqLite('<div style="display: table;" ng-show="exp"></div>');
      element = $compile(element)($rootScope);
      $rootScope.$digest();
      expect(element.css('display')).toEqual('none');
      $rootScope.exp = true;
      $rootScope.$digest();
      expect(element.css('display')).toEqual('table');
    }));
  });

  describe('ngHide', function() {
    it('should hide an element', inject(function($rootScope, $compile) {
      element = jqLite('<div ng-hide="exp"></div>');
      element = $compile(element)($rootScope);
      expect(isCssVisible(element)).toBe(true);
      $rootScope.exp = true;
      $rootScope.$digest();
      expect(isCssVisible(element)).toBe(false);
    }));

    it('should preserve the display type', inject(function($rootScope, $compile) {
      element = jqLite('<div style="display: table;" ng-hide="exp"></div>');
      element = $compile(element)($rootScope);
      $rootScope.$digest();
      expect(element.css('display')).toEqual('table');
      $rootScope.exp = true;
      $rootScope.$digest();
      expect(element.css('display')).toEqual('none');
    }));
  });
});
