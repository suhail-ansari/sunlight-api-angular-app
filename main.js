/**
 * utility functions
 */
function parseDate(date) {
    var splitDate = date.split('-').map(Number);
    var year = splitDate[0];
    var month = splitDate[1] - 1;
    var day = splitDate[2];
    return new Date(year, month, day);
}

Object.values = function(items){
    var keys = Object.keys(items);
    return keys.map(function(k){
        return items[k];
    });
}

/**
 * angular app
 */
var app = angular.module("congress-app", ["ngRoute", "angularUtils.directives.dirPagination"]);

app.config(function($routeProvider) {
    $routeProvider
    .when("/legislator", {
        templateUrl : "legislator.html",
        controller: 'LegislatorController'
    })
    .when("/bill", {
        templateUrl : "bill.html",
        controller: 'BillController'
    })
    .when("/committee", {
        templateUrl : "committee.html",
        controller: 'CommitteeController'
    })
    .when("/favorite", {
        templateUrl : "favorite.html",
        controller: 'FavoriteController'
    })
    .otherwise({
        redirectTo: '/legislator'
    })
});

app.run(function($rootScope, localStorageFactory, httpCache, LegislatorFactory, BillFactory, CommitteeFactory) {
    
    $rootScope.sidebarLinkIndex = 0;

    $rootScope.data = {};
    LegislatorFactory.getAll().then(function(res){
        $rootScope.data.legislators = res.data.results;
    }, function(){});
    
    BillFactory.getAll().then(function(res){
        $rootScope.data.activeBills = res.data.results;
    }, function(){});
    BillFactory.getAllNew().then(function(res){
        $rootScope.data.newBills = res.data.results;
    }, function(){});
    
    CommitteeFactory.getHouseAll().then(function(res){
        $rootScope.data.houseCommittees = res.data.results;
    }, function(){});
    CommitteeFactory.getSenateAll().then(function(res){
        $rootScope.data.senateCommittees = res.data.results;
    }, function(){});
    CommitteeFactory.getJointAll().then(function(res){
        $rootScope.data.jointCommittees = res.data.results;
    }, function(){});

    $rootScope.toggleStoredItem = function(itemType, key, item){
        localStorageFactory.toggle(itemType, key, item);
    }

    $rootScope.isItemInLocalStorage = function(itemType, key){
        return localStorageFactory.isItemInLocalStorage(itemType, key);
    }

    $rootScope.toggleSidebar = function() {
        console.log("hello");
        $('#sidebar').toggle();
        $('#main-container').toggleClass('sidebar-open');
        $('#main-container').toggleClass('sidebar-close');
        
        $('#content-container').toggleClass('col-lg-12');
        $('#content-container').toggleClass('col-md-12');
        $('#content-container').toggleClass('col-sm-12');
        $('#content-container').toggleClass('col-xs-12');

        $('#content-container').toggleClass('col-lg-10 col-lg-offset-2');
        $('#content-container').toggleClass('col-md-10 col-md-offset-2');
        $('#content-container').toggleClass('col-sm-9 col-sm-offset-3');
        $('#content-container').toggleClass('col-xs-10 col-xs-offset-2');

    };
    
});

app.filter('capitalize', function() {
    return function(input) {
      return (!!input) ? input.charAt(0).toUpperCase() + input.substr(1).toLowerCase() : '';
    }
});

/**
 * Factories
*/

// httpCache
app.factory('httpCache', function($cacheFactory) {
    return $cacheFactory('http-cache');
});

// localStorageFactory
app.factory('localStorageFactory', function(){

    $localStorage = {
        get: function(itemType, k){
            var items = JSON.parse(localStorage[itemType] || "{}");
            if(k){
                return items[k] || null;
            } else{
                return items || null;
            }
        },
        set: function(itemType, k, item){
            var prevItems = JSON.parse(localStorage[itemType] || "{}");
            prevItems[k] = item;
            localStorage[itemType] = JSON.stringify(prevItems);
        },
        delete: function(itemType, k){
            var prevItems = JSON.parse(localStorage[itemType] || "{}");
            delete prevItems[k];
            localStorage[itemType] = JSON.stringify(prevItems);
        },
        reset: function(){
            var keys = Object.keys(localStorage);
            keys.map(function(k){
                localStorage.removeItem(k);
            });
        }
    };

    
    return {
        saveToLocalStorage : function(itemType, key, item){
            item.ts = new Date();
            $localStorage.set(itemType, key, item);
        },
        deleteFromLocalStorage: function(itemType, key){
            var item = $localStorage.get(itemType, key);
            if(item){
                $localStorage.delete(itemType, key);
            }
        },
        isItemInLocalStorage: function(itemType, key){
            var items = $localStorage.get(itemType);
            return items.hasOwnProperty(key);
        },
        toggle : function(itemType, key, item){
            if(this.isItemInLocalStorage(itemType, key)){
                this.deleteFromLocalStorage(itemType, key);
            }else{
                this.saveToLocalStorage(itemType, key, item);
            }
        },
        get: function(itemType){
            return $localStorage.get(itemType);
        },
        reset: function(){
            $localStorage.reset();
        }
    }
});

// LegislatorFactory
app.factory('LegislatorFactory', function($http, $q){
    var baseUrl = "api.php";
    
    return {
        getAll: function(){
            return $http.get(baseUrl + '/legislator');
        },
        getCommittees: function(bioguideId){ return $http.get(baseUrl + '/legislator-committees?bioguide_id=' + bioguideId)},
        getBills: function(bioguideId){ return $http.get(baseUrl + '/legislator-bills?bioguide_id=' + bioguideId)}
    }
});

// BillFactory
app.factory('BillFactory', function($http, $q){
    var baseUrl = "api.php";
    return {
        getAll: function(){
            return $http.get(baseUrl + '/bills');
        },
        getAllNew: function(){
            return $http.get(baseUrl + '/new-bills');
         }
    }
});

app.factory('CommitteeFactory', function($http, $q){
    var baseUrl = "api.php";
    return {
        getHouseAll: function(){
            return $http.get(baseUrl + '/committee?chamber=house');
        },
        getSenateAll: function(){
            return $http.get(baseUrl + '/committee?chamber=senate');
        },
        getJointAll: function(){
            return $http.get(baseUrl + '/committee?chamber=joint');
        }
    }
});

app.factory('FavoriteFactory', function($http){

});

/**
 * Controller
 */

// LegislatorController
app.controller('LegislatorController', function($scope, $rootScope, LegislatorFactory, StateNameFactory, localStorageFactory, httpCache){
    $rootScope.sidebarLinkIndex = 0;
    
    $scope.items = [];
    $scope.currentTab = 0;

    $scope.states = StateNameFactory.states;
    $scope.selectedState = "";
    $scope.filterByState = function(item){
        return ($scope.selectedState == "")?true:(item.state == $scope.selectedState); 
    }

    $("#legislator-carousel-container").carousel();
    $("#legislator-carousel-container").carousel('pause');
    $scope.currentItem = null;
    $scope.viewDetails = function(item){
        console.log(item);
        $scope.currentItem = item;
        $scope.currentItem.committees = $scope.currentItem.committees || [];
        $scope.currentItem.bills = $scope.currentItem.bills || [];
        LegislatorFactory.getCommittees(item.bioguide_id).then(function(res){
            $scope.currentItem.committees = res.data.results;
        });
        LegislatorFactory.getBills(item.bioguide_id).then(function(res){
            $scope.currentItem.bills = res.data.results;
        });
        $("#legislator-carousel-container").carousel('next');
    }

    $scope.goBack = function(){
        $("#legislator-carousel-container").carousel('prev');
        setTimeout(function(){
            $scope.$apply(function(){$scope.currentItem = null;});
        }, 1000);
    }

    $scope.getTermPercentage = function(startDate, endDate) {
        var startDate = parseDate(startDate);
        var endDate = parseDate(endDate);
        var now = new Date();
        var percentage = ((now.getTime() - startDate.getTime())/(endDate.getTime() - startDate.getTime()))*100;
        return parseInt(percentage);
    }
    
});

// BillController
app.controller('BillController', function($scope, $rootScope, BillFactory, $sce, httpCache){
    $rootScope.sidebarLinkIndex = 1;
    $scope.currentTab = 0;
    $scope.items = [];
    $scope.newItems = [];

    
    $("#bills-carousel-container").carousel();
    $("#bills-carousel-container").carousel('pause');
    $scope.currentItem = null;
    $scope.viewDetails = function(billType, item){
        console.log(billType, item);
        $scope.currentItem = item;
        $scope.currentItem.custom_bill_status = billType;
        if($scope.currentItem.last_version && $scope.currentItem.last_version.urls && $scope.currentItem.last_version.urls.pdf){
            $scope.currentItemPDFUrl = $sce.trustAsResourceUrl($scope.currentItem.last_version.urls.pdf);
        }
        
        $("#bills-carousel-container").carousel('next');
    }
    $scope.goBack = function(){
        $("#bills-carousel-container").carousel('prev');
        setTimeout(function(){
            $scope.$apply(function(){
                $scope.currentItem = null;
                $scope.currentItemPDFUrl = null;
            });
        }, 1000);
    }
});

app.controller('CommitteeController', function($scope, $rootScope, CommitteeFactory, httpCache){
    $rootScope.sidebarLinkIndex = 2;
    $scope.currentTab = 0;
    
    $scope.houseCommittee = [];
    $scope.senateCommittee = [];
    $scope.jointCommittee = [];
    
});

app.controller('FavoriteController', function($scope, $rootScope, localStorageFactory, LegislatorFactory, BillFactory, $sce){
    $rootScope.sidebarLinkIndex = 3;
    $scope.currentTab = 0;
    
    $scope.legislator = Object.values(localStorageFactory.get('legislator') || {});
    $scope.bill = Object.values(localStorageFactory.get('bill') || {});
    $scope.committee = Object.values(localStorageFactory.get('committee') || {});   
    console.log($scope);

    $scope.deleteItem = function(itemType, key){
        localStorageFactory.deleteFromLocalStorage(itemType, key);
        $scope[itemType] = Object.values(localStorageFactory.get(itemType));
    }

    $scope.goBack = function(){
        $("#fav-carousel-container").carousel(0);
        setTimeout(function(){
            $scope.$apply(function(){
                $scope.currentItem = null;
                $scope.currentItemPDFUrl = null;
            });
        }, 1000);
    }

    $("#fav-carousel-container").carousel();
    $("#fav-carousel-container").carousel('pause');
    
    $scope.viewLegislatorDetails = function(item){
        console.log(item);
        $scope.currentItem = item;
        $scope.currentItem.committees = $scope.currentItem.committees || [];
        $scope.currentItem.bills = $scope.currentItem.bills || [];

        if($scope.currentItem.committees.length == 0){
            LegislatorFactory.getCommittees(item.bioguide_id).then(function(res){
                $scope.currentItem.committees = res.data.results;
            });
        }

        if($scope.currentItem.bills.length == 0){
            LegislatorFactory.getBills(item.bioguide_id).then(function(res){
                $scope.currentItem.bills = res.data.results;
            });
        }
        $("#fav-carousel-container").carousel(1);
    }

    $scope.viewBillDetails = function(item){
        $scope.currentItem = item;
        if($scope.currentItem.last_version && $scope.currentItem.last_version.urls && $scope.currentItem.last_version.urls.pdf){
            $scope.currentItemPDFUrl = $sce.trustAsResourceUrl($scope.currentItem.last_version.urls.pdf);
        }
        $("#fav-carousel-container").carousel(2);
    }

    $scope.getTermPercentage = function(startDate, endDate) {
        var startDate = parseDate(startDate);
        var endDate = parseDate(endDate);
        var now = new Date();
        var percentage = ((now.getTime() - startDate.getTime())/(endDate.getTime() - startDate.getTime()))*100;
        return parseInt(percentage);
    }

}); 

// this is a factory to generate select element for states
app.factory('StateNameFactory', function(){
    return {
        states: [
            {
                "name": "Alabama",
                "abbreviation": "AL"
            },
            {
                "name": "Alaska",
                "abbreviation": "AK"
            },
            {
                "name": "American Samoa",
                "abbreviation": "AS"
            },
            {
                "name": "Arizona",
                "abbreviation": "AZ"
            },
            {
                "name": "Arkansas",
                "abbreviation": "AR"
            },
            {
                "name": "California",
                "abbreviation": "CA"
            },
            {
                "name": "Colorado",
                "abbreviation": "CO"
            },
            {
                "name": "Connecticut",
                "abbreviation": "CT"
            },
            {
                "name": "Delaware",
                "abbreviation": "DE"
            },
            {
                "name": "District Of Columbia",
                "abbreviation": "DC"
            },
            {
                "name": "Federated States Of Micronesia",
                "abbreviation": "FM"
            },
            {
                "name": "Florida",
                "abbreviation": "FL"
            },
            {
                "name": "Georgia",
                "abbreviation": "GA"
            },
            {
                "name": "Guam",
                "abbreviation": "GU"
            },
            {
                "name": "Hawaii",
                "abbreviation": "HI"
            },
            {
                "name": "Idaho",
                "abbreviation": "ID"
            },
            {
                "name": "Illinois",
                "abbreviation": "IL"
            },
            {
                "name": "Indiana",
                "abbreviation": "IN"
            },
            {
                "name": "Iowa",
                "abbreviation": "IA"
            },
            {
                "name": "Kansas",
                "abbreviation": "KS"
            },
            {
                "name": "Kentucky",
                "abbreviation": "KY"
            },
            {
                "name": "Louisiana",
                "abbreviation": "LA"
            },
            {
                "name": "Maine",
                "abbreviation": "ME"
            },
            {
                "name": "Marshall Islands",
                "abbreviation": "MH"
            },
            {
                "name": "Maryland",
                "abbreviation": "MD"
            },
            {
                "name": "Massachusetts",
                "abbreviation": "MA"
            },
            {
                "name": "Michigan",
                "abbreviation": "MI"
            },
            {
                "name": "Minnesota",
                "abbreviation": "MN"
            },
            {
                "name": "Mississippi",
                "abbreviation": "MS"
            },
            {
                "name": "Missouri",
                "abbreviation": "MO"
            },
            {
                "name": "Montana",
                "abbreviation": "MT"
            },
            {
                "name": "Nebraska",
                "abbreviation": "NE"
            },
            {
                "name": "Nevada",
                "abbreviation": "NV"
            },
            {
                "name": "New Hampshire",
                "abbreviation": "NH"
            },
            {
                "name": "New Jersey",
                "abbreviation": "NJ"
            },
            {
                "name": "New Mexico",
                "abbreviation": "NM"
            },
            {
                "name": "New York",
                "abbreviation": "NY"
            },
            {
                "name": "North Carolina",
                "abbreviation": "NC"
            },
            {
                "name": "North Dakota",
                "abbreviation": "ND"
            },
            {
                "name": "Northern Mariana Islands",
                "abbreviation": "MP"
            },
            {
                "name": "Ohio",
                "abbreviation": "OH"
            },
            {
                "name": "Oklahoma",
                "abbreviation": "OK"
            },
            {
                "name": "Oregon",
                "abbreviation": "OR"
            },
            {
                "name": "Palau",
                "abbreviation": "PW"
            },
            {
                "name": "Pennsylvania",
                "abbreviation": "PA"
            },
            {
                "name": "Puerto Rico",
                "abbreviation": "PR"
            },
            {
                "name": "Rhode Island",
                "abbreviation": "RI"
            },
            {
                "name": "South Carolina",
                "abbreviation": "SC"
            },
            {
                "name": "South Dakota",
                "abbreviation": "SD"
            },
            {
                "name": "Tennessee",
                "abbreviation": "TN"
            },
            {
                "name": "Texas",
                "abbreviation": "TX"
            },
            {
                "name": "Utah",
                "abbreviation": "UT"
            },
            {
                "name": "Vermont",
                "abbreviation": "VT"
            },
            {
                "name": "Virgin Islands",
                "abbreviation": "VI"
            },
            {
                "name": "Virginia",
                "abbreviation": "VA"
            },
            {
                "name": "Washington",
                "abbreviation": "WA"
            },
            {
                "name": "West Virginia",
                "abbreviation": "WV"
            },
            {
                "name": "Wisconsin",
                "abbreviation": "WI"
            },
            {
                "name": "Wyoming",
                "abbreviation": "WY"
            }
        ]     
    }
});