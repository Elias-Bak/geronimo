'use strict';

quickcountApp.controller('LoginCtrl', function ($scope, $location) {

    // Module
    if (window.currentModule === 71) {
        return;
    }
    window.currentModule = 71;

    // Checking if user is already logged in
    console.log("LoginCtrl - Google User logged: '" + $scope.$parent.user_logged + "' ID: " + $scope.$parent.user_id);
    if ($scope.$parent.user_logged) {
        console.log("User is already logged in! redirecting...");
        window.currentModule = 0;
        $location.path('/empty');
        return;
    }
    
});
