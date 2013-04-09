'use strict';

describe("$animator", function() {

  var element;

  afterEach(function(){
    dealoc(element);
  });

  describe("enable / disable", function() {

    it("should disable and enable the animations", inject(function($animator) {
      expect($animator.isEnabled()).toBe(true);

      $animator.disable();
      expect($animator.isDisabled()).toBe(true);
      expect($animator.isEnabled()).toBe(false);

      $animator.enable();
      expect($animator.isDisabled()).toBe(false);
      expect($animator.isEnabled()).toBe(true);
    }));

    it("should broadcast the $animationDisabled and animationEnabled events upon toggle", inject(function($rootScope, $animator) {
      var enabled = false, disabled = false;;
      $rootScope.$on('$animationDisabled', function() {
        disabled = true;
      });
      $rootScope.$on('$animationEnabled', function() {
        enabled = true;
      });

      $animator.disable();
      expect(disabled).toBe(true);

      disabled = false;
      $animator.disable();
      expect(disabled).toBe(false);

      $animator.enable();
      expect(enabled).toBe(true);

      enabled = false;
      $animator.enable();
      expect(enabled).toBe(false);
    }));

  });

  describe("without animation", function() {
    var window, animator;

    beforeEach(function() {
      module(function($animationProvider, $provide) {
        $provide.value('$window', window = angular.mock.createMockWindow());
      })
      inject(function($animator, $compile, $rootScope) {
        animator = $animator($rootScope, {});
        element = $compile('<div></div>')($rootScope);
      })
    });

    it("should add element at the start of enter animation", inject(function($animator, $compile, $rootScope) {
      var child = $compile('<div></div>')($rootScope);
      expect(element.contents().length).toBe(0);
      animator.enter(child, element);
      expect(element.contents().length).toBe(1);
    }));

    it("should remove the element at the end of leave animation", inject(function($animator, $compile, $rootScope) {
      var child = $compile('<div></div>')($rootScope);
      element.append(child);
      expect(element.contents().length).toBe(1);
      animator.leave(child, element);
      expect(element.contents().length).toBe(0);
    }));

    it("should reorder the move animation", inject(function($animator, $compile, $rootScope) {
      var child1 = $compile('<div>1</div>')($rootScope);
      var child2 = $compile('<div>2</div>')($rootScope);
      element.append(child1);
      element.append(child2);
      expect(element.text()).toBe('12');
      animator.move(child1, element, child2);
      expect(element.text()).toBe('21');
    }));

    it("should animate the show animation event", inject(function($animator, $compile, $rootScope) {
      element.css('display','none');
      expect(element.css('display')).toBe('none');
      animator.show(element);
      expect(element[0].style.display).toBe('');
    }));

    it("should animate the hide animation event", inject(function($animator, $compile, $rootScope) {
      element.css('display','block');
      expect(element.css('display')).toBe('block');
      animator.hide(element);
      expect(element.css('display')).toBe('none');
    }));

    it("should still perform DOM operations even if animations are disabled", inject(function($animator, $rootScope) {
      $animator.disable();
      element.css('display','block');
      expect(element.css('display')).toBe('block');
      animator.hide(element);
      expect(element.css('display')).toBe('none');
    }));
  });

  describe("with polyfill", function() {

    var child, after, window, animator;

    beforeEach(function() {
      module(function($animationProvider, $provide) {
        $provide.value('$window', window = angular.mock.createMockWindow());
        $animationProvider.register('custom', function() {
          return {
            start: function(element, done) {
              done();
            }
          }
        });
       $animationProvider.register('setup-memo', function() {
          return {
            setup: function(element) {
              return "memento";
            },
            start: function(element, done, memento) {
              element.text(memento);
              done();
            }
          }
        });
      })
      inject(function($animator, $compile, $rootScope) {
        element = $compile('<div></div>')($rootScope);
        child   = $compile('<div></div>')($rootScope);
        after   = $compile('<div></div>')($rootScope);
      });
    })

    it("should animate the enter animation event", inject(function($animator, $rootScope) {
      animator = $animator($rootScope, {
        ngAnimate : '{enter: \'custom\'}'
      });
      expect(element.contents().length).toBe(0);
      animator.enter(child, element);
      window.setTimeout.expect(1).process();
    }));

    it("should animate the leave animation event", inject(function($animator, $rootScope) {
      animator = $animator($rootScope, {
        ngAnimate : '{leave: \'custom\'}'
      });
      element.append(child);
      expect(element.contents().length).toBe(1);
      animator.leave(child, element);
      window.setTimeout.expect(1).process();
      expect(element.contents().length).toBe(0);
    }));

    it("should animate the move animation event", inject(function($animator, $compile, $rootScope) {
      animator = $animator($rootScope, {
        ngAnimate : '{move: \'custom\'}'
      });
      var child1 = $compile('<div>1</div>')($rootScope);
      var child2 = $compile('<div>2</div>')($rootScope);
      element.append(child1);
      element.append(child2);
      expect(element.text()).toBe('12');
      animator.move(child1, element, child2);
      expect(element.text()).toBe('21');
      window.setTimeout.expect(1).process();
    }));

    it("should animate the show animation event", inject(function($animator, $rootScope) {
      animator = $animator($rootScope, {
        ngAnimate : '{show: \'custom\'}'
      });
      element.css('display','none');
      expect(element.css('display')).toBe('none');
      animator.show(element);
      expect(element[0].style.display).toBe('');
      window.setTimeout.expect(1).process();
      expect(element[0].style.display).toBe('');
    }));

    it("should animate the hide animation event", inject(function($animator, $rootScope) {
      animator = $animator($rootScope, {
        ngAnimate : '{hide: \'custom\'}'
      });
      element.css('display','block');
      expect(element.css('display')).toBe('block');
      animator.hide(element);
      expect(element.css('display')).toBe('block');
      window.setTimeout.expect(1).process();
      expect(element.css('display')).toBe('none');
    }));

    it("should assign the ngAnimate string to all events if a string is given",
        inject(function($animator, $sniffer, $rootScope) {
      if (!$sniffer.supportsTransitions) return;
      animator = $animator($rootScope, {
        ngAnimate : '"custom"'
      });

      //enter
      animator.enter(child, element);
      expect(child.attr('class')).toContain('custom-enter-setup');
      window.setTimeout.expect(1).process();
      expect(child.attr('class')).toContain('custom-enter-start');
      window.setTimeout.expect(0).process();

      //leave
      element.append(after);
      animator.move(child, element, after);
      expect(child.attr('class')).toContain('custom-move-setup');
      window.setTimeout.expect(1).process();
      expect(child.attr('class')).toContain('custom-move-start');
      window.setTimeout.expect(0).process();

      //hide
      animator.hide(child);
      expect(child.attr('class')).toContain('custom-hide-setup');
      window.setTimeout.expect(1).process();
      expect(child.attr('class')).toContain('custom-hide-start');
      window.setTimeout.expect(0).process();

      //show
      animator.show(child);
      expect(child.attr('class')).toContain('custom-show-setup');
      window.setTimeout.expect(1).process();
      expect(child.attr('class')).toContain('custom-show-start');
      window.setTimeout.expect(0).process();

      //leave
      animator.leave(child);
      expect(child.attr('class')).toContain('custom-leave-setup');
      window.setTimeout.expect(1).process();
      expect(child.attr('class')).toContain('custom-leave-start');
      window.setTimeout.expect(0).process();
    }));

    it("should run polyfillSetup and return the memento", inject(function($animator, $rootScope) {
      animator = $animator($rootScope, {
        ngAnimate : '{show: \'setup-memo\'}'
      });
      expect(element.text()).toEqual('');
      animator.show(element);
      window.setTimeout.expect(1).process();
      expect(element.text()).toBe('memento');
    }));

    it("should not run if animations are disabled", inject(function($animator, $rootScope) {
      $animator.disable();

      animator = $animator($rootScope, {
        ngAnimate : '{show: \'setup-memo\'}'
      });
      element.text('123');
      expect(element.text()).toBe('123');
      animator.show(element);
      expect(element.text()).toBe('123');

      $animator.enable();

      animator.show(element);
      window.setTimeout.expect(1).process();
      expect(element.text()).toBe('memento');
    }));
  });

  describe("with css3", function() {
    var window, animator, prefix, vendorPrefix;

    beforeEach(function() {
      module(function($animationProvider, $provide) {
        $provide.value('$window', window = angular.mock.createMockWindow());
        return function($sniffer) {
          vendorPrefix = '-' + $sniffer.vendorPrefix + '-';
        };
      })
    });

    it("should skip animations if disabled and run when enabled", inject(function($animator, $rootScope, $compile) {
      $animator.disable();
      element = $compile('<div style="transition: 1s linear all">1</div>')($rootScope);
      var animator = $animator($rootScope, {
        ngAnimate : '{show: \'inline-show\'}'
      });

      element.css('display','none');
      expect(element.css('display')).toBe('none');
      animator.show(element);
      expect(element.css('display')).toBe('');

      $animator.enable();

      element.css('display','none');
      expect(element.css('display')).toBe('none');

      animator.show(element);
      window.setTimeout.expect(1).process();
      window.setTimeout.expect(1000).process();
      expect(element.css('display')).toBe('');
    }));
  });

  it("should throw an error when an invalid ng-animate syntax is provided", inject(function($compile, $rootScope) {
    expect(function() {
      element = $compile('<div ng-repeat="i in is" ng-animate=":"></div>')($rootScope);
    }).toThrow("Syntax Error: Token ':' not a primary expression at column 1 of the expression [:] starting at [:].");
  }));
});
