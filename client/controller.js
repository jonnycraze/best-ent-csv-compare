angular.module('controller', [])
    //// controllers
    .controller('uploadCtrl', function($scope, Upload, CSV){
      // table sorting
      $scope.sortType = 'seq';
      $scope.sortReverse = false;

      // export as joined as CSV
      var exportData = function(data){
        var csvContent = new Array();

        var header = "MFR, Part #, Description, Cost, Retail, GSA Old Price, GSA New Price, Variance, Action, Country";

        csvContent.push(header);

        for(var key in data){
          var _manu = data[key].manufacturer;
          var _part = data[key].part_no;
          var _desc = data[key].desc;
          var _cost = data[key].cost;
          var _retail = data[key].retail;
          var _old = data[key].old;
          var _new = data[key].new;
          var _var = data[key].var;
          var _diff = data[key].diff;
          var _country = data[key].country;

          var string = _manu + ", " + _part + ", " + _desc + ", " + _cost + ", " + _retail + ", $" + _old + ", $" + _new + ", " + _var + ", " + _diff + ', ' + _country;
          csvContent.push(string);
        }

        var buffer = csvContent.join("\n");
        var blob = new Blob([buffer], {
          "type":"text/csv;charset=utf8;"
        })
        var filename = 'merged_data.csv';

        $scope.linkObj = window.URL.createObjectURL(blob);
        $scope.linkDL = filename;
      }

      // all having to do with file upload
      $scope.$watch('file_a', function (file_a) {
        $scope.upload_old($scope.file_a);
      });
      $scope.$watch('file_b', function (file_b) {
        $scope.upload_new($scope.file_b);
      });

      $scope.upload_old = function(file) {
          if (!file) return;

          Upload.upload({
              url: '/api/files/upload',
              method: 'POST',
              file: file,
              data: $scope._id
          }).progress(function (evt) {
              var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
              console.log('progress: ' + progressPercentage + '% ' + evt.config.file.name);
              $scope.uploadProgress = progressPercentage;
          }).success(function (data, status, headers, config) {
              CSV.get(file, function(csvdata){
                $scope.oldfiledata = csvdata;
              });

              $scope.file_a_complete = true;
          });
      };
      $scope.upload_new = function(file) {
        if (!file) return;

        Upload.upload({
            url: '/api/files/upload',
            method: 'POST',
            file: file,
            data: $scope._id
        }).progress(function (evt) {
            var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
            console.log('progress: ' + progressPercentage + '% ' + evt.config.file.name);
            $scope.uploadProgress = progressPercentage;

        }).success(function (data, status, headers, config) {
            $scope.file_b_complete = true;

            // parse data from CSV and deal with it
            CSV.get(file, function(csvdata){
              $scope.newfiledata = csvdata;
              //now we send the data off to the server
              //server does muscle work
              var _data = {
                oldfile: $scope.oldfiledata,
                newfile: $scope.newfiledata
              }
              CSV.post(_data, function(data){
                $scope.merged_files = data.data;
                exportData($scope.merged_files);
              });

              $scope.showFile = true;

            }); // end function
        });
      };
    });
