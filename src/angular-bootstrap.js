//try to bind to jquery now so that one can write angular.element().read()
//but we will rebind on bootstrap again.
bindJQuery();

publishExternalAPI(angular);

jqLite(document).ready(function() {
  angularInit(document, bootstrap);
});
