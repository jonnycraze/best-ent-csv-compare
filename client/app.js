var app = angular.module('csv_app', 
        [
            'ngRoute',
            'ngFileUpload',
            // 'ngResource',
            'CSVservice',
            'controller'
        ]
    );

    // configure our routes
    app.config(function($routeProvider, $locationProvider) {
        $locationProvider.html5Mode(true);

        $routeProvider
            // route for the home page
            .when('/', {
                templateUrl : 'landing.html',
                controller  : 'uploadCtrl'
            })
    });