'use strict';

quickcountApp.controller('LogoutCtrl', function ($scope, $http, $filter, $location, $cookies) {

    // Module
    if (window.currentModule === 72) {
        return;
    }
    window.currentModule = 72;
    
    // Reloading Google auth2 library (because logout in on a separate page)
    gapi.load('auth2', function () {
        gapi.auth2.init();
    });
    
    // Logout
    $scope.logout = function () {

        // login variable
        $scope.$parent.user_logged = false;
        $scope.$parent.user_id = "0";
        $scope.$parent.user_name = "";
        $scope.$parent.user_email = "";
        $scope.$parent.user_image_url = "";
        $scope.$parent.user_auth_token = "";
        $scope.$parent.user_type_id = "0";
        $scope.$parent.comp_code = "";
        $scope.$parent.comp_name = "";

        // Logging out Google user
        console.log('LogoutCtrl - Google user signing out');
        onSignOut();

        // reloading login page
        location.reload();
    };
});