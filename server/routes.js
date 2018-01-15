var express 	= require('express');
var bodyParser  = require('body-parser');
var fs 					= require('fs');
var multiparty 	= require('multiparty');
var multer 			= require('multer');
var crypto 			= require('crypto');
var router 			= express.Router();

var storage = multer.diskStorage({
  destination: './client/uploads/',
  filename: function (req, file, cb) {
		cb(null, file.originalname)
  }
});
var upload = multer({storage: storage});

module.exports = function(app) {
	app.post('/api/files/upload',
		upload.single('file'),
		function (req,res,next) {
			console.log('uploading file...');

			fs.readFile(req.file.path, (err, data) => {
				if (err) throw err;
				console.log(data)
				return res.json(data);
			});
	});

	app.post('/api/compare', function(req,res,next){
		var oldfile = req.body.oldfile;
		var newfile = req.body.newfile;
		var merged_files = [];
		var removed_files = [];

		//start looping through new file
		for (var key in newfile) {
			var diff, variation, description, added, removed, product, newdata, olddata, updated, newretail, newwholesale, removed_pt, country;

			if(key == 0) continue;

			//set status of new data row
			updated = false;
			removed = false;

			newdata = newfile[key];
			// manipulate the data received
			if (newdata) {
				country = newdata[9];
				newretail = newdata[3];
				if (newretail) newretail = newretail.replace(',','');

				newwholesale = newdata[4];
				if(newwholesale) newwholesale = newwholesale.replace(',','');

				description = newdata[2];
				if (description) description = description.replace(/,/g ,'');

				//this is the proposed GSA price
				newdata = newdata[8];

				if(newdata){
				  newdata = newdata.replace('$','');
				  newdata = newdata.replace(',','');
				  newdata = parseFloat(newdata);
				}
			}

			var oldLength = oldfile.length;
			product = newfile[key];
			var manufacturer = product[0];
			var part_no = product[1];

      		// now we loop through the old file and start to compare
			for(var i in oldfile){
				//get the part number in the old file
				var old_iteration = oldfile[i];
				var old_pt_num = old_iteration[1];
				var old_desc = old_iteration[2];
				var old_retail = old_iteration[3];
				var old_wholesale = old_iteration[4];
				var old_country = old_iteration[9];

				if(i == 0)continue;

				olddata = oldfile[i];
				olddata = olddata[8];
				if(olddata){
					olddata = olddata.replace('$','');
					olddata = olddata.replace(',','');
					olddata = parseFloat(olddata);
				}

				//if these part numbers match do things
				if (old_pt_num == part_no) {
					// check variation of value
					if(newdata > olddata){
						diff = 'increase';
						variation = (newdata-olddata);
					} else if(newdata < olddata) {
						diff = 'decrease';
						variation = -(olddata-newdata);
					} else {
						diff = "nochange";
						variation = 0;
					}

					var obj = {
						'manufacturer': manufacturer,
						'part_no': part_no,
						'old': olddata,
						'new': newdata,
						'var': variation.toFixed(2),
						'add': '',
						'del': removed,
						'diff': diff,
						'retail': old_retail,
						'cost': newwholesale,
						'seq': key,
						'desc': description,
						'country': country
					}

					updated = true;
					merged_files.push(obj);
					break;
					// end if comparison
				}
		  } // end oldfile loop

			// if there was no comparison found this item is added or removed
			if (!updated) {
				olddata = '-';
				added = "added";
				variation = 0;
				diff = 'added';

				var obj = {
				  'manufacturer': manufacturer,
				  'part_no': part_no,
				  'old': olddata,
				  'new': newdata,
				  'var': variation.toFixed(2),
				  'add': added,
				  'del': removed,
				  'diff': diff,
				  'retail': newretail,
				  'cost': newwholesale,
				  'seq': key,
				  'desc': description,
				  'country': country
				}

				merged_files.push(obj);
				console.log(obj)
			}
	  } // end new file loop

	    for(var key in oldfile){
	    	var pt_included = false;

	    	if(key == 0) continue;
	    	if(key == 1) console.log(oldfile[key]);

	    	var part = oldfile[key];
	    	var part_no = part[1];
	    	var manufacturer = part[0]
	    	var part_retail = part[3];
	    	var part_desc = part[2];
	    	var part_cost = part[4];
	    	var part_country = part[9];

	    	for(var i in merged_files){
	    		if (merged_files[i].part_no == part_no) pt_included = true;
	    	}

	    	if (!pt_included) {
	    		console.log('removed');
	    		console.log(part);

	    		var obj = {
				  'manufacturer': manufacturer,
				  'part_no': part_no,
				  'old': olddata,
				  'new': '-',
				  'var': 0,
				  'add': "",
				  'del': "removed",
				  'diff': "removed",
				  'retail': part_retail,
				  'cost': part_cost,
				  'seq': ""+ merged_files.length+1 +"",
				  'desc': part_desc,
				  'country': part_country
				}
	    		merged_files.push(obj);
	    	}
	    }

	    console.log('done with all loops, sending data');

	    // now send the array back to the client
	    return res.json(merged_files);
	})




	// frontend routes =========================================================
	// route to handle all angular requests
	// app.get('*', function(req, res, next) {
	// 	res.sendFile(__dirname + '../client/index.html');
	// });
}
