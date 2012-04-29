'use strict';

var directive = {};
var service = { value: {} };

var DEPENDENCIES = {
  'angular.js': 'http://code.angularjs.org/angular-' + angular.version.full + '.min.js',
  'angular-resource.js': 'http://code.angularjs.org/angular-resource-' + angular.version.full + '.min.js',
  'angular-sanitize.js': 'http://code.angularjs.org/angular-sanitize-' + angular.version.full + '.min.js',
  'angular-cookies.js': 'http://code.angularjs.org/angular-cookies-' + angular.version.full + '.min.js'
};


function escape(text) {
  return text.
    replace(/\&/g, '&amp;').
    replace(/\</g, '&lt;').
    replace(/\>/g, '&gt;').
    replace(/"/g, '&quot;');
}



directive.jsFiddle = function(getEmbeddedTemplate, escape, script) {
  return {
    terminal: true,
    link: function(scope, element, attr) {
      var name = '',
        stylesheet = '<link rel="stylesheet" href="http://twitter.github.com/bootstrap/assets/css/bootstrap.css">\n',
        fields = {
          html: '',
          css: '',
          js: ''
        };

      angular.forEach(attr.jsFiddle.split(' '), function(file, index) {
        var fileType = file.split('.')[1];

        if (fileType == 'html') {
          if (index == 0) {
            fields[fileType] +=
              '<div ng-app' + (attr.module ? '="' + attr.module + '"' : '') + '>\n' +
                getEmbeddedTemplate(file, 2);
          } else {
            fields[fileType] += '\n\n\n  <!-- CACHE FILE: ' + file + ' -->\n' +
              '  <script type="text/ng-template" id="' + file + '">\n' +
              getEmbeddedTemplate(file, 4) +
              '  </script>\n';
          }
        } else {
          fields[fileType] += getEmbeddedTemplate(file) + '\n';
        }
      });

      fields.html += '</div>\n';

      element.html(
        '<form class="jsfiddle" method="post" action="http://jsfiddle.net/api/post/library/pure/" target="_blank">' +
          hiddenField('title', 'AngularJS Example: ' + name) +
          hiddenField('css', '</style> <!-- Ugly Hack due to jsFiddle issue: http://goo.gl/BUfGZ --> \n' +
            stylesheet +
            script.angular +
            (attr.resource ? script.resource : '') +
            '<style>\n' +
            fields.css) +
          hiddenField('html', fields.html) +
          hiddenField('js', fields.js) +
          '<button class="btn btn-primary"><i class="icon-white icon-pencil"></i> Edit Me</button>' +
          '</form>');

      function hiddenField(name, value) {
        return '<input type="hidden" name="' +  name + '" value="' + escape(value) + '">';
      }
    }
  }
};


directive.code = function() {
  return {restrict: 'E', terminal: true};
};


directive.prettyprint = ['reindentCode', function(reindentCode) {
  return {
    restrict: 'C',
    terminal: true,
    compile: function(element) {
      element.html(window.prettyPrintOne(reindentCode(element.html()), undefined, true));
    }
  };
}];


directive.ngSetText = ['getEmbeddedTemplate', function(getEmbeddedTemplate) {
  return {
    restrict: 'CA',
    priority: 10,
    compile: function(element, attr) {
      element.text(getEmbeddedTemplate(attr.ngSetText));
    }
  }
}]


directive.ngHtmlWrap = ['reindentCode', 'templateMerge', function(reindentCode, templateMerge) {
  return {
    compile: function(element, attr) {
      var properties = {
            head: '',
            module: '',
            body: reindentCode(element.text(), 4)
          },
        html = "<!doctype html>\n<html ng-app{{module}}>\n  <head>\n{{head}}  </head>\n  <body>\n{{body}}  </body>\n</html>";

      angular.forEach((attr.ngHtmlWrap || '').split(' '), function(dep) {
        if (!dep) return;
        dep = DEPENDENCIES[dep] || dep;

        var ext = dep.split(/\./).pop();

        if (ext == 'css') {
          properties.head += '    <link rel="stylesheet" href="' + dep + '" type="text/css">\n';
        } else if(ext == 'js') {
          properties.head += '    <script src="' + dep + '"></script>\n';
        } else {
          properties.module = '="' + dep + '"';
        }
      });

      element.text(templateMerge(html, properties));
    }
  }
}];


directive.ngSetHtml = ['getEmbeddedTemplate', function(getEmbeddedTemplate) {
  return {
    restrict: 'CA',
    priority: 10,
    compile: function(element, attr) {
      element.html(getEmbeddedTemplate(attr.ngSetHtml));
    }
  }
}];


directive.ngEvalJavascript = ['getEmbeddedTemplate', function(getEmbeddedTemplate) {
  return {
    compile: function (element, attr) {
      var script = getEmbeddedTemplate(attr.ngEvalJavascript);

      try {
        if (window.execScript) { // IE
          window.execScript(script || '""'); // IE complains when evaling empty string
        } else {
          window.eval(script);
        }
      } catch (e) {
        if (window.console) {
          window.console.log(script, '\n', e);
        } else {
          window.alert(e);
        }
      }
    }
  };
}];


directive.ngEmbedApp = ['$templateCache', '$browser', '$rootScope', '$location', function($templateCache, $browser, docsRootScope, $location) {
  return {
    terminal: true,
    link: function(scope, element, attrs) {
      var modules = [];

      modules.push(['$provide', function($provide) {
        $provide.value('$templateCache', $templateCache);
        $provide.value('$anchorScroll', angular.noop);
        $provide.value('$browser', $browser);
        $provide.provider('$location', function() {
          this.$get = function() { return $location; };
          this.html5Mode = angular.noop;
        });
        $provide.decorator('$defer', ['$rootScope', '$delegate', function($rootScope, $delegate) {
          return angular.extend(function(fn, delay) {
            if (delay && delay > 50) {
              return setTimeout(function() {
                $rootScope.$apply(fn);
              }, delay);
            } else {
              return $delegate.apply(this, arguments);
            }
          }, $delegate);
        }]);
        $provide.decorator('$rootScope', ['$delegate', function(embedRootScope) {
          docsRootScope.$watch(function() {
            embedRootScope.$digest();
          });
          return embedRootScope;
        }]);
      }]);
      if (attrs.ngEmbedApp)  modules.push(attrs.ngEmbedApp);

      element.bind('click', function(event) {
        if (event.target.attributes.getNamedItem('ng-click')) {
          event.preventDefault();
        }
      });
      angular.bootstrap(element, modules);
    }
  };
}];

service.reindentCode = function() {
  return function (text, spaces) {
    if (!text) return text;
    var lines = text.split(/\r?\n/);
    var prefix = '      '.substr(0, spaces || 0);
    var i;

    // remove any leading blank lines
    while (lines.length && lines[0].match(/^\s*$/)) lines.shift();
    // remove any trailing blank lines
    while (lines.length && lines[lines.length - 1].match(/^\s*$/)) lines.pop();
    var minIndent = 999;
    for (i = 0; i < lines.length; i++) {
      var line = lines[0];
      var reindentCode = line.match(/^\s*/)[0];
      if (reindentCode !== line && reindentCode.length < minIndent) {
        minIndent = reindentCode.length;
      }
    }

    for (i = 0; i < lines.length; i++) {
      lines[i] = prefix + lines[i].substring(minIndent);
    }
    lines.push('');
    return lines.join('\n');
  }
};

service.templateMerge = ['reindentCode', function(indentCode) {
  return function(template, properties) {
    return template.replace(/\{\{(\w+)(?:\:(\d+))?\}\}/g, function(_, key, indent) {
      var value = properties[key];

      if (indent) {
        value = indentCode(value, indent);
      }

      return value == undefined ? '' : value;
    });
  };
}];

service.getEmbeddedTemplate = ['reindentCode', function(reindentCode) {
  return function (id) {
    return reindentCode(angular.element(document.getElementById(id)).html(), 0);
  }
}];


angular.module('bootstrapPrettify', []).directive(directive).factory(service);
