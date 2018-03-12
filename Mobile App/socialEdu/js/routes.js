angular.module('app.routes', [])

.config(function($stateProvider, $urlRouterProvider) {

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider
    

      .state('tabsController.home', {
    url: '/page2',
    views: {
      'tab1': {
        templateUrl: 'templates/home.html',
        controller: 'homeCtrl'
      }
    }
  })

  .state('vHome', {
    url: '/page8',
    templateUrl: 'templates/vHome.html',
    controller: 'vHomeCtrl'
  })

  .state('tabsController.questionAnswer', {
    url: '/page3',
    views: {
      'tab2': {
        templateUrl: 'templates/questionAnswer.html',
        controller: 'questionAnswerCtrl'
      }
    }
  })

  .state('tabsController.profile', {
    url: '/page4',
    views: {
      'tab3': {
        templateUrl: 'templates/profile.html',
        controller: 'profileCtrl'
      }
    }
  })

  .state('tabsController', {
    url: '/page1',
    templateUrl: 'templates/tabsController.html',
    abstract:true
  })

  .state('landing', {
    url: '/page5',
    templateUrl: 'templates/landing.html',
    controller: 'landingCtrl'
  })

  .state('studentLogin', {
    url: '/page6',
    templateUrl: 'templates/studentLogin.html',
    controller: 'studentLoginCtrl'
  })

  .state('volunteerLogin', {
    url: '/page7',
    templateUrl: 'templates/volunteerLogin.html',
    controller: 'volunteerLoginCtrl'
  })

$urlRouterProvider.otherwise('/page1/page2')


});