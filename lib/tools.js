var fs      = require('fs'),
	path    = require('path'),
	crypto  = require('crypto'),
	mkdirp  = require('mkdirp'),
	utils = require('utils');

var Tools = function(){};

utils.inherits(Tools,{
	getFileContent:function(file){
		if(!fs.existsSync(file)) throw new Error('cannot found file:' + file);
		return fs.readFileSync(file,'utf8');
	},
	getFileHash:function(fileContent,options){
		var buf = new Buffer(fileContent),
			len = options.hashLength || 10
		return crypto.creatHash('md5').update(buf).digest('hex').slice(0,len);
	}
});

module.exports = new Tools();
