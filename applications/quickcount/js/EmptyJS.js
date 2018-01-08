'use strict';

quickcountApp.controller('EmptyCtrl', function ($scope, $http, $filter, $location, $cookies) {

    // Retrieving user login session variables
    //console.log("EmptyCtrl - user logged: '" + $scope.$parent.user_logged + "' ID: " + $scope.$parent.user_id);
    if (!$scope.$parent.user_logged) {
        $location.path('/login');
        return;
    }

    // Company table prefix code
    //console.log("EmptyCtrl - company code: " + $scope.$parent.comp_code);
    if ($scope.$parent.comp_code === null || $scope.$parent.comp_code.length === 0) {
        $location.path('/logout');
        $scope.$parent.msg_title = 'Company not available';
        $scope.$parent.msg_body = 'Company code for current user is not available. Please login with a different user!';
        $("#messageModal").modal("show");
        return;
    }

    // Display error message
    $scope.showErrorMessage = function (title, message) {
        $scope.msg_title = title;
        $scope.msg_body = message;
        $("#messageModal").modal("show");
    };

});