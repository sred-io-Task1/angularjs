'use strict';

describe('$formFactory', function(){

  var rootScope;
  var formFactory;

  beforeEach(function(){
    rootScope = angular.scope();
    formFactory = rootScope.$service('$formFactory');
  });


  it('should have global form', function(){
    expect(formFactory.rootForm).toBeTruthy();
    expect(formFactory.rootForm.$createWidget).toBeTruthy();
  });


  describe('new form', function(){
    var form;
    var scope;
    var log;

    function WidgetController($formFactory){
      this.$formFactory = $formFactory;
      log += '<init>';
      this.$render = function(){
        log += '$render();';
      };
      this.$on('$validate', function(e){
        log += '$validate();';
      });
    }

    WidgetController.$inject = ['$formFactory'];

    WidgetController.prototype = {
        getFormFactory: function(){
          return this.$formFactory;
        }
    };

    beforeEach(function(){
      log = '';
      scope = rootScope.$new();
      form = formFactory(scope);
    });

    describe('$createWidget', function(){
      var widget;

      beforeEach(function(){
        widget = form.$createWidget({model:scope, bind:'text', alias:'text', Ctrl:WidgetController});
      });


      describe('data flow', function(){
        it('should have status properties', function(){
          expect(widget.$error).toEqual({});
          expect(widget.$valid).toBe(true);
          expect(widget.$invalid).toBe(false);
        });


        it('should update view when model changes', function(){
          scope.text = 'abc';
          scope.$digest();
          expect(log).toEqual('<init>$validate();$render();');
          expect(widget.$modelValue).toEqual('abc');

          scope.text = 'xyz';
          scope.$digest();
          expect(widget.$modelValue).toEqual('xyz');

        });


        it('should have controller prototype methods', function(){
          expect(widget.getFormFactory()).toEqual(formFactory);
        });
      });


      describe('validation', function(){
        it('should update state on error', function(){
          widget.$emit('$invalid', 'E');
          expect(widget.$valid).toEqual(false);
          expect(widget.$invalid).toEqual(true);

          widget.$emit('$valid', 'E');
          expect(widget.$valid).toEqual(true);
          expect(widget.$invalid).toEqual(false);
        });


        it('should have called the model setter before the validation', function(){
          var modelValue;
          widget.$on('$validate', function(){
            modelValue = scope.text;
          });
          widget.$emit('$viewChange', 'abc');
          expect(modelValue).toEqual('abc');
        });


        describe('form', function(){
          it('should invalidate form when widget is invalid', function(){
            expect(form.$error).toEqual({});
            expect(form.$valid).toEqual(true);
            expect(form.$invalid).toEqual(false);

            widget.$emit('$invalid', 'REASON');

            expect(form.$error.REASON).toEqual([widget]);
            expect(form.$valid).toEqual(false);
            expect(form.$invalid).toEqual(true);

            var widget2 = form.$createWidget({model:scope, bind:'text', alias:'text', Ctrl:WidgetController});
            widget2.$emit('$invalid', 'REASON');

            expect(form.$error.REASON).toEqual([widget, widget2]);
            expect(form.$valid).toEqual(false);
            expect(form.$invalid).toEqual(true);

            widget.$emit('$valid', 'REASON');

            expect(form.$error.REASON).toEqual([widget2]);
            expect(form.$valid).toEqual(false);
            expect(form.$invalid).toEqual(true);

            widget2.$emit('$valid', 'REASON');

            expect(form.$error).toEqual({});
            expect(form.$valid).toEqual(true);
            expect(form.$invalid).toEqual(false);
          });
        });

      });

      describe('id assignment', function(){
        it('should default to name expression', function(){
          expect(form.text).toEqual(widget);
        });


        it('should use ng:id', function(){
          widget = form.$createWidget({model:scope, bind:'text', alias:'my.id', Ctrl:WidgetController});
          expect(form['my.id']).toEqual(widget);
        });


        it('should not override existing names', function(){
          var widget2 = form.$createWidget({model:scope, bind:'text', alias:'text', Ctrl:WidgetController});
          expect(form.text).toEqual(widget);
          expect(widget2).not.toEqual(widget);
        });
      });

      describe('dealocation', function(){
        it('should dealocate', function(){
          var widget2 = form.$createWidget({model:scope, bind:'text', alias:'myId', Ctrl:WidgetController});
          expect(form.myId).toEqual(widget2);
          var widget3 = form.$createWidget({model:scope, bind:'text', alias:'myId', Ctrl:WidgetController});
          expect(form.myId).toEqual(widget2);

          widget3.$destroy();
          expect(form.myId).toEqual(widget2);

          widget2.$destroy();
          expect(form.myId).toBeUndefined();
        });


        it('should remove invalid fields from errors, when child widget removed', function(){
          widget.$emit('$invalid', 'MyError');

          expect(form.$error.MyError).toEqual([widget]);
          expect(form.$invalid).toEqual(true);

          widget.$destroy();

          expect(form.$error.MyError).toBeUndefined();
          expect(form.$invalid).toEqual(false);
        });
      });
    });
  });
});
