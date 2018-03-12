var express = require('express');
var router = express.Router();
var fs = require('fs');
var path = require('path');
var multer  = require('multer');
var archiver = require('archiver');



router.get('/showall', function (req, res, next) {
    res.send('f');
});


router.put('/upload',
    multer({
        dest: path.join(global.iflicks_settings.uploadPath, '/notencoded/'),
        /*changeDest: function (dest, req, res) {
            //console.log(res);
            return path.join(global.iflicks_settings.uploadPath, '/notencoded/');
        },*/
        onError: function (err, next) { 
            console.log('Broken');
            err.code = 'F06001'; 
            logger.errorNoReq('api.copy.post.multer', 'F06006', err, 2);
            next(err); 
        },
        onFileUploadStart: function (file, req, res) {
            //console.log(file);
            if (req.user === undefined) {
                res.status(500).send('Missing user');
                return;
            }
        },
        onFileSizeLimit: function (file) {
          console.log('Failed: ', file.originalname);
          fs.unlink('./' + file.path); // delete the partially written file 
        },
        onFilesLimit: function () {
          console.log('Crossed file limit!');
        },
        onFieldsLimit: function () {
          console.log('Crossed fields limit!');
        },
        onPartsLimit: function () {
          console.log('Crossed parts limit!');
        },
        onFileUploadComplete: function (file, req, res) {
            if (req.user === undefined) {
                res.status(500).send('Missing user');
                return;
            }
            var doc, folderName, mediaPath, unzipper, tmpFlick;
            folderName = file.name.substring(0, file.name.lastIndexOf('.'));
            mediaPath = path.join(global.iflicks_settings.uploadPath, folderName);

            unzipper = new DecompressZip(file.path);
            unzipper.on('error', function (err) {
                logger.error(req, 'api.copy.post.unzip', 'F06003', err, 2);
            });
            
        
            });
        }
    }),
    function (req, res, next) {
        //console.log(req.user);
        res.status(202).send('Received');
    });


module.exports = router;
