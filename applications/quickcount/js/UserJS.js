'use strict';


quickcountApp.controller('UserCtrl', function ($scope, $http, $filter, $location, $cookies) {

    // Module
    if (window.currentModule === 73) {
        return;
    }
    window.currentModule = 73;
    
    // Retrieving user login session variables
    console.log("UserCtrl - user logged: " + $scope.$parent.user_logged 
            + "  user id: " + $scope.$parent.user_id
            + "  company code: " + $scope.$parent.comp_code);
    if (!$scope.$parent.user_logged) {
        $location.path('/login');
        return;
    }

    // Company table prefix code
    //console.log("UserCtrl - company code: " + $scope.$parent.comp_code);
    if ($scope.$parent.comp_code === null || $scope.$parent.comp_code.length === 0) {
        $location.path('/logout');
        $scope.$parent.msg_title = 'Company not available';
        $scope.$parent.msg_body = 'Company code for current user is not available. Please login with a different user!';
        $("#messageModal").modal("show");
        return;
    }
    
    // Check if currently loading parameters
    if (loading) {
        console.log("UserCtrl - loading: " + loading);
        return;
    }

    // Form data variables
    $scope.id = $scope.$parent.user_id;
    $scope.name = $scope.$parent.user_name;
    $scope.email = $scope.$parent.user_email;
    $scope.password = '';
    $scope.password2 = '';

    // Update user info
    $scope.update = function () {
        console.log("Updating user info '" + $scope.email + "'");
        var update_sql = {
            table: ["geronimo_user"],
            field: ["name = '" + $scope.name + "'",
                "email = '" + $scope.email + "'",
                "password = '" + $scope.password + "'"
            ],
            condition: ["id = " + $scope.id]
        };
        //$http.get("../../php/update.php?params=" + JsonToString(update_sql))
        $http.post("../../php/update.php", JsonToString(update_sql))
                .success(function (response) {
                    if (response < 0) {
                        alert("[1102] Error occurred while updating an entry");
                        return false;
                    }
                    // update global variables
                    var expiryDate = new Date();
                    var expiryTime = expiryDate.getTime() + (1000 * 60 * 30); // 30 minutes
                    expiryDate.setTime(expiryTime);
                    $cookies.put('user_name', $scope.name, {'expires': expiryDate});
                    $cookies.put('user_email', $scope.email, {'expires': expiryDate});
                    // go to home page
                    console.log("user info are updated! redirecting to default page ...");
                    $location.path('/dashboard');
                    // reloading default page
                    location.reload();
                });
    };
});